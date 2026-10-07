"""
LumiVue — Phase 6B Evaluation
=============================
Evaluates the retrained DenseNet-121 (v2) on the validation split.
"""

import os
import sys
import json
from pathlib import Path

import torch
from torch.utils.data import DataLoader
from sklearn.metrics import roc_auc_score, average_precision_score, precision_recall_fscore_support, confusion_matrix
import matplotlib.pyplot as plt
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training.dataset import RSNAPneumoniaDataset
from training.config import config
from app.models.pneumonia import PneumoniaModel

def main():
    print("=" * 60)
    print("LumiVue Phase 6B: V2 Model Evaluation")
    print("=" * 60)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    data_dir = Path("data/raw")
    
    # Load dataset
    # We must use exactly the same transform pipeline as inference (no augmentations)
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val")
    def custom_collate(batch):
        images = torch.stack([item["image"] for item in batch])
        labels = torch.stack([item["label"] for item in batch])
        bboxes = [item["bboxes"] for item in batch]
        patient_ids = [item["patient_id"] for item in batch]
        original_shapes = [item["original_shape"] for item in batch]
        return {
            "image": images, 
            "label": labels, 
            "bboxes": bboxes, 
            "patient_id": patient_ids, 
            "original_shape": original_shapes
        }
        
    val_loader = DataLoader(
        val_dataset,
        batch_size=config.batch_size * 2, # evaluation can use larger batch
        shuffle=False,
        num_workers=config.num_workers,
        collate_fn=custom_collate
    )
    
    # Load model
    model = PneumoniaModel(device=device)
    checkpoint_path = Path("models/lumivue_densenet121_rsna_v2.pth")
    
    if not checkpoint_path.exists():
        raise FileNotFoundError(f"V2 Checkpoint not found at {checkpoint_path}")
        
    # Load the V2 checkpoint (saved as backbone.state_dict() by train.py)
    state_dict = torch.load(checkpoint_path, map_location=device, weights_only=True)
    model.backbone.load_state_dict(state_dict)
    model.eval()
    
    y_true = []
    y_prob = []
    
    print("\nRunning Evaluation over Validation Set...")
    with torch.no_grad():
        for batch_idx, batch in enumerate(val_loader):
            images = batch["image"].to(device)
            labels = batch["label"]
            
            with torch.amp.autocast(device_type='cuda', enabled=config.use_amp):
                # We can use the PneumoniaModel predict wrapper or backbone directly
                logits = model.backbone(images)
                probs = torch.sigmoid(logits)
                
            y_true.extend(labels.cpu().numpy())
            y_prob.extend(probs.cpu().numpy())
            
            if batch_idx % 200 == 0 and batch_idx > 0:
                print(f"  Batch {batch_idx}/{len(val_loader)}")
                
    y_true = [int(y) for y in y_true]
    y_prob = [float(y[0]) for y in y_prob]
    
    threshold = 0.50
    y_pred = [1 if p >= threshold else 0 for p in y_prob]
    
    # Metrics
    roc_auc = roc_auc_score(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary", zero_division=0)
    
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    TN, FP, FN, TP = cm.ravel()
    
    specificity = TN / (TN + FP) if (TN + FP) > 0 else 0.0
    accuracy = (TP + TN) / len(y_true)
    
    print("\n[Metrics]")
    print(f"ROC-AUC:      {roc_auc:.4f}")
    print(f"PR-AUC:       {pr_auc:.4f}")
    print(f"Precision:    {precision:.4f}")
    print(f"Recall:       {recall:.4f}")
    print(f"Specificity:  {specificity:.4f}")
    print(f"F1:           {f1:.4f}")
    print(f"Accuracy:     {accuracy:.4f}")
    
    print("\n[Confusion Matrix (Threshold 0.50)]")
    print(f"TP: {TP} | FP: {FP}")
    print(f"FN: {FN} | TN: {TN}")
    
    # Verify math consistency
    assert abs(recall - (TP / (TP + FN))) < 1e-4
    assert abs(specificity - (TN / (TN + FP))) < 1e-4
    
    # Save CM
    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(cm, cmap='Blues')
    plt.colorbar(cax)
    for (i, j), val in np.ndenumerate(cm):
        ax.text(j, i, f'{val}', ha='center', va='center', color='red')
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(['Normal', 'Pneumonia'])
    ax.set_yticklabels(['Normal', 'Pneumonia'])
    plt.ylabel('Ground Truth')
    plt.xlabel('Prediction')
    plt.title('V2 Confusion Matrix (Threshold 0.50)')
    
    runs_dir = Path("runs")
    runs_dir.mkdir(parents=True, exist_ok=True)
    cm_path = runs_dir / "v2_confusion_matrix.png"
    plt.savefig(cm_path)
    plt.close()
    print(f"-> Saved confusion matrix to {cm_path}")
    
    # Held-out Checkpoint Test
    print("\n[Held-Out Checkpoint Test]")
    
    print(f"{'Patient ID':<40} | {'GT':<2} | {'Score':<6} | {'Prediction':<20}")
    print("-" * 80)
    for i in range(5):
        sample = val_dataset[i]
        pid = sample["patient_id"]
        gt = int(sample["label"].item())
        
        img = sample["image"].unsqueeze(0).to(device)
        res = model.predict(img)
        pred_label = "suspected_pneumonia" if res.score >= threshold else "normal"
        
        print(f"{pid:<40} | {gt:<2} | {res.score:.4f} | {pred_label:<20}")

if __name__ == "__main__":
    main()
