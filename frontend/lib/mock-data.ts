// =============================================================================
// LumiVue — Mock Data for Frontend Development
// =============================================================================
// Allows the frontend team to build and test the UI without the backend running.
// This mock data matches the shared API contract.
// =============================================================================

import type { AnalysisResponse, HealthResponse, ModelInfoResponse } from "./types";

/** Mock analysis response — simulates a positive pneumonia finding */
export const mockAnalysisResponse: AnalysisResponse = {
  analysis_id: "demo-001",
  finding: "suspected_pneumonia",
  model_score: 0.82,
  confidence: "high",
  image_quality: "good",
  image_evidence: {
    available: true,
    bbox: [120, 160, 340, 390],
    heatmap_available: true,
  },
  clinical_evidence: [
    "fever",
    "productive cough",
    "SpO2 92%",
  ],
  explanation:
    "Doctor, consider a possible focal lung opacity in the highlighted region. " +
    "The DenseNet model indicates an elevated pneumonia probability (0.82), " +
    "and the clinical context (fever, productive cough, low SpO2) supports " +
    "further evaluation. This is a decision-support suggestion — please " +
    "correlate with your clinical judgment.",
};

/** Mock analysis response — simulates a negative/clear finding */
export const mockNegativeResponse: AnalysisResponse = {
  analysis_id: "demo-002",
  finding: "no_pneumonia_detected",
  model_score: 0.12,
  confidence: "high",
  image_quality: "good",
  image_evidence: {
    available: false,
    bbox: null,
    heatmap_available: false,
  },
  clinical_evidence: [],
  explanation:
    "Doctor, the model does not detect significant opacities suggestive of " +
    "pneumonia. No supporting clinical evidence was provided. " +
    "Please correlate with your clinical findings.",
};

/** Mock analysis response — simulates a poor quality image rejection */
export const mockPoorQualityResponse: AnalysisResponse = {
  analysis_id: "demo-003",
  finding: "rejected",
  model_score: 0.0,
  confidence: "low",
  image_quality: "rejected",
  image_evidence: {
    available: false,
    bbox: null,
    heatmap_available: false,
  },
  clinical_evidence: [],
  explanation:
    "Doctor, the uploaded image does not meet the quality requirements for " +
    "reliable analysis. Please upload a properly exposed PA chest X-ray.",
};

/** Mock health check response */
export const mockHealthResponse: HealthResponse = {
  status: "ok",
};

/** Mock model info response */
export const mockModelInfoResponse: ModelInfoResponse = {
  project: "LumiVue",
  classifier: "DenseNet-121",
  multimodal_model: "MedGemma 1.5 4B",
  status: "development",
};

/**
 * Simulates network latency for a more realistic mock experience.
 * @param ms Delay in milliseconds (default 800ms)
 */
export function simulateDelay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
