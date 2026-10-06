# LumiVue — Team Workflow

## Team Roles

### Frontend Team

| Member | Responsibilities |
|--------|-----------------|
| **Member 1** | UI, Layout, Upload experience, X-ray viewer |
| **Member 2** | Result screen, Evidence panel, Confidence visualization, API integration, Mock mode |

### Backend Team

| Member | Responsibilities |
|--------|-----------------|
| **Member 3** | DenseNet-121, Dataset, Image preprocessing, Grad-CAM |
| **Member 4** | FastAPI routes, MedGemma, Evidence Firewall, Confidence engine |

---

## File Ownership

### Frontend Members — Primary Files

| Member 1 | Member 2 |
|----------|----------|
| `frontend/components/ImageUploader.tsx` | `frontend/components/AnalysisResult.tsx` |
| `frontend/components/PatientContextForm.tsx` | `frontend/components/EvidencePanel.tsx` |
| `frontend/components/XrayViewer.tsx` | `frontend/components/ConfidenceBadge.tsx` |
| `frontend/app/layout.tsx` | `frontend/components/ImageQualityBadge.tsx` |
| `frontend/app/page.tsx` | `frontend/components/AnalyzeButton.tsx` |
| `frontend/app/globals.css` | `frontend/lib/api.ts` |
| | `frontend/lib/mock-data.ts` |

### Backend Members — Primary Files

| Member 3 | Member 4 |
|----------|----------|
| `backend/app/models/pneumonia.py` | `backend/app/api/routes.py` |
| `backend/app/vision/preprocess.py` | `backend/app/models/medgemma.py` |
| `backend/app/vision/gradcam.py` | `backend/app/evidence/firewall.py` |
| `backend/app/vision/image_quality.py` | `backend/app/evidence/confidence.py` |
| | `backend/app/services/analysis_service.py` |
| | `backend/app/core/config.py` |

### Shared Files (Coordinate Changes)

| File | Description |
|------|-------------|
| `contracts/analysis-response.schema.json` | API contract — coordinate all changes |
| `frontend/lib/types.ts` | Must match contract |
| `backend/app/schemas/analysis.py` | Must match contract |
| `docs/API_CONTRACT.md` | Document all contract changes |

---

## Branch Naming

```
main                        # Stable, production-ready
develop                     # Integration branch

frontend/<feature>          # Frontend feature branches
backend/<feature>           # Backend feature branches
docs/<topic>                # Documentation changes
```

### Examples

```
frontend/upload-ui          # Member 1
frontend/results-ui         # Member 2

backend/densenet            # Member 3
backend/gradcam             # Member 3
backend/medgemma            # Member 4
backend/evidence-firewall   # Member 4
```

---

## Rules

1. **Frontend devs do NOT modify `backend/` files** (and vice versa).
2. **Contract changes require team agreement** — update all three sync points.
3. **Never commit secrets** (`.env`, API keys, credentials).
4. **Never commit patient data** — use only public/demo images.
5. **Use mock mode** during development — do not require real models.
6. **Pull from `develop` before starting new work** to avoid conflicts.

---

## Workflow

1. Pull latest `develop`
2. Create a feature branch (`frontend/my-feature` or `backend/my-feature`)
3. Develop and test locally
4. Push branch and create a Pull Request to `develop`
5. Get at least one team review
6. Merge to `develop`
7. Periodically merge `develop` → `main` when stable
