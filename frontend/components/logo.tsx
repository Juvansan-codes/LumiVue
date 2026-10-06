"use client";

/**
 * LumiVue Logo — Abstract "L" with a subtle medical/vision motif.
 * Uses a clean geometric design suggesting light, vision, and imaging.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Abstract L shape with vision/scanning motif */}
        <rect x="4" y="4" width="6" height="24" rx="2" fill="#2563FF" />
        <rect x="4" y="22" width="20" height="6" rx="2" fill="#2563FF" />
        {/* Vision/scan circle — represents imaging */}
        <circle
          cx="22"
          cy="12"
          r="6"
          stroke="#2563FF"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        {/* Center dot — focal point */}
        <circle cx="22" cy="12" r="2" fill="#2563FF" opacity="0.8" />
      </svg>
      <div className="flex flex-col">
        <span
          className="text-lg font-semibold tracking-tight leading-none"
          style={{ color: "var(--lv-black)" }}
        >
          Lumi<span style={{ color: "var(--lv-blue)" }}>Vue</span>
        </span>
        <span
          className="text-[10px] font-medium tracking-wide uppercase leading-none mt-0.5"
          style={{ color: "var(--lv-muted)" }}
        >
          Medical Image Intelligence
        </span>
      </div>
    </div>
  );
}
