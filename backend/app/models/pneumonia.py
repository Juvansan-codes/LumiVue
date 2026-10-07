"""
LumiVue — Pneumonia Classification Model Interface
====================================================
Owner: Backend Member 3 (DenseNet / Dataset / Preprocessing)

Interface for the DenseNet-121 pneumonia classifier.

Usage:
    model = PneumoniaModel(device="cuda")
    # For training
    model.train()
    logits = model(images)
    
    # For inference
    model.load_checkpoint("models/lumivue_densenet121_rsna.pth")
    score = model.predict(image_tensor)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import torch
import torch.nn as nn
import torchvision.models as models

logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    """Result from the pneumonia classifier."""

    score: float  # 0.0 = normal, 1.0 = pneumonia
    raw_logits: list[float] | None = None


class PneumoniaModel(nn.Module):
    """
    DenseNet-121 based pneumonia classifier.
    Trained on the RSNA Pneumonia Detection Challenge dataset.
    """

    def __init__(self, device: str = "cpu"):
        super().__init__()
        self.device = torch.device(device)
        
        # Load ImageNet-pretrained DenseNet-121
        logger.info("Loading pretrained DenseNet-121...")
        # Note: weights=models.DenseNet121_Weights.DEFAULT is standard in newer torchvision
        self.backbone = models.densenet121(weights=models.DenseNet121_Weights.DEFAULT)
        
        # Replace the final classifier for binary classification
        num_ftrs = self.backbone.classifier.in_features
        self.backbone.classifier = nn.Linear(num_ftrs, 1)
        
        self.to(self.device)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        Returns raw logits (use BCEWithLogitsLoss for training).
        """
        return self.backbone(x)

    def load_checkpoint(self, checkpoint_path: str | Path) -> None:
        """Load model weights from disk."""
        path = Path(checkpoint_path)
        if not path.exists():
            raise FileNotFoundError(f"Checkpoint not found at {path}")
            
        logger.info(f"Loading checkpoint from {path}")
        state_dict = torch.load(path, map_location=self.device, weights_only=True)
        
        # Handle DataParallel wrapped dicts if necessary
        if "state_dict" in state_dict:
            state_dict = state_dict["state_dict"]
        
        # Determine if checkpoint was saved from model.backbone (no 'backbone.' prefix)
        # or from the full PneumoniaModel wrapper (has 'backbone.' prefix)
        sample_key = next(iter(state_dict.keys()))
        if sample_key.startswith("backbone."):
            self.load_state_dict(state_dict)
        else:
            # Checkpoint was saved via model.backbone.state_dict()
            self.backbone.load_state_dict(state_dict)
        self.eval()

    def predict(self, image_tensor: torch.Tensor) -> PredictionResult:
        """
        Predict pneumonia probability from a preprocessed image tensor.

        Parameters
        ----------
        image_tensor : torch.Tensor
            Preprocessed image tensor of shape (1, 3, 224, 224).

        Returns
        -------
        PredictionResult
            Contains the pneumonia probability score.
        """
        self.eval()
        image_tensor = image_tensor.to(self.device)
        
        with torch.no_grad():
            logits = self.forward(image_tensor)
            prob = torch.sigmoid(logits).item()
            
        return PredictionResult(
            score=prob,
            raw_logits=[logits.item()]
        )
