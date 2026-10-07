"use client";

import type { PipelineStep } from "@/lib/types";
import { Check, Circle, Loader2, ScanLine } from "lucide-react";

interface AnalysisProgressProps {
  steps: PipelineStep[];
}

export function AnalysisProgress({ steps }: AnalysisProgressProps) {
  return (
    <div
      className="rounded-xl border bg-white p-6"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center h-10 w-10 rounded-xl"
          style={{ background: "var(--lv-blue-light)" }}
        >
          <ScanLine
            className="h-5 w-5"
            style={{ color: "var(--lv-blue)" }}
          />
        </div>
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--lv-black)" }}
          >
            Analyzing X-ray
          </h3>
          <p
            className="text-xs"
            style={{ color: "var(--lv-muted)" }}
          >
            Processing through the LumiVue pipeline
          </p>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors duration-200"
            style={{
              background:
                step.status === "active"
                  ? "var(--lv-blue-light)"
                  : "transparent",
            }}
          >
            {/* Status Icon */}
            <div className="flex items-center justify-center h-5 w-5 shrink-0">
              {step.status === "complete" && (
                <div
                  className="flex items-center justify-center h-5 w-5 rounded-full"
                  style={{ background: "var(--lv-success)" }}
                >
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              {step.status === "active" && (
                <Loader2
                  className="h-4.5 w-4.5 lv-animate-spin"
                  style={{ color: "var(--lv-blue)" }}
                />
              )}
              {step.status === "pending" && (
                <Circle
                  className="h-4 w-4"
                  style={{ color: "var(--lv-border)" }}
                />
              )}
              {step.status === "error" && (
                <div
                  className="flex items-center justify-center h-5 w-5 rounded-full"
                  style={{ background: "var(--lv-danger)" }}
                >
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>

            {/* Label */}
            <span
              className="text-sm font-medium"
              style={{
                color:
                  step.status === "active"
                    ? "var(--lv-blue)"
                    : step.status === "complete"
                      ? "var(--lv-black)"
                      : "var(--lv-muted-light)",
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
