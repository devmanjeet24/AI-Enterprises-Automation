"""Whisper-based audio transcription for voice sessions."""

import shutil
from functools import lru_cache
from pathlib import Path
from subprocess import CalledProcessError, run
from typing import Any

import imageio_ffmpeg
import numpy as np
import whisper

from app.config import Settings

SAMPLE_RATE = 16000


@lru_cache(maxsize=1)
def _resolve_ffmpeg_executable() -> str:
    """Return system ffmpeg when available, otherwise the imageio-ffmpeg bundle."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def _load_audio(file: str, sr: int = SAMPLE_RATE) -> np.ndarray:
    """Decode audio to mono float32 waveform (Whisper-compatible)."""
    ffmpeg = _resolve_ffmpeg_executable()
    cmd = [
        ffmpeg,
        "-nostdin",
        "-threads",
        "0",
        "-i",
        file,
        "-f",
        "s16le",
        "-ac",
        "1",
        "-acodec",
        "pcm_s16le",
        "-ar",
        str(sr),
        "-",
    ]
    try:
        out = run(cmd, capture_output=True, check=True).stdout
    except CalledProcessError as exc:
        raise RuntimeError(f"Failed to load audio: {exc.stderr.decode()}") from exc

    return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0


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
    audio = _load_audio(str(audio_path))
    result = model.transcribe(audio, fp16=False)
    return {
        "text": (result.get("text") or "").strip(),
        "language": result.get("language"),
        "segments": len(result.get("segments") or []),
    }
