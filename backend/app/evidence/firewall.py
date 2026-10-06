"""
LumiVue — Evidence Firewall
=============================
Owner: Backend Member 4 (Evidence Firewall)

Enforces the core principle: **No evidence = No finding**

The Evidence Firewall sits between the AI model outputs and the final
API response. It ensures that:

1. Findings MUST be supported by evidence (image or clinical).
2. LLM output NEVER directly becomes the API response.
3. Unsupported findings are rejected.

Decision matrix:
    ┌─────────────────┬──────────────────┬──────────────┐
    │ Image Evidence   │ Clinical Evidence │ Decision     │
    ├─────────────────┼──────────────────┼──────────────┤
    │ Available        │ Available         │ ALLOW        │
    │ Available        │ None              │ ALLOW (warn) │
    │ None             │ Available         │ ALLOW (warn) │
    │ None             │ None              │ REJECT       │
    └─────────────────┴──────────────────┴──────────────┘

TODO:
    - Implement full evidence validation logic
    - Add configurable thresholds
    - Add audit logging for rejected findings
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass
class FirewallDecision:
    """Result of the evidence firewall evaluation."""

    allowed: bool
    reason: str
    action: Literal["allow", "warn", "reject"]


def enforce_evidence(
    has_image_evidence: bool,
    clinical_evidence: list[str],
    model_score: float,
) -> FirewallDecision:
    """
    Evaluate whether a finding has sufficient evidence to be reported.

    Parameters
    ----------
    has_image_evidence : bool
        Whether image-level evidence (Grad-CAM, bbox) is available.
    clinical_evidence : list[str]
        List of clinical evidence items from patient context.
    model_score : float
        Raw model prediction score.

    Returns
    -------
    FirewallDecision
        Whether the finding is allowed, warned, or rejected.
    """
    has_clinical = len(clinical_evidence) > 0

    # No evidence at all → reject
    if not has_image_evidence and not has_clinical:
        return FirewallDecision(
            allowed=False,
            reason="No image or clinical evidence supports this finding.",
            action="reject",
        )

    # Only one type of evidence → allow with warning
    if not has_image_evidence or not has_clinical:
        missing = "image" if not has_image_evidence else "clinical"
        return FirewallDecision(
            allowed=True,
            reason=f"Finding allowed with caution: {missing} evidence is missing.",
            action="warn",
        )

    # Both types of evidence available
    return FirewallDecision(
        allowed=True,
        reason="Finding supported by both image and clinical evidence.",
        action="allow",
    )
