// =============================================================================
// LumiVue — Pipeline Steps Configuration
// =============================================================================

import type { PipelineStep } from "./types";

/** Real analysis pipeline steps representing the multi-modal workflow */
export const defaultPipelineSteps: PipelineStep[] = [
  { id: "preprocess", label: "Image preprocessing & DICOM parsing", status: "pending" },
  { id: "assessment", label: "DenseNet-121 pneumonia feature extraction", status: "pending" },
  { id: "localization", label: "Grad-CAM focal ROI localization", status: "pending" },
  { id: "clinical", label: "MedGemma 1.5 clinical context reasoning", status: "pending" },
  { id: "validation", label: "Evidence Firewall verification gate", status: "pending" },
  { id: "opinion", label: "Final clinical second-opinion compilation", status: "pending" },
];
