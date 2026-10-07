# LumiVue CV Integration Handoff

This document details how the backend API, Evidence Firewall, and Confidence Engine should interact with the Computer Vision (CV) components.

## Vision Service Interface

All computer vision inference (DenseNet pneumonia detection, Grad-CAM generation, and Image Quality assessment) is orchestrated by the `VisionService` singleton located in `backend/app/services/vision_service.py`.

### How to use it:
```python
from app.services.vision_service import analyze_image

# Pass raw uploaded image bytes
result = analyze_image(image_bytes)
```

### Input
* `image_bytes`: Raw file bytes (e.g., from `await file.read()` in a FastAPI `UploadFile`). Note: Currently, the pipeline expects standard image formats (PNG/JPEG) converted from DICOM, or DICOM files if pre-processed before passing to `analyze_image`. The `analyze_image` function uses `cv2.imdecode` directly on the bytes.

### Output
The service returns a `dict` structured similarly to the final API response, minus the MedGemma/Confidence logic:

```json
{
  "prediction": "suspected_pneumonia",
  "model_score": 0.6073,
  "image_evidence": {
    "available": true,
    "bbox": [0, 331, 155, 181],
    "heatmap_available": true,
    "heatmap_base64": "<base64_encoded_png_string>"
  },
  "image_quality": {
    "quality": "good",
    "blur_score": 0.95,
    "brightness_score": 0.88,
    "contrast_score": 0.90
  }
}
```

## Key Engineering Details

1. **Model Loading & Checkpoint**:
   * The DenseNet-121 model is loaded exactly once on startup via the `VisionService` singleton from `models/lumivue_densenet121_rsna.pth`.
   * Inference and Grad-CAM reuse this loaded instance.
2. **GPU Memory & Grad-CAM Cleanup**:
   * Grad-CAM generates computation graphs that could leak VRAM. The `VisionService` safely implements a `try...finally` block that deletes tensors and unregisters PyTorch hooks immediately after heatmap generation.
3. **Threshold Configuration**:
   * The pneumonia classification threshold is configured via `pneumonia_threshold` in `backend/app/core/config.py` (default `0.60`). Do not hardcode this across the API.
4. **Coordinate System & BBox Format**:
   * The bounding box is returned in **original image coordinates** (e.g., scaled back up to 1024x1024), perfectly matching the resolution of the image you upload.
   * Format: `[x, y, width, height]`.
   * **Boundary Clamping**: The coordinates are strictly clamped to the image boundaries. If the box is invalid or if the prediction is `normal`, `"bbox"` will be `null`.
5. **Heatmap Access**:
   * To prevent file I/O latency, the Grad-CAM visualization is overlaid onto the original image, compressed as a PNG, and directly returned as a `utf-8` encoded Base64 string in `image_evidence.heatmap_base64`. 

## Clinical Terminology Constraints

* **Grad-CAM provides:** "Model-highlighted visual evidence" showing regions that mathematically influenced the prediction.
* **Grad-CAM does NOT provide:** Exact clinical pneumonia segmentation or lesion masking. Never present this to the user as an exact medical boundary.

---

## ⚠️ PROPOSED CONTRACT CHANGES

The current shared API schema in `contracts/analysis-response.schema.json` requires two minor updates to match the CV realities:

1. **`image_evidence.bbox`**:
   * Current schema: `[x_min, y_min, x_max, y_max]`
   * Proposed change: Update description to `[x, y, width, height]` to match RSNA and frontend rendering conventions.
2. **`image_quality`**:
   * Current schema: String enum (`"good"`, `"acceptable"`, etc.)
   * Proposed change: Update to an object to support detailed metrics:
     ```json
     {
       "quality": "good",
       "blur_score": 0.95,
       "brightness_score": 0.88,
       "contrast_score": 0.90
     }
     ```
3. **`image_evidence.heatmap_base64`**:
   * Proposed change: Add an optional string property to transport the Base64 representation of the heatmap.

*Attention Backend Teammate: Please update `analysis-response.schema.json` and coordinate with the frontend teammate before finalizing the FastAPI routes.*
