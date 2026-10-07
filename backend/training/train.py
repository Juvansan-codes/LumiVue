"""
LumiVue — Retraining Pipeline (Phase 6B)
========================================
Retrains the DenseNet-121 model using the verified, leak-proof 
patient-level dataset split.
"""

import os
import sys
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from sklearn.metrics import roc_auc_score, average_precision_score, precision_recall_fscore_support
from torchvision import transforms

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from training.dataset import RSNAPneumoniaDataset
from training.config import config
from app.models.pneumonia import PneumoniaModel
import csv

def verify_splits():
    split_dir = Path(__file__).parent / "runs" / "final_split"
    train_file = split_dir / "train_patient_ids.csv"
    val_file = split_dir / "val_patient_ids.csv"
    
    train_ids = set()
    val_ids = set()
    
    train_pos, train_neg = 0, 0
    val_pos, val_neg = 0, 0
    
    with open(train_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            train_ids.add(row["patientId"])
            if int(row["label"]) == 1:
                train_pos += 1
            else:
                train_neg += 1
                
    with open(val_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            val_ids.add(row["patientId"])
            if int(row["label"]) == 1:
                val_pos += 1
            else:
                val_neg += 1
                
    overlap = len(train_ids.intersection(val_ids))
    print(f"Train patients: {len(train_ids)}")
    print(f"Validation patients: {len(val_ids)}")
    print(f"Overlap: {overlap}")
    
    if overlap != 0:
        raise ValueError(f"CRITICAL: Overlap of {overlap} detected!")
        
    return len(train_ids), len(val_ids), train_pos, train_neg, val_pos, val_neg

def main():
    print("=" * 60)
    print("LumiVue Phase 6B: DenseNet-121 Retraining")
    print("=" * 60)
    
    # 1. VERIFY SPLITS & CALCULATE POS WEIGHT
    t_cnt, v_cnt, t_pos, t_neg, v_pos, v_neg = verify_splits()
    
    pos_weight = t_neg / t_pos
    print(f"Train Positive: {t_pos}, Train Negative: {t_neg}")
    print(f"Validation Positive: {v_pos}, Validation Negative: {v_neg}")
    print(f"Calculated pos_weight: {pos_weight:.4f}")
    
    # 2. DATASETS & AUGMENTATION
    data_dir = Path("data/raw")
    
    train_transform = transforms.Compose([
        transforms.RandomRotation(5),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="train", transform=train_transform)
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val", transform=val_transform)
    
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
    
    train_loader = DataLoader(
        train_dataset, 
        batch_size=config.batch_size, 
        shuffle=True, 
        num_workers=config.num_workers,
        pin_memory=True,
        collate_fn=custom_collate
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=config.batch_size, 
        shuffle=False, 
        num_workers=config.num_workers,
        pin_memory=True,
        collate_fn=custom_collate
    )
    
    # 3. MODEL SETUP
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nUsing device: {device}")
    
    model = PneumoniaModel(device=device)
    # The PneumoniaModel already initialized a fresh pretrained backbone
    
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], device=device))
    scaler = torch.amp.GradScaler(device='cuda', enabled=config.use_amp)
    
    best_roc = 0.0
    best_epoch = -1
    
    # Track metrics for metadata
    history = []
    
    start_time = time.time()
    
    # 4. STAGE 1: Freeze backbone, train classifier (Epochs 1-3)
    print("\n--- STAGE 1: Freezing Backbone ---")
    for param in model.backbone.parameters():
        param.requires_grad = False
    for param in model.backbone.classifier.parameters():
        param.requires_grad = True
        
    optimizer = optim.Adam(model.backbone.classifier.parameters(), lr=1e-4)
    
    epochs_stage1 = 3
    epochs_stage2 = 2
    total_epochs = epochs_stage1 + epochs_stage2
    
    for epoch in range(1, total_epochs + 1):
        if epoch == epochs_stage1 + 1:
            print("\n--- STAGE 2: Unfreezing DenseBlock 4 ---")
            for param in model.backbone.features.denseblock4.parameters():
                param.requires_grad = True
            for param in model.backbone.features.norm5.parameters():
                param.requires_grad = True
            optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.backbone.parameters()), lr=1e-5)
            
        print(f"\nEpoch [{epoch}/{total_epochs}]")
        
        # Train
        model.train()
        train_loss = 0.0
        
        for batch_idx, batch in enumerate(train_loader):
            images = batch["image"].to(device)
            labels = batch["label"].to(device).unsqueeze(1)
            
            optimizer.zero_grad()
            
            with torch.amp.autocast(device_type='cuda', enabled=config.use_amp):
                logits = model.backbone(images)
                loss = criterion(logits, labels)
                
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item()
            
            if batch_idx % 2000 == 0 and batch_idx > 0:
                print(f"  Batch {batch_idx}/{len(train_loader)} - Loss: {loss.item():.4f}")
                
        avg_train_loss = train_loss / len(train_loader)
        
        # Validate
        model.eval()
        val_loss = 0.0
        y_true = []
        y_prob = []
        
        with torch.no_grad():
            for batch in val_loader:
                images = batch["image"].to(device)
                labels = batch["label"].to(device).unsqueeze(1)
                
                with torch.amp.autocast(device_type='cuda', enabled=config.use_amp):
                    logits = model.backbone(images)
                    loss = criterion(logits, labels)
                    
                val_loss += loss.item()
                
                probs = torch.sigmoid(logits)
                y_true.extend(labels.cpu().numpy())
                y_prob.extend(probs.cpu().numpy())
                
        avg_val_loss = val_loss / len(val_loader)
        
        # Metrics
        y_true = [int(y[0]) for y in y_true]
        y_prob = [float(y[0]) for y in y_prob]
        y_pred = [1 if p >= 0.50 else 0 for p in y_prob]
        
        roc_auc = roc_auc_score(y_true, y_prob)
        pr_auc = average_precision_score(y_true, y_prob)
        precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary", zero_division=0)
        
        from sklearn.metrics import confusion_matrix
        cm = confusion_matrix(y_true, y_pred, labels=[0,1])
        TN, FP, FN, TP = cm.ravel()
        specificity = TN / (TN + FP) if (TN + FP) > 0 else 0.0
        accuracy = (TP + TN) / len(y_true)
        
        print(f"  Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")
        print(f"  Val ROC-AUC: {roc_auc:.4f} | Val PR-AUC: {pr_auc:.4f}")
        print(f"  Val Recall: {recall:.4f} | Val Spec: {specificity:.4f} | Val F1: {f1:.4f} | Val Acc: {accuracy:.4f}")
        
        epoch_stats = {
            "epoch": epoch,
            "train_loss": avg_train_loss,
            "val_loss": avg_val_loss,
            "val_roc_auc": roc_auc,
            "val_pr_auc": pr_auc,
            "val_recall": recall,
            "val_specificity": specificity,
            "val_f1": f1,
            "val_accuracy": accuracy
        }
        history.append(epoch_stats)
        
        if roc_auc > best_roc:
            best_roc = roc_auc
            best_epoch = epoch
            save_path = Path("models/lumivue_densenet121_rsna_v2.pth")
            save_path.parent.mkdir(parents=True, exist_ok=True)
            torch.save(model.backbone.state_dict(), save_path)
            print(f"  [*] Saved new best checkpoint -> {save_path}", flush=True)

    total_time = time.time() - start_time
    
    # Save JSON metadata
    metadata = {
        "train_patient_count": t_cnt,
        "val_patient_count": v_cnt,
        "train_positive": t_pos,
        "train_negative": t_neg,
        "pos_weight": pos_weight,
        "image_size": config.image_size,
        "batch_size": config.batch_size,
        "learning_rates": {"stage1": 1e-4, "stage2": 1e-5},
        "epochs": total_epochs,
        "best_epoch": best_epoch,
        "best_val_roc_auc": best_roc,
        "training_time_seconds": total_time,
        "history": history
    }
    
    json_path = Path("models/lumivue_densenet121_rsna_v2.json")
    with open(json_path, "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nTraining Complete in {total_time/60:.2f} mins!")
    print(f"Best ROC-AUC: {best_roc:.4f} at Epoch {best_epoch}")
    print(f"Metadata saved to {json_path}")

if __name__ == "__main__":
    main()
