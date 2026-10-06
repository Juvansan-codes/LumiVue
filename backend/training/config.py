"""
LumiVue — Training Configuration
==================================
Hyperparameters and settings for model training.
Configured conservatively for RTX 3050 4GB VRAM.
"""

from dataclasses import dataclass


@dataclass
class TrainingConfig:
    # Model & Image
    image_size: int = 224
    
    # Batch size kept extremely small to avoid OOM on 4GB VRAM
    batch_size: int = 2
    
    # Optimization
    learning_rate: float = 1e-4
    epochs: int = 5
    
    # DataLoader
    num_workers: int = 0  # 0 is safer for Windows multi-processing issues
    
    # Reproducibility
    seed: int = 42
    
    # Mixed Precision (AMP) to save VRAM and speed up training
    use_amp: bool = True

# Global instance
config = TrainingConfig()
