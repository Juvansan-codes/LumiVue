"""
LumiVue — End-to-End Analysis Test
===================================
Tests the final /analyze integration pipeline.
"""

import os
import sys
import pytest
from unittest.mock import patch
from io import BytesIO
from PIL import Image

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.medgemma import MedGemmaResponse

settings.medgemma_mode = "api"
client = TestClient(app)

def create_dummy_image(mode="RGB") -> bytes:
    img = Image.new(mode, (224, 224), color="gray")
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

@patch("app.services.analysis_service.vision_service")
@patch("app.services.analysis_service.MedGemmaService")
def test_full_analyze_positive(mock_medgemma_cls, mock_vision):
    """Case 1: Positive image with clinical context."""
    # Mock Vision Service
    mock_vision.analyze_image.return_value = {
        "prediction": "suspected_pneumonia",
        "model_score": 0.85,
        "image_evidence": {"available": True, "bbox": [10, 20, 30, 40], "heatmap_available": True, "heatmap_base64": "base64"},
        "image_quality": {"quality": "good", "blur_score": 0.9, "brightness_score": 0.9, "contrast_score": 0.9}
    }
    # Mock MedGemma
    mock_mg_instance = mock_medgemma_cls.return_value
    mock_mg_instance.analyze.return_value = MedGemmaResponse(
        explanation="Doctor, consider possible pneumonia...",
        supporting_findings=["fever", "productive cough", "SpO2 92%"]
    )
    
    files = {"image": ("test.png", create_dummy_image(), "image/png")}
    data = {"patient_context": "fever, productive cough, SpO2 92%"}
    
    response = client.post("/analyze", files=files, data=data)
    if response.status_code != 200:
        print("ERROR:", response.json())
    assert response.status_code == 200
    res_json = response.json()
    
    assert res_json["finding"] == "suspected_pneumonia"
    assert res_json["image_evidence"]["available"] is True
    assert len(res_json["clinical_evidence"]) == 3
    assert res_json["confidence"] == "high"
    assert "Doctor, consider" in res_json["explanation"]

@patch("app.services.analysis_service.vision_service")
@patch("app.services.analysis_service.MedGemmaService")
def test_full_analyze_negative(mock_medgemma_cls, mock_vision):
    """Case 2: Negative image."""
    mock_vision.analyze_image.return_value = {
        "prediction": "normal",
        "model_score": 0.15,
        "image_evidence": {"available": False, "bbox": None, "heatmap_available": True, "heatmap_base64": "base64"},
        "image_quality": {"quality": "good", "blur_score": 0.9, "brightness_score": 0.9, "contrast_score": 0.9}
    }
    mock_mg_instance = mock_medgemma_cls.return_value
    mock_mg_instance.analyze.return_value = MedGemmaResponse(
        explanation="No obvious findings.",
        supporting_findings=[]
    )
    
    files = {"image": ("test.png", create_dummy_image(), "image/png")}
    data = {"patient_context": "no symptoms"}
    
    response = client.post("/analyze", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    
    assert res_json["finding"] == "no_pneumonia_detected"
    assert res_json["image_evidence"]["bbox"] is None
    assert res_json["confidence"] == "low"

@patch("app.services.analysis_service.vision_service")
@patch("app.services.analysis_service.MedGemmaService")
def test_full_analyze_poor_quality(mock_medgemma_cls, mock_vision):
    """Case 3: Poor image."""
    mock_vision.analyze_image.return_value = {
        "prediction": "normal",
        "model_score": 0.45,
        "image_evidence": {"available": False, "bbox": None, "heatmap_available": False, "heatmap_base64": None},
        "image_quality": {"quality": "poor", "blur_score": 0.3, "brightness_score": 0.3, "contrast_score": 0.3}
    }
    mock_mg_instance = mock_medgemma_cls.return_value
    mock_mg_instance.analyze.return_value = MedGemmaResponse(
        explanation="Image quality is too poor.",
        supporting_findings=[]
    )
    
    files = {"image": ("test.png", create_dummy_image(), "image/png")}
    data = {"patient_context": ""}
    
    response = client.post("/analyze", files=files, data=data)
    assert response.status_code == 200
    res_json = response.json()
    
    assert res_json["image_quality"]["quality"] == "poor"
    assert res_json["confidence"] == "low"

