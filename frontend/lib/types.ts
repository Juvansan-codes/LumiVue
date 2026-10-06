// =============================================================================
// LumiVue — Shared TypeScript Types
// =============================================================================
// These types mirror the shared API contract in contracts/analysis-response.schema.json
// Any changes must be reflected in both places.
// =============================================================================

/** Bounding box coordinates [x_min, y_min, x_max, y_max] */
export type BBox = [number, number, number, number];

/** Confidence level derived from the confidence engine */
export type ConfidenceLevel = "low" | "moderate" | "high";

/** Image quality assessment result */
export type ImageQuality = "good" | "acceptable" | "poor" | "rejected";

/** Possible analysis finding categories */
export type Finding =
  | "suspected_pneumonia"
  | "no_pneumonia_detected"
  | "inconclusive"
  | "rejected";

/** Evidence derived from the chest X-ray image analysis */
export interface ImageEvidence {
  /** Whether image-based evidence is available */
  available: boolean;
  /** Bounding box of the region of interest, if available */
  bbox: BBox | null;
  /** Whether a Grad-CAM heatmap overlay is available */
  heatmap_available: boolean;
}

/** Full analysis response from POST /analyze */
export interface AnalysisResponse {
  /** Unique identifier for this analysis run */
  analysis_id: string;
  /** The finding category */
  finding: Finding;
  /** Raw DenseNet model prediction score (0.0–1.0) */
  model_score: number;
  /** Confidence level computed by the confidence engine */
  confidence: ConfidenceLevel;
  /** Image quality assessment result */
  image_quality: ImageQuality;
  /** Image-level evidence (bounding box, heatmap) */
  image_evidence: ImageEvidence;
  /** Clinical evidence items that support the finding */
  clinical_evidence: string[];
  /** Human-readable explanation for the clinician */
  explanation: string;
}

/** Request payload for the analysis (sent as multipart form) */
export interface AnalysisRequest {
  /** The chest X-ray image file */
  image: File;
  /** Optional patient clinical context (JSON string) */
  patient_context?: string;
}

/** Health check response from GET /health */
export interface HealthResponse {
  status: string;
}

/** Model info response from GET /model-info */
export interface ModelInfoResponse {
  project: string;
  classifier: string;
  multimodal_model: string;
  status: string;
}
