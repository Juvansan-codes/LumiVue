"""
LumiVue — Prototype Evaluation Metrics
========================================
Calculates metrics and plots curves for the held-out validation set.
"""

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    auc,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)


def evaluate_prototype(y_true: list[float], y_prob: list[float], output_dir: Path, threshold: float = 0.5) -> dict:
    """
    Calculate prototype metrics (Accuracy, Precision, Recall, Specificity, F1, ROC-AUC, PR-AUC).
    Generates ROC and PR curve plots.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    y_true_np = np.array(y_true)
    y_prob_np = np.array(y_prob)
    y_pred_np = (y_prob_np >= threshold).astype(float)
    
    # Classification metrics
    acc = accuracy_score(y_true_np, y_pred_np)
    prec = precision_score(y_true_np, y_pred_np, zero_division=0)
    rec = recall_score(y_true_np, y_pred_np, zero_division=0)
    f1 = f1_score(y_true_np, y_pred_np, zero_division=0)
    
    # Confusion Matrix
    tn, fp, fn, tp = confusion_matrix(y_true_np, y_pred_np).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    
    # AUC metrics
    try:
        roc_auc = roc_auc_score(y_true_np, y_prob_np)
    except ValueError:
        roc_auc = 0.0  # Only 1 class present in batch
        
    precision_array, recall_array, _ = precision_recall_curve(y_true_np, y_prob_np)
    pr_auc = auc(recall_array, precision_array)
    
    metrics = {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "specificity": float(specificity),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "threshold": float(threshold),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
    }
    
    # Save ROC Curve
    fpr, tpr, _ = roc_curve(y_true_np, y_prob_np)
    plt.figure(figsize=(6, 6))
    plt.plot(fpr, tpr, label=f'ROC curve (AUC = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic')
    plt.legend(loc="lower right")
    plt.savefig(output_dir / "roc_curve.png")
    plt.close()
    
    # Save PR Curve
    plt.figure(figsize=(6, 6))
    plt.plot(recall_array, precision_array, label=f'PR curve (AUC = {pr_auc:.3f})')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend(loc="lower left")
    plt.savefig(output_dir / "pr_curve.png")
    plt.close()
    
    return metrics
