"""
LumiVue — Threshold Analysis
=============================
Evaluates multiple prediction thresholds for the trained DenseNet-121 model.
No retraining occurs.
"""

import csv
import json
import os
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from torch.utils.data import DataLoader

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.pneumonia import PneumoniaModel
from training.config import config
from training.dataset import RSNAPneumoniaDataset
from training.train import custom_collate


def analyze_thresholds():
    print("--- LumiVue Phase 3C: Threshold Analysis ---")
    
    SUBSET_SIZE = 2500
    data_dir = Path("data/raw")
    
    device_str = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_str)
    
    # 1. Load Validation Dataset
    print("\n[1] Preparing validation dataset...")
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val", seed=config.seed, subset_size=SUBSET_SIZE)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False, num_workers=config.num_workers, collate_fn=custom_collate)
    
    # 2. Load Model Checkpoint
    checkpoint_path = Path("models/lumivue_densenet121_rsna.pth")
    if not checkpoint_path.exists():
        print(f"ERROR: Checkpoint not found at {checkpoint_path}")
        return
        
    print(f"\n[2] Loading trained model from {checkpoint_path}...")
    model = PneumoniaModel(device=device_str)
    model.load_checkpoint(checkpoint_path)
    model.eval()
    
    # 3. Collect Predictions
    print("\n[3] Running inference on validation set...")
    y_true = []
    y_prob = []
    
    with torch.no_grad():
        for batch in val_loader:
            images = batch["image"].to(device)
            labels = batch["label"].squeeze().tolist()
            
            # Handle batch size 1 edge case
            if not isinstance(labels, list):
                labels = [labels]
                
            logits = model(images)
            probs = torch.sigmoid(logits).cpu().squeeze().tolist()
            
            if not isinstance(probs, list):
                probs = [probs]
                
            y_true.extend(labels)
            y_prob.extend(probs)
            
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    
    # 4. Evaluate Thresholds
    print("\n[4] Evaluating thresholds...")
    thresholds = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
    
    results = []
    
    print("\nThreshold | Precision | Recall | Specificity | F1     | Accuracy")
    print("-" * 62)
    
    for th in thresholds:
        y_pred = (y_prob >= th).astype(float)
        
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        
        results.append({
            "threshold": th,
            "precision": prec,
            "recall": rec,
            "specificity": specificity,
            "f1": f1,
            "accuracy": acc,
            "fpr": fp / (fp + tn) if (fp + tn) > 0 else 0.0,
            "fnr": fn / (fn + tp) if (fn + tp) > 0 else 0.0
        })
        
        print(f"{th:.2f}      | {prec:.4f}    | {rec:.4f} | {specificity:.4f}      | {f1:.4f} | {acc:.4f}")

    # 5. Save Outputs
    runs_dir = Path("training/runs")
    runs_dir.mkdir(parents=True, exist_ok=True)
    
    csv_path = runs_dir / "threshold_analysis.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results[0].keys())
        writer.writeheader()
        writer.writerows(results)
        
    # Plot
    plt.figure(figsize=(8, 6))
    recalls = [r["recall"] for r in results]
    specs = [r["specificity"] for r in results]
    f1s = [r["f1"] for r in results]
    
    plt.plot(thresholds, recalls, label="Recall (Sensitivity)", marker="o")
    plt.plot(thresholds, specs, label="Specificity", marker="s")
    plt.plot(thresholds, f1s, label="F1 Score", marker="^", linestyle="--")
    
    plt.axvline(x=0.50, color='r', linestyle=':', label="Baseline (0.50)")
    
    plt.title("Threshold vs Recall & Specificity")
    plt.xlabel("Prediction Threshold")
    plt.ylabel("Metric Score")
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plot_path = runs_dir / "threshold_analysis.png"
    plt.savefig(plot_path)
    plt.close()
    
    print(f"\nSaved CSV to {csv_path}")
    print(f"Saved Plot to {plot_path}")
    print("\nDone.")

if __name__ == "__main__":
    analyze_thresholds()
