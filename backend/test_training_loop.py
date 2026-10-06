import os
import sys
import time
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.pneumonia import PneumoniaModel
from test_dataset import setup_mock_data
from training.config import config
from training.dataset import RSNAPneumoniaDataset

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

def run_tiny_training_test():
    print("--- LumiVue Phase 3A: Tiny Training Sanity Test ---")
    
    # 1. Check Device & VRAM
    device_str = "cuda" if torch.cuda.is_available() else "cpu"
    device = torch.device(device_str)
    
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Initial GPU memory allocated: {torch.cuda.memory_allocated(0) / (1024**2):.2f} MB")
    
    # Set seed
    torch.manual_seed(config.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(config.seed)
        
    # 2. Dataset & DataLoader (Mock)
    data_dir = Path("data/raw")
    setup_mock_data(data_dir)
    
    dataset = RSNAPneumoniaDataset(data_dir=data_dir, split="train", seed=config.seed)
    dataloader = DataLoader(
        dataset, 
        batch_size=config.batch_size, 
        shuffle=True,
        num_workers=config.num_workers,
        collate_fn=custom_collate
    )
    
    # 3. Model
    print("\nLoading DenseNet-121...")
    model = PneumoniaModel(device=device_str)
    model.train()
    
    # 4. Loss & Optimizer
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)
    
    # Scaler for AMP
    scaler = torch.amp.GradScaler(enabled=config.use_amp and device.type == "cuda")
    
    print("\nStarting Tiny Training Loop...")
    try:
        for batch_idx, batch in enumerate(dataloader):
            images = batch["image"].to(device)
            # labels need to be reshaped to match logits [batch_size, 1]
            labels = batch["label"].unsqueeze(1).to(device)
            
            print(f"  Batch {batch_idx+1}:")
            print(f"    Input shape: {images.shape}")
            
            optimizer.zero_grad()
            
            # Forward pass with AMP
            with torch.amp.autocast(device_type=device.type, enabled=config.use_amp and device.type == "cuda"):
                logits = model(images)
                loss = criterion(logits, labels)
                
            print(f"    Forward pass successful. Loss: {loss.item():.4f}")
            
            # Backward pass
            scaler.scale(loss).backward()
            print("    Backward pass successful.")
            
            # Optimizer step
            scaler.step(optimizer)
            scaler.update()
            print("    Optimizer step successful.")
            
            if torch.cuda.is_available():
                print(f"    GPU Memory allocated after step: {torch.cuda.memory_allocated(0) / (1024**2):.2f} MB")
                
            # Only run one batch for the tiny test
            break
            
        print("\n[SUCCESS] Tiny training test passed successfully!")
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            print("\n[ERROR] Out of Memory (OOM) occurred!")
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        else:
            print(f"\n[ERROR] Error during training loop: {e}")
            raise e

if __name__ == "__main__":
    run_tiny_training_test()
