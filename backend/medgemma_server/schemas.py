"""
MedGemma Server — Pydantic Schemas
=====================================
Request and response models for the MedGemma HTTP service.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """GET /health response."""

    status: str = Field(description="'ok' when the model is loaded and ready")
    model: str = Field(description="Model identifier")
    device: str = Field(description="'cuda' or 'cpu'")
    device_name: str = Field(default="", description="GPU model name or 'cpu'")
    vram_gb: float = Field(default=0.0, description="Total VRAM in GB (0 for CPU)")
    error: Optional[str] = Field(
        default=None,
        description="Error message when status != 'ok'",
    )


# ---------------------------------------------------------------------------
# /analyze — request
# ---------------------------------------------------------------------------

class PatientContext(BaseModel):
    """Optional structured patient clinical context."""

    age: Optional[int] = Field(default=None, description="Patient age in years")
    sex: Optional[str] = Field(default=None, description="Patient sex")
    symptoms: list[str] = Field(
        default_factory=list, description="List of symptoms"
    )
    spo2: Optional[float] = Field(
        default=None, description="Oxygen saturation (%)"
    )
    temperature: Optional[float] = Field(
        default=None, description="Body temperature (°C)"
    )
    duration: Optional[str] = Field(
        default=None, description="Duration of current illness"
    )
    notes: Optional[str] = Field(
        default=None, description="Free-text clinical notes"
    )


# ---------------------------------------------------------------------------
# /analyze — response
# ---------------------------------------------------------------------------

class Finding(BaseModel):
    """A single clinical finding produced by MedGemma."""

    name: str = Field(description="Short clinical label for the finding")
    description: str = Field(description="One or two sentence description")
    image_support: bool = Field(
        description="True when the finding is supported by the X-ray image"
    )
    clinical_support: bool = Field(
        description="True when the finding is supported by patient context"
    )
    clinical_evidence: list[str] = Field(
        default_factory=list,
        description="Specific clinical items that support this finding",
    )


class AnalyzeResponse(BaseModel):
    """POST /analyze response."""

    findings: list[Finding] = Field(
        default_factory=list,
        description="Structured clinical findings from MedGemma",
    )
    explanation: str = Field(
        description="Human-readable summary for the clinician"
    )
