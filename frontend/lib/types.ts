// =============================================================================
// LumiVue — TypeScript Type Definitions
// =============================================================================
// Shared types for the API contract and UI state.
// =============================================================================

/** Bounding box coordinates [x, y, width, height] */
export type BBox = [number, number, number, number];

/** Confidence level derived from the confidence engine */
export type ConfidenceLevel = "low" | "moderate" | "high";

/** Image quality assessment result */
export interface ImageQuality {
  quality: "good" | "acceptable" | "poor" | "rejected";
  blur_score?: number;
  brightness_score?: number;
  contrast_score?: number;
}

/** Possible analysis finding categories */
export type Finding =
  | "suspected_pneumonia"
  | "no_pneumonia_detected"
  | "inconclusive"
  | "rejected";

/** Evidence derived from the chest X-ray image analysis */
export interface ImageEvidence {
  model: string;
  score: number;
  bbox: BBox | null;
  heatmap_available: boolean;
  /** Base64 encoded PNG string of the heatmap overlay */
  heatmap_base64?: string | null;
}

// Removed old conflicting types to align strictly with the backend API contract.

/** Full analysis response from POST /analyze */
export interface AnalysisResponse {
  analysis_id: string;
  finding: Finding;
  model_score: number;
  confidence: ConfidenceLevel;
  image_evidence: ImageEvidence;
  clinical_evidence: string[];
  explanation: string;
  image_quality: ImageQuality;
}

/** Patient clinical context submitted with analysis */
export interface PatientContext {
  age: string;
  sex: string;
  spo2: string;
  temperature: string;
  symptom_duration: string;
  symptoms: string[];
  clinical_notes: string;
}

/** Analysis pipeline step */
export interface PipelineStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

/** Application state for the analysis workflow */
export type AppState =
  | "idle"
  | "uploading"
  | "analyzing"
  | "complete"
  | "error";

/** Health check response */
export interface HealthResponse {
  status: string;
}

/** Model info response */
export interface ModelInfoResponse {
  project: string;
  classifier: string;
  multimodal_model: string;
  status: string;
}
