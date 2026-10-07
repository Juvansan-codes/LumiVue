"use client";

import { Activity, Stethoscope, AlertTriangle } from "lucide-react";

interface ClinicalEvidenceProps {
  evidence: string[];
}

export function ClinicalEvidence({ evidence }: ClinicalEvidenceProps) {
  const hasEvidence = evidence && evidence.length > 0;

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
          <Stethoscope
            className="h-4 w-4"
            style={{ color: "var(--lv-blue)" }}
            aria-hidden="true"
          />
          <h3
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Clinical Evidence
          </h3>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: hasEvidence ? "var(--lv-blue-light)" : "var(--lv-border-light)",
            color: hasEvidence ? "var(--lv-blue)" : "var(--lv-muted)",
          }}
        >
          {evidence.length} {evidence.length === 1 ? "factor" : "factors"}
        </span>
      </div>

      {/* Content */}
      {hasEvidence ? (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--lv-muted)" }}>
            Correlated patient findings contributing to multimodal evaluation:
          </p>

          <div className="flex flex-wrap gap-2">
            {evidence.map((item, index) => {
              const isVital = item.toLowerCase().includes("spo2") || item.toLowerCase().includes("temp") || item.includes("%") || item.includes("°");
              return (
                <div
                  key={`${item}-${index}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                  style={{
                    background: "var(--lv-surface-raised)",
                    borderColor: isVital ? "var(--lv-blue-muted)" : "var(--lv-border)",
                    color: "var(--lv-black)",
                  }}
                >
                  <Activity
                    className="h-3 w-3 shrink-0"
                    style={{ color: isVital ? "var(--lv-blue)" : "var(--lv-muted)" }}
                  />
                  <span>{item}</span>
                </div>
              );
            })}
          </div>

          <p
            className="text-[10px] pt-2"
            style={{ color: "var(--lv-muted-light)" }}
          >
            Verified against structured patient intake.
          </p>
        </div>
      ) : (
        <div
          className="rounded-lg p-4 border border-dashed flex items-start gap-2.5 text-xs"
          style={{
            background: "var(--lv-surface-raised)",
            borderColor: "var(--lv-border)",
            color: "var(--lv-muted)",
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium" style={{ color: "var(--lv-black)" }}>
              No clinical factors documented
            </p>
            <p className="mt-0.5 text-[11px]">
              Analysis is currently operating on image-only features without patient history or vital signs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
