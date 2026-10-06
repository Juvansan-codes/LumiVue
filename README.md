# LumiVue

**Evidence-Grounded Multimodal Pneumonia Intelligence**

> AI-powered second-opinion assistant for chest X-ray pneumonia detection.
> Decision-support prototype — not a medical device.

---

## Problem Statement

**HNX26PSI05 — Multimodal Medical Image Intelligence**

Doctors need reliable, evidence-grounded decision support when interpreting chest X-rays for pneumonia. LumiVue analyzes chest X-rays, detects possible pneumonia, highlights supporting image regions, combines imaging with patient clinical context, and explains findings using evidence — rejecting unsupported conclusions.

**Core Principle: No evidence = No finding**

---

## Architecture

```
Doctor
 ↓
Next.js Frontend
 ↓  HTTP / JSON / multipart
FastAPI Backend
 ↓
Image Preprocessing → DenseNet-121 → Pneumonia Score
                        ↓
                    Grad-CAM → Heatmap / BBox
                        ↓
                    MedGemma 1.5 4B → Multimodal Reasoning
                        ↓
                    Evidence Firewall → Reject unsupported findings
                        ↓
                    Confidence Engine → low / moderate / high
                        ↓
                    API Response → Doctor reviews
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide React |
| Backend | Python 3.11, FastAPI, Pydantic, Uvicorn |
| AI Models | DenseNet-121 (PyTorch), MedGemma 1.5 4B (Transformers) |
| Vision | OpenCV, Pillow, pydicom, Grad-CAM |
| Utilities | Zod, react-dropzone, scikit-learn, NumPy |

---

## Repository Structure

```
lumivue/
├── frontend/              # Next.js application
│   ├── app/               # Pages and layouts
│   ├── components/        # React components
│   ├── lib/               # API client, types, mock data
│   └── hooks/             # Custom React hooks
│
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── api/           # Route definitions
│   │   ├── schemas/       # Pydantic models
│   │   ├── models/        # AI model interfaces
│   │   ├── vision/        # Image processing
│   │   ├── evidence/      # Firewall & confidence
│   │   ├── services/      # Orchestration
│   │   └── core/          # Configuration
│   ├── models/            # Model checkpoints (git-ignored)
│   ├── data/              # Datasets (git-ignored)
│   └── tests/             # Backend tests
│
├── contracts/             # Shared API contract (JSON Schema)
├── docs/                  # Documentation
├── scripts/               # Utility scripts
├── .gitignore
├── .env.example
└── README.md
```

---

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate          # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger)
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
```

### Backend (`backend/.env`)

```env
APP_ENV=development
HOST=0.0.0.0
PORT=8000
MEDGEMMA_MODE=mock
MODEL_PATH=models/lumivue_densenet121_rsna.pth
```

---

## API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/model-info` | Model information |
| POST | `/analyze` | Analyze chest X-ray |

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for full details.

---

## Team Workflow

| Member | Role | Primary Directory |
|--------|------|-------------------|
| 1 | UI, Upload, X-ray Viewer | `frontend/` |
| 2 | Results, Evidence, API Integration | `frontend/` |
| 3 | DenseNet, Dataset, Preprocessing, Grad-CAM | `backend/` |
| 4 | FastAPI, MedGemma, Evidence Firewall, Confidence | `backend/` |

See [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) for branching and file ownership.

---

## Development Roadmap

- [x] Project scaffolding and structure
- [x] API contract definition
- [x] Mock mode for frontend and backend
- [ ] Frontend UI implementation
- [ ] DenseNet-121 training on RSNA dataset
- [ ] Grad-CAM visualization
- [ ] MedGemma multimodal integration
- [ ] Evidence Firewall logic
- [ ] Confidence Engine tuning
- [ ] End-to-end integration
- [ ] Demo preparation

---

## Medical Safety Disclaimer

> ⚠️ **Important**
>
> LumiVue is a **decision-support prototype** built for a hackathon.
>
> - It is **NOT** a certified medical device.
> - It is **NOT** intended for clinical diagnosis.
> - All output **requires clinician review**.
> - Never use real patient data during development.
> - Only use public/demo medical images for testing.
> - Never commit API keys or patient data to the repository.
>
> This system assists doctors — it does not replace clinical judgment.
