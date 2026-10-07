"use client";

import { useState, useCallback } from "react";
import type {
  AnalysisResponse,
  AppState,
  PatientContext,
  PipelineStep,
} from "@/lib/types";
import { analyzeXray } from "@/lib/api";
import { defaultPipelineSteps } from "@/lib/pipeline";
import {
  saveAnalysisToSupabase,
  fetchCaseHistoryFromSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { AuthGuard } from "@/components/auth-guard";
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
import { Sidebar, type ActiveTab } from "@/components/sidebar";
import { AboutView } from "@/components/about-view";
import {
  RotateCcw,
  FileDown,
  Activity,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
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
  // Navigation State: 'about' is the main content page by default
  const [activeTab, setActiveTab] = useState<ActiveTab>("about");
  const [appState, setAppState] = useState<AppState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientContext, setPatientContext] = useState<PatientContext>(initialPatientContext);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(defaultPipelineSteps);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historicalCases, setHistoricalCases] = useState<AnalysisResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load past cases from Supabase when switching to history tab
  const loadHistory = useCallback(async () => {
    if (isSupabaseConfigured) {
      setLoadingHistory(true);
      const cases = await fetchCaseHistoryFromSupabase();
      setHistoricalCases(cases);
      setLoadingHistory(false);
    }
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "history") {
      void loadHistory();
    }
  }, [loadHistory]);

  // Handle file selection from disk
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
  }, []);

  // Preset action helper
  const handleLoadSample = useCallback((preset: "positive" | "negative") => {
    if (preset === "positive") {
      setPreviewUrl("/samples/cxr-sample-pneumonia.svg");
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
    setPipelineSteps(defaultPipelineSteps.map((s) => ({ ...s, status: "pending" })));
  }, []);

  // Run the analysis pipeline (Calls real FastAPI backend and logs to Supabase)
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile && !previewUrl) return;

    setAppState("analyzing");
    setErrorMessage(null);

    try {
      const fileToSend =
        selectedFile ??
        new File(["dummy"], "cxr_scan.png", { type: "image/png" });

      const result = await analyzeXray(
        fileToSend,
        patientContext,
        (updatedSteps) => {
          setPipelineSteps([...updatedSteps]);
        },
      );

      setAnalysisResult(result);
      setAppState("complete");

      // Asynchronously persist analysis into Supabase database if connected
      if (isSupabaseConfigured) {
        void saveAnalysisToSupabase(result, patientContext, previewUrl ?? undefined);
      }
    } catch (err: unknown) {
      console.error("Analysis pipeline failure:", err);
      setAppState("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Backend service unreachable at http://localhost:8000. Ensure the FastAPI server is running.",
      );
    }
  }, [selectedFile, previewUrl, patientContext]);

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
    <AuthGuard>
    <div className="flex h-screen w-full bg-neutral-50/60 overflow-hidden">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        {/* Top Header / Context Bar */}
        <header
          className="border-b bg-white px-6 lg:px-8 py-3.5 sticky top-0 z-20 shrink-0"
          style={{ borderColor: "var(--lv-border)" }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center h-8 w-8 rounded-lg"
                style={{ background: "var(--lv-blue-light)" }}
              >
                {activeTab === "about" ? (
                  <Info
                    className="h-4 w-4"
                    style={{ color: "var(--lv-blue)" }}
                    aria-hidden="true"
                  />
                ) : activeTab === "history" ? (
                  <Clock
                    className="h-4 w-4"
                    style={{ color: "var(--lv-blue)" }}
                    aria-hidden="true"
                  />
                ) : (
                  <Activity
                    className="h-4 w-4"
                    style={{ color: "var(--lv-blue)" }}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-sm font-semibold tracking-tight"
                    style={{ color: "var(--lv-black)" }}
                  >
                    {activeTab === "about"
                      ? "About LumiVue & System Architecture"
                      : activeTab === "history"
                      ? "Case History & Past Diagnostic Records"
                      : "Chest Radiograph Pneumonia Assessment"}
                  </h1>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded border"
                    style={{
                      background: "var(--lv-surface-raised)",
                      borderColor: "var(--lv-border)",
                      color: "var(--lv-muted)",
                    }}
                  >
                    {activeTab === "about"
                      ? "Evidence-Grounded"
                      : activeTab === "history"
                      ? "Encrypted Logs"
                      : "PA View • Multimodal"}
                  </span>
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--lv-muted)" }}
                >
                  {activeTab === "about"
                    ? "Clinical decision-support overview, multimodal pipeline design, and Evidence Firewall guarantees"
                    : activeTab === "history"
                    ? "Review audited case evaluations, heatmaps, and past physician sign-offs"
                    : "Evidence-grounded second-opinion assistance with automated Evidence Firewall verification"}
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2.5">
              {activeTab === "about" && (
                <button
                  type="button"
                  onClick={() => handleTabChange("analysis")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors hover:opacity-95"
                  style={{ background: "var(--lv-blue)" }}
                >
                  <span>Launch Diagnostic Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {activeTab === "analysis" && (
                <>
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
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Workstation Layout */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* VIEW A: ABOUT PAGE (Default Main Content Page) */}
          {activeTab === "about" && (
            <AboutView onNavigateToAnalysis={() => handleTabChange("analysis")} />
          )}

          {/* VIEW B: DIAGNOSTIC ANALYSIS WORKSTATION */}
          {activeTab === "analysis" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
              {/* LEFT COLUMN: Radiological Imaging & Diagnostic Viewer (7 cols) */}
              <section className="lg:col-span-7 space-y-5" aria-label="X-ray Viewer and Image Controls">
                <div className="relative">
                  <XrayViewer
                    imageUrl={previewUrl}
                    heatmapUrl={analysisResult?.image_evidence.heatmap_available ? previewUrl : null}
                    bbox={analysisResult?.image_evidence.bbox ?? null}
                    heatmapAvailable={analysisResult?.image_evidence.heatmap_available ?? false}
                    showResults={appState === "complete"}
                  />
                </div>

                <UploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClear={handleClear}
                  previewUrl={previewUrl}
                  onLoadPreset={handleLoadSample}
                />

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

              {/* RIGHT COLUMN: Patient Context, Analysis & Results (5 cols) */}
              <section className="lg:col-span-5 space-y-5" aria-label="Patient Context and Results Panel">
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

                {appState === "error" && (
                  <ErrorState
                    onRetry={handleAnalyze}
                    message={errorMessage ?? undefined}
                  />
                )}

                {appState === "complete" && analysisResult && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <FindingCard result={analysisResult} />
                    <ConfidenceCard
                      confidence={analysisResult.confidence}
                      factors={analysisResult.confidence_factors}
                    />
                    <AiExplanation explanation={analysisResult.explanation} />
                    <EvidencePanel result={analysisResult} />
                    <SafetyDisclaimer />

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
          )}

          {/* VIEW C: CASE HISTORY */}
          {activeTab === "history" && (
            <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
              <div
                className="rounded-xl border bg-white p-6 flex items-center justify-between"
                style={{ borderColor: "var(--lv-border)" }}
              >
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">
                    Diagnostic Session Records
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Past chest radiograph evaluations and structured findings stored in database
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange("analysis")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs"
                  style={{ background: "var(--lv-blue)" }}
                >
                  Start New Analysis
                </button>
              </div>

              {loadingHistory ? (
                <div className="rounded-xl border bg-white p-12 text-center text-xs text-neutral-500">
                  Loading records from Supabase...
                </div>
              ) : historicalCases.length > 0 || analysisResult ? (
                <div className="space-y-3">
                  {(historicalCases.length > 0
                    ? historicalCases
                    : analysisResult
                    ? [analysisResult]
                    : []
                  ).map((c) => (
                    <div
                      key={c.analysis_id}
                      className="rounded-xl border bg-white p-5 space-y-3"
                      style={{ borderColor: "var(--lv-border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-neutral-500">
                          Case #{c.analysis_id.slice(0, 8)}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            c.finding === "suspected_pneumonia"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {c.finding === "suspected_pneumonia"
                            ? "Suspected Pneumonia"
                            : c.finding === "no_pneumonia_detected"
                            ? "No Pneumonia Detected"
                            : c.finding}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {c.explanation}
                      </p>
                      <div className="pt-2 flex items-center justify-between border-t border-neutral-100 text-[11px] text-neutral-500">
                        <span>Confidence: {c.confidence.toUpperCase()}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAnalysisResult(c);
                            setAppState("complete");
                            handleTabChange("analysis");
                          }}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          View in Workstation &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl border bg-white p-12 text-center"
                  style={{ borderColor: "var(--lv-border)" }}
                >
                  <Clock className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-neutral-800">
                    No Recorded Cases Yet
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                    Assess an X-ray in the Diagnostic Analysis tab to record and persist structured audit reports.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange("analysis")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "var(--lv-blue)" }}
                  >
                    Go to Analysis
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
