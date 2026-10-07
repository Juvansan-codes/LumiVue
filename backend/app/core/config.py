"""
LumiVue — Application Configuration
=====================================
Loads settings from environment variables using pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- Application ----
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000

    # ---- MedGemma ----
    # Modes:
    #   "mock"   — no real model, returns placeholder responses
    #   "remote" — calls the MedGemma local HTTP service on another machine
    #   "api"    — calls an external hosted API
    #   "local"  — loads MedGemma in-process (not used in Phase 6B)
    medgemma_mode: str = "mock"  # "mock" | "remote" | "api" | "local"
    medgemma_base_url: str = ""  # e.g. http://192.168.1.25:8001  (remote mode)
    medgemma_api_url: str = ""   # legacy / external API URL
    medgemma_api_key: str = ""
    medgemma_timeout: float = 120.0  # seconds before giving up on a remote call

    # ---- Model Paths & Config ----
    model_path: str = "models/lumivue_densenet121_rsna.pth"
    pneumonia_threshold: float = 0.60

    @property
    def is_mock(self) -> bool:
        """Whether the application is running in mock mode."""
        return self.medgemma_mode == "mock"

    @property
    def use_remote_medgemma(self) -> bool:
        """Whether to call the MedGemma laptop service over the LAN."""
        return self.medgemma_mode == "remote"


settings = Settings()
