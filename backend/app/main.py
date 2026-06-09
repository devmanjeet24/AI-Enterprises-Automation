from fastapi import FastAPI

from app.api.router import api_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

app.include_router(api_router)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": settings.app_version,
    }
