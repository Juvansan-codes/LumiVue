// =============================================================================
// LumiVue — Home Page
// =============================================================================
// This is the placeholder landing page.
// Frontend Members 1 & 2 will build the full UI here.
// =============================================================================

import ImageUploader from "@/components/ImageUploader";
import PatientContextForm from "@/components/PatientContextForm";
import AnalyzeButton from "@/components/AnalyzeButton";
import XrayViewer from "@/components/XrayViewer";
import AnalysisResult from "@/components/AnalysisResult";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
          Lumi<span className="text-cyan-400">Vue</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Evidence-Grounded Multimodal Pneumonia Intelligence
        </p>
        <p className="mt-1 text-xs text-neutral-600">
          Decision-support prototype — not a medical device
        </p>
      </header>

      {/* Two-column layout placeholder */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Upload & Context */}
        <section className="space-y-6">
          <ImageUploader />
          <PatientContextForm />
          <AnalyzeButton />
        </section>

        {/* Right: Viewer & Results */}
        <section className="space-y-6">
          <XrayViewer />
          <AnalysisResult />
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-xs text-neutral-600">
        LumiVue v0.1.0 &middot; Hackathon Prototype &middot; Requires clinician review
      </footer>
    </main>
  );
}
