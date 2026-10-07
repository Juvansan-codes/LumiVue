"""
MedGemma Server — FastAPI Application
========================================
A dedicated local HTTP service that:
  - Loads MedGemma 1.5 4B once at startup (GPU when available)
  - Exposes GET /health and POST /analyze
  - Is called by the main LumiVue backend over the local network
  - Does NOT serve the browser directly

Start with:
    uvicorn medgemma_server.app:app --host 0.0.0.0 --port 8001
"""

from __future__ import annotations

import io
import json
import logging
import sys
from contextlib import asynccontextmanager
from typing import Annotated, Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image

from medgemma_server.model import MODEL_DISPLAY_NAME, medgemma
from medgemma_server.prompt import build_prompt, parse_response
from medgemma_server.schemas import AnalyzeResponse, Finding, HealthResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("medgemma_server.app")


# ---------------------------------------------------------------------------
# Lifespan: load model ONCE at startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load MedGemma during startup; nothing to clean up on shutdown."""
    logger.info("=== MedGemma Server starting — loading model ===")
    try:
        medgemma.load()
        logger.info("=== MedGemma ready on %s ===", medgemma.device_label.upper())
    except Exception as exc:
        # Server will still start; /health will return error status
        logger.error("=== MedGemma failed to load: %s ===", exc)
    yield
    logger.info("=== MedGemma Server shutting down ===")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="MedGemma Local Service",
    description=(
        "Local HTTP API wrapping MedGemma 1.5 4B for chest X-ray "
        "multimodal clinical reasoning. Called by the LumiVue backend — "
        "not exposed to the browser directly."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    Return service health.

    Returns status='ok' ONLY when MedGemma is fully loaded and ready.
    Returns status='error' if model initialisation failed.
    """
    if medgemma.loaded:
        return HealthResponse(
            status="ok",
            model=MODEL_DISPLAY_NAME,
            device=medgemma.device_label,
            device_name=medgemma.device_name,
            vram_gb=round(medgemma.vram_gb, 1),
        )

    error_msg = medgemma.load_error or "Model not loaded"
    return HealthResponse(
        status="error",
        model=MODEL_DISPLAY_NAME,
        device="unknown",
        error=error_msg,
    )


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    image: Annotated[UploadFile, File(description="Chest X-ray image (JPEG or PNG)")],
    patient_context: Annotated[
        str,
        Form(
            description=(
                "Patient clinical context as a JSON string "
                '(e.g. {"age":57,"sex":"male","symptoms":["fever"]})'
                " or a plain text description. Optional."
            )
        ),
    ] = "",
    model_score: Annotated[
        float,
        Form(description="DenseNet pneumonia probability score (0.0–1.0)"),
    ] = 0.0,
) -> AnalyzeResponse:
    """
    Perform multimodal chest X-ray analysis with MedGemma.

    Accepts multipart/form-data with:
    - **image** : JPEG or PNG chest X-ray
    - **patient_context** : JSON or plain-text clinical context (optional)
    - **model_score** : DenseNet output score (optional, 0.0–1.0)

    Returns structured JSON findings and a clinician-facing explanation.
    """
    # ---- Guard: model must be loaded ----
    if not medgemma.loaded:
        raise HTTPException(
            status_code=503,
            detail=(
                "MedGemma model is not available. "
                f"Error: {medgemma.load_error or 'not loaded'}"
            ),
        )

    # ---- Validate and decode image ----
    if not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty")

    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Could not decode image: {exc}"
        ) from exc

    # ---- Parse patient context ----
    parsed_context: dict | str = patient_context.strip()
    if parsed_context:
        try:
            parsed_context = json.loads(patient_context)
        except (json.JSONDecodeError, ValueError):
            # Not JSON — treat as plain text, that is fine
            parsed_context = patient_context.strip()

    # ---- Clamp model_score ----
    model_score = max(0.0, min(1.0, model_score))

    # ---- Build prompt and run inference ----
    prompt = build_prompt(patient_context=parsed_context, model_score=model_score)

    logger.info(
        "Running MedGemma inference (model_score=%.3f, context_type=%s)",
        model_score,
        "dict" if isinstance(parsed_context, dict) else "text",
    )

    try:
        raw_output = medgemma.generate(image=pil_image, prompt=prompt)
    except RuntimeError as exc:
        logger.error("MedGemma inference error: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during MedGemma inference")
        raise HTTPException(
            status_code=500, detail=f"Inference failed: {exc}"
        ) from exc

    # ---- Parse structured JSON from raw output ----
    structured = parse_response(raw_output)

    findings = [Finding(**f) for f in structured.get("findings", [])]
    explanation = structured.get("explanation", "")

    logger.info(
        "MedGemma returned %d finding(s)", len(findings)
    )

    return AnalyzeResponse(findings=findings, explanation=explanation)


# ---------------------------------------------------------------------------
# Entrypoint for direct execution:  python -m medgemma_server.app
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        "medgemma_server.app:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info",
    )
