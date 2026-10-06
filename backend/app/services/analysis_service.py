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
from app.schemas.analysis import AnalysisResponse, ImageEvidence

# Future imports (uncomment when implementing):
# from app.models.pneumonia import PneumoniaModel
# from app.models.medgemma import MedGemmaService
# from app.vision.preprocess import preprocess_image
# from app.vision.gradcam import generate_gradcam
# from app.vision.image_quality import assess_quality
# from app.evidence.firewall import enforce_evidence
# from app.evidence.confidence import compute_confidence


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

    # ---- REAL PIPELINE (TODO) ----
    # 1. Preprocess image
    # 2. Assess image quality
    # 3. Run DenseNet-121 classifier
    # 4. Generate Grad-CAM heatmap
    # 5. Run MedGemma multimodal reasoning
    # 6. Apply evidence firewall
    # 7. Compute confidence
    # 8. Build response
    #
    # For now, fall through to mock even if not explicitly in mock mode,
    # since no models are loaded yet.
    return _mock_response(patient_context)


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
        image_quality="good",
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
