"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Info, Check, X } from "lucide-react";

interface EvidenceFirewallProps {
  validation: {
    supported: boolean;
    image_evidence: boolean;
    clinical_evidence: boolean;
  };
}

export function EvidenceFirewall({ validation }: EvidenceFirewallProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isFullySupported = validation.supported;

  return (
    <div
      className="rounded-xl border p-5 relative transition-all duration-200"
      style={{
        background: isFullySupported ? "var(--lv-white)" : "var(--lv-warning-light)",
        borderColor: isFullySupported ? "var(--lv-border)" : "var(--lv-warning)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isFullySupported ? (
            <ShieldCheck
              className="h-4 w-4"
              style={{ color: "var(--lv-blue)" }}
              aria-hidden="true"
            />
          ) : (
            <ShieldAlert
              className="h-4 w-4"
              style={{ color: "var(--lv-warning)" }}
              aria-hidden="true"
            />
          )}
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--lv-muted)" }}
          >
            Evidence Check (Firewall)
          </span>
        </div>

        {/* Info button & tooltip */}
        <div className="relative">
          <button
            type="button"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label="Evidence firewall explanation"
          >
            <Info className="h-3.5 w-3.5" />
          </button>

          {showTooltip && (
            <div
              className="absolute right-0 bottom-full mb-2 w-64 p-3 rounded-lg text-xs z-30 shadow-lg border text-neutral-700 bg-white"
              style={{ borderColor: "var(--lv-border)" }}
            >
              <p className="font-semibold text-neutral-900 mb-1">
                LumiVue Evidence Firewall
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-600">
                LumiVue only surfaces findings that are supported by available image or clinical evidence, guarding against hallucinated AI diagnoses.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Image Evidence */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
          style={{
            background: validation.image_evidence ? "var(--lv-surface-raised)" : "white",
            borderColor: "var(--lv-border)",
          }}
        >
          {validation.image_evidence ? (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-success-light)", color: "var(--lv-success)" }}
            >
              <Check className="h-2.5 w-2.5" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-border-light)", color: "var(--lv-muted)" }}
            >
              <X className="h-2.5 w-2.5" />
            </div>
          )}
          <span className="font-medium text-[11px]" style={{ color: "var(--lv-black)" }}>
            Image evidence present
          </span>
        </div>

        {/* Clinical Evidence */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
          style={{
            background: validation.clinical_evidence ? "var(--lv-surface-raised)" : "white",
            borderColor: "var(--lv-border)",
          }}
        >
          {validation.clinical_evidence ? (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-success-light)", color: "var(--lv-success)" }}
            >
              <Check className="h-2.5 w-2.5" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-border-light)", color: "var(--lv-muted)" }}
            >
              <span className="text-[10px]">•</span>
            </div>
          )}
          <span className="font-medium text-[11px]" style={{ color: "var(--lv-black)" }}>
            Clinical evidence present
          </span>
        </div>

        {/* Finding Supported */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
          style={{
            background: validation.supported ? "var(--lv-blue-light)" : "var(--lv-surface-raised)",
            borderColor: validation.supported ? "var(--lv-blue-muted)" : "var(--lv-border)",
          }}
        >
          {validation.supported ? (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-blue)", color: "white" }}
            >
              <Check className="h-2.5 w-2.5" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-4 w-4 rounded-full shrink-0"
              style={{ background: "var(--lv-warning)", color: "white" }}
            >
              <span className="text-[10px] font-bold">!</span>
            </div>
          )}
          <span
            className="font-medium text-[11px]"
            style={{ color: validation.supported ? "var(--lv-blue)" : "var(--lv-warning)" }}
          >
            Finding supported
          </span>
        </div>
      </div>
    </div>
  );
}
