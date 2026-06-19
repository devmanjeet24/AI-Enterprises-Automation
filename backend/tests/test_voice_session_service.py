"""Unit tests for voice session conversation helpers."""

import uuid
from unittest.mock import MagicMock

from app.models.enums import VoiceTranscriptRole
from app.models.voice_transcript import VoiceTranscript
from app.services.voice_session_service import build_conversation_history


def test_build_conversation_history_maps_roles() -> None:
    session_id = uuid.uuid4()
    transcripts = [
        VoiceTranscript(
            voice_session_id=session_id,
            role=VoiceTranscriptRole.CALLER,
            content="What are your hours?",
        ),
        VoiceTranscript(
            voice_session_id=session_id,
            role=VoiceTranscriptRole.AI_ASSISTANT,
            content="We are open 9 to 5.",
        ),
        VoiceTranscript(
            voice_session_id=session_id,
            role=VoiceTranscriptRole.CALLER,
            content="Thanks, and refunds?",
        ),
    ]

    history = build_conversation_history(transcripts)

    assert history == [
        ("user", "What are your hours?"),
        ("assistant", "We are open 9 to 5."),
        ("user", "Thanks, and refunds?"),
    ]


def test_resolve_transcript_audio_path_uses_metadata() -> None:
    from pathlib import Path

    from app.services.voice_session_service import resolve_transcript_audio_path

    session = MagicMock()
    session.audio_file_path = "org/voice/session/audio.webm"
    transcript = MagicMock()
    transcript.role = VoiceTranscriptRole.CALLER
    transcript.metadata_ = {"audio_file_path": "org/voice/session/turn-1.webm"}

    upload_root = Path("/tmp/uploads")
    audio_path = upload_root / "org/voice/session/turn-1.webm"
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    audio_path.write_bytes(b"audio")

    try:
        resolved = resolve_transcript_audio_path(
            session=session,
            transcript=transcript,
            upload_root=upload_root,
        )
        assert resolved == audio_path
    finally:
        audio_path.unlink(missing_ok=True)
        audio_path.parent.rmdir()
        (upload_root / "org/voice/session").rmdir()
        (upload_root / "org/voice").rmdir()
        (upload_root / "org").rmdir()
