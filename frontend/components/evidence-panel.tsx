"use client";

import type { AnalysisResponse } from "@/lib/types";
import { EvidenceFirewall } from "@/components/evidence-firewall";
import { ClinicalEvidence } from "@/components/clinical-evidence";
import { ImageQuality } from "@/components/image-quality";
import { Crosshair, Eye, Cpu } from "lucide-react";

interface EvidencePanelProps {
  result: AnalysisResponse;
}

export function EvidencePanel({ result }: EvidencePanelProps) {
  const { image_evidence, clinical_evidence, image_quality, evidence_validation } = result;

  return (
    <div className="space-y-4">
      {/* Evidence Firewall Verification */}
      <EvidenceFirewall validation={evidence_validation} />

      {/* Visual Image Evidence Summary */}
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
            <Eye
              className="h-4 w-4"
              style={{ color: "var(--lv-blue)" }}
              aria-hidden="true"
            />
            <h3
              className="text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--lv-muted)" }}
            >
              Visual Image Evidence
            </h3>
          </div>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded border"
            style={{
              background: "var(--lv-surface-raised)",
              borderColor: "var(--lv-border)",
              color: "var(--lv-black)",
            }}
          >
            {image_evidence.model}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* ROI Coordinates */}
          <div
            className="p-3 rounded-lg border"
            style={{
              background: "var(--lv-surface-raised)",
              borderColor: "var(--lv-border-light)",
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-neutral-400 mb-1">
              <Crosshair className="h-3 w-3" />
              <span>Target Region of Interest</span>
            </div>
            {image_evidence.bbox ? (
              <div>
                <p className="font-mono text-xs font-medium text-neutral-900">
                  [{image_evidence.bbox.join(", ")}]
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Focal opacity coordinates (Xmin, Ymin, Xmax, Ymax)
                </p>
              </div>
            ) : (
              <p className="text-neutral-500 text-xs italic">
                No focal lesion localized
              </p>
            )}
          </div>

          {/* Model Heatmap Attribution */}
          <div
            className="p-3 rounded-lg border"
            style={{
              background: "var(--lv-surface-raised)",
              borderColor: "var(--lv-border-light)",
            }}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-neutral-400 mb-1">
              <Cpu className="h-3 w-3" />
              <span>Attention Attribution</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900 text-xs">
                {image_evidence.heatmap_available ? "Grad-CAM Enabled" : "Not Available"}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: image_evidence.heatmap_available
                    ? "var(--lv-blue-light)"
                    : "var(--lv-border-light)",
                  color: image_evidence.heatmap_available
                    ? "var(--lv-blue)"
                    : "var(--lv-muted)",
                }}
              >
                {image_evidence.heatmap_available ? "Ready" : "None"}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Toggle overlay in viewer toolbar
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Evidence Chips */}
      <ClinicalEvidence evidence={clinical_evidence} />

      {/* Image Quality Assessment */}
      <ImageQuality quality={image_quality} />
    </div>
  );
}
