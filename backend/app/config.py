from functools import lru_cache
from urllib.parse import urlparse

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "AI Enterprise Automation Platform"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = True

    host: str = "0.0.0.0"
    port: int = 8000

    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    upload_dir: str = "uploads"
    max_upload_size_mb: int = 25

    chroma_persist_dir: str = "chroma_data"
    embedding_model_name: str = "BAAI/bge-small-en-v1.5"
    retrieval_top_k: int = 5
    retrieval_min_similarity_score: float = 0.5

    groq_api_key: str
    groq_model_name: str = "llama-3.3-70b-versatile"
    groq_temperature: float = 0.2
    groq_max_tokens: int = 512

    @field_validator("database_url", mode="after")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Ensure SQLAlchemy uses the psycopg2 driver with Neon-style URLs."""
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg2://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg2://", 1)
        return value

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_name(self) -> str:
        return urlparse(self.database_url).path.lstrip("/") or "postgres"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins from settings."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
