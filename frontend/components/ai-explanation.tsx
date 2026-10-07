"use client";

import { Sparkles, FileText, AlertCircle } from "lucide-react";

interface AiExplanationProps {
  explanation: string;
}

export function AiExplanation({ explanation }: AiExplanationProps) {
  return (
    <div
      className="rounded-xl border bg-white p-6 transition-all duration-200"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText
            className="h-4 w-4"
            style={{ color: "var(--lv-blue)" }}
            aria-hidden="true"
          />
          <h3
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Clinical Explanation
          </h3>
        </div>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            background: "var(--lv-blue-light)",
            color: "var(--lv-blue)",
          }}
        >
          <Sparkles className="h-3 w-3" />
          <span>Multimodal Synthesis</span>
        </div>
      </div>

      {/* Narrative Card */}
      <div
        className="rounded-lg p-4 border text-sm leading-relaxed"
        style={{
          background: "var(--lv-surface-raised)",
          borderColor: "var(--lv-border-light)",
          color: "var(--lv-black)",
        }}
      >
        <p className="font-normal selection:bg-orange-100">
          {explanation}
        </p>
      </div>

      {/* Cautious Note */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--lv-muted)" }}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <span>
          Generated to assist radiological evaluation. Requires physician correlation with clinical findings.
        </span>
      </div>
    </div>
  );
}
