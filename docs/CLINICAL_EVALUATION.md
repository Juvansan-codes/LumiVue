# Clinical Evaluation & Safety

## 1. Safety-First AI
In medical domains, the cost of a false positive is unnecessary testing and patient anxiety, while the cost of a false negative is missed treatment. Furthermore, Large Language Models (LLMs) are notorious for "hallucinations" — stating falsehoods with extreme confidence.

LumiVue combats these issues through a deterministic **Evidence Firewall** and a multi-factor **Confidence Engine**.

## 2. The Evidence Firewall
Before any finding is presented to the clinician, it must pass the Evidence Firewall. The firewall checks for the presence of grounding evidence:

- **Image Evidence:** Is the DenseNet-121 model probability score above the clinical threshold (`0.50`)? Did it successfully localize a bounding box via Grad-CAM?
- **Clinical Evidence:** Did the doctor provide supporting symptoms (e.g., Fever, Cough, low SpO2)?

### Firewall Rules:
1. If the MedGemma LLM predicts "suspected pneumonia" but neither Image Evidence nor Clinical Evidence is present, the firewall **rejects** the finding and overrides it to "inconclusive".
2. If the LLM predicts "no pneumonia detected" but the image strongly suggests it, the firewall flags a discrepancy.
3. This guarantees that **No Evidence = No Finding**.

## 3. The Confidence Engine
The confidence engine determines the reliability of the AI's prediction. It outputs a `low`, `moderate`, or `high` confidence score based on the agreement of multiple independent signals:

| Signal | Description | High Confidence Requirement |
|--------|-------------|-----------------------------|
| **Image Signal** | DenseNet probability score | Strongly aligns with the final finding (e.g., `score > 0.7` for positive). |
| **Clinical Signal** | Presence of symptoms | Symptoms correlate with the finding. |
| **Image Quality** | Radiograph fidelity | Blur and contrast scores must be strictly "good" or "acceptable". |
| **Model Agreement** | Vision vs LLM | The DenseNet raw score and the LLM's final reasoning must agree. |

If the radiograph is blurry, or if the LLM's conclusion contradicts the vision model, the confidence is immediately downgraded to `low` or `moderate`, prompting the doctor to rely heavily on their own expertise.

## 4. Ethical Limitations
- **Decision Support Only:** LumiVue is not a diagnostic tool. The final diagnosis rests 100% on the attending clinician.
- **Bias:** The DenseNet-121 model was trained on the RSNA Pneumonia Detection dataset, which may contain geographic, demographic, or technical biases. The model may underperform on portable X-rays or distinct demographics not represented in the training distribution.
- **Prototype Status:** The current implementation is a hackathon prototype and has not undergone FDA or CE regulatory approval.
