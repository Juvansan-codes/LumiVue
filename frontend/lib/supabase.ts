import { createClient } from "@supabase/supabase-js";
import type { AnalysisResponse, PatientContext } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-project-ref");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Saves a completed diagnostic analysis and patient context to Supabase
 */
export async function saveAnalysisToSupabase(
  analysis: AnalysisResponse,
  patientContext?: PatientContext,
  imageUrl?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: "Supabase client is not configured." };
  }

  try {
    let patientId: string | null = null;

    // 1. Insert patient context if provided
    if (patientContext) {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          age: patientContext.age || null,
          sex: patientContext.sex || null,
          spo2: patientContext.spo2 || null,
          temperature: patientContext.temperature || null,
          symptom_duration: patientContext.symptom_duration || null,
          symptoms: patientContext.symptoms || [],
          clinical_notes: patientContext.clinical_notes || null,
        })
        .select("id")
        .single();

      if (!patientError && patientData) {
        patientId = patientData.id;
      }
    }

    // 2. Insert radiograph record if image URL exists
    let radiographId: string | null = null;
    if (imageUrl) {
      const { data: radData, error: radError } = await supabase
        .from("radiographs")
        .insert({
          patient_id: patientId,
          file_name: `xray-${analysis.analysis_id}`,
          file_path: imageUrl,
          file_type: "image/png",
          image_url: imageUrl,
          image_quality: analysis.image_quality?.status || "good",
          quality_details: analysis.image_quality || {},
        })
        .select("id")
        .single();

      if (!radError && radData) {
        radiographId = radData.id;
      }
    }

    // 3. Insert analysis record
    const { error: analysisError } = await supabase.from("analyses").insert({
      analysis_id: analysis.analysis_id,
      patient_id: patientId,
      radiograph_id: radiographId,
      finding: analysis.finding,
      model_score: analysis.model_score,
      confidence: analysis.confidence,
      confidence_factors: analysis.confidence_factors,
      heatmap_url: analysis.image_evidence?.heatmap_available
        ? imageUrl
        : null,
      bbox_xmin: analysis.image_evidence?.bbox?.[0] ?? null,
      bbox_ymin: analysis.image_evidence?.bbox?.[1] ?? null,
      bbox_xmax: analysis.image_evidence?.bbox?.[2] ?? null,
      bbox_ymax: analysis.image_evidence?.bbox?.[3] ?? null,
      clinical_evidence: analysis.clinical_evidence,
      explanation: analysis.explanation,
      firewall_supported: analysis.evidence_validation?.supported ?? true,
      firewall_image_evidence:
        analysis.evidence_validation?.image_evidence ?? true,
      firewall_clinical_evidence:
        analysis.evidence_validation?.clinical_evidence ?? true,
    });

    if (analysisError) {
      return { success: false, error: analysisError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches past cases from Supabase database
 */
export async function fetchCaseHistoryFromSupabase(): Promise<AnalysisResponse[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("analyses")
      .select("*, radiographs(image_url), patients(*)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      analysis_id: row.analysis_id,
      finding: row.finding,
      model_score: Number(row.model_score),
      confidence: row.confidence,
      confidence_factors: row.confidence_factors || {
        image_signal: false,
        clinical_context_supportive: false,
        adequate_image_quality: false,
      },
      image_evidence: {
        model: "LumiVue DenseNet-121",
        score: Number(row.model_score),
        bbox:
          row.bbox_xmin !== null
            ? [row.bbox_xmin, row.bbox_ymin, row.bbox_xmax, row.bbox_ymax]
            : null,
        heatmap_available: Boolean(row.heatmap_url),
      },
      clinical_evidence: row.clinical_evidence || [],
      explanation: row.explanation,
      image_quality: {
        status: "good",
      },
      evidence_validation: {
        supported: row.firewall_supported,
        image_evidence: row.firewall_image_evidence,
        clinical_evidence: row.firewall_clinical_evidence,
      },
    }));
  } catch (err) {
    console.error("Failed to query history from Supabase:", err);
    return [];
  }
}
