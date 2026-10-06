# LumiVue — Development Guide

## Prerequisites

- **Node.js** ≥ 18.x (for frontend)
- **Python** ≥ 3.11 (for backend)
- **Git**

---

## Local Development Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

### Backend

```powershell
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Linux/macOS)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open: http://localhost:8000
Swagger: http://localhost:8000/docs

---

## Environment Variables

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
```

Set `NEXT_PUBLIC_USE_MOCK=true` to work without the backend.

### Backend

Copy `backend/.env.example` to `backend/.env`:

```env
APP_ENV=development
HOST=0.0.0.0
PORT=8000
MEDGEMMA_MODE=mock
MEDGEMMA_API_URL=
MEDGEMMA_API_KEY=
MODEL_PATH=models/lumivue_densenet121_rsna.pth
```

Set `MEDGEMMA_MODE=mock` to work without real AI models.

---

## Mock-First Development

**Both frontend and backend work in mock mode by default.**

| Scenario | Frontend | Backend |
|----------|----------|---------|
| Full mock (no backend needed) | `NEXT_PUBLIC_USE_MOCK=true` | N/A |
| Frontend → mock backend | `NEXT_PUBLIC_USE_MOCK=false` | `MEDGEMMA_MODE=mock` |
| Full real pipeline | `NEXT_PUBLIC_USE_MOCK=false` | `MEDGEMMA_MODE=api` or `local` |

---

## Testing API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Model info
curl http://localhost:8000/model-info

# Analyze (with a test image)
curl -X POST http://localhost:8000/analyze \
  -F "image=@test_xray.jpg" \
  -F "patient_context=fever, cough"
```

---

## Security Rules

- ❌ Never commit `.env` files
- ❌ Never commit API keys or secrets
- ❌ Never commit real patient data
- ❌ Never use real patient images
- ✅ Use only public/demo medical images for testing
- ✅ All output requires clinician review

---

## Git Branch Conventions

```
main                          # Production-ready
develop                       # Integration branch

frontend/upload-ui            # Frontend feature branches
frontend/results-ui
frontend/xray-viewer

backend/densenet              # Backend feature branches
backend/gradcam
backend/medgemma
backend/evidence-firewall
```
