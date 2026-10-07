"use client";

import type { ConfidenceLevel } from "@/lib/types";
import { Check, ShieldCheck, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

interface ConfidenceCardProps {
  confidence: ConfidenceLevel;
}

export function ConfidenceCard({ confidence }: ConfidenceCardProps) {
  const badgeConfig: Record<
    ConfidenceLevel,
    { label: string; variant: "success" | "warning" | "danger" }
  > = {
    high: { label: "High Confidence", variant: "success" },
    moderate: { label: "Moderate Confidence", variant: "warning" },
    low: { label: "Low Confidence", variant: "danger" },
  };

  const currentBadge = badgeConfig[confidence] ?? badgeConfig.moderate;

  const defaultFactors = {
    image_signal: confidence !== "low",
    clinical_context_supportive: confidence === "high",
    adequate_image_quality: true,
  };

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
          <ShieldCheck
            className="h-4 w-4"
            style={{ color: "var(--lv-blue)" }}
            aria-hidden="true"
          />
          <h3
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Confidence Assessment
          </h3>
        </div>
        <StatusBadge
          variant={currentBadge.variant}
          label={currentBadge.label}
          dot={true}
        />
      </div>

      {/* Main Confidence Callout */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold tracking-tight uppercase"
            style={{
              color:
                confidence === "high"
                  ? "var(--lv-success)"
                  : confidence === "moderate"
                    ? "var(--lv-warning)"
                    : "var(--lv-danger)",
            }}
          >
            {confidence}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--lv-muted)" }}
          >
            estimated consistency across multimodal signals
          </span>
        </div>
      </div>

      {/* Supporting Factors List */}
      <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--lv-border-light)" }}>
        <span
          className="text-[10px] font-semibold tracking-wider uppercase block"
          style={{ color: "var(--lv-muted-light)" }}
        >
          Supporting Factors
        </span>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            {defaultFactors.image_signal ? (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-success-light)", color: "var(--lv-success)" }}
              >
                <Check className="h-2.5 w-2.5" />
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-border-light)", color: "var(--lv-muted)" }}
              >
                <AlertCircle className="h-2.5 w-2.5" />
              </div>
            )}
            <span
              style={{
                color: defaultFactors.image_signal
                  ? "var(--lv-black)"
                  : "var(--lv-muted)",
              }}
            >
              Strong image visual signal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {defaultFactors.clinical_context_supportive ? (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-success-light)", color: "var(--lv-success)" }}
              >
                <Check className="h-2.5 w-2.5" />
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-border-light)", color: "var(--lv-muted)" }}
              >
                <span className="text-[10px]">•</span>
              </div>
            )}
            <span
              style={{
                color: defaultFactors.clinical_context_supportive
                  ? "var(--lv-black)"
                  : "var(--lv-muted)",
              }}
            >
              Clinical context supportive
            </span>
          </div>

          <div className="flex items-center gap-2">
            {defaultFactors.adequate_image_quality ? (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-success-light)", color: "var(--lv-success)" }}
              >
                <Check className="h-2.5 w-2.5" />
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-4 w-4 rounded-full"
                style={{ background: "var(--lv-danger-light)", color: "var(--lv-danger)" }}
              >
                <AlertCircle className="h-2.5 w-2.5" />
              </div>
            )}
            <span
              style={{
                color: defaultFactors.adequate_image_quality
                  ? "var(--lv-black)"
                  : "var(--lv-danger)",
              }}
            >
              Adequate image quality
            </span>
          </div>
        </div>
      </div>

      {/* Discretion Note */}
      <p
        className="text-[10px] mt-4 pt-3 border-t"
        style={{
          borderColor: "var(--lv-border-light)",
          color: "var(--lv-muted-light)",
        }}
      >
        Confidence reflects agreement between image feature extraction and clinical parameters.
        Not a mathematical guarantee.
      </p>
    </div>
  );
}
