"""
LumiVue — Pydantic Schemas for Analysis
=========================================
These schemas define the API request and response models.
They MUST match the shared contract in contracts/analysis-response.schema.json.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class ImageEvidence(BaseModel):
    """Evidence derived from the chest X-ray image analysis."""

    available: bool = Field(
        description="Whether image-based evidence is available"
    )
    bbox: list[int] | None = Field(
        default=None,
        description="Bounding box [x_min, y_min, x_max, y_max] of the region of interest",
    )
    heatmap_available: bool = Field(
        default=False,
        description="Whether a Grad-CAM heatmap overlay is available",
    )


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class AnalysisResponse(BaseModel):
    """Response from POST /analyze."""

    analysis_id: str = Field(description="Unique identifier for this analysis run")
    finding: Literal[
        "suspected_pneumonia",
        "no_pneumonia_detected",
        "inconclusive",
        "rejected",
    ] = Field(description="The finding category")
    model_score: float = Field(
        ge=0.0, le=1.0,
        description="Raw DenseNet model prediction score (0.0-1.0)",
    )
    confidence: Literal["low", "moderate", "high"] = Field(
        description="Confidence level computed by the confidence engine"
    )
    image_quality: Literal["good", "acceptable", "poor", "rejected"] = Field(
        description="Image quality assessment result"
    )
    image_evidence: ImageEvidence = Field(
        description="Image-level evidence (bounding box, heatmap)"
    )
    clinical_evidence: list[str] = Field(
        default_factory=list,
        description="Clinical evidence items that support the finding",
    )
    explanation: str = Field(
        description="Human-readable explanation for the clinician"
    )


class HealthResponse(BaseModel):
    """Response from GET /health."""

    status: str = "ok"


class ModelInfoResponse(BaseModel):
    """Response from GET /model-info."""

    project: str = "LumiVue"
    classifier: str = "DenseNet-121"
    multimodal_model: str = "MedGemma 1.5 4B"
    status: str = "development"
