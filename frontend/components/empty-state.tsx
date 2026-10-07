"use client";

import { ScanLine, Shield, ArrowUpRight } from "lucide-react";

interface EmptyStateProps {
  onLoadSample?: (preset: "positive" | "negative") => void;
}

export function EmptyState({ onLoadSample }: EmptyStateProps) {
  return (
    <div
      className="rounded-xl border bg-white p-8 text-center flex flex-col items-center justify-center min-h-[460px] transition-all duration-200"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center h-16 w-16 rounded-2xl mb-5"
        style={{ background: "var(--lv-blue-light)" }}
      >
        <ScanLine
          className="h-8 w-8"
          style={{ color: "var(--lv-blue)" }}
          aria-hidden="true"
        />
      </div>

      {/* Heading */}
      <h3
        className="text-lg font-semibold tracking-tight mb-2"
        style={{ color: "var(--lv-black)" }}
      >
        No analysis yet
      </h3>

      {/* Description */}
      <p
        className="text-sm max-w-sm mb-6 leading-relaxed"
        style={{ color: "var(--lv-muted)" }}
      >
        Upload a chest X-ray and provide clinical context to generate an evidence-backed second opinion.
      </p>

      {/* Preset Quick Actions for demo/presentation */}
      {onLoadSample && (
        <div className="w-full max-w-md pt-6 border-t space-y-3" style={{ borderColor: "var(--lv-border-light)" }}>
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block"
            style={{ color: "var(--lv-muted-light)" }}
          >
            Quick Test Cases for Evaluation
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onLoadSample("positive")}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium text-left transition-all duration-150 hover:border-orange-400 hover:bg-orange-50/50"
              style={{
                borderColor: "var(--lv-border)",
                background: "var(--lv-surface-raised)",
                color: "var(--lv-black)",
              }}
            >
              <div>
                <p className="font-semibold text-neutral-900">Case 1: Suspected Infiltrate</p>
                <p className="text-[10px] text-neutral-500">Fever, cough, SpO₂ 92%</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-orange-600 shrink-0 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => onLoadSample("negative")}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs font-medium text-left transition-all duration-150 hover:border-orange-400 hover:bg-orange-50/50"
              style={{
                borderColor: "var(--lv-border)",
                background: "var(--lv-surface-raised)",
                color: "var(--lv-black)",
              }}
            >
              <div>
                <p className="font-semibold text-neutral-900">Case 2: Clear Lungs</p>
                <p className="text-[10px] text-neutral-500">Routine pre-op assessment</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-orange-600 shrink-0 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Evidence firewall callout footer */}
      <div
        className="mt-6 flex items-center gap-1.5 text-[11px]"
        style={{ color: "var(--lv-muted-light)" }}
      >
        <Shield className="h-3.5 w-3.5 text-orange-600" />
        <span>Multimodal verification with Evidence Firewall active</span>
      </div>
    </div>
  );
}
