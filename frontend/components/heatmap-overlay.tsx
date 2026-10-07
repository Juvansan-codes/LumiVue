"use client";

import type { BBox } from "@/lib/types";

interface HeatmapOverlayProps {
  heatmapUrl?: string | null;
  bbox?: BBox | null;
  opacity: number;
  imageDimensions: { w: number; h: number };
}

export function HeatmapOverlay({
  heatmapUrl,
  bbox,
  opacity,
  imageDimensions,
}: HeatmapOverlayProps) {
  if (heatmapUrl) {
    return (
      <img
        src={heatmapUrl}
        alt="Grad-CAM activation heatmap overlay"
        className="absolute inset-0 max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-200"
        style={{ opacity }}
        draggable={false}
      />
    );
  }

  if (bbox) {
    const baseW = imageDimensions.w || 1024;
    const baseH = imageDimensions.h || 1024;

    const left = (bbox[0] / baseW) * 100;
    const top = (bbox[1] / baseH) * 100;
    const width = ((bbox[2] - bbox[0]) / baseW) * 100;
    const height = ((bbox[3] - bbox[1]) / baseH) * 100;

    return (
      <div
        className="absolute pointer-events-none transition-opacity duration-200"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
          background: `radial-gradient(ellipse at center, rgba(239, 68, 68, ${opacity * 0.75}) 0%, rgba(249, 115, 22, ${opacity * 0.45}) 40%, rgba(234, 179, 8, ${opacity * 0.2}) 75%, transparent 100%)`,
          borderRadius: "40%",
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      />
    );
  }

  return null;
}
