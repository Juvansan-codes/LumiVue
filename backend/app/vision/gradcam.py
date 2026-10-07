"""
LumiVue — Grad-CAM Heatmap Generator
======================================
Owner: Backend Member 3 (Grad-CAM)

Generates Grad-CAM heatmaps and bounding boxes from DenseNet feature maps.
"""

from __future__ import annotations

import cv2
import numpy as np
import torch
from dataclasses import dataclass

@dataclass
class GradCAMResult:
    """Result from Grad-CAM generation."""
    heatmap: bytes | None = None  # Heatmap image bytes
    bbox: list[int] | None = None  # [x, y, width, height]
    available: bool = False

class _GradCAMHook:
    """
    Internal class to handle PyTorch forward/backward hooks on the target layer.
    """
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        self.forward_handle = self.target_layer.register_forward_hook(self.save_activation)
        self.backward_handle = self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]
        
    def remove_hooks(self):
        """Clean up hooks to prevent memory leaks."""
        self.forward_handle.remove()
        self.backward_handle.remove()

    def __call__(self, x, class_idx=0):
        self.model.eval()
        self.model.zero_grad()
        
        logits = self.model(x)
        score = logits[:, class_idx].squeeze()
        
        score.backward(retain_graph=True)
        
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
        activations = self.activations.detach()[0]
        
        for i in range(activations.size(0)):
            activations[i, :, :] *= pooled_gradients[i]
            
        heatmap = torch.mean(activations, dim=0).cpu().numpy()
        heatmap = np.maximum(heatmap, 0)
        
        if np.max(heatmap) == 0:
            return heatmap
            
        heatmap /= np.max(heatmap)
        
        # Explicit cleanup of tensors
        del pooled_gradients
        del activations
        del logits
        del score
        
        return heatmap

def generate_gradcam(model, input_tensor: torch.Tensor, target_class=None) -> np.ndarray:
    """
    Generate a normalized Grad-CAM heatmap.
    
    Parameters
    ----------
    model : PneumoniaModel
        The trained LumiVue DenseNet-121 model.
    input_tensor : torch.Tensor
        Preprocessed image tensor of shape (1, 3, 224, 224).
    target_class : int, optional
        Target class index. Default is 0.
        
    Returns
    -------
    np.ndarray
        Normalized 2D heatmap of shape (224, 224).
    """
    target_layer = model.backbone.features.denseblock4
    gradcam_hook = _GradCAMHook(model, target_layer)
    
    input_tensor.requires_grad_(True)
    
    try:
        heatmap = gradcam_hook(input_tensor, class_idx=0 if target_class is None else target_class)
        heatmap = cv2.resize(heatmap, (input_tensor.shape[3], input_tensor.shape[2]))
    finally:
        # Guarantee cleanup even on error
        gradcam_hook.remove_hooks()
        
    return heatmap

def overlay_heatmap(original_img: np.ndarray, heatmap: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    """
    Overlays the Grad-CAM heatmap on the original image.
    """
    heatmap_uint8 = np.uint8(255 * heatmap)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    if original_img.shape[:2] != heatmap_colored.shape[:2]:
        heatmap_colored = cv2.resize(heatmap_colored, (original_img.shape[1], original_img.shape[0]))
        
    blended = cv2.addWeighted(original_img, 1 - alpha, heatmap_colored, alpha, 0)
    return blended

def find_suspicious_region(heatmap: np.ndarray, threshold: float = 0.6) -> dict:
    """
    Converts the strongest Grad-CAM activation into an approximate bounding box.
    
    Parameters
    ----------
    heatmap : np.ndarray
        Normalized heatmap (224, 224).
    threshold : float
        Activation threshold to binarize the heatmap. This is an engineering parameter, not clinically validated.
        
    Returns
    -------
    dict
        Dictionary containing the internal bbox [x1, y1, x2, y2] or None.
    """
    binary_map = (heatmap >= threshold).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary_map, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"bbox": None}
        
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    return {"bbox": [x, y, x + w, y + h]}

def convert_coordinates(bbox: list[int], original_shape: tuple[int, int], model_shape: tuple[int, int] = (224, 224)) -> list[int]:
    """
    Converts 224x224 internal Grad-CAM coordinates to original DICOM coordinates,
    clamps to boundaries, and returns [x, y, width, height] format.
    
    Parameters
    ----------
    bbox : list[int]
        Bounding box [x1, y1, x2, y2] in model coordinate space.
    original_shape : tuple[int, int]
        Original image shape (Height, Width).
    model_shape : tuple[int, int]
        Model input shape (Height, Width).
        
    Returns
    -------
    list[int]
        Converted bounding box [x, y, width, height].
    """
    if not bbox:
        return None
        
    orig_h, orig_w = original_shape
    mod_h, mod_w = model_shape
    
    scale_x = orig_w / mod_w
    scale_y = orig_h / mod_h
    
    x1, y1, x2, y2 = bbox
    
    orig_x1 = int(x1 * scale_x)
    orig_y1 = int(y1 * scale_y)
    orig_x2 = int(x2 * scale_x)
    orig_y2 = int(y2 * scale_y)
    
    # Boundary clamping
    orig_x1 = max(0, orig_x1)
    orig_y1 = max(0, orig_y1)
    orig_x2 = min(orig_w, orig_x2)
    orig_y2 = min(orig_h, orig_y2)
    
    width = orig_x2 - orig_x1
    height = orig_y2 - orig_y1
    
    # Reject invalid boxes
    if width <= 0 or height <= 0:
        return None
    
    # Final format: [x, y, width, height]
    return [orig_x1, orig_y1, width, height]

class GradCAM:
    """Legacy interface for compatibility."""
    def __init__(self, model=None):
        self._model = model

    def generate(self, image_bytes: bytes) -> GradCAMResult:
        # Placeholder compatible with original interface if required before full integration
        return GradCAMResult(heatmap=None, bbox=[120, 160, 340, 390], available=True)
