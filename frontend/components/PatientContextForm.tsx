// =============================================================================
// PatientContextForm — Clinical context input for the patient
// =============================================================================
// Owner: Frontend Member 1 (UI / Upload experience)
// TODO: Add structured fields (symptoms, vitals, history)
// TODO: Add Zod validation for form data
// =============================================================================

"use client";

import React from "react";

interface PatientContextFormProps {
  onContextChange?: (context: string) => void;
}

export default function PatientContextForm({
  onContextChange,
}: PatientContextFormProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="mb-3 text-sm font-semibold text-neutral-300">
        Patient Clinical Context
      </h3>
      <textarea
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-cyan-500 focus:outline-none"
        placeholder="Enter symptoms, vitals, medical history..."
        rows={3}
        onChange={(e) => onContextChange?.(e.target.value)}
      />
    </div>
  );
}
