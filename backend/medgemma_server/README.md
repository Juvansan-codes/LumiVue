# MedGemma Local Service — Phase 6B

A dedicated FastAPI service that runs **MedGemma 1.5 4B** locally on the
MedGemma laptop and exposes it over the team LAN so the main LumiVue backend
can call it.

---

## Architecture

```
Browser
  ↓
Main LumiVue FastAPI  (port 8000, teammate's laptop)
  ↓  HTTP POST /analyze
MedGemma Service       (port 8001, this laptop)
  ↓
MedGemma 1.5 4B GPU
  ↓
JSON response
  ↑
Main LumiVue FastAPI
  ↑
Browser
```

The browser **never** calls this service directly.

---

## Files

| File | Purpose |
|------|---------|
| `app.py` | FastAPI application — `GET /health`, `POST /analyze` |
| `model.py` | Loads MedGemma once at startup, keeps it in GPU memory |
| `prompt.py` | Builds the clinical prompt; parses MedGemma's JSON output |
| `schemas.py` | Pydantic request / response models |
| `open_firewall.ps1` | One-time Windows Firewall rule (run as Administrator) |

---

## First-time setup (MedGemma laptop)

### 1 — Install dependencies

```powershell
cd d:\CFile\Lumivue\backend
pip install -r requirements.txt
```

### 2 — Open the firewall (once, as Administrator)

```powershell
.\medgemma_server\open_firewall.ps1
```

### 3 — Find your LAN IP

```powershell
ipconfig
```

Look for the active adapter's **IPv4 Address**, e.g. `192.168.1.25`.

### 4 — Start the server

```powershell
cd d:\CFile\Lumivue\backend
uvicorn medgemma_server.app:app --host 0.0.0.0 --port 8001
```

---

## Verify locally (MedGemma laptop)

```powershell
# Health check
Invoke-WebRequest -Uri http://127.0.0.1:8001/health | Select-Object -ExpandProperty Content

# Expected:
# {"status":"ok","model":"medgemma-1.5-4b","device":"cuda",...}
```

---

## Verify from the main backend laptop

Replace `192.168.1.25` with the actual MedGemma laptop IP.

```powershell
Invoke-WebRequest -Uri http://192.168.1.25:8001/health | Select-Object -ExpandProperty Content
```

If this fails, check:
1. Is the MedGemma server running?
2. Did you run `open_firewall.ps1`?
3. Are both laptops on the same network?

---

## Configure the main backend

In `backend/.env` on the **main backend laptop**:

```env
MEDGEMMA_MODE=remote
MEDGEMMA_BASE_URL=http://192.168.1.25:8001
MEDGEMMA_TIMEOUT=120
```

Do **not** commit the real IP — keep it only in your local `.env`.

---

## POST /analyze — quick test

```powershell
# From the main backend laptop (replace IP and image path)
$form = @{
    image         = Get-Item "path\to\xray.png"
    patient_context = '{"age":57,"sex":"male","symptoms":["fever","cough"],"spo2":92}'
    model_score   = "0.78"
}
Invoke-RestMethod -Uri "http://192.168.1.25:8001/analyze" -Method Post -Form $form
```

Expected response shape:
```json
{
  "findings": [
    {
      "name": "possible pneumonia",
      "description": "Possible focal pulmonary opacity in the right lower lobe.",
      "image_support": true,
      "clinical_support": true,
      "clinical_evidence": ["fever", "cough", "SpO2 92%"]
    }
  ],
  "explanation": "Doctor, consider possible pneumonia..."
}
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Connection refused` on port 8001 | Server not running | Start `uvicorn …` |
| `Connection refused` from other laptop | Firewall blocking | Run `open_firewall.ps1` |
| `/health` returns `status: error` | Model failed to load | Check VRAM, CUDA driver |
| Slow response (>60 s) | CPU fallback | Check CUDA is available |
| `MEDGEMMA_BASE_URL is not configured` | Missing `.env` setting | Add `MEDGEMMA_BASE_URL=http://<IP>:8001` |
