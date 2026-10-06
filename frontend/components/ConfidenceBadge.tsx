// =============================================================================
// ConfidenceBadge — Displays the confidence level of the analysis
// =============================================================================
// Owner: Frontend Member 2 (Confidence visualization)
// TODO: Add color coding (green=high, amber=moderate, red=low)
// TODO: Add tooltip explaining confidence derivation
// =============================================================================

"use client";

import React from "react";
import type { ConfidenceLevel } from "@/lib/types";

interface ConfidenceBadgeProps {
  level?: ConfidenceLevel | null;
}

const colorMap: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  moderate: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  low: "bg-red-600/20 text-red-400 border-red-600/30",
};

export default function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  if (!level) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorMap[level]}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} Confidence
    </span>
  );
}
