"use client";

import type { ImageQuality as ImageQualityType } from "@/lib/types";
import { AlertTriangle, Sliders } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

interface ImageQualityProps {
  quality: ImageQualityType;
}

export function ImageQuality({ quality }: ImageQualityProps) {
  const isGood = quality.quality === "good";
  const isPoor = quality.quality === "poor" || quality.quality === "rejected";

  const getStatusBadge = () => {
    switch (quality.quality) {
      case "good":
        return { label: "Good Quality", variant: "success" as const };
      case "acceptable":
        return { label: "Acceptable", variant: "muted" as const };
      case "poor":
        return { label: "Low Image Quality", variant: "warning" as const };
      case "rejected":
        return { label: "Quality Rejected", variant: "danger" as const };
      default:
        return { label: "Standard Quality", variant: "muted" as const };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className="rounded-xl border bg-white p-6 transition-all duration-200"
      style={{
        borderColor: isPoor ? "var(--lv-warning)" : "var(--lv-border)",
        background: isPoor ? "var(--lv-warning-light)" : "var(--lv-white)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders
            className="h-4 w-4"
            style={{ color: isPoor ? "var(--lv-warning)" : "var(--lv-blue)" }}
            aria-hidden="true"
          />
          <h3
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Image Quality Check
          </h3>
        </div>
        <StatusBadge variant={badge.variant} label={badge.label} dot={true} />
      </div>

      {/* Main warning if poor */}
      {isPoor ? (
        <div className="mb-4 p-3 rounded-lg bg-amber-100/60 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Model reliability may be reduced</p>
            <p className="text-[11px] mt-0.5 text-amber-800">
              Degraded radiographic resolution or artifacts detected. Doctor manual review is strongly recommended.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: "var(--lv-muted)" }}>
          Radiographic fidelity verified for automated feature extraction.
        </p>
      )}

      {/* Metric Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--lv-border-light)" }}>
        <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
            Blur Score
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.blur_score ? quality.blur_score.toFixed(2) : (isGood ? "Good" : "Sub-optimal")}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
            Contrast Score
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.contrast_score ? quality.contrast_score.toFixed(2) : (isGood ? "Good" : "Adequate")}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
            Brightness
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.brightness_score ? quality.brightness_score.toFixed(2) : (isGood ? "Adequate" : "Low")}
          </span>
        </div>
      </div>
    </div>
  );
}
