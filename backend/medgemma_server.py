"""
LumiVue — MedGemma Local Server
=================================
Standalone FastAPI service that loads google/medgemma-1.5-4b-it from the
local Hugging Face cache and exposes two endpoints:

    GET  /health   — liveness probe
    POST /analyze  — multipart: image file + patient_context + model_score

Run with:
    python medgemma_server.py

Or explicitly:
    uvicorn medgemma_server:app --host 0.0.0.0 --port 8001

The main LumiVue backend connects to this service when
MEDGEMMA_MODE=remote and MEDGEMMA_BASE_URL=http://127.0.0.1:8001
"""

from __future__ import annotations

import io
import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import Any

# Tell HuggingFace libraries to use local cache only — skips all SSL/network
# checks and retries that slow down startup when Hub is unreachable.
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_DATASETS_OFFLINE", "1")

import torch
import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("medgemma_server")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL_ID = "google/medgemma-1.5-4b-it"
HOST = os.getenv("MEDGEMMA_HOST", "0.0.0.0")
PORT = int(os.getenv("MEDGEMMA_PORT", "8001"))

# Use GPU if available, otherwise CPU (slower but works)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
TORCH_DTYPE = torch.bfloat16 if DEVICE == "cuda" else torch.float32

logger.info("Device: %s | dtype: %s", DEVICE, TORCH_DTYPE)

# ---------------------------------------------------------------------------
# Global model state
# ---------------------------------------------------------------------------

_processor: AutoProcessor | None = None
_model: AutoModelForImageTextToText | None = None


def load_model() -> None:
    """Load MedGemma processor and model from local Hugging Face cache."""
    global _processor, _model

    logger.info("Loading MedGemma processor from cache: %s", MODEL_ID)
    _processor = AutoProcessor.from_pretrained(MODEL_ID)

    logger.info("Loading MedGemma model from cache: %s", MODEL_ID)
    _model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        torch_dtype=TORCH_DTYPE,
        device_map="auto" if DEVICE == "cuda" else None,
    )

    if DEVICE == "cpu":
        _model = _model.to(DEVICE)

    _model.eval()
    logger.info("MedGemma model ready on %s", DEVICE)


# ---------------------------------------------------------------------------
# Lifespan — load model once on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield
    logger.info("MedGemma server shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LumiVue MedGemma Server",
    description="Local MedGemma 1.5 4B inference service for chest X-ray analysis.",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

ANALYSIS_PROMPT_TEMPLATE = """You are a radiology AI assistant. Analyze this chest X-ray for pneumonia.

Clinical context: {patient_context}
DenseNet pneumonia probability: {model_score:.2f}

YOU MUST RESPOND WITH ONLY A JSON OBJECT. NO OTHER TEXT BEFORE OR AFTER.
Start your response with {{ and end with }}.

Required format:
{{
  "explanation": "2-3 sentence clinical summary for the attending physician",
  "findings": [
    {{
      "name": "finding name",
      "image_support": true,
      "clinical_support": false,
      "clinical_evidence": ["evidence item"]
    }}
  ]
}}\
"""


def build_prompt(patient_context: str, model_score: float) -> str:
    ctx = patient_context.strip() if patient_context else "No clinical context provided."
    return ANALYSIS_PROMPT_TEMPLATE.format(
        patient_context=ctx,
        model_score=model_score,
    )


# ---------------------------------------------------------------------------
# Inference helper
# ---------------------------------------------------------------------------

def run_inference(image: Image.Image, patient_context: str, model_score: float) -> dict[str, Any]:
    """
    Run MedGemma inference and return a parsed dict with 'explanation' and 'findings'.
    Falls back to a structured error response if parsing fails.
    """
    assert _processor is not None and _model is not None, "Model not loaded"

    prompt_text = build_prompt(patient_context, model_score)

    # Build the messages list in the chat template format MedGemma expects
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": prompt_text},
            ],
        }
    ]

    # Apply chat template to get the full formatted prompt
    text = _processor.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    # Process inputs — image + text together
    inputs = _processor(
        text=text,
        images=image,
        return_tensors="pt",
    ).to(DEVICE)

    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=False,          # greedy for determinism
            temperature=1.0,
            pad_token_id=_processor.tokenizer.eos_token_id,
        )

    # Decode only the newly generated tokens (skip the prompt)
    input_len = inputs["input_ids"].shape[1]
    generated = output_ids[0][input_len:]
    raw_text = _processor.decode(generated, skip_special_tokens=True).strip()

    logger.debug("MedGemma raw output: %s", raw_text[:500])

    # Parse JSON from the response
    return _parse_output(raw_text, model_score)


def _parse_output(raw_text: str, model_score: float) -> dict[str, Any]:
    """Extract JSON from model output, with a smart fallback for free-text."""
    text = raw_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()

    # Try direct JSON parse
    try:
        data = json.loads(text)
        if "explanation" in data and "findings" in data:
            return data
    except json.JSONDecodeError:
        pass

    # Try to extract just the JSON object portion
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            data = json.loads(text[start:end])
            if "explanation" in data and "findings" in data:
                return data
        except json.JSONDecodeError:
            pass

    logger.warning("MedGemma returned free-text instead of JSON — wrapping as explanation. Raw: %s", raw_text[:300])

    # Smart fallback: use the free-text as the explanation directly.
    # This preserves the clinical value even when JSON formatting fails.
    explanation = raw_text.strip()

    # Try to clean up common prefixes MedGemma adds
    for prefix in ("EXPLANATION:", "FINDINGS:", "SUMMARY:", "ANALYSIS:"):
        if explanation.upper().startswith(prefix):
            explanation = explanation[len(prefix):].strip()

    return {
        "explanation": explanation if explanation else (
            f"Image analysis complete. DenseNet pneumonia probability: {model_score:.2f}. "
            "Please correlate with clinical findings."
        ),
        "findings": [],
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> JSONResponse:
    """Liveness probe — also reports whether model is loaded."""
    ready = _model is not None and _processor is not None
    return JSONResponse({
        "status": "ok" if ready else "loading",
        "model": MODEL_ID,
        "device": DEVICE,
        "ready": ready,
    })


@app.post("/analyze")
async def analyze(
    image: UploadFile = File(..., description="Chest X-ray image (PNG/JPEG)"),
    patient_context: str = Form(default="", description="Clinical context string"),
    model_score: str = Form(default="0.0", description="DenseNet probability score"),
) -> JSONResponse:
    """
    Analyze a chest X-ray image with MedGemma.

    Accepts multipart/form-data:
    - image: image file bytes
    - patient_context: clinical context string
    - model_score: DenseNet float score (as string)

    Returns JSON with 'explanation' and 'findings'.
    """
    if _model is None or _processor is None:
        raise HTTPException(status_code=503, detail="Model is still loading, please retry.")

    # Parse model_score safely
    try:
        score = float(model_score)
    except (ValueError, TypeError):
        score = 0.0

    # Read and decode the image
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    # Run inference
    try:
        result = run_inference(pil_image, patient_context, score)
    except Exception as exc:
        logger.exception("MedGemma inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}") from exc

    return JSONResponse(result)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logger.info("Starting MedGemma server on %s:%d", HOST, PORT)
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level="info",
    )
