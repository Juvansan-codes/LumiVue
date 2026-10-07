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
Next.js Frontend (Supabase Auth & Database)
 ↓  HTTP / JSON / multipart
FastAPI Backend
 ↓
Image Preprocessing → DenseNet-121 V2 (RSNA Trained) → Pneumonia Score
                        ↓
                    Grad-CAM → Heatmap / BBox
                        ↓
                    Standalone MedGemma 1.5 4B Server (vLLM) → Multimodal Reasoning
                        ↓
                    Evidence Firewall → Reject unsupported findings
                        ↓
                    Confidence Engine → low / moderate / high
                        ↓
                    API Response → Doctor reviews & saves to Supabase History
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Supabase Auth/DB |
| Backend | Python 3.11, FastAPI, Pydantic, Uvicorn |
| AI Models | DenseNet-121 (PyTorch), MedGemma 1.5 4B (Transformers/vLLM) |
| Vision | OpenCV, Pillow, pydicom, Grad-CAM |
| Utilities | Zod, react-dropzone, scikit-learn, NumPy |

---

## Repository Structure

```
lumivue/
├── frontend/              # Next.js application
│   ├── app/               # Pages, auth routing, and layouts
│   ├── components/        # React components (Evidence Panels, Viewers, etc.)
│   └── lib/               # API client, types, Supabase client, mock data
│
├── backend/               # FastAPI core application
│   ├── app/
│   │   ├── api/           # Route definitions (/analyze, /health)
│   │   ├── models/        # AI model interfaces (DenseNet)
│   │   ├── vision/        # Image processing (DICOM parsing, Grad-CAM)
│   │   ├── evidence/      # Firewall & confidence engines
│   │   └── services/      # MedGemma client & Orchestration
│   ├── medgemma_server/   # Standalone vLLM server for MedGemma 1.5 4B
│   ├── models/            # Model checkpoints (DenseNet-121 V2)
│   └── data/              # Datasets (RSNA)
│
├── supabase/              # Supabase database migrations & RLS policies
├── docs/                  # Documentation
└── README.md
```

---

## Quick Start

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 2. FastAPI Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows
# source .venv/bin/activate         # Linux/macOS
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

### 3. MedGemma Server (Standalone)
To enable full multimodal reasoning with the LLM, you must run the standalone MedGemma server:
```powershell
cd backend/medgemma_server
pip install -r requirements.txt
python app.py
# → http://localhost:8080
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (`backend/.env`)

```env
APP_ENV=development
HOST=0.0.0.0
PORT=8000
MEDGEMMA_MODE=api
MEDGEMMA_SERVER_URL=http://localhost:8080
PNEUMONIA_THRESHOLD=0.50
MODEL_PATH=models/lumivue_densenet121_rsna_v2.pth
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

## Development Roadmap

- [x] Project scaffolding and structure
- [x] API contract definition
- [x] Mock mode for frontend and backend
- [x] Frontend UI implementation (File upload, result dashboards, Supabase Auth/DB)
- [x] DenseNet-121 training on RSNA dataset (Leak-free V2 Split - 0.84 ROC-AUC)
- [x] Grad-CAM visualization
- [x] MedGemma multimodal integration (via standalone vLLM server)
- [x] Evidence Firewall logic
- [x] Confidence Engine tuning
- [x] End-to-end integration
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
