// =============================================================================
// AnalyzeButton — Triggers the X-ray analysis
// =============================================================================
// Owner: Frontend Member 2 (API integration)
// TODO: Add loading spinner state
// TODO: Disable while analysis is in progress
// =============================================================================

"use client";

import React from "react";

interface AnalyzeButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function AnalyzeButton({
  onClick,
  disabled = false,
  loading = false,
}: AnalyzeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Analyzing…" : "Analyze X-ray"}
    </button>
  );
}
