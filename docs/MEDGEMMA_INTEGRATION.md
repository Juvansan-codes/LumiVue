# MedGemma Multimodal Integration

## 1. Introduction
While computer vision models excel at image feature extraction, clinical diagnosis is inherently **multimodal**. Doctors synthesize visual findings with patient history, vitals, and symptoms. 

LumiVue bridges this gap by integrating **MedGemma 1.5 4B**, an open-weights clinical LLM, deployed via a standalone, high-throughput **vLLM server**.

## 2. Server Architecture
To bypass the memory and blocking limitations of the synchronous FastAPI application, MedGemma runs as an independent microservice.

### 2.1 The vLLM Engine
- **Framework:** `vLLM`
- **Optimization:** Utilizes PagedAttention for efficient KV-cache memory management.
- **Exposure:** Serves an OpenAI-compatible HTTP API on `http://localhost:8080/v1`.

### 2.2 Client-Server Orchestration
The core FastAPI application uses `medgemma_client.py` to communicate asynchronously with the vLLM server:
1. **Vision Inference:** The DenseNet-121 processes the image and extracts the `model_score` and `bbox`.
2. **Context Assembly:** The `model_score` is combined with the `PatientContext` (age, sex, SpO2, temp, symptoms).
3. **Prompt Generation:** A strict, zero-shot system prompt is constructed to force the LLM to act purely as a synthesizer.
4. **Inference Request:** Sent to vLLM via `AsyncOpenAI`.

## 3. Prompt Engineering & Guardrails
To prevent hallucination, the MedGemma prompt is rigidly structured:

```text
You are an expert clinical reasoning AI assistant analyzing a chest X-ray.
You have two sources of information:
1. AI Image Analysis: Probability of pneumonia.
2. Clinical Context: Vitals, symptoms, and demographics.

Rules:
1. Do not diagnose. Offer 'suspected' findings.
2. If image analysis is low and clinical context is weak, conclude 'no_pneumonia_detected'.
3. Always reference both the visual probability and the clinical symptoms.
```

### Structured Output (JSON Mode)
MedGemma is forced to respond in strict JSON, guaranteeing parseable output for the frontend:
```json
{
  "finding": "suspected_pneumonia",
  "explanation": "Doctor, consider a possible focal lung opacity...",
  "confidence": "high"
}
```

## 4. Why MedGemma?
MedGemma 1.5 4B was chosen because:
- **Domain Specialization:** It is pre-trained/fine-tuned on biomedical literature and clinical reasoning datasets.
- **Resource Efficiency:** At 4 billion parameters, it comfortably fits within a standard 16GB-24GB VRAM GPU, making on-premise hospital deployment feasible.
- **Safety:** It explicitly avoids overconfident diagnostic assertions, aligning perfectly with LumiVue's decision-support philosophy.
