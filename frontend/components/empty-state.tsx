"use client";

import { ScanLine, Shield } from "lucide-react";

export function EmptyState() {
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

      {/* Evidence firewall callout footer */}
      <div
        className="mt-2 flex items-center gap-1.5 text-[11px]"
        style={{ color: "var(--lv-muted-light)" }}
      >
        <Shield className="h-3.5 w-3.5 text-orange-600" />
        <span>Multimodal verification with Evidence Firewall active</span>
      </div>
    </div>
  );
}
