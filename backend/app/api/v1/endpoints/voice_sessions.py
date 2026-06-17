"""Voice AI session and transcript endpoints."""

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import Settings, get_settings
from app.core.authorization import require_any_permission, require_permission
from app.core.permissions import (
    VOICE_SESSIONS_DELETE,
    VOICE_SESSIONS_EXECUTE,
    VOICE_SESSIONS_READ,
    VOICE_SESSIONS_WRITE,
)
from app.models.user import User
from app.models.voice_transcript import VoiceTranscript
from app.schemas.voice_session import (
    VoiceSessionCreateRequest,
    VoiceSessionDetailResponse,
    VoiceSessionResponse,
    VoiceSessionSummaryResponse,
    VoiceSessionUpdateRequest,
    VoiceTranscriptResponse,
)
from app.services.chroma_service import ChromaService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.embedding_service import EmbeddingService
from app.services.retrieval_service import get_cached_embedding_service
from app.services.voice_session_service import (
    build_voice_session_detail_response,
    create_voice_session,
    delete_voice_session,
    get_voice_session_or_404,
    list_session_transcripts,
    list_voice_sessions,
    process_voice_session_audio,
    resolve_transcript_audio_path,
    update_voice_session,
)

router = APIRouter(prefix="/voice-sessions", tags=["voice-sessions"])


def get_embedding_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmbeddingService:
    return get_cached_embedding_service(settings.embedding_model_name)


def get_chroma_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChromaService:
    return ChromaService(settings.chroma_persist_dir)


def get_employee_rag_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmployeeRAGService:
    return EmployeeRAGService(settings)


@router.post("", response_model=VoiceSessionResponse, status_code=status.HTTP_201_CREATED)
def create_voice_session_endpoint(
    payload: VoiceSessionCreateRequest,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceSessionResponse:
    """Create a voice session for audio upload and transcription."""
    return create_voice_session(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[VoiceSessionSummaryResponse])
def list_voice_sessions_endpoint(
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    voice_agent_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[VoiceSessionSummaryResponse]:
    """List voice sessions in the current organization."""
    return list_voice_sessions(
        db,
        organization_id=current_user.organization_id,
        voice_agent_id=voice_agent_id,
    )


@router.get("/{session_id}", response_model=VoiceSessionDetailResponse)
def get_voice_session_endpoint(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceSessionDetailResponse:
    """Get one voice session with transcript history."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    return build_voice_session_detail_response(db, session=session)


@router.patch("/{session_id}", response_model=VoiceSessionResponse)
def update_voice_session_endpoint(
    session_id: uuid.UUID,
    payload: VoiceSessionUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceSessionResponse:
    """Update voice session metadata."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    return update_voice_session(db, session=session, payload=payload)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_voice_session_endpoint(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Delete a voice session and its audio file."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    delete_voice_session(db, session=session, upload_root=Path(settings.upload_dir))


@router.get("/{session_id}/transcripts", response_model=list[VoiceTranscriptResponse])
def list_session_transcripts_endpoint(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[VoiceTranscriptResponse]:
    """List transcript entries for a voice session."""
    transcripts = list_session_transcripts(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    return [VoiceTranscriptResponse.model_validate(transcript) for transcript in transcripts]


@router.post(
    "/{session_id}/upload",
    response_model=VoiceSessionDetailResponse,
)
async def upload_voice_session_audio_endpoint(
    session_id: uuid.UUID,
    file: Annotated[UploadFile, File(description="Audio file to transcribe")],
    current_user: Annotated[
        User,
        Depends(require_any_permission(VOICE_SESSIONS_EXECUTE, VOICE_SESSIONS_WRITE)),
    ],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> VoiceSessionDetailResponse:
    """Upload audio, transcribe with Whisper, and generate an AI response."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    return await process_voice_session_audio(
        db,
        settings=settings,
        session=session,
        file=file,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )


@router.get("/{session_id}/audio")
def get_voice_session_audio_endpoint(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileResponse:
    """Stream the most recently uploaded audio for a voice session."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    if not session.audio_file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No audio available for this session",
        )

    upload_root = Path(settings.upload_dir)
    audio_path = upload_root / session.audio_file_path
    if not audio_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found",
        )

    return FileResponse(
        path=str(audio_path),
        media_type=session.audio_mime_type or "application/octet-stream",
        filename=audio_path.name,
    )


@router.get("/{session_id}/transcripts/{transcript_id}/audio")
def get_voice_transcript_audio_endpoint(
    session_id: uuid.UUID,
    transcript_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_SESSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> FileResponse:
    """Stream the caller audio associated with a transcript entry."""
    session = get_voice_session_or_404(
        db,
        session_id=session_id,
        organization_id=current_user.organization_id,
    )
    transcript = db.get(VoiceTranscript, transcript_id)
    if transcript is None or transcript.voice_session_id != session.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found",
        )

    upload_root = Path(settings.upload_dir)
    audio_path = resolve_transcript_audio_path(
        session=session,
        transcript=transcript,
        upload_root=upload_root,
    )
    if audio_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No audio available for this transcript",
        )

    metadata = transcript.metadata_ or {}
    mime_type = metadata.get("audio_mime_type") or session.audio_mime_type

    return FileResponse(
        path=str(audio_path),
        media_type=str(mime_type) if mime_type else "application/octet-stream",
        filename=audio_path.name,
    )
