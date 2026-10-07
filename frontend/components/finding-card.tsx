"use client";

import type { AnalysisResponse, Finding } from "@/lib/types";
import { formatScore } from "@/lib/utils";
import { StatusBadge, findingToBadge } from "@/components/status-badge";
import { AlertCircle, CheckCircle2, HelpCircle, XOctagon, BrainCircuit } from "lucide-react";

interface FindingCardProps {
  result: AnalysisResponse;
}

export function FindingCard({ result }: FindingCardProps) {
  const findingBadge = findingToBadge(result.finding);

  const getFindingDisplay = (finding: Finding) => {
    switch (finding) {
      case "suspected_pneumonia":
        return {
          title: "SUSPECTED PNEUMONIA",
          subtitle: "Multimodal indicators suggestive of focal pulmonary opacity",
          icon: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
          accentBg: "var(--lv-warning-light)",
          accentBorder: "rgba(245, 158, 11, 0.2)",
          titleColor: "#B45309",
        };
      case "no_pneumonia_detected":
        return {
          title: "NO PNEUMONIA DETECTED",
          subtitle: "No significant focal opacities or consolidated infiltrates identified",
          icon: <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />,
          accentBg: "var(--lv-success-light)",
          accentBorder: "rgba(22, 163, 74, 0.2)",
          titleColor: "#15803D",
        };
      case "inconclusive":
        return {
          title: "INCONCLUSIVE",
          subtitle: "Equivocal radiographic pattern or conflicting clinical data",
          icon: <HelpCircle className="h-5 w-5 text-neutral-500 shrink-0" />,
          accentBg: "var(--lv-surface-raised)",
          accentBorder: "var(--lv-border)",
          titleColor: "var(--lv-black)",
        };
      case "rejected":
        return {
          title: "REJECTED",
          subtitle: "Sub-diagnostic image quality or technical artifact prevents analysis",
          icon: <XOctagon className="h-5 w-5 text-red-600 shrink-0" />,
          accentBg: "var(--lv-danger-light)",
          accentBorder: "rgba(220, 38, 38, 0.2)",
          titleColor: "#B91C1C",
        };
    }
  };

  const display = getFindingDisplay(result.finding);

  return (
    <div
      className="rounded-xl border bg-white p-6 transition-all duration-200"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit
            className="h-4 w-4"
            style={{ color: "var(--lv-blue)" }}
            aria-hidden="true"
          />
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Radiological AI Evaluation
          </span>
        </div>
        <StatusBadge
          variant={findingBadge.variant}
          label={findingBadge.label}
        />
      </div>

      {/* Main Finding Banner */}
      <div
        className="rounded-xl p-4 border mb-5 flex items-start gap-3"
        style={{
          background: display.accentBg,
          borderColor: display.accentBorder,
        }}
      >
        {display.icon}
        <div>
          <h2
            className="text-lg font-bold tracking-tight uppercase"
            style={{ color: display.titleColor }}
          >
            {display.title}
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            {display.subtitle}
          </p>
        </div>
      </div>

      {/* Model Score Metric */}
      <div
        className="rounded-xl p-4 border"
        style={{
          background: "var(--lv-surface-raised)",
          borderColor: "var(--lv-border-light)",
        }}
      >
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span
              className="text-[10px] font-semibold tracking-wider uppercase block"
              style={{ color: "var(--lv-muted)" }}
            >
              Model Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className="text-3xl font-bold font-mono tracking-tight"
                style={{ color: "var(--lv-black)" }}
              >
                {formatScore(result.model_score)}
              </span>
              <span className="text-xs text-neutral-400">/ 1.00</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className="text-[10px] font-semibold tracking-wider uppercase block"
              style={{ color: "var(--lv-muted)" }}
            >
              Architecture
            </span>
            <span className="text-xs font-medium text-neutral-800 mt-0.5 block">
              {result.image_evidence.model}
            </span>
          </div>
        </div>

        {/* Essential Clinical UX Disclaimer */}
        <p
          className="text-[11px] pt-2.5 border-t text-neutral-500 leading-normal"
          style={{ borderColor: "var(--lv-border)" }}
        >
          <strong>Notice:</strong> Model output score — not a clinically calibrated probability.
          Do not interpret as percentage likelihood of disease.
        </p>
      </div>
    </div>
  );
}
