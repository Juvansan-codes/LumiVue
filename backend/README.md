# LumiVue Backend

FastAPI backend for LumiVue — Evidence-Grounded Multimodal Pneumonia Intelligence.

## Quick Start

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Path         | Description                    |
|--------|--------------|--------------------------------|
| GET    | `/health`    | Health check                   |
| GET    | `/model-info`| Model information              |
| POST   | `/analyze`   | Analyze a chest X-ray          |
| GET    | `/docs`      | Swagger UI (auto-generated)    |

## Environment Variables

Copy `.env.example` to `.env` and configure as needed.

## Project Structure

```
app/
├── main.py              # FastAPI application entry point
├── api/routes.py        # API route definitions
├── schemas/analysis.py  # Pydantic request/response models
├── models/              # AI model interfaces (DenseNet, MedGemma)
├── vision/              # Image preprocessing, Grad-CAM, quality checks
├── evidence/            # Evidence firewall, confidence engine
├── services/            # Analysis orchestration service
└── core/config.py       # Application configuration
```

## Grad-CAM Localization

LumiVue uses Grad-CAM to highlight areas of the chest X-ray that influenced the DenseNet-121 prediction.

**Important Clinical Disclaimer:**
* **Grad-CAM provides:** Model-highlighted visual evidence showing image regions that influenced the prediction.
* **Grad-CAM does NOT provide:** Exact pneumonia segmentation or clinically validated lesion localization.

**Implementation Details:**
* **Bounding Box Format**: `[x, y, width, height]` (Matches RSNA convention).
* **Coordinate System**: The model computes Grad-CAM at 224×224 resolution. The returned bounding box coordinates are converted back and scaled to perfectly match the original uploaded DICOM image resolution, clipped to image boundaries.
* **Configuration**: The Grad-CAM heatmap extraction is threshold-based (default `0.5`). This is an engineering parameter to extract the strongest connected component and is not clinically derived.
* **Negative Predictions**: If the model predicts `normal` (or score is below the confidence threshold), Grad-CAM is still computed (indicated by `"heatmap_available": true`), but the bounding box is omitted (`"bbox": null`) to prevent fabricating suspicious regions for negative patients.
