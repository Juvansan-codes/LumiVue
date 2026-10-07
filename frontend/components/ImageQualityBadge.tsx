// =============================================================================
// ImageQualityBadge — Displays the image quality assessment
// =============================================================================
// Owner: Frontend Member 2 (Result screen)
// TODO: Add warning icon for poor/rejected quality
// =============================================================================

"use client";

import React from "react";
import type { ImageQuality } from "@/lib/types";

interface ImageQualityBadgeProps {
  quality?: ImageQuality | null;
}

const colorMap: Record<ImageQuality["quality"], string> = {
  good: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  acceptable: "bg-sky-600/20 text-sky-400 border-sky-600/30",
  poor: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  rejected: "bg-red-600/20 text-red-400 border-red-600/30",
};

export default function ImageQualityBadge({ quality }: ImageQualityBadgeProps) {
  if (!quality) return null;

  const q = quality.quality;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colorMap[q]}`}
    >
      Image: {q.charAt(0).toUpperCase() + q.slice(1)}
    </span>
  );
}
