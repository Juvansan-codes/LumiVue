# LumiVue — Trained Models Directory

This directory stores trained model checkpoints.

## Expected Files

| File | Description |
|------|-------------|
| `lumivue_densenet121_rsna.pth` | DenseNet-121 trained on RSNA Pneumonia Detection Challenge |

## Important Notes

- Model checkpoint files (`.pth`, `.pt`, `.ckpt`) are **NOT tracked by Git**.
- Do NOT commit model files to the repository.
- Trained models should be shared via cloud storage or model registry.
- The `MODEL_PATH` environment variable in `.env` should point to the checkpoint location.

## Training

Model training instructions will be added in a future development phase.
The training pipeline will be implemented by Backend Member 3.

---

## 🚨 CRITICAL WARNING: INVALID MODEL
The prototype model currently saved as `lumivue_densenet121_rsna.pth` (Phase 3B) **IS INVALID** and MUST NOT be used for final clinical evaluations. 
* **Reason**: A severe patient-level train/validation leakage bug was discovered in Phase 6. All 500 validation patients were present in the training set during its generation.
* **Action Required**: The model MUST be retrained from scratch using the new reproducible splits generated in Phase 6A (`backend/training/runs/final_split/`).
