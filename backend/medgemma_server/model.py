"""
MedGemma Server — Model Loader
================================
Loads MedGemma 1.5 4B once at server startup and keeps it resident in GPU
memory for the lifetime of the process.

The module exposes a single global instance:  ``medgemma``
Call ``medgemma.load()`` during startup, then ``medgemma.generate(...)`` per
request.  ``medgemma.loaded`` is False until ``load()`` completes successfully.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

import torch
from PIL import Image

logger = logging.getLogger("medgemma_server.model")

# ---------------------------------------------------------------------------
# Model identifier — matches the downloaded snapshot in the HuggingFace cache
# ---------------------------------------------------------------------------
MODEL_ID = "google/medgemma-1.5-4b-it"
MODEL_DISPLAY_NAME = "medgemma-1.5-4b"


@dataclass
class DeviceInfo:
    """GPU / CPU availability summary logged at startup."""

    cuda_available: bool
    device_name: str
    device: str
    vram_gb: float = 0.0


def _probe_device() -> DeviceInfo:
    """Return the best available device and log diagnostic information."""
    if torch.cuda.is_available():
        idx = torch.cuda.current_device()
        name = torch.cuda.get_device_name(idx)
        props = torch.cuda.get_device_properties(idx)
        vram_gb = props.total_memory / (1024 ** 3)
        logger.info("CUDA available — device 0: %s (%.1f GB VRAM)", name, vram_gb)
        return DeviceInfo(
            cuda_available=True,
            device_name=name,
            device="cuda",
            vram_gb=vram_gb,
        )

    logger.warning("CUDA not available — falling back to CPU (inference will be slow)")
    return DeviceInfo(cuda_available=False, device_name="cpu", device="cpu")


class MedGemmaModel:
    """
    Wrapper around the HuggingFace AutoModelForImageTextToText / AutoProcessor
    pipeline for MedGemma 1.5 4B.

    Usage
    -----
    model = MedGemmaModel()
    model.load()                          # called once at startup
    text = model.generate(image, prompt)  # called per request
    """

    def __init__(self) -> None:
        self._processor = None
        self._model = None
        self._device_info: Optional[DeviceInfo] = None
        self.loaded: bool = False
        self.load_error: Optional[str] = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def load(self) -> None:
        """
        Load MedGemma from the local HuggingFace cache.
        Raises on failure so the /health endpoint can report the real status.
        """
        # Late import — avoids paying the transformers startup cost if the
        # module is imported but load() is never called (e.g. unit tests).
        from transformers import AutoProcessor, AutoModelForImageTextToText

        logger.info("Loading MedGemma model: %s", MODEL_ID)
        self._device_info = _probe_device()
        device = self._device_info.device

        try:
            # Use float16 on CUDA to fit comfortably in VRAM; float32 on CPU
            torch_dtype = torch.bfloat16 if device == "cuda" else torch.float32

            logger.info("Loading processor …")
            self._processor = AutoProcessor.from_pretrained(
                MODEL_ID, local_files_only=True
            )

            logger.info("Loading model weights (dtype=%s) …", torch_dtype)
            self._model = AutoModelForImageTextToText.from_pretrained(
                MODEL_ID,
                dtype=torch_dtype,           # replaces deprecated torch_dtype
                device_map="auto" if device == "cuda" else None,
                local_files_only=True,       # never attempt to reach HuggingFace Hub
            )

            if device != "cuda":
                # device_map="auto" handles GPU placement; for CPU we move manually
                self._model = self._model.to(device)

            self._model.eval()
            self.loaded = True
            logger.info(
                "MedGemma loaded successfully on %s (%s)",
                device,
                self._device_info.device_name,
            )

        except Exception as exc:
            self.load_error = str(exc)
            logger.error("Failed to load MedGemma: %s", exc)
            raise

    def generate(
        self,
        image: Image.Image,
        prompt: str,
        max_new_tokens: int = 512,
    ) -> str:
        """
        Run one forward pass through MedGemma.

        Parameters
        ----------
        image : PIL.Image.Image
            The chest X-ray image.
        prompt : str
            The fully-formed text prompt including patient context.
        max_new_tokens : int
            Maximum tokens to generate.

        Returns
        -------
        str
            The raw generated text from the model.
        """
        if not self.loaded:
            raise RuntimeError("MedGemma model is not loaded")

        device = self._device_info.device  # type: ignore[union-attr]

        # Build the chat-style input that MedGemma-it expects
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text",  "text": prompt},
                ],
            }
        ]

        inputs = self._processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.inference_mode():
            output_ids = self._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,          # deterministic for medical context
            )

        # Decode only the newly generated tokens (strip the prompt)
        input_len = inputs["input_ids"].shape[1]
        new_tokens = output_ids[0][input_len:]
        return self._processor.decode(new_tokens, skip_special_tokens=True)

    # ------------------------------------------------------------------
    # Properties used by /health
    # ------------------------------------------------------------------

    @property
    def device_label(self) -> str:
        """'cuda' or 'cpu', or 'unloaded' if load() was never called."""
        if self._device_info is None:
            return "unloaded"
        return self._device_info.device

    @property
    def device_name(self) -> str:
        if self._device_info is None:
            return "unknown"
        return self._device_info.device_name

    @property
    def vram_gb(self) -> float:
        if self._device_info is None:
            return 0.0
        return self._device_info.vram_gb


# ---------------------------------------------------------------------------
# Module-level singleton — imported by app.py and prompt.py
# ---------------------------------------------------------------------------
medgemma = MedGemmaModel()
