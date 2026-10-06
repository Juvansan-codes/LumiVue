// =============================================================================
// LumiVue — TypeScript Type Definitions
// =============================================================================
// Shared types for the API contract and UI state.
// =============================================================================

/** Bounding box coordinates [x_min, y_min, x_max, y_max] */
export type BBox = [number, number, number, number];

/** Confidence level derived from the confidence engine */
export type ConfidenceLevel = "low" | "moderate" | "high";

/** Image quality assessment result */
export type ImageQualityStatus = "good" | "acceptable" | "poor" | "rejected";
export type ImageQuality = ImageQualityStatus;

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
}

/** Image quality details */
export interface ImageQualityInfo {
  status: ImageQualityStatus;
  sharpness?: string;
  contrast?: string;
  resolution?: string;
}

/** Evidence validation (Evidence Firewall) */
export interface EvidenceValidation {
  supported: boolean;
  image_evidence: boolean;
  clinical_evidence: boolean;
}

/** Confidence supporting factors */
export interface ConfidenceFactors {
  image_signal: boolean;
  clinical_context_supportive: boolean;
  adequate_image_quality: boolean;
}

/** Full analysis response from POST /analyze */
export interface AnalysisResponse {
  analysis_id: string;
  finding: Finding;
  model_score: number;
  confidence: ConfidenceLevel;
  confidence_factors: ConfidenceFactors;
  image_evidence: ImageEvidence;
  clinical_evidence: string[];
  explanation: string;
  image_quality: ImageQualityInfo;
  evidence_validation: EvidenceValidation;
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
