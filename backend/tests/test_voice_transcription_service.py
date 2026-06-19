"""Tests for voice transcription ffmpeg resolution."""

from pathlib import Path

from app.services.voice_transcription_service import (
    _load_audio,
    _resolve_ffmpeg_executable,
    transcribe_audio_file,
)
from app.config import get_settings


def test_resolve_ffmpeg_executable_returns_path() -> None:
    ffmpeg = _resolve_ffmpeg_executable()
    assert Path(ffmpeg).exists() or ffmpeg == "ffmpeg"


def test_load_audio_decodes_silence_wav(tmp_path: Path) -> None:
    # Minimal valid WAV: 16-bit mono PCM, 0.1s at 16kHz
    import struct
    import wave

    wav_path = tmp_path / "silence.wav"
    with wave.open(str(wav_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(struct.pack("<h", 0) * 1600)

    audio = _load_audio(str(wav_path))
    assert len(audio) > 0


def test_transcribe_audio_file_on_short_wav(tmp_path: Path) -> None:
    import struct
    import wave

    wav_path = tmp_path / "tone.wav"
    with wave.open(str(wav_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        # quiet noise — whisper may return empty text, but must not raise
        frames = struct.pack("<" + "h" * 8000, *([100] * 8000))
        wav_file.writeframes(frames)

    settings = get_settings()
    result = transcribe_audio_file(settings=settings, audio_path=wav_path)
    assert "text" in result
    assert "language" in result
