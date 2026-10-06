"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { BBox } from "@/lib/types";
import { ViewerToolbar } from "@/components/viewer-toolbar";
import { HeatmapOverlay } from "@/components/heatmap-overlay";

interface XrayViewerProps {
  imageUrl: string | null;
  heatmapUrl?: string | null;
  bbox?: BBox | null;
  heatmapAvailable?: boolean;
  showResults?: boolean;
}

export function XrayViewer({
  imageUrl,
  heatmapUrl,
  bbox,
  heatmapAvailable = false,
  showResults = false,
}: XrayViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showBbox, setShowBbox] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.5);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ w: 0, h: 0 });

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    },
    [zoom, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 4));
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    },
    [],
  );

  // Reset view when image changes
  useEffect(() => {
    handleReset();
  }, [imageUrl, handleReset]);

  if (!imageUrl) {
    return (
      <div
        className="rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          background: "var(--lv-viewer-bg)",
          minHeight: showResults ? "460px" : "320px",
        }}
      >
        <div className="text-center">
          <div
            className="flex items-center justify-center h-16 w-16 rounded-2xl mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <svg
              className="h-7 w-7"
              style={{ color: "rgba(255,255,255,0.25)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18M3 3v18"
              />
            </svg>
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            No X-ray loaded
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Upload a chest X-ray to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--lv-viewer-bg)",
        boxShadow: "var(--lv-shadow-md)",
      }}
    >
      {/* Toolbar */}
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        heatmapAvailable={heatmapAvailable}
        showBbox={showBbox}
        onToggleBbox={() => setShowBbox(!showBbox)}
        bboxAvailable={!!bbox}
        heatmapOpacity={heatmapOpacity}
        onOpacityChange={setHeatmapOpacity}
        showResults={showResults}
      />

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden lv-no-select"
        style={{
          height: showResults ? "460px" : "320px",
          cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        role="img"
        aria-label="Chest X-ray viewer"
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isPanning ? "none" : "transform 200ms ease",
          }}
        >
          {/* Base X-ray Image */}
          <img
            src={imageUrl}
            alt="Chest X-ray"
            className="max-w-full max-h-full object-contain"
            draggable={false}
            onLoad={handleImageLoad}
          />

          {/* Heatmap Overlay */}
          {showHeatmap && heatmapAvailable && (
            <HeatmapOverlay
              heatmapUrl={heatmapUrl}
              bbox={bbox}
              opacity={heatmapOpacity}
              imageDimensions={imageDimensions}
            />
          )}

          {/* Bounding Box */}
          {showBbox && bbox && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${(bbox[0] / (imageDimensions.w || 1024)) * 100}%`,
                top: `${(bbox[1] / (imageDimensions.h || 1024)) * 100}%`,
                width: `${((bbox[2] - bbox[0]) / (imageDimensions.w || 1024)) * 100}%`,
                height: `${((bbox[3] - bbox[1]) / (imageDimensions.h || 1024)) * 100}%`,
                border: "2px solid var(--lv-blue-bright)",
                borderRadius: "4px",
                boxShadow: "0 0 8px rgba(59, 130, 246, 0.3)",
              }}
            >
              <span
                className="absolute -top-5 left-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--lv-blue-bright)",
                  color: "white",
                }}
              >
                ROI
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
