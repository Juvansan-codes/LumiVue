"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <div
      className="rounded-xl border bg-white p-8 text-center flex flex-col items-center justify-center min-h-[400px] transition-all duration-200"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
      role="alert"
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
        style={{ background: "var(--lv-danger-light)" }}
      >
        <AlertTriangle
          className="h-7 w-7"
          style={{ color: "var(--lv-danger)" }}
          aria-hidden="true"
        />
      </div>

      {/* Heading */}
      <h3
        className="text-lg font-semibold tracking-tight mb-2"
        style={{ color: "var(--lv-black)" }}
      >
        Analysis could not be completed
      </h3>

      {/* Description */}
      <p
        className="text-sm max-w-sm mb-6 leading-relaxed"
        style={{ color: "var(--lv-muted)" }}
      >
        {message || "We couldn't reliably process this image. Please verify that the X-ray is valid, uncorrupted, and try again."}
      </p>

      {/* Retry Action */}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200"
        style={{
          background: "var(--lv-blue)",
          boxShadow: "var(--lv-shadow-sm)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--lv-blue-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--lv-blue)";
        }}
      >
        <RefreshCw className="h-4 w-4" />
        <span>Try Again</span>
      </button>

      {/* Guidance */}
      <p
        className="mt-6 text-[11px]"
        style={{ color: "var(--lv-muted-light)" }}
      >
        Acceptable formats: Standard DICOM (.dcm), PNG, or high-resolution JPEG.
      </p>
    </div>
  );
}
