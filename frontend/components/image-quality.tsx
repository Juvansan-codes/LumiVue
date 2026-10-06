"use client";

import type { ImageQualityInfo } from "@/lib/types";
import { CheckCircle2, AlertTriangle, XCircle, Sliders } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

interface ImageQualityProps {
  quality: ImageQualityInfo;
}

export function ImageQuality({ quality }: ImageQualityProps) {
  const isGood = quality.status === "good";
  const isPoor = quality.status === "poor" || quality.status === "rejected";

  const getStatusBadge = () => {
    switch (quality.status) {
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
            Sharpness
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.sharpness || (isGood ? "Good" : "Sub-optimal")}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
            Contrast
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.contrast || (isGood ? "Good" : "Adequate")}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
          <span className="text-[10px] text-neutral-400 block uppercase font-semibold">
            Resolution
          </span>
          <span className="text-xs font-medium text-neutral-800">
            {quality.resolution || (isGood ? "Adequate" : "Low")}
          </span>
        </div>
      </div>
    </div>
  );
}
