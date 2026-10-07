# LumiVue — Architecture

## System Overview

LumiVue is an AI-powered second-opinion assistant for chest X-ray pneumonia detection. It combines a DenseNet-121 classifier with MedGemma multimodal reasoning, filtered through an evidence firewall and confidence engine.

**Core Principle:** No evidence = No finding

---

## Data Flow

```
Doctor
 ↓
Next.js Frontend (React 19)
 ↓  HTTP / JSON / multipart
FastAPI Backend (Python 3.11)
 ↓
Image Preprocessing (OpenCV / Pillow / pydicom)
 ↓
┌─────────────────────────────────────────┐
│           Parallel Processing            │
├─────────────┬─────────────┬─────────────┤
│ Image       │ DenseNet-121│ Grad-CAM    │
│ Quality     │ Classifier  │ Heatmap     │
│ Assessment  │ (PyTorch)   │ Generator   │
└──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │
       ▼             ▼             ▼
┌─────────────────────────────────────────┐
│     MedGemma 1.5 4B Server (vLLM)       │
│     (Image + Clinical Context)          │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Evidence Firewall               │
│  No image + no clinical = REJECT        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Confidence Engine               │
│  Combines: score, quality, clinical,    │
│  model agreement → low/moderate/high    │
└────────────────┬────────────────────────┘
                 ↓
           API Response
                 ↓
           Frontend (Saves to Supabase)
                 ↓
           Doctor reviews
```

---

## Component Responsibilities

### Frontend (Next.js)

| Component | Purpose |
|-----------|---------|
| `ImageUploader` | Drag-and-drop chest X-ray upload |
| `PatientContextForm` | Clinical context input (symptoms, vitals) |
| `XrayViewer` | Image display with bounding box / heatmap overlays |
| `AnalysisResult` | Composite result view |
| `EvidencePanel` | Clinical and image evidence display |
| `ConfidenceBadge` | Color-coded confidence indicator |
| `ImageQualityBadge` | Image quality indicator |
| `AnalyzeButton` | Triggers the analysis workflow |

### Backend (FastAPI)

| Module | Purpose |
|--------|---------|
| `app/api/routes.py` | HTTP endpoint definitions |
| `app/services/analysis_service.py` | Pipeline orchestrator |
| `app/models/pneumonia.py` | DenseNet-121 interface |
| `app/models/medgemma.py` | MedGemma service interface |
| `app/vision/preprocess.py` | Image loading and normalization |
| `app/vision/gradcam.py` | Grad-CAM heatmap generation |
| `app/vision/image_quality.py` | Image quality assessment |
| `app/evidence/firewall.py` | Evidence validation gate |
| `app/evidence/confidence.py` | Multi-signal confidence scoring |
| `app/core/config.py` | Environment configuration |

---

## Communication

```
FRONTEND  ←──── HTTP/JSON ────→  BACKEND
              (API Contract)
```

- Frontend and backend are **completely independent** applications.
- They communicate **only** via the API contract defined in `contracts/analysis-response.schema.json`.
- Frontend **never** imports backend code, and vice versa.

---

## Mock-First Development

Both frontend and backend support mock mode for development without real AI models:

| Component | Mock Variable | Value |
|-----------|--------------|-------|
| Frontend | `NEXT_PUBLIC_USE_MOCK` | `true` |
| Backend | `MEDGEMMA_MODE` | `mock` |

This allows all four developers to work simultaneously without requiring GPU, datasets, or API keys.
