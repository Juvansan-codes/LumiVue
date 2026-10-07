"use client";

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Square,
} from "lucide-react";

interface ViewerToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  heatmapAvailable: boolean;
  showBbox: boolean;
  onToggleBbox: () => void;
  bboxAvailable: boolean;
  heatmapOpacity: number;
  onOpacityChange: (v: number) => void;
  showResults: boolean;
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center h-7 w-7 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: active ? "var(--lv-blue)" : "rgba(255,255,255,0.08)",
        color: active ? "white" : "rgba(255,255,255,0.6)",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
        }
      }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function ViewerToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  showHeatmap,
  onToggleHeatmap,
  heatmapAvailable,
  showBbox,
  onToggleBbox,
  bboxAvailable,
  heatmapOpacity,
  onOpacityChange,
  showResults,
}: ViewerToolbarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Left: Zoom Controls */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onZoomOut} label="Zoom out" disabled={zoom <= 0.5}>
          <ZoomOut className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span
          className="text-[11px] font-mono min-w-[40px] text-center"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton onClick={onZoomIn} label="Zoom in" disabled={zoom >= 4}>
          <ZoomIn className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={onReset} label="Reset view">
          <RotateCcw className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Right: Overlay Controls */}
      {showResults && (
        <div className="flex items-center gap-1.5">
          {/* Heatmap Opacity */}
          {showHeatmap && heatmapAvailable && (
            <div className="flex items-center gap-1.5 mr-1">
              <span
                className="text-[10px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Opacity
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={heatmapOpacity * 100}
                onChange={(e) =>
                  onOpacityChange(Number(e.target.value) / 100)
                }
                className="w-16 h-1 appearance-none rounded-full cursor-pointer"
                style={{ background: "rgba(255,255,255,0.2)" }}
                aria-label="Heatmap opacity"
              />
            </div>
          )}

          <ToolbarButton
            onClick={onToggleHeatmap}
            active={showHeatmap}
            disabled={!heatmapAvailable}
            label="Toggle heatmap"
          >
            <Layers className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={onToggleBbox}
            active={showBbox}
            disabled={!bboxAvailable}
            label="Toggle evidence region"
          >
            <Square className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
