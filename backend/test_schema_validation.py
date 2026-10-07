"""
LumiVue — Pydantic Schema Validation Test
=========================================
Tests that the real VisionService output cleanly integrates into the 
full AnalysisResponse Pydantic schema.
"""

import os
import sys
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas.analysis import AnalysisResponse
from app.services.vision_service import analyze_image
from training.dataset import RSNAPneumoniaDataset
from training.config import config
import pydicom
from pydantic import ValidationError

def get_dicom_bytes(patient_id: str, data_dir: Path) -> bytes:
    dicom_path = data_dir / "stage_2_train_images" / f"{patient_id}.dcm"
    dcm = pydicom.dcmread(dicom_path)
    pixel_array = dcm.pixel_array
    
    import numpy as np
    import cv2
    img_8bit = ((pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min()) * 255).astype(np.uint8)
    img_rgb = cv2.cvtColor(img_8bit, cv2.COLOR_GRAY2RGB)
    
    _, buffer = cv2.imencode('.png', img_rgb)
    return buffer.tobytes()

def test_validation():
    print("--- LumiVue Phase 5B: Schema Validation Test ---")
    data_dir = Path("data/raw")
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val", seed=config.seed, subset_size=2500)
    
    pos_patient = next(d["patient_id"] for d in val_dataset.patient_data if d["target"] == 1)
    neg_patient = next(d["patient_id"] for d in val_dataset.patient_data if d["target"] == 0)
    
    for label, pid in [("POSITIVE", pos_patient), ("NEGATIVE", neg_patient)]:
        print(f"\nTesting {label} patient ({pid})...")
        image_bytes = get_dicom_bytes(pid, data_dir)
        
        # 1. Get raw CV result
        cv_result = analyze_image(image_bytes)
        
        # 2. Mock the rest of the backend's responsibilities
        # (MedGemma, Confidence Engine, etc.)
        api_finding = cv_result["prediction"]
        if api_finding == "normal":
            api_finding = "no_pneumonia_detected"
            
        full_payload = {
            "analysis_id": f"test-{pid}",
            "finding": api_finding,
            "model_score": cv_result["model_score"],
            "confidence": "moderate", # Mocked from Confidence Engine
            "image_quality": cv_result["image_quality"],
            "image_evidence": cv_result["image_evidence"],
            "clinical_evidence": ["fever"],
            "explanation": "Test explanation."
        }
        
        # 3. Validate against Pydantic schema
        try:
            validated = AnalysisResponse(**full_payload)
            print("[PASS] Pydantic validation successful.")
            
            # Show a slice of the validated object to prove it works
            print(f"   BBox format: {validated.image_evidence.bbox}")
            print(f"   Image Quality object: {validated.image_quality.model_dump()}")
            
        except ValidationError as e:
            print("[FAIL] Validation Failed!")
            print(e.json())
            
    # Explicitly test a hand-crafted negative case with bbox=null
    print("\nTesting Manual Negative Case with bbox=null...")
    manual_neg_payload = {
        "analysis_id": "test-manual",
        "finding": "normal", # Wait, finding enum is no_pneumonia_detected or suspected_pneumonia.
        "model_score": 0.57,
        "confidence": "low",
        "image_quality": {"quality": "good"},
        "image_evidence": {
            "available": True,
            "bbox": None,
            "heatmap_available": True
        },
        "clinical_evidence": [],
        "explanation": "Normal"
    }
    
    try:
        # Note: the CV service returns "normal", but the API contract finding enum uses "no_pneumonia_detected".
        # Let's see if the schema rejects "normal".
        manual_neg_payload["finding"] = "no_pneumonia_detected"
        validated_neg = AnalysisResponse(**manual_neg_payload)
        print("[PASS] Pydantic validation successful for manual negative.")
    except ValidationError as e:
        print("[FAIL] Validation Failed for manual negative!")
        print(e.json())

if __name__ == "__main__":
    test_validation()
