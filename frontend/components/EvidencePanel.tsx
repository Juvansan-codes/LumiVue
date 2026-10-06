// =============================================================================
// EvidencePanel — Displays clinical and image evidence supporting findings
// =============================================================================
// Owner: Frontend Member 2 (Evidence panel)
// TODO: Render clinical_evidence list with icons
// TODO: Show image evidence status
// TODO: Display explanation text
// =============================================================================

"use client";

import React from "react";
import type { AnalysisResponse } from "@/lib/types";

interface EvidencePanelProps {
  result?: AnalysisResponse | null;
}

export default function EvidencePanel({ result }: EvidencePanelProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="mb-3 text-sm font-semibold text-neutral-300">
        Evidence Summary
      </h3>
      <p className="text-xs text-neutral-500">
        [Evidence panel — to be implemented]
      </p>
    </div>
  );
}
