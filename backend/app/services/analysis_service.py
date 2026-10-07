"""
LumiVue — Analysis Service (Orchestrator)
==========================================
Orchestrates the full analysis pipeline:

    POST /analyze
           ↓
    analysis_service.run_analysis()
           ↓
     ┌─────┼────────┬───────────┐
     ▼     ▼        ▼           ▼
   Image  DenseNet  GradCAM   MedGemma
   Quality
           ↓
   Evidence Firewall
           ↓
   Confidence Engine
           ↓
   Response

At scaffolding stage this returns a mock response.
Replace with real pipeline once models are integrated.
"""

from __future__ import annotations

import uuid

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse, ImageEvidence, ImageQuality

from app.services.vision_service import vision_service
from app.models.medgemma import MedGemmaService
from app.evidence.firewall import enforce_evidence
from app.evidence.confidence import compute_confidence


async def run_analysis(
    image_bytes: bytes,
    patient_context: str = "",
) -> AnalysisResponse:
    """
    Run the full analysis pipeline on a chest X-ray image.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of the uploaded image.
    patient_context : str
        Clinical context string (symptoms, vitals, history).

    Returns
    -------
    AnalysisResponse
        Evidence-grounded analysis result.
    """
    # ---- MOCK MODE ----
    # Returns a realistic mock response so the frontend team can develop
    # the full UI without real models.
    if settings.is_mock:
        return _mock_response(patient_context)

    # ---- REAL PIPELINE ----
    
    # 1. Vision Service (DenseNet + GradCAM + Image Quality)
    try:
        cv_result = vision_service.analyze_image(image_bytes)
    except Exception as e:
        # Fallback or error handling; for now raise to be caught by route or middleware
        raise RuntimeError(f"VisionService failed: {e}")

    # 2. MedGemma Service
    medgemma = MedGemmaService()
    mg_result = medgemma.analyze(
        image_bytes=image_bytes, 
        patient_context=patient_context,
        model_score=cv_result["model_score"]
    )
    
    # If the user didn't provide patient_context, we can fall back to using MedGemma's supporting findings as clinical evidence,
    # or we can parse the patient_context. For simplicity, we use MedGemma's structured supporting_findings.
    clinical_evidence = mg_result.supporting_findings

    # 3. Evidence Firewall
    firewall_decision = enforce_evidence(
        has_image_evidence=cv_result["image_evidence"]["available"],
        clinical_evidence=clinical_evidence,
        model_score=cv_result["model_score"]
    )

    # 4. Finding Mapping
    # VisionService uses "suspected_pneumonia" / "normal"
    # API Contract uses "suspected_pneumonia" / "no_pneumonia_detected"
    finding = "suspected_pneumonia" if cv_result["prediction"] == "suspected_pneumonia" else "no_pneumonia_detected"
    
    # Enforce firewall decision
    if not firewall_decision.allowed:
        finding = "no_pneumonia_detected"
        
    # 5. Confidence Engine
    # A simple proxy for model agreement: if the CV model predicts pneumonia and MedGemma found clinical support
    model_agreement = (finding == "suspected_pneumonia" and len(clinical_evidence) > 0)
    confidence = compute_confidence(
        model_score=cv_result["model_score"],
        image_quality=cv_result["image_quality"]["quality"],
        clinical_support=len(clinical_evidence) > 0,
        model_agreement=model_agreement
    )

    # 6. Build Final Response
    return AnalysisResponse(
        analysis_id=f"analysis-{uuid.uuid4().hex[:8]}",
        finding=finding,
        model_score=cv_result["model_score"],
        confidence=confidence,
        image_quality=cv_result["image_quality"],
        image_evidence=ImageEvidence(**cv_result["image_evidence"]),
        clinical_evidence=clinical_evidence,
        explanation=mg_result.explanation
    )


def _mock_response(patient_context: str = "") -> AnalysisResponse:
    """Generate a realistic mock analysis response."""

    # Parse clinical evidence from patient context
    clinical_evidence: list[str] = []
    if patient_context:
        clinical_evidence = [
            item.strip()
            for item in patient_context.split(",")
            if item.strip()
        ]

    return AnalysisResponse(
        analysis_id=f"mock-{uuid.uuid4().hex[:8]}",
        finding="suspected_pneumonia",
        model_score=0.82,
        confidence="high",
        image_quality=ImageQuality(quality="good"),
        image_evidence=ImageEvidence(
            available=True,
            bbox=[120, 160, 340, 390],
            heatmap_available=True,
        ),
        clinical_evidence=clinical_evidence or [
            "fever",
            "productive cough",
            "SpO2 92%",
        ],
        explanation=(
            "Doctor, consider a possible focal lung opacity in the highlighted "
            "region. The DenseNet model indicates an elevated pneumonia "
            "probability (0.82), and the clinical context supports further "
            "evaluation. This is a decision-support suggestion — please "
            "correlate with your clinical judgment."
        ),
    )
