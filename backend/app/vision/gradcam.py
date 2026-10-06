"""
LumiVue — Grad-CAM Heatmap Generator
======================================
Owner: Backend Member 3 (Grad-CAM)

Generates Grad-CAM heatmaps and bounding boxes from DenseNet feature maps.

Usage:
    gradcam = GradCAM(model)
    result = gradcam.generate(image_tensor)

TODO:
    - Hook into DenseNet-121 final conv layer
    - Compute gradient-weighted class activation maps
    - Generate bounding box from heatmap thresholding
    - Return heatmap overlay image
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class GradCAMResult:
    """Result from Grad-CAM generation."""

    heatmap: bytes | None = None  # Heatmap image bytes
    bbox: list[int] | None = None  # [x_min, y_min, x_max, y_max]
    available: bool = False


class GradCAM:
    """
    Grad-CAM heatmap generator for DenseNet-121.

    Produces visual explanations highlighting the regions
    that most influenced the pneumonia prediction.
    """

    def __init__(self, model=None):
        self._model = model
        # TODO: Register hooks on the target layer

    def generate(self, image_bytes: bytes) -> GradCAMResult:
        """
        Generate a Grad-CAM heatmap for the given image.

        Parameters
        ----------
        image_bytes : bytes
            Preprocessed image bytes.

        Returns
        -------
        GradCAMResult
            Contains heatmap, bounding box, and availability flag.
        """
        # TODO: Implement real Grad-CAM
        # Placeholder returns a mock bounding box
        return GradCAMResult(
            heatmap=None,
            bbox=[120, 160, 340, 390],
            available=True,
        )
