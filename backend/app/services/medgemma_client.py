"""
LumiVue — Remote MedGemma Client
==================================
Calls the MedGemma laptop service over the local network.

Used by analysis_service.py when MEDGEMMA_MODE=remote.

The client:
  - POSTs multipart form-data to  {MEDGEMMA_BASE_URL}/analyze
  - Enforces a configurable timeout so a hung MedGemma request never
    stalls the main FastAPI backend
  - Returns a MedGemmaResponse compatible with the existing interface
  - Raises RuntimeError on network / timeout / non-200 errors so the
    caller can fall back gracefully
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.models.medgemma import MedGemmaResponse

logger = logging.getLogger("lumivue.medgemma_client")


class RemoteMedGemmaClient:
    """
    Thin HTTP client around the MedGemma local service.

    Usage
    -----
    client = RemoteMedGemmaClient()
    response = await client.analyze(image_bytes, patient_context, model_score)
    """

    def __init__(self) -> None:
        base_url = (settings.medgemma_base_url or "").rstrip("/")
        if not base_url:
            raise RuntimeError(
                "MEDGEMMA_BASE_URL is not configured. "
                "Set it in .env to the MedGemma laptop's LAN address, "
                "e.g.  MEDGEMMA_BASE_URL=http://192.168.1.25:8001"
            )
        self._base_url = base_url
        self._timeout = settings.medgemma_timeout

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze(
        self,
        image_bytes: bytes,
        patient_context: str = "",
        model_score: float = 0.0,
    ) -> MedGemmaResponse:
        """
        Call POST /analyze on the MedGemma service.

        Parameters
        ----------
        image_bytes : bytes
            Raw bytes of the chest X-ray image.
        patient_context : str
            Clinical context (JSON string or plain text).
        model_score : float
            DenseNet probability score passed for context.

        Returns
        -------
        MedGemmaResponse
            Structured response compatible with the existing MedGemmaService
            interface used in analysis_service.py.

        Raises
        ------
        RuntimeError
            On connection error, timeout, or non-2xx HTTP response.
        """
        url = f"{self._base_url}/analyze"
        logger.info("Calling remote MedGemma at %s (timeout=%.0fs)", url, self._timeout)

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    url,
                    files={"image": ("xray.png", image_bytes, "image/png")},
                    data={
                        "patient_context": patient_context,
                        "model_score": str(model_score),
                    },
                )
        except httpx.TimeoutException as exc:
            raise RuntimeError(
                f"MedGemma service timed out after {self._timeout}s. "
                "Check that the MedGemma laptop is running and reachable."
            ) from exc
        except httpx.ConnectError as exc:
            raise RuntimeError(
                f"Cannot connect to MedGemma service at {self._base_url}. "
                "Verify the laptop IP, port 8001, and Windows Firewall settings."
            ) from exc
        except httpx.RequestError as exc:
            raise RuntimeError(
                f"Network error calling MedGemma service: {exc}"
            ) from exc

        if response.status_code != 200:
            raise RuntimeError(
                f"MedGemma service returned HTTP {response.status_code}: "
                f"{response.text[:300]}"
            )

        payload: dict[str, Any] = response.json()
        return self._parse_response(payload)

    async def check_health(self) -> dict[str, Any]:
        """
        Call GET /health and return the raw JSON dict.

        Raises RuntimeError on failure.
        """
        url = f"{self._base_url}/health"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
        except httpx.RequestError as exc:
            raise RuntimeError(
                f"Cannot reach MedGemma /health at {url}: {exc}"
            ) from exc

        if resp.status_code != 200:
            raise RuntimeError(
                f"MedGemma /health returned HTTP {resp.status_code}"
            )
        return resp.json()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_response(payload: dict[str, Any]) -> MedGemmaResponse:
        """
        Convert the MedGemma service JSON response to a MedGemmaResponse
        so analysis_service.py needs zero changes.
        """
        findings: list[dict] = payload.get("findings", [])
        explanation: str = payload.get("explanation", "")

        # Extract supporting_findings from all findings that have clinical evidence
        supporting: list[str] = []
        for finding in findings:
            # Add the finding name if it has image or clinical support
            if finding.get("image_support") or finding.get("clinical_support"):
                supporting.append(finding.get("name", ""))
            # Also add individual clinical evidence items
            for evidence in finding.get("clinical_evidence", []):
                if evidence and evidence not in supporting:
                    supporting.append(evidence)

        return MedGemmaResponse(
            explanation=explanation,
            supporting_findings=[s for s in supporting if s],
            raw_output=str(payload),
        )
