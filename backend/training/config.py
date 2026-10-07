"""
LumiVue — Training Configuration
==================================
Hyperparameters and settings for model training.
Optimized for RTX 4060 8GB VRAM with PNG-cached dataset.
"""

from dataclasses import dataclass


@dataclass
class TrainingConfig:
    # Model & Image
    image_size: int = 224
    
    # Batch size optimized for RTX 4060 8GB VRAM
    batch_size: int = 32
    
    # Optimization
    learning_rate: float = 1e-4
    epochs: int = 5
    
    # DataLoader — 0 workers for Windows compatibility (PNG loading is fast enough)
    num_workers: int = 0
    
    # Reproducibility
    seed: int = 42
    
    # Mixed Precision (AMP) to save VRAM and speed up training
    use_amp: bool = True

# Global instance
config = TrainingConfig()
