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
