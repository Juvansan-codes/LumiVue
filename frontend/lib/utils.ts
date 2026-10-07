// =============================================================================
// LumiVue — Utility Functions
// =============================================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a model score as a display string (e.g., 0.82)
 */
export function formatScore(score: number): string {
  return score.toFixed(2);
}

/**
 * Get a human-readable finding label
 */
export function findingLabel(finding: string): string {
  const labels: Record<string, string> = {
    suspected_pneumonia: "Possible pneumonia",
    no_pneumonia_detected: "No pneumonia detected",
    inconclusive: "Inconclusive",
    rejected: "Image rejected",
  };
  return labels[finding] ?? finding;
}

/**
 * Get finding severity for styling
 */
export function findingSeverity(
  finding: string,
): "warning" | "success" | "danger" | "muted" {
  switch (finding) {
    case "suspected_pneumonia":
      return "warning";
    case "no_pneumonia_detected":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}
