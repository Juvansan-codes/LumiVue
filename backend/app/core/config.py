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
    medgemma_mode: str = "mock"  # "mock" | "api" | "local"
    medgemma_api_url: str = ""
    medgemma_api_key: str = ""

    # ---- Model Paths & Config ----
    model_path: str = "models/lumivue_densenet121_rsna.pth"
    pneumonia_threshold: float = 0.60

    @property
    def is_mock(self) -> bool:
        """Whether the application is running in mock mode."""
        return self.medgemma_mode == "mock"


settings = Settings()
