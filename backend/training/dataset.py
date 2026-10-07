"""
LumiVue — RSNA Pneumonia Detection Dataset
============================================
Handles RSNA dataset loading, DICOM parsing, preprocessing, and patient splitting.
Ensures no patient leakage between train and validation sets.
"""

from __future__ import annotations

import csv
import logging
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import pydicom
import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

logger = logging.getLogger(__name__)


def preprocess_dicom_to_tensor(dicom_ds: pydicom.dataset.FileDataset) -> torch.Tensor:
    """
    Preprocess a DICOM dataset to a model-compatible tensor (3-channel, 224x224).
    """
    # 1. Extract pixel array
    pixel_array = dicom_ds.pixel_array.astype(np.float32)

    # 2. Normalize to 0-1 range
    # RSNA images are generally 8-bit (0-255) but check max to be safe
    v_max = pixel_array.max()
    if v_max > 0:
        pixel_array = pixel_array / v_max

    # 3. Convert grayscale to 3-channel (copy channels)
    # Shape becomes (H, W, 3)
    image_3c = np.stack((pixel_array,) * 3, axis=-1)

    # Convert to PIL Image for torchvision transforms
    # Scale back to 0-255 uint8 for PIL
    image_pil = Image.fromarray((image_3c * 255).astype(np.uint8))

    # 4. Resize and convert to tensor
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        # ImageNet normalization (DenseNet expects this)
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    tensor = transform(image_pil)
    return tensor


class RSNAPneumoniaDataset(Dataset):
    """
    RSNA Pneumonia Detection Challenge Dataset.
    Loads DICOM images and bounding boxes, applying preprocessing.
    """

    def __init__(self, data_dir: str | Path, split: str = "train", seed: int = 42, transform=None, subset_size: int = None):
        self.data_dir = Path(data_dir)
        self.split = split
        self.transform = transform
        self.subset_size = subset_size
        
        self.images_dir = self.data_dir / "stage_2_train_images"
        self.labels_file = self.data_dir / "stage_2_train_labels.csv"
        
        self.patient_data = []
        self._prepare_dataset(seed)

    def _prepare_dataset(self, seed: int):
        """Parse CSV, group by patient, and create splits."""
        if not self.labels_file.exists():
            raise FileNotFoundError(f"Labels file not found: {self.labels_file}")
        
        # Parse CSV
        # Fields: patientId, x, y, width, height, Target
        patient_records = defaultdict(list)
        
        with open(self.labels_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                patient_id = row.get("patientId")
                if not patient_id:
                    logger.warning("Skipping row with missing patientId.")
                    continue
                
                target = int(row.get("Target", 0))
                
                bbox = None
                if target == 1:
                    try:
                        x = float(row["x"])
                        y = float(row["y"])
                        w = float(row["width"])
                        h = float(row["height"])
                        bbox = [x, y, w, h]
                    except (ValueError, TypeError):
                        pass # Valid for Target=1 to not have box sometimes, or malformed
                
                patient_records[patient_id].append({
                    "target": target,
                    "bbox": bbox
                })
        
        if not patient_records:
            raise ValueError(f"No valid records found in {self.labels_file}")

        # Load from pre-generated split files to guarantee 0 leakage
        split_file = Path(__file__).parent / "runs" / "final_split" / f"{self.split}_patient_ids.csv"
        if not split_file.exists():
            raise FileNotFoundError(f"Split file missing: {split_file}. Run generate_splits.py first.")
            
        split_patients = []
        with open(split_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                split_patients.append(row["patientId"])
                
        # Optional: Apply subset_size strictly within this split
        if self.subset_size and self.subset_size < len(split_patients):
            split_patients = split_patients[:self.subset_size]
        
        # Flatten into dataset items
        # NOTE: A patient can have multiple bounding boxes. We store all bboxes for the patient.
        for pid in split_patients:
            records = patient_records[pid]
            # Target is 1 if any record has Target=1
            target = max([r["target"] for r in records])
            bboxes = [r["bbox"] for r in records if r["bbox"] is not None]
            
            dicom_path = self.images_dir / f"{pid}.dcm"
            
            self.patient_data.append({
                "patient_id": pid,
                "target": target,
                "bboxes": bboxes,
                "dicom_path": dicom_path
            })

    def __len__(self) -> int:
        return len(self.patient_data)

    def __getitem__(self, idx: int) -> dict[str, Any]:
        data = self.patient_data[idx]
        dicom_path = data["dicom_path"]
        patient_id = data["patient_id"]
        
        if not dicom_path.exists():
            raise FileNotFoundError(f"DICOM file not found: {dicom_path}")
            
        try:
            dicom_ds = pydicom.dcmread(dicom_path)
            # Basic validation
            if not hasattr(dicom_ds, "pixel_array"):
                raise ValueError(f"No pixel_array in DICOM: {dicom_path}")
                
            original_shape = dicom_ds.pixel_array.shape
            
            if self.transform:
                # Custom transform path
                image = self.transform(dicom_ds)
            else:
                # Default preprocessing pipeline
                image = preprocess_dicom_to_tensor(dicom_ds)
                
            # Scale bounding boxes to 224x224
            # original shape is usually (1024, 1024) for RSNA
            bboxes = []
            if data["bboxes"] and len(original_shape) == 2:
                orig_h, orig_w = original_shape
                scale_x = 224.0 / orig_w
                scale_y = 224.0 / orig_h
                
                for box in data["bboxes"]:
                    x, y, w, h = box
                    bboxes.append([
                        x * scale_x,
                        y * scale_y,
                        w * scale_x,
                        h * scale_y
                    ])
                    
            return {
                "image": image,
                "label": torch.tensor(data["target"], dtype=torch.float32),
                "patient_id": patient_id,
                "bboxes": torch.tensor(bboxes, dtype=torch.float32) if bboxes else torch.empty((0, 4)),
                "original_shape": original_shape
            }
            
        except Exception as e:
            logger.error(f"Failed to load/process DICOM for {patient_id}: {e}")
            raise
