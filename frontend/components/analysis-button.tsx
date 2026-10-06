"use client";

import { Sparkles, Loader2 } from "lucide-react";

interface AnalysisButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export function AnalysisButton({
  onClick,
  disabled,
  loading,
}: AnalysisButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="
        w-full flex items-center justify-center gap-2.5
        h-12 rounded-xl text-sm font-semibold text-white
        transition-all duration-200 outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      style={{
        background: disabled ? "var(--lv-muted-light)" : "var(--lv-blue)",
        boxShadow: disabled ? "none" : "var(--lv-shadow-md)",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.background = "var(--lv-blue-hover)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--lv-shadow-blue)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.background = "var(--lv-blue)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--lv-shadow-md)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }
      }}
      aria-label={loading ? "Analyzing X-ray" : "Analyze with LumiVue"}
    >
      {loading ? (
        <>
          <Loader2 className="h-4.5 w-4.5 lv-animate-spin" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4.5 w-4.5" />
          <span>Analyze with LumiVue</span>
        </>
      )}
    </button>
  );
}
