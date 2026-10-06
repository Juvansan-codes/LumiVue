"use client";

import { ShieldCheck } from "lucide-react";

export function SafetyDisclaimer() {
  return (
    <div
      className="rounded-xl border p-4 text-center transition-all duration-200"
      style={{
        background: "var(--lv-surface-raised)",
        borderColor: "var(--lv-border)",
      }}
      role="note"
      aria-label="Clinical Safety Disclaimer"
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <ShieldCheck
          className="h-4 w-4"
          style={{ color: "var(--lv-muted)" }}
          aria-hidden="true"
        />
        <span
          className="text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--lv-muted)" }}
        >
          Clinical Decision Support Notice
        </span>
      </div>
      <p
        className="text-xs leading-relaxed max-w-xl mx-auto"
        style={{ color: "var(--lv-muted)" }}
      >
        <strong className="font-semibold text-neutral-800">AI decision support only.</strong>{" "}
        LumiVue does not provide a definitive diagnosis and is not a replacement for qualified clinical judgment.
        All radiographic findings and interpretations must be reviewed and verified by a licensed healthcare professional.
      </p>
    </div>
  );
}
