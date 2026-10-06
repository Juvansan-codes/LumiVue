"""
LumiVue — Confidence Engine
=============================
Owner: Backend Member 4 (Confidence engine)

Computes an overall confidence level by combining multiple signals:
    - model_score     : DenseNet prediction score
    - image_quality   : Image quality assessment result
    - clinical_support: Whether clinical evidence is available
    - model_agreement : Whether DenseNet and MedGemma agree

Output:
    - "low"      : Insufficient confidence for clinical consideration
    - "moderate" : Reasonable confidence, interpret with caution
    - "high"     : Strong evidence alignment, high confidence

TODO:
    - Implement weighted scoring logic
    - Add configurable thresholds
    - Consider model calibration
"""

from __future__ import annotations

from typing import Literal


ConfidenceLevel = Literal["low", "moderate", "high"]


def compute_confidence(
    model_score: float,
    image_quality: str = "good",
    clinical_support: bool = False,
    model_agreement: bool = True,
) -> ConfidenceLevel:
    """
    Compute overall confidence level from multiple signals.

    Parameters
    ----------
    model_score : float
        Raw DenseNet prediction score (0.0–1.0).
    image_quality : str
        Image quality level ("good", "acceptable", "poor", "rejected").
    clinical_support : bool
        Whether clinical evidence supports the finding.
    model_agreement : bool
        Whether DenseNet and MedGemma outputs are in agreement.

    Returns
    -------
    ConfidenceLevel
        Computed confidence level.
    """
    # TODO: Implement real weighted confidence computation
    # Placeholder logic based on model score and image quality
    if image_quality in ("poor", "rejected"):
        return "low"

    if model_score >= 0.75 and clinical_support and model_agreement:
        return "high"

    if model_score >= 0.5:
        return "moderate"

    return "low"
