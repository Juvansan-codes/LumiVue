// =============================================================================
// XrayViewer — Displays the uploaded chest X-ray with overlays
// =============================================================================
// Owner: Frontend Member 1 (X-ray viewer)
// TODO: Render uploaded image on canvas
// TODO: Overlay bounding box from image_evidence.bbox
// TODO: Overlay heatmap when image_evidence.heatmap_available
// =============================================================================

"use client";

import React from "react";
import type { ImageEvidence } from "@/lib/types";

interface XrayViewerProps {
  imageSrc?: string | null;
  imageEvidence?: ImageEvidence | null;
}

export default function XrayViewer({ imageSrc, imageEvidence }: XrayViewerProps) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950">
      {imageSrc ? (
        <p className="text-xs text-neutral-500">
          [X-ray preview — viewer to be implemented]
        </p>
      ) : (
        <p className="text-xs text-neutral-600">No image uploaded</p>
      )}
    </div>
  );
}
