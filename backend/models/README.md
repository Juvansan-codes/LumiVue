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
