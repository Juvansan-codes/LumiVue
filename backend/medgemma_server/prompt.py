"""
MedGemma Server — Prompt Engineering
======================================
Builds the structured prompt sent to MedGemma and parses its text output
back into the required JSON schema.

Design principles
-----------------
* Prompt tells the model it is a clinician-support tool, NOT a replacement.
* Prompt explicitly forbids inventing symptoms, test results, or findings.
* Prompt instructs the model to distinguish image evidence from clinical context.
* Prompt requests cautious medical language ("Doctor, consider …").
* Structured-output parsing is done here; the caller receives a clean dict.
* Hallucination prevention is NOT solely done through prompting — the main
  backend's Evidence Firewall provides the final safety gate.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger("medgemma_server.prompt")

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_SYSTEM_PREAMBLE = """\
You are MedGemma, a clinician-support AI assisting a licensed physician.
You are NOT a replacement for clinical judgment.

Rules you must follow without exception:
1. Analyze ONLY the supplied chest X-ray image and the supplied patient context.
2. Do NOT invent symptoms, laboratory results, or clinical findings that are not
   present in the image or the patient context.
3. Clearly distinguish findings that are image-supported from those that are
   only supported by the clinical context.
4. Use cautious medical language.
   - Prefer: "Doctor, consider …", "The image suggests …",
     "The clinical context provides support for …"
   - Do NOT use absolute statements such as "The patient has pneumonia."
5. Do NOT produce a confidence score — confidence is computed externally.
6. Do NOT generate bounding boxes — visual localisation is handled externally.
7. Respond ONLY with a valid JSON object that matches the schema below.
   Do not add any text before or after the JSON.

Response schema:
{
  "findings": [
    {
      "name": "<short clinical label>",
      "description": "<one or two sentence description>",
      "image_support": <true|false>,
      "clinical_support": <true|false>,
      "clinical_evidence": ["<evidence item>", ...]
    }
  ],
  "explanation": "<2-4 sentence summary for the clinician>"
}
"""


def build_prompt(
    patient_context: dict[str, Any] | str,
    model_score: float,
) -> str:
    """
    Compose the full text prompt that is sent alongside the image.

    Parameters
    ----------
    patient_context : dict or str
        Structured patient data (age, sex, symptoms, vitals, notes) or a
        plain-text context string supplied by the caller.
    model_score : float
        DenseNet pneumonia probability (0.0–1.0).  Provided for context only —
        MedGemma must not copy this number into its findings.

    Returns
    -------
    str
        Complete prompt string.
    """
    # Normalise patient context to a readable block
    if isinstance(patient_context, dict):
        ctx_lines = _dict_to_readable(patient_context)
    else:
        ctx_lines = str(patient_context).strip() or "(no patient context supplied)"

    prompt = (
        f"{_SYSTEM_PREAMBLE}\n\n"
        "--- PATIENT CONTEXT ---\n"
        f"{ctx_lines}\n\n"
        "--- COMPUTER-VISION SCORE ---\n"
        f"DenseNet pneumonia probability: {model_score:.3f} "
        "(for reference only — do not copy this number into your output)\n\n"
        "--- TASK ---\n"
        "Examine the chest X-ray image above and the patient context.\n"
        "Produce the JSON response following the schema defined in your rules."
    )
    return prompt


def _dict_to_readable(ctx: dict[str, Any]) -> str:
    """Format a patient context dict into a short readable block."""
    lines: list[str] = []
    if "age" in ctx:
        lines.append(f"Age: {ctx['age']}")
    if "sex" in ctx:
        lines.append(f"Sex: {ctx['sex']}")
    if "symptoms" in ctx:
        symptoms = ctx["symptoms"]
        if isinstance(symptoms, list):
            symptoms = ", ".join(symptoms)
        lines.append(f"Symptoms: {symptoms}")
    if "spo2" in ctx:
        lines.append(f"SpO2: {ctx['spo2']}%")
    if "temperature" in ctx:
        lines.append(f"Temperature: {ctx['temperature']} °C")
    if "duration" in ctx:
        lines.append(f"Duration: {ctx['duration']}")
    if "notes" in ctx:
        lines.append(f"Notes: {ctx['notes']}")
    # Any extra keys not handled above
    known = {"age", "sex", "symptoms", "spo2", "temperature", "duration", "notes"}
    for k, v in ctx.items():
        if k not in known:
            lines.append(f"{k.capitalize()}: {v}")
    return "\n".join(lines) if lines else "(no patient context supplied)"


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------

_FALLBACK_RESPONSE: dict[str, Any] = {
    "findings": [],
    "explanation": (
        "Doctor, MedGemma was unable to produce a structured response for this "
        "image. Please rely on the DenseNet classification and Grad-CAM evidence "
        "and apply your own clinical judgment."
    ),
}


def parse_response(raw_text: str) -> dict[str, Any]:
    """
    Extract the JSON payload from MedGemma's raw generated text.

    MedGemma is instructed to return only JSON, but may occasionally wrap it
    in markdown fences or add a short preamble.  This function is tolerant of
    those edge cases.

    Parameters
    ----------
    raw_text : str
        The raw string returned by ``MedGemmaModel.generate()``.

    Returns
    -------
    dict
        Parsed and validated response dict, or a safe fallback on failure.
    """
    if not raw_text:
        logger.warning("MedGemma returned empty text — using fallback response")
        return _FALLBACK_RESPONSE.copy()

    # 1. Try to find a JSON block in markdown fences
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
    candidate = fence_match.group(1) if fence_match else raw_text

    # 2. Try to extract the outermost {...} if there is surrounding text
    brace_match = re.search(r"\{.*\}", candidate, re.DOTALL)
    if brace_match:
        candidate = brace_match.group(0)

    # 3. Parse
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError as exc:
        logger.warning("Failed to parse MedGemma JSON output: %s\nRaw: %.300s", exc, raw_text)
        return _FALLBACK_RESPONSE.copy()

    # 4. Basic schema validation — ensure required keys exist
    validated = _validate_structure(parsed)
    return validated


def _validate_structure(data: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure the parsed dict matches the expected schema.
    Missing keys are filled with safe defaults; extra keys are kept.
    """
    # Top-level keys
    findings = data.get("findings", [])
    explanation = data.get("explanation", _FALLBACK_RESPONSE["explanation"])

    # Validate each finding entry
    clean_findings: list[dict[str, Any]] = []
    for item in findings:
        if not isinstance(item, dict):
            continue
        clean_findings.append({
            "name": str(item.get("name", "unspecified finding")),
            "description": str(item.get("description", "")),
            "image_support": bool(item.get("image_support", False)),
            "clinical_support": bool(item.get("clinical_support", False)),
            "clinical_evidence": [
                str(e) for e in item.get("clinical_evidence", [])
                if isinstance(e, str)
            ],
        })

    return {
        "findings": clean_findings,
        "explanation": str(explanation),
    }
