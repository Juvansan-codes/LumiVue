# DenseNet-121 V2 Model Training Report

## 1. Overview
The computer vision backbone of LumiVue is a **DenseNet-121** model, specifically fine-tuned on the RSNA Pneumonia Detection Challenge dataset. This model is responsible for feature extraction, bounding box localization via Grad-CAM, and computing the foundational `model_score` passed into the MedGemma multimodal engine.

## 2. Dataset & Data Leakage Prevention
To ensure valid, real-world evaluation, the dataset was rigorously split at the **patient level** rather than the image level.

### 2.1 The Issue with Image-Level Splits
If a patient has multiple radiographs, splitting by image can result in the same patient appearing in both the training and validation sets. The model might memorize patient-specific anatomical features rather than learning generalized pneumonia features, artificially inflating validation accuracy (data leakage).

### 2.2 Patient-Level Splitting (V2)
In the final V2 pipeline:
- **Total Patients:** 26,684
- **Training Set:** 21,346 patients (80%)
- **Validation Set:** 5,338 patients (20%)
- **Overlap:** 0 patients

This strict boundary guarantees that the validation metrics accurately represent the model's performance on entirely unseen clinical cases.

## 3. Two-Stage Training Methodology
A two-stage transfer learning approach was adopted to prevent catastrophic forgetting of the ImageNet pre-trained weights.

### Stage 1: Frozen Backbone (Epochs 1-4)
- **Action:** The deep convolutional layers of the DenseNet-121 were frozen.
- **Objective:** Train the randomly initialized classification head (`fc` layer) to map the existing pre-trained ImageNet features to the binary pneumonia classes without distorting the deep feature extractors.
- **Result:** Validation ROC-AUC improved from `0.65` to `0.7491`.

### Stage 2: Deep Fine-Tuning (Epoch 5+)
- **Action:** All layers were unfrozen.
- **Objective:** Allow the deep convolutional filters to adapt specifically to radiological textures (e.g., cloudy opacities, consolidations) with a significantly reduced learning rate (`1e-4` to `1e-5`).
- **Result:** A major breakthrough in metric performance as the network specialized in medical imaging.

## 4. Final Validation Metrics
The final leak-free V2 checkpoint achieved the following robust metrics on the unseen 5,338 validation patients at a configurable threshold of `0.50`:

| Metric | Score | Interpretation |
|--------|-------|----------------|
| **ROC-AUC** | `0.8427` | Excellent capability to rank positive cases higher than negative cases. |
| **PR-AUC** | `0.6125` | Strong performance in maintaining precision given the dataset class imbalance. |
| **Recall (Sensitivity)** | `0.8288` | High ability to identify true pneumonia cases (low false negatives). |
| **Specificity** | `0.6955` | Good ability to correctly dismiss healthy patients. |
| **F1 Score** | `0.5765` | Balanced harmonic mean of Precision and Recall. |
| **Accuracy** | `0.7256` | Overall percentage of correct predictions. |

## 5. Grad-CAM Localization
Beyond binary classification, the DenseNet-121 model leverages **Gradient-weighted Class Activation Mapping (Grad-CAM)**. 
- The gradients flowing into the final convolutional layer are utilized to produce a coarse localization map highlighting the regions in the image crucial for the prediction.
- This map is thresholded to calculate a bounding box (`[x_min, y_min, x_max, y_max]`), providing the doctor with visual evidence of the focal opacity.
