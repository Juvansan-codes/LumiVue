// =============================================================================
// LumiVue — Mock Data for Frontend Development
// =============================================================================
// Realistic mock data that matches the full API contract.
// =============================================================================

import type { AnalysisResponse, HealthResponse, ModelInfoResponse, PipelineStep } from "./types";

/** Mock analysis response — simulates a positive pneumonia finding */
export const mockAnalysisResponse: AnalysisResponse = {
  analysis_id: "lv-20261007-001",
  finding: "suspected_pneumonia",
  model_score: 0.82,
  confidence: "high",
  confidence_factors: {
    image_signal: true,
    clinical_context_supportive: true,
    adequate_image_quality: true,
  },
  image_evidence: {
    model: "LumiVue DenseNet-121",
    score: 0.82,
    bbox: [412, 508, 701, 872],
    heatmap_available: true,
  },
  clinical_evidence: [
    "Fever",
    "Productive cough",
    "SpO₂ 92%",
  ],
  explanation:
    "Doctor, consider a possible focal lung opacity in the highlighted region. " +
    "The image model identified visual evidence in this area, while the reported " +
    "fever and productive cough provide supporting clinical context. " +
    "This is a decision-support suggestion — please correlate with your clinical judgment.",
  image_quality: {
    status: "good",
    sharpness: "Good",
    contrast: "Good",
    resolution: "Adequate",
  },
  evidence_validation: {
    supported: true,
    image_evidence: true,
    clinical_evidence: true,
  },
};

/** Mock analysis response — simulates a negative/clear finding */
export const mockNegativeResponse: AnalysisResponse = {
  analysis_id: "lv-20261007-002",
  finding: "no_pneumonia_detected",
  model_score: 0.12,
  confidence: "high",
  confidence_factors: {
    image_signal: true,
    clinical_context_supportive: false,
    adequate_image_quality: true,
  },
  image_evidence: {
    model: "LumiVue DenseNet-121",
    score: 0.12,
    bbox: null,
    heatmap_available: false,
  },
  clinical_evidence: [],
  explanation:
    "Doctor, the model does not detect significant opacities suggestive of " +
    "pneumonia. No supporting clinical evidence was provided. " +
    "Please correlate with your clinical findings.",
  image_quality: {
    status: "good",
    sharpness: "Good",
    contrast: "Good",
    resolution: "Good",
  },
  evidence_validation: {
    supported: false,
    image_evidence: false,
    clinical_evidence: false,
  },
};

/** Mock analysis pipeline steps */
export const mockPipelineSteps: PipelineStep[] = [
  { id: "preprocess", label: "Image preprocessing", status: "pending" },
  { id: "assessment", label: "Pneumonia assessment", status: "pending" },
  { id: "localization", label: "Visual localization", status: "pending" },
  { id: "clinical", label: "Clinical context", status: "pending" },
  { id: "validation", label: "Evidence validation", status: "pending" },
  { id: "opinion", label: "Generating second opinion", status: "pending" },
];

/** Mock health check response */
export const mockHealthResponse: HealthResponse = {
  status: "ok",
};

/** Mock model info response */
export const mockModelInfoResponse: ModelInfoResponse = {
  project: "LumiVue",
  classifier: "DenseNet-121",
  multimodal_model: "MedGemma 1.5 4B",
  status: "ready",
};

/**
 * Simulates network latency for a more realistic mock experience.
 */
export function simulateDelay(ms: number = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates the analysis pipeline with progressive step updates.
 */
export async function simulatePipeline(
  onStepUpdate: (steps: PipelineStep[]) => void,
): Promise<AnalysisResponse> {
  const steps = mockPipelineSteps.map((s) => ({ ...s }));
  const delays = [600, 800, 700, 500, 400, 600];

  for (let i = 0; i < steps.length; i++) {
    steps[i].status = "active";
    onStepUpdate([...steps]);
    await simulateDelay(delays[i]);
    steps[i].status = "complete";
    onStepUpdate([...steps]);
  }

  await simulateDelay(300);
  return mockAnalysisResponse;
}
