"use client";

import {
  Cpu,
  Eye,
  AlertTriangle,
  Stethoscope,
  Network,
  CheckCircle2,
  Workflow,
  Sparkles,
  Lock,
} from "lucide-react";

interface AboutViewProps {
  onNavigateToAnalysis?: () => void;
}

export function AboutView({ onNavigateToAnalysis }: AboutViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Hero Banner */}
      <section
        className="rounded-2xl border p-8 lg:p-10 relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20"
        style={{
          borderColor: "var(--lv-border)",
          boxShadow: "var(--lv-shadow-sm)",
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-white/90 text-orange-700 border-orange-200 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-orange-600" />
            <span>HNX26PSI05 &bull; Multimodal Medical Image Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
            Evidence-Grounded Second-Opinion Assistant for Pneumonia Assessment
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl">
            LumiVue empowers clinicians by cross-verifying deep learning chest X-ray feature maps with patient clinical vitals. Rooted in a strict clinical firewall principle:{" "}
            <span className="font-semibold text-neutral-900">
              No evidence = No finding
            </span>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {onNavigateToAnalysis && (
              <button
                type="button"
                onClick={onNavigateToAnalysis}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 flex items-center gap-2"
                style={{ background: "var(--lv-blue)" }}
              >
                <Stethoscope className="h-4 w-4" />
                <span>Open Diagnostic Workstation</span>
              </button>
            )}
            <div className="px-3.5 py-2 rounded-xl text-xs font-medium border bg-white/80 text-neutral-600 border-neutral-200">
              Prototype &bull; Clinical Decision Support Only
            </div>
          </div>
        </div>

        {/* Ambient subtle decorative circle */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-orange-100/50 pointer-events-none blur-3xl"
          aria-hidden="true"
        />
      </section>

      {/* Core Principles 3-Card Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          className="rounded-xl border bg-white p-6 space-y-3 transition-all hover:shadow-md"
          style={{ borderColor: "var(--lv-border)" }}
        >
          <div
            className="flex items-center justify-center h-10 w-10 rounded-lg text-orange-600"
            style={{ background: "var(--lv-blue-light)" }}
          >
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900">
            Evidence Firewall
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Eliminates hallucinated diagnoses. If Grad-CAM focal activation lacks visual grounding or conflicts with clinical symptoms, findings are rejected or marked unconfirmed.
          </p>
        </div>

        <div
          className="rounded-xl border bg-white p-6 space-y-3 transition-all hover:shadow-md"
          style={{ borderColor: "var(--lv-border)" }}
        >
          <div
            className="flex items-center justify-center h-10 w-10 rounded-lg text-emerald-600"
            style={{ background: "var(--lv-success-light)" }}
          >
            <Network className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900">
            Multimodal Fusion
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Synergizes high-resolution radiograph features from DenseNet-121 with clinical signs (SpO₂, fever, cough severity, symptom onset) processed by MedGemma 1.5 4B.
          </p>
        </div>

        <div
          className="rounded-xl border bg-white p-6 space-y-3 transition-all hover:shadow-md"
          style={{ borderColor: "var(--lv-border)" }}
        >
          <div
            className="flex items-center justify-center h-10 w-10 rounded-lg text-amber-600"
            style={{ background: "var(--lv-warning-light)" }}
          >
            <Eye className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-neutral-900">
            Explainable Overlays
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Generates calibrated Grad-CAM heatmaps and bounding-box regions of interest (ROI) alongside transparent multi-factor confidence scoring.
          </p>
        </div>
      </section>

      {/* Multi-step Architecture Pipeline */}
      <section
        className="rounded-xl border bg-white p-6 sm:p-8 space-y-6"
        style={{ borderColor: "var(--lv-border)", boxShadow: "var(--lv-shadow-sm)" }}
      >
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--lv-border-light)" }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-9 w-9 rounded-lg text-orange-600"
              style={{ background: "var(--lv-blue-light)" }}
            >
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                End-to-End Inference Pipeline
              </h2>
              <p className="text-xs text-neutral-500">
                How LumiVue processes chest radiographs from ingestion to clinical report
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono font-medium px-2.5 py-1 rounded border bg-neutral-50 text-neutral-600 border-neutral-200">
            FastAPI + PyTorch + Next.js
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border bg-neutral-50/60 border-neutral-200/80 space-y-2">
            <div className="text-[11px] font-mono font-bold text-orange-600">STEP 01</div>
            <h3 className="text-xs font-semibold text-neutral-900">Pre-check & Quality</h3>
            <p className="text-[12px] text-neutral-600 leading-relaxed">
              Assesses exposure, blur index, contrast, and anatomical centering before running deep networks.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-neutral-50/60 border-neutral-200/80 space-y-2">
            <div className="text-[11px] font-mono font-bold text-orange-600">STEP 02</div>
            <h3 className="text-xs font-semibold text-neutral-900">DenseNet-121 & Heatmap</h3>
            <p className="text-[12px] text-neutral-600 leading-relaxed">
              Extracts spatial activations and computes Grad-CAM heatmaps with focal bounding boxes.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-neutral-50/60 border-neutral-200/80 space-y-2">
            <div className="text-[11px] font-mono font-bold text-orange-600">STEP 03</div>
            <h3 className="text-xs font-semibold text-neutral-900">Multimodal Alignment</h3>
            <p className="text-[12px] text-neutral-600 leading-relaxed">
              MedGemma 1.5 4B reasons over radiological features together with vital signs and symptom chronology.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-neutral-50/60 border-neutral-200/80 space-y-2">
            <div className="text-[11px] font-mono font-bold text-orange-600">STEP 04</div>
            <h3 className="text-xs font-semibold text-neutral-900">Firewall & Output</h3>
            <p className="text-[12px] text-neutral-600 leading-relaxed">
              Applies safety gates, computes confidence factors, and generates structured clinical findings.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specifications & Clinical Safety Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specifications */}
        <div
          className="rounded-xl border bg-white p-6 space-y-4"
          style={{ borderColor: "var(--lv-border)", boxShadow: "var(--lv-shadow-sm)" }}
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="h-5 w-5 text-orange-600" />
            <h2 className="text-sm font-semibold text-neutral-900">
              System Specifications
            </h2>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-500">Image Classification Backbone</span>
              <span className="font-semibold text-neutral-800">DenseNet-121 (PyTorch)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-500">Multimodal Language Reasoning</span>
              <span className="font-semibold text-neutral-800">MedGemma 1.5 4B</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-500">Visual Localization</span>
              <span className="font-semibold text-neutral-800">Grad-CAM + Automatic Bounding Box</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-500">Input Formats Supported</span>
              <span className="font-semibold text-neutral-800">DICOM (.dcm), PNG, JPEG</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-neutral-500">API Standard</span>
              <span className="font-semibold text-neutral-800">RESTful JSON &bull; OpenAPI Schema</span>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Card */}
        <div
          className="rounded-xl border bg-amber-50/50 p-6 space-y-4 border-amber-200"
          style={{ boxShadow: "var(--lv-shadow-sm)" }}
        >
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <h2 className="text-sm font-semibold">
              Clinical Decision Support Disclaimer
            </h2>
          </div>

          <p className="text-xs text-amber-900/80 leading-relaxed">
            LumiVue is an investigational decision-support prototype created for demonstration and academic evaluation. It is not an FDA-cleared or CE-marked medical device and must never substitute for licensed clinical judgment.
          </p>

          <div className="space-y-2 pt-1 text-xs text-amber-900/90 font-medium">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>All AI-generated impressions require board-certified physician sign-off.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Evidence Firewall actively rejects findings unsupported by radiographic features.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
