// =============================================================================
// AnalysisResult — Composite view of the full analysis output
// =============================================================================
// Owner: Frontend Member 2 (Result screen)
// TODO: Compose ConfidenceBadge, EvidencePanel, ImageQualityBadge
// TODO: Add expand/collapse for detailed explanation
// =============================================================================

"use client";

import React from "react";
import type { AnalysisResponse } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";
import ImageQualityBadge from "./ImageQualityBadge";
import EvidencePanel from "./EvidencePanel";

interface AnalysisResultProps {
  result?: AnalysisResponse | null;
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  if (!result) return null;

  return (
    <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-100">
          Analysis Result
        </h2>
        <div className="flex gap-2">
          <ConfidenceBadge level={result.confidence} />
          <ImageQualityBadge quality={result.image_quality} />
        </div>
      </div>

      <p className="text-sm text-neutral-400">{result.explanation}</p>

      <EvidencePanel result={result} />
    </div>
  );
}
