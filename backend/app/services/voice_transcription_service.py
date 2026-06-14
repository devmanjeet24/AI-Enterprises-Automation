"""Whisper-based audio transcription for voice sessions."""

from functools import lru_cache
from pathlib import Path
from typing import Any

import whisper

from app.config import Settings


@lru_cache(maxsize=1)
def _load_whisper_model(model_name: str) -> whisper.Whisper:
    return whisper.load_model(model_name)


def transcribe_audio_file(
    *,
    settings: Settings,
    audio_path: Path,
) -> dict[str, Any]:
    """Transcribe an audio file and return text plus metadata."""
    model = _load_whisper_model(settings.whisper_model_name)
    result = model.transcribe(str(audio_path), fp16=False)
    return {
        "text": (result.get("text") or "").strip(),
        "language": result.get("language"),
        "segments": len(result.get("segments") or []),
    }
