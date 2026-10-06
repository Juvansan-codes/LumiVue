"""
LumiVue — FastAPI Application Entry Point
==========================================
Creates and configures the FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="LumiVue API",
        description=(
            "Evidence-Grounded Multimodal Pneumonia Intelligence. "
            "AI-powered second-opinion assistant for chest X-ray analysis."
        ),
        version="0.1.0",
    )

    # CORS — allow the Next.js frontend during development
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routes
    application.include_router(router)

    return application


app = create_app()
