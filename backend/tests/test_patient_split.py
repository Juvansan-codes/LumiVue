"""
LumiVue — Permanent Leakage Test
================================
Ensures there is absolutely zero patient overlap between train and validation splits.
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training.dataset import RSNAPneumoniaDataset

def test_no_patient_leakage():
    data_dir = Path(__file__).parent.parent / "data" / "raw"
    
    train_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="train")
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val")
    
    train_patients = set(d["patient_id"] for d in train_dataset.patient_data)
    val_patients = set(d["patient_id"] for d in val_dataset.patient_data)
    
    overlap = train_patients.intersection(val_patients)
    
    print(f"Train patients: {len(train_patients)}")
    print(f"Validation patients: {len(val_patients)}")
    print(f"Overlap: {len(overlap)}")
    
    assert len(overlap) == 0, f"DATA LEAKAGE DETECTED! Overlap count: {len(overlap)}"

if __name__ == "__main__":
    test_no_patient_leakage()
