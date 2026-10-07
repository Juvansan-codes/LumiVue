import csv
import os
import random
from collections import defaultdict
from pathlib import Path

def generate_splits():
    print("--- Generating Patient-Level Train/Val Splits ---")
    
    data_dir = Path("data/raw")
    labels_file = data_dir / "stage_2_train_labels.csv"
    
    # Group by patientId
    patient_targets = defaultdict(list)
    
    with open(labels_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = row["patientId"]
            if pid:
                patient_targets[pid].append(int(row.get("Target", 0)))
                
    # Calculate patient-level label = max(Target)
    patient_labels = {}
    for pid, targets in patient_targets.items():
        patient_labels[pid] = max(targets)
        
    # Separate into positive and negative for stratified splitting
    positive_patients = [pid for pid, label in patient_labels.items() if label == 1]
    negative_patients = [pid for pid, label in patient_labels.items() if label == 0]
    
    print(f"Total Unique Patients: {len(patient_labels)}")
    print(f"Total Positive: {len(positive_patients)}")
    print(f"Total Negative: {len(negative_patients)}")
    
    # Shuffle predictably
    random.seed(42)
    positive_patients.sort() # Ensure deterministic before shuffle
    negative_patients.sort()
    random.shuffle(positive_patients)
    random.shuffle(negative_patients)
    
    # Split 80/20
    pos_split_idx = int(len(positive_patients) * 0.8)
    neg_split_idx = int(len(negative_patients) * 0.8)
    
    train_pos = positive_patients[:pos_split_idx]
    val_pos = positive_patients[pos_split_idx:]
    
    train_neg = negative_patients[:neg_split_idx]
    val_neg = negative_patients[neg_split_idx:]
    
    train_patients = train_pos + train_neg
    val_patients = val_pos + val_neg
    
    # Verify Overlap
    train_set = set(train_patients)
    val_set = set(val_patients)
    overlap = len(train_set.intersection(val_set))
    print(f"Train patients: {len(train_patients)}")
    print(f"Validation patients: {len(val_patients)}")
    print(f"Train positive: {len(train_pos)}")
    print(f"Train negative: {len(train_neg)}")
    print(f"Validation positive: {len(val_pos)}")
    print(f"Validation negative: {len(val_neg)}")
    print(f"Overlap: {overlap}")
    
    assert overlap == 0, "FATAL: Overlap detected during split generation!"
    
    # Save splits
    out_dir = Path("training/runs/final_split")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    train_csv = out_dir / "train_patient_ids.csv"
    val_csv = out_dir / "val_patient_ids.csv"
    
    with open(train_csv, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["patientId", "label"])
        for pid in train_patients:
            writer.writerow([pid, patient_labels[pid]])
            
    with open(val_csv, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["patientId", "label"])
        for pid in val_patients:
            writer.writerow([pid, patient_labels[pid]])
            
    print(f"Saved train splits to {train_csv}")
    print(f"Saved val splits to {val_csv}")

if __name__ == "__main__":
    generate_splits()
