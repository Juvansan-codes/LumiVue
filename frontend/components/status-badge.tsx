"use client";

import type { Finding, ConfidenceLevel, ImageQualityStatus } from "@/lib/types";

type StatusVariant = "success" | "warning" | "danger" | "info" | "muted";

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: "var(--lv-success-light)",
    text: "var(--lv-success)",
    dot: "var(--lv-success)",
  },
  warning: {
    bg: "var(--lv-warning-light)",
    text: "var(--lv-warning)",
    dot: "var(--lv-warning)",
  },
  danger: {
    bg: "var(--lv-danger-light)",
    text: "var(--lv-danger)",
    dot: "var(--lv-danger)",
  },
  info: {
    bg: "var(--lv-blue-light)",
    text: "var(--lv-blue)",
    dot: "var(--lv-blue)",
  },
  muted: {
    bg: "var(--lv-border-light)",
    text: "var(--lv-muted)",
    dot: "var(--lv-muted)",
  },
};

export function StatusBadge({
  variant,
  label,
  dot = true,
  className = "",
}: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
      }}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: styles.dot }}
        />
      )}
      {label}
    </span>
  );
}

/** Map Finding to StatusBadge props */
export function findingToBadge(finding: Finding): {
  variant: StatusVariant;
  label: string;
} {
  switch (finding) {
    case "suspected_pneumonia":
      return { variant: "warning", label: "Evidence supported" };
    case "no_pneumonia_detected":
      return { variant: "success", label: "No findings" };
    case "inconclusive":
      return { variant: "muted", label: "Insufficient evidence" };
    case "rejected":
      return { variant: "danger", label: "Image rejected" };
  }
}

/** Map Confidence to StatusBadge props */
export function confidenceToBadge(confidence: ConfidenceLevel): {
  variant: StatusVariant;
  label: string;
} {
  switch (confidence) {
    case "high":
      return { variant: "success", label: "High" };
    case "moderate":
      return { variant: "warning", label: "Moderate" };
    case "low":
      return { variant: "danger", label: "Low" };
  }
}

/** Map ImageQuality to StatusBadge props */
export function qualityToBadge(quality: ImageQualityStatus): {
  variant: StatusVariant;
  label: string;
} {
  switch (quality) {
    case "good":
      return { variant: "success", label: "Good" };
    case "acceptable":
      return { variant: "muted", label: "Acceptable" };
    case "poor":
      return { variant: "warning", label: "Low quality" };
    case "rejected":
      return { variant: "danger", label: "Rejected" };
  }
}
