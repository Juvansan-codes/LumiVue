// =============================================================================
// LumiVue — API Client Layer
// =============================================================================
// All HTTP calls go through this module. Components NEVER call fetch() directly.
//
// Modes:
//   MOCK  — Returns mock data with simulated pipeline (NEXT_PUBLIC_USE_MOCK=true or default)
//   REAL  — Hits the FastAPI backend (NEXT_PUBLIC_API_BASE_URL)
// =============================================================================

import type {
  AnalysisResponse,
  HealthResponse,
  ModelInfoResponse,
  PatientContext,
  PipelineStep,
} from "./types";
import {
  mockAnalysisResponse,
  mockHealthResponse,
  mockModelInfoResponse,
  simulateDelay,
  simulatePipeline,
} from "./mock-data";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const USE_MOCK: boolean =
  process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // default to mock

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
  if (USE_MOCK) {
    await simulateDelay(200);
    return mockHealthResponse;
  }
  return request<HealthResponse>("/health");
}

/**
 * GET /model-info — returns information about loaded models.
 */
export async function getModelInfo(): Promise<ModelInfoResponse> {
  if (USE_MOCK) {
    await simulateDelay(300);
    return mockModelInfoResponse;
  }
  return request<ModelInfoResponse>("/model-info");
}

/**
 * POST /analyze — sends a chest X-ray image (and optional patient context)
 * for analysis. Returns the evidence-grounded result.
 *
 * In mock mode, simulates a pipeline with step-by-step progress.
 */
export async function analyzeXray(
  image: File,
  patientContext?: PatientContext,
  onPipelineUpdate?: (steps: PipelineStep[]) => void,
): Promise<AnalysisResponse> {
  if (USE_MOCK) {
    if (onPipelineUpdate) {
      return simulatePipeline(onPipelineUpdate);
    }
    await simulateDelay(2000);
    return mockAnalysisResponse;
  }

  const formData = new FormData();
  formData.append("image", image);
  if (patientContext) {
    formData.append("patient_context", JSON.stringify(patientContext));
  }

  return request<AnalysisResponse>("/analyze", {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — the browser sets it with the boundary
  });
}
