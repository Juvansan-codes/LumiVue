import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.pneumonia import PneumoniaModel
from training.config import config
from training.dataset import RSNAPneumoniaDataset
from training.evaluate import evaluate_prototype

def custom_collate(batch):
    images = torch.stack([item['image'] for item in batch])
    labels = torch.stack([item['label'] for item in batch])
    patient_ids = [item['patient_id'] for item in batch]
    bboxes = [item['bboxes'] for item in batch]
    original_shapes = [item['original_shape'] for item in batch]
    
    return {
        'image': images,
        'label': labels,
        'patient_id': patient_ids,
        'bboxes': bboxes,
        'original_shape': original_shapes
    }

def main():
    print("--- LumiVue Phase 3B: Real DenseNet-121 Fine-tuning ---")
    
    # Target subset for prototype
    SUBSET_SIZE = 2500 
    
    data_dir = Path("data/raw")
    if not (data_dir / "stage_2_train_labels.csv").exists():
        print(f"ERROR: Dataset not found in {data_dir}")
        return
        
    device_str = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_str)
    
    print(f"GPU: {torch.cuda.get_device_name(0) if device_str == 'cuda' else 'None'}")
    
    # 1. Dataset & Split
    print("\n[1] Preparing datasets...")
    train_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="train", seed=config.seed, subset_size=SUBSET_SIZE)
    val_dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="val", seed=config.seed, subset_size=SUBSET_SIZE)
    
    print(f"Train patients: {len(train_dataset)}")
    print(f"Validation patients: {len(val_dataset)}")
    
    train_ids = set([d["patient_id"] for d in train_dataset.patient_data])
    val_ids = set([d["patient_id"] for d in val_dataset.patient_data])
    overlap = len(train_ids.intersection(val_ids))
    print(f"Overlap: {overlap}")
    if overlap > 0:
        print("ERROR: Patient leak detected! Overlap must be 0.")
        return
        
    # 2. Class Imbalance
    pos_count = sum([d["target"] for d in train_dataset.patient_data])
    neg_count = len(train_dataset) - pos_count
    print(f"Positive training patients: {pos_count}")
    print(f"Negative training patients: {neg_count}")
    print(f"Positive/Negative Ratio: {pos_count/neg_count:.2f}" if neg_count > 0 else "N/A")
    
    pos_weight = neg_count / pos_count if pos_count > 0 else 1.0
    print(f"Calculated pos_weight: {pos_weight:.4f}")
    
    # 3. DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True, num_workers=config.num_workers, collate_fn=custom_collate)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False, num_workers=config.num_workers, collate_fn=custom_collate)
    
    # 4. Model Loading (Stage 1: Freeze backbone)
    print("\n[2] Loading DenseNet-121...")
    model = PneumoniaModel(device=device_str)
    
    # Freeze backbone
    for param in model.backbone.features.parameters():
        param.requires_grad = False
        
    criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], device=device))
    optimizer = optim.Adam(model.backbone.classifier.parameters(), lr=config.learning_rate)
    scaler = torch.amp.GradScaler(enabled=config.use_amp and device_str == "cuda")
    
    # 5. Training Loop
    runs_dir = Path("training/runs")
    runs_dir.mkdir(parents=True, exist_ok=True)
    
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    best_checkpoint_path = models_dir / "lumivue_densenet121_rsna.pth"
    best_metadata_path = models_dir / "lumivue_densenet121_rsna.json"
    
    best_roc_auc = 0.0
    best_epoch = 0
    best_metrics = {}
    
    history_file = open(runs_dir / "training_history.csv", "w")
    history_file.write("epoch,stage,train_loss,val_loss,val_roc_auc,val_pr_auc\n")
    
    start_time = time.time()
    
    print("\n[3] Starting Training...")
    
    # Epochs
    TOTAL_EPOCHS = config.epochs
    for epoch in range(1, TOTAL_EPOCHS + 1):
        stage = "Stage 1 (Frozen Backbone)"
        
        # Stage 2 Transition
        if epoch == TOTAL_EPOCHS:
            stage = "Stage 2 (Fine-tuning)"
            print(f"\n--- Entering {stage} ---")
            for param in model.backbone.features.denseblock4.parameters():
                param.requires_grad = True
            for param in model.backbone.features.norm5.parameters():
                param.requires_grad = True
            optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-5)
            
        print(f"\nEpoch {epoch}/{TOTAL_EPOCHS} [{stage}]")
        
        # Train
        model.train()
        train_loss = 0.0
        for batch_idx, batch in enumerate(train_loader):
            images = batch["image"].to(device)
            labels = batch["label"].unsqueeze(1).to(device)
            
            optimizer.zero_grad()
            with torch.amp.autocast(device_type=device.type, enabled=config.use_amp and device_str == "cuda"):
                logits = model(images)
                loss = criterion(logits, labels)
                
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item()
            
        train_loss /= len(train_loader)
        
        # Validate
        model.eval()
        val_loss = 0.0
        y_true = []
        y_prob = []
        
        with torch.no_grad():
            for batch in val_loader:
                images = batch["image"].to(device)
                labels = batch["label"].unsqueeze(1).to(device)
                
                logits = model(images)
                loss = criterion(logits, labels)
                val_loss += loss.item()
                
                probs = torch.sigmoid(logits).cpu().squeeze(1).tolist()
                y_true.extend(labels.cpu().squeeze(1).tolist())
                y_prob.extend(probs)
                
        val_loss /= len(val_loader)
        
        metrics = evaluate_prototype(y_true, y_prob, runs_dir, threshold=0.5)
        
        print(f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"Val ROC-AUC: {metrics['roc_auc']:.4f} | PR-AUC: {metrics['pr_auc']:.4f}")
        print(f"F1: {metrics['f1']:.4f} | Precision: {metrics['precision']:.4f} | Recall: {metrics['recall']:.4f}")
        
        history_file.write(f"{epoch},{stage},{train_loss:.4f},{val_loss:.4f},{metrics['roc_auc']:.4f},{metrics['pr_auc']:.4f}\n")
        history_file.flush()
        
        # Save Best Model
        if metrics["roc_auc"] > best_roc_auc:
            best_roc_auc = metrics["roc_auc"]
            best_epoch = epoch
            best_metrics = metrics
            
            torch.save({"state_dict": model.state_dict()}, best_checkpoint_path)
            
            metadata = {
                "model_architecture": "DenseNet-121",
                "image_size": config.image_size,
                "batch_size": config.batch_size,
                "seed": config.seed,
                "train_samples": len(train_dataset),
                "val_samples": len(val_dataset),
                "positive_count": pos_count,
                "negative_count": neg_count,
                "pos_weight": pos_weight,
                "best_epoch": best_epoch,
                "validation_metrics": metrics,
                "timestamp": datetime.now().isoformat()
            }
            
            with open(best_metadata_path, "w") as f:
                json.dump(metadata, f, indent=2)
                
            with open(runs_dir / "metrics.json", "w") as f:
                json.dump(metrics, f, indent=2)
                
            print(">>> Saved new best checkpoint! <<<")
            
    history_file.close()
    
    total_time = time.time() - start_time
    print(f"\n[4] Training Complete in {total_time/60:.2f} minutes.")
    
    # 6. Held-out Inference Test
    print("\n[5] Held-out Inference Test...")
    test_model = PneumoniaModel(device=device_str)
    test_model.load_checkpoint(best_checkpoint_path)
    
    sample = val_dataset[0]
    img = sample["image"].unsqueeze(0)  # Add batch dim
    
    result = test_model.predict(img)
    
    print(f"Patient ID: {sample['patient_id']}")
    print(f"Ground Truth: {sample['label'].item()}")
    print(f"Prediction: {'suspected_pneumonia' if result.score >= 0.60 else 'normal'}")
    print(f"Model Score: {result.score:.4f}")
    
    print("\nDone.")

if __name__ == "__main__":
    main()
