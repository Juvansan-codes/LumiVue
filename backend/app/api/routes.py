"""
LumiVue — API Routes
=====================
All HTTP endpoints are defined here.
Route handlers delegate to the analysis service — no business logic lives here.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.analysis import (
    AnalysisResponse,
    HealthResponse,
    ImageEvidence,
    ModelInfoResponse,
)
from app.services.analysis_service import run_analysis

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return service health status."""
    return HealthResponse(status="ok")


# ---------------------------------------------------------------------------
# GET /model-info
# ---------------------------------------------------------------------------

@router.get("/model-info", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    """Return information about the loaded models."""
    return ModelInfoResponse()


# ---------------------------------------------------------------------------
# POST /analyze
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_xray(
    image: UploadFile = File(..., description="Chest X-ray image file"),
    patient_context: str = Form(
        default="",
        description="Patient clinical context (symptoms, vitals, history)",
    ),
) -> AnalysisResponse:
    """
    Analyze a chest X-ray image for possible pneumonia.

    Accepts a multipart/form-data request with:
    - **image**: The chest X-ray file (JPEG, PNG, or DICOM)
    - **patient_context**: Optional clinical context string

    Returns an evidence-grounded analysis result.
    """
    image_bytes = await image.read()
    result = await run_analysis(image_bytes, patient_context)
    return result
