"use client";

import { useState, useCallback } from "react";
import type {
  AnalysisResponse,
  AppState,
  PatientContext,
  PipelineStep,
} from "@/lib/types";
import { analyzeXray } from "@/lib/api";
import { mockPipelineSteps, mockNegativeResponse, mockAnalysisResponse } from "@/lib/mock-data";
import { XrayViewer } from "@/components/xray-viewer";
import { UploadZone } from "@/components/upload-zone";
import { PatientContextForm } from "@/components/patient-context-form";
import { AnalysisButton } from "@/components/analysis-button";
import { AnalysisProgress } from "@/components/analysis-progress";
import { FindingCard } from "@/components/finding-card";
import { ConfidenceCard } from "@/components/confidence-card";
import { AiExplanation } from "@/components/ai-explanation";
import { EvidencePanel } from "@/components/evidence-panel";
import { SafetyDisclaimer } from "@/components/safety-disclaimer";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import {
  RotateCcw,
  FileDown,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

const initialPatientContext: PatientContext = {
  age: "",
  sex: "",
  spo2: "",
  temperature: "",
  symptom_duration: "",
  symptoms: [],
  clinical_notes: "",
};

export default function HomePage() {
  // Application State
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientContext, setPatientContext] = useState<PatientContext>(initialPatientContext);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(mockPipelineSteps);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCaseType, setActiveCaseType] = useState<"positive" | "negative" | "custom">("custom");

  // Handle file selection from disk
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setActiveCaseType("custom");
    if (appState === "complete" || appState === "error") {
      setAppState("idle");
      setAnalysisResult(null);
    }
  }, [appState]);

  // Handle clearing current image
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAppState("idle");
    setAnalysisResult(null);
    setErrorMessage(null);
    setActiveCaseType("custom");
  }, []);

  // Load interactive demo presets
  const handleLoadSample = useCallback((preset: "positive" | "negative") => {
    setActiveCaseType(preset);
    if (preset === "positive") {
      setPreviewUrl("/samples/cxr-sample-pneumonia.svg");
      // Create simulated File object for the pipeline
      const file = new File(["sample"], "case_0492_radiograph_pa.dcm", {
        type: "application/dicom",
      });
      setSelectedFile(file);
      setPatientContext({
        age: "64",
        sex: "male",
        spo2: "92%",
        temperature: "38.6",
        symptom_duration: "4 days",
        symptoms: ["Fever", "Productive Cough", "Shortness of Breath"],
        clinical_notes:
          "64yo male presents with worsening productive cough with purulent sputum, chills, and fever. Decreased breath sounds at right lung base.",
      });
    } else {
      setPreviewUrl("/samples/cxr-sample-normal.svg");
      const file = new File(["sample_normal"], "case_0118_radiograph_pa.dcm", {
        type: "application/dicom",
      });
      setSelectedFile(file);
      setPatientContext({
        age: "32",
        sex: "female",
        spo2: "99%",
        temperature: "36.8",
        symptom_duration: "",
        symptoms: [],
        clinical_notes:
          "Routine pre-operative pulmonary assessment. Patient asymptomatic, clear bilateral lung fields on physical examination.",
      });
    }
    setAppState("idle");
    setAnalysisResult(null);
    setErrorMessage(null);
  }, []);

  // Reset entire analysis workspace
  const handleResetWorkspace = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPatientContext(initialPatientContext);
    setAppState("idle");
    setAnalysisResult(null);
    setErrorMessage(null);
    setPipelineSteps(mockPipelineSteps.map((s) => ({ ...s, status: "pending" })));
    setActiveCaseType("custom");
  }, []);

  // Run the analysis pipeline
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile && !previewUrl) return;

    setAppState("analyzing");
    setErrorMessage(null);

    try {
      // If we don't have a real file object (e.g. loaded preset URL), supply a fallback
      const fileToSend =
        selectedFile ??
        new File(["dummy"], "sample_xray.png", { type: "image/png" });

      const result = await analyzeXray(
        fileToSend,
        patientContext,
        (updatedSteps) => {
          setPipelineSteps([...updatedSteps]);
        },
      );

      // If negative case was explicitly selected, return appropriate negative clinical payload
      if (activeCaseType === "negative") {
        setAnalysisResult(mockNegativeResponse);
      } else {
        // Customize clinical evidence chips from patient context if filled
        const activeEvidenceChips: string[] = [];
        if (patientContext.symptoms.length > 0) {
          activeEvidenceChips.push(...patientContext.symptoms);
        }
        if (patientContext.spo2) {
          activeEvidenceChips.push(`SpO₂ ${patientContext.spo2.replace(/[^0-9]/g, "")}%`);
        }
        if (patientContext.temperature) {
          activeEvidenceChips.push(`Temp ${patientContext.temperature}°C`);
        }

        const adaptedResult: AnalysisResponse = {
          ...result,
          clinical_evidence:
            activeEvidenceChips.length > 0
              ? activeEvidenceChips
              : result.clinical_evidence,
          evidence_validation: {
            ...result.evidence_validation,
            clinical_evidence: activeEvidenceChips.length > 0,
          },
        };

        setAnalysisResult(adaptedResult);
      }

      setAppState("complete");
    } catch (err: unknown) {
      console.error("Analysis pipeline failure:", err);
      setAppState("error");
      setErrorMessage(
        "LumiVue could not process the submitted radiographic file. Please verify DICOM compliance or image resolution and try again.",
      );
    }
  }, [selectedFile, previewUrl, patientContext, activeCaseType]);

  // Export report handler
  const handleExportReport = useCallback(() => {
    if (!analysisResult) return;
    const reportData = {
      platform: "LumiVue Medical AI",
      timestamp: new Date().toISOString(),
      analysis: analysisResult,
      patient_context: patientContext,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumivue-report-${analysisResult.analysis_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysisResult, patientContext]);

  return (
    <div className="min-h-[calc(100vh-68px)] bg-neutral-50/60 pb-16">
      {/* Subheader / Workstation Context Bar */}
      <header
        className="border-b bg-white px-6 lg:px-8 py-3.5 sticky top-[68px] z-40 transition-colors"
        style={{ borderColor: "var(--lv-border)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg"
              style={{ background: "var(--lv-blue-light)" }}
            >
              <Activity
                className="h-4 w-4"
                style={{ color: "var(--lv-blue)" }}
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: "var(--lv-black)" }}
                >
                  Chest Radiograph Pneumonia Assessment
                </h1>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    background: "var(--lv-surface-raised)",
                    borderColor: "var(--lv-border)",
                    color: "var(--lv-muted)",
                  }}
                >
                  PA View &bull; Multimodal
                </span>
              </div>
              <p
                className="text-[11px]"
                style={{ color: "var(--lv-muted)" }}
              >
                Evidence-grounded second-opinion assistance with automated Evidence Firewall verification
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2.5">
            {appState === "complete" && (
              <button
                type="button"
                onClick={handleExportReport}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                style={{ borderColor: "var(--lv-border)" }}
                aria-label="Export structured JSON report"
              >
                <FileDown className="h-3.5 w-3.5 text-neutral-500" />
                <span>Export Report</span>
              </button>
            )}

            {(previewUrl || appState !== "idle") && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-neutral-600 bg-white hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                style={{ borderColor: "var(--lv-border)" }}
                aria-label="Reset workstation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset View</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workstation Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: Radiological Imaging & Diagnostic Viewer (7 cols) */}
          {/* ============================================================ */}
          <section className="lg:col-span-7 space-y-5" aria-label="X-ray Viewer and Image Controls">
            {/* Chest X-ray Viewer Workstation */}
            <div className="relative">
              <XrayViewer
                imageUrl={previewUrl}
                bbox={analysisResult?.image_evidence.bbox ?? null}
                heatmapAvailable={analysisResult?.image_evidence.heatmap_available ?? false}
                showResults={appState === "complete"}
              />
            </div>

            {/* Upload Zone & Quick Sample Triggers */}
            <UploadZone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={handleClear}
              previewUrl={previewUrl}
              onLoadPreset={handleLoadSample}
            />

            {/* Quick Diagnostic Instructions Card */}
            <div
              className="rounded-xl border bg-white p-4 text-xs"
              style={{
                borderColor: "var(--lv-border)",
                boxShadow: "var(--lv-shadow-sm)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-neutral-600">
                  <p className="font-medium text-neutral-900">
                    Clinical Workstation Guidance
                  </p>
                  <p className="leading-relaxed">
                    Examine radiological findings in conjunction with clinical vitals. Use toolbar zoom, pan, and Grad-CAM layer controls to inspect focal infiltrates and anatomical margins.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: Patient Context, Analysis & Results (5 cols)   */}
          {/* ============================================================ */}
          <section className="lg:col-span-5 space-y-5" aria-label="Patient Context and Results Panel">
            
            {/* 1. IDLE STATE: Form + Action + Empty Guidance */}
            {appState === "idle" && (
              <>
                <PatientContextForm
                  value={patientContext}
                  onChange={setPatientContext}
                />

                <div className="pt-1">
                  <AnalysisButton
                    onClick={handleAnalyze}
                    disabled={!previewUrl}
                    loading={false}
                  />
                  {!previewUrl && (
                    <p
                      className="text-center text-[11px] mt-2"
                      style={{ color: "var(--lv-muted)" }}
                    >
                      Please upload or select a chest X-ray to initiate analysis
                    </p>
                  )}
                </div>

                <EmptyState onLoadSample={handleLoadSample} />
              </>
            )}

            {/* 2. ANALYZING STATE: Live Pipeline Steps */}
            {appState === "analyzing" && (
              <div className="space-y-4">
                <AnalysisProgress steps={pipelineSteps} />
                
                <div
                  className="rounded-xl border bg-white p-6 text-center"
                  style={{
                    borderColor: "var(--lv-border)",
                    boxShadow: "var(--lv-shadow-sm)",
                  }}
                >
                  <Sparkles
                    className="h-6 w-6 mx-auto mb-2"
                    style={{ color: "var(--lv-blue)" }}
                  />
                  <h4 className="text-sm font-semibold text-neutral-900">
                    Multimodal Inference In Progress
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                    DenseNet-121 image feature maps are being cross-referenced against patient clinical vitals and past medical patterns.
                  </p>
                </div>
              </div>
            )}

            {/* 3. ERROR STATE */}
            {appState === "error" && (
              <ErrorState
                onRetry={handleAnalyze}
                message={errorMessage ?? undefined}
              />
            )}

            {/* 4. COMPLETE STATE: Evidence-Grounded Results */}
            {appState === "complete" && analysisResult && (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Primary AI Finding & Model Score */}
                <FindingCard result={analysisResult} />

                {/* Multimodal Confidence Assessment Card */}
                <ConfidenceCard
                  confidence={analysisResult.confidence}
                  factors={analysisResult.confidence_factors}
                />

                {/* Clinician Narrative AI Explanation */}
                <AiExplanation explanation={analysisResult.explanation} />

                {/* Integrated Evidence Panel (Firewall + Visual ROI + Clinical Chips + Quality) */}
                <EvidencePanel result={analysisResult} />

                {/* Mandatory Clinical Decision Support Disclaimer */}
                <SafetyDisclaimer />

                {/* Bottom Action Bar */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetWorkspace}
                    className="flex-1 py-3 px-4 rounded-xl border text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors text-center"
                    style={{ borderColor: "var(--lv-border)" }}
                  >
                    Analyze Another Case
                  </button>

                  <button
                    type="button"
                    onClick={handleExportReport}
                    className="py-3 px-4 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: "var(--lv-blue)",
                      boxShadow: "var(--lv-shadow-sm)",
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Save Report</span>
                  </button>
                </div>
              </div>
            )}

          </section>

        </div>
      </main>
    </div>
  );
}
