"""
LumiVue — Vision Service Integration Test
=========================================
Tests the end-to-end computer vision service on a few held-out validation images.
Ensures preprocessing, inference, Grad-CAM, and image quality all work together.
"""

import os
import sys
from pathlib import Path
import json

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vision_service import analyze_image
from training.dataset import RSNAPneumoniaDataset
from training.config import config
import pydicom

def get_dicom_bytes(patient_id: str, data_dir: Path) -> bytes:
    """Reads raw DICOM file and converts it to a standard image format bytes (PNG/JPEG)
       as would be uploaded to the FastAPI endpoint."""
    dicom_path = data_dir / "stage_2_train_images" / f"{patient_id}.dcm"
    dcm = pydicom.dcmread(dicom_path)
    pixel_array = dcm.pixel_array
    
    # Normalize 16-bit to 8-bit
    import numpy as np
    import cv2
    img_8bit = ((pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min()) * 255).astype(np.uint8)
    
    # Convert to RGB (assuming grayscale originally)
    img_rgb = cv2.cvtColor(img_8bit, cv2.COLOR_GRAY2RGB)
    
    # Encode to PNG bytes
    _, buffer = cv2.imencode('.png', img_rgb)
    return buffer.tobytes()

def test_vision_service():
    print("--- LumiVue Phase 5: Vision Service Integration Test ---")
    
    data_dir = Path("data/raw")
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val", seed=config.seed, subset_size=2500)
    
    # Pick one positive and one negative sample
    test_patients = []
    pos_found = False
    neg_found = False
    
    for data in val_dataset.patient_data:
        if data["target"] == 1 and not pos_found:
            test_patients.append((data["patient_id"], 1))
            pos_found = True
        elif data["target"] == 0 and not neg_found:
            test_patients.append((data["patient_id"], 0))
            neg_found = True
            
        if pos_found and neg_found:
            break
            
    print(f"Testing vision_service with {len(test_patients)} patients...")
    
    for patient_id, gt_label in test_patients:
        print(f"\n[Patient: {patient_id}] (Ground Truth: {gt_label})")
        
        # 1. Simulate API upload by reading DICOM and converting to PNG bytes
        image_bytes = get_dicom_bytes(patient_id, data_dir)
        print(f"Loaded image bytes: {len(image_bytes)} bytes")
        
        # 2. Run vision service (this triggers Model Load on first call, Preprocessing, DenseNet, GradCAM, Image Quality)
        result = analyze_image(image_bytes)
        
        # 3. Print the structured result (excluding the giant base64 string for terminal readability)
        result_printable = result.copy()
        if result_printable.get("image_evidence") and result_printable["image_evidence"].get("heatmap_base64"):
            result_printable["image_evidence"]["heatmap_base64"] = "<base64_string_omitted>"
            
        print(json.dumps(result_printable, indent=2))
        
        # Assertions
        assert "prediction" in result
        assert "model_score" in result
        assert "image_evidence" in result
        assert "image_quality" in result
        
        if result["prediction"] == "normal":
            assert result["image_evidence"]["bbox"] is None
        elif result["prediction"] == "suspected_pneumonia":
            assert result["image_evidence"]["bbox"] is not None
            assert len(result["image_evidence"]["bbox"]) == 4

    print("\nIntegration test completed successfully!")

if __name__ == "__main__":
    test_vision_service()
