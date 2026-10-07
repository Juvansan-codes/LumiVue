// =============================================================================
// LumiVue — API Client Layer
// =============================================================================
// All HTTP calls go through this module. Components NEVER call fetch() directly.
//
// Communicates with the FastAPI backend (NEXT_PUBLIC_API_BASE_URL).
// Fallback simulations occur only if the backend is currently offline.
// =============================================================================

import type {
  AnalysisResponse,
  HealthResponse,
  ModelInfoResponse,
  PatientContext,
  PipelineStep,
} from "./types";
import { defaultPipelineSteps } from "./pipeline";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API error ${res.status} ${res.statusText}: ${body}`,
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GET /health — checks whether the backend is reachable.
 */
export async function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

/**
 * GET /model-info — returns information about loaded models.
 */
export async function getModelInfo(): Promise<ModelInfoResponse> {
  return request<ModelInfoResponse>("/model-info");
}

/**
 * POST /analyze — sends a chest X-ray image (and optional patient context)
 * for analysis. Returns the evidence-grounded result from the backend.
 */
export async function analyzeXray(
  image: File,
  patientContext?: PatientContext,
  onPipelineUpdate?: (steps: PipelineStep[]) => void,
): Promise<AnalysisResponse> {
  const steps = defaultPipelineSteps.map((s) => ({ ...s }));

  // Progress update helper
  const updateStep = (index: number, status: "pending" | "active" | "complete" | "error") => {
    if (steps[index]) {
      steps[index].status = status;
      if (onPipelineUpdate) onPipelineUpdate([...steps]);
    }
  };

  try {
    updateStep(0, "active"); // Preprocessing

    const formData = new FormData();
    formData.append("image", image);
    if (patientContext) {
      formData.append("patient_context", JSON.stringify(patientContext));
    }

    updateStep(0, "complete");
    updateStep(1, "active"); // Model inference
    updateStep(2, "active"); // Localization

    const response = await request<AnalysisResponse>("/analyze", {
      method: "POST",
      body: formData,
    });

    updateStep(1, "complete");
    updateStep(2, "complete");
    updateStep(3, "complete"); // Clinical reasoning
    updateStep(4, "complete"); // Firewall
    updateStep(5, "complete"); // Opinion

    return response;
  } catch (error) {
    // If backend connection fails, mark remaining steps error and re-throw
    steps.forEach((s) => {
      if (s.status === "active") s.status = "error";
    });
    if (onPipelineUpdate) onPipelineUpdate([...steps]);
    throw error;
  }
}
