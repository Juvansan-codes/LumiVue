# LumiVue — API Contract

> **This document is the single source of truth for communication between frontend and backend.**
> Changes to this contract must be deliberate, documented, and agreed upon by both teams.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000` |
| Production  | TBD |

---

## Endpoints

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

---

### `GET /model-info`

Returns information about the loaded models.

**Response:**

```json
{
  "project": "LumiVue",
  "classifier": "DenseNet-121",
  "multimodal_model": "MedGemma 1.5 4B",
  "status": "development"
}
```

---

### `POST /analyze`

Analyze a chest X-ray image for possible pneumonia.

**Request Format:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File | ✅ | Chest X-ray image (JPEG, PNG, or DICOM) |
| `patient_context` | string | ❌ | Comma-separated clinical context (symptoms, vitals, history) |

**Example Request:**

```bash
curl -X POST http://localhost:8000/analyze \
  -F "image=@chest_xray.jpg" \
  -F "patient_context=fever, productive cough, SpO2 92%"
```

**Response Format:** `application/json`

```json
{
  "analysis_id": "demo-001",
  "finding": "suspected_pneumonia",
  "model_score": 0.82,
  "confidence": "high",
  "image_quality": "good",
  "image_evidence": {
    "available": true,
    "bbox": [120, 160, 340, 390],
    "heatmap_available": true
  },
  "clinical_evidence": [
    "fever",
    "productive cough",
    "SpO2 92%"
  ],
  "explanation": "Doctor, consider a possible focal lung opacity in the highlighted region."
}
```

---

## Response Field Reference

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `analysis_id` | string | UUID or demo ID | Unique identifier for this analysis |
| `finding` | string | `suspected_pneumonia`, `no_pneumonia_detected`, `inconclusive`, `rejected` | The analysis finding category |
| `model_score` | float | 0.0–1.0 | Raw DenseNet-121 prediction score |
| `confidence` | string | `low`, `moderate`, `high` | Confidence level from the confidence engine |
| `image_quality` | string | `good`, `acceptable`, `poor`, `rejected` | Image quality assessment |
| `image_evidence.available` | boolean | | Whether image evidence exists |
| `image_evidence.bbox` | int[4] \| null | [x_min, y_min, x_max, y_max] | Bounding box of the region of interest |
| `image_evidence.heatmap_available` | boolean | | Whether a Grad-CAM heatmap is available |
| `clinical_evidence` | string[] | | Clinical evidence items supporting the finding |
| `explanation` | string | | Human-readable explanation for the clinician |

---

## Confidence Levels

| Level | Meaning |
|-------|---------|
| **high** | Strong evidence alignment — model score ≥0.75, image + clinical evidence present, models agree |
| **moderate** | Reasonable evidence — model score ≥0.5, partial evidence |
| **low** | Insufficient evidence — low model score, poor image quality, or no supporting evidence |

---

## Evidence Requirements

The **Evidence Firewall** enforces the core principle: **No evidence = No finding**.

| Image Evidence | Clinical Evidence | Decision |
|---------------|-------------------|----------|
| ✅ Available | ✅ Available | **ALLOW** |
| ✅ Available | ❌ None | ALLOW (with warning) |
| ❌ None | ✅ Available | ALLOW (with warning) |
| ❌ None | ❌ None | **REJECT** |

---

## Schema

The canonical JSON Schema is at:

```
contracts/analysis-response.schema.json
```

Frontend TypeScript types are at:

```
frontend/lib/types.ts
```

Backend Pydantic models are at:

```
backend/app/schemas/analysis.py
```

> ⚠️ All three must remain in sync. When updating the contract, update all three locations.
