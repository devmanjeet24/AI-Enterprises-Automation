"""Voice session lifecycle: create, upload audio, transcribe, and AI response."""

import shutil
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from langchain_core.messages import AIMessage, HumanMessage

from app.config import Settings
from app.models.ai_employee import AIEmployee
from app.models.enums import VoiceSessionStatus, VoiceTranscriptRole
from app.models.voice_agent import VoiceAgent
from app.models.voice_session import VoiceSession
from app.models.voice_transcript import VoiceTranscript
from app.schemas.voice_session import (
    VoiceSessionCreateRequest,
    VoiceSessionDetailResponse,
    VoiceSessionSummaryResponse,
    VoiceSessionUpdateRequest,
    VoiceTranscriptResponse,
)
from app.services.ai_employee_service import get_employee_or_404, list_knowledge_assignments
from app.services.chroma_service import ChromaService
from app.services.employee_rag_service import EmployeeRAGService, citations_to_json
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService
from app.services.voice_agent_service import get_voice_agent_or_404
from app.services.voice_transcription_service import transcribe_audio_file

ALLOWED_AUDIO_EXTENSIONS = frozenset({".mp3", ".wav", ".m4a", ".webm", ".ogg", ".mp4"})
ALLOWED_AUDIO_MIME_TYPES = frozenset({
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
    "audio/mp4",
    "audio/webm",
    "audio/ogg",
    "video/webm",
    "video/mp4",
})

ALLOWED_UPLOAD_STATUSES = frozenset({
    VoiceSessionStatus.PENDING,
    VoiceSessionStatus.FAILED,
    VoiceSessionStatus.COMPLETED,
})


def get_voice_session_or_404(
    db: Session,
    *,
    session_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> VoiceSession:
    session = db.scalar(
        select(VoiceSession).where(
            VoiceSession.id == session_id,
            VoiceSession.organization_id == organization_id,
        )
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice session not found",
        )
    return session


def list_voice_sessions(
    db: Session,
    *,
    organization_id: uuid.UUID,
    voice_agent_id: uuid.UUID | None = None,
) -> list[VoiceSessionSummaryResponse]:
    query = select(VoiceSession).where(VoiceSession.organization_id == organization_id)
    if voice_agent_id is not None:
        query = query.where(VoiceSession.voice_agent_id == voice_agent_id)

    sessions = list(
        db.scalars(query.order_by(VoiceSession.created_at.desc())).all()
    )
    if not sessions:
        return []

    agent_ids = {session.voice_agent_id for session in sessions}
    agents = {
        agent.id: agent
        for agent in db.scalars(
            select(VoiceAgent).where(VoiceAgent.id.in_(agent_ids))
        ).all()
    }

    transcript_counts = dict(
        db.execute(
            select(VoiceTranscript.voice_session_id, func.count())
            .where(
                VoiceTranscript.voice_session_id.in_([session.id for session in sessions])
            )
            .group_by(VoiceTranscript.voice_session_id)
        ).all()
    )

    return [
        VoiceSessionSummaryResponse(
            id=session.id,
            organization_id=session.organization_id,
            voice_agent_id=session.voice_agent_id,
            created_by_id=session.created_by_id,
            title=session.title,
            status=session.status,
            audio_file_path=session.audio_file_path,
            audio_mime_type=session.audio_mime_type,
            audio_duration_seconds=session.audio_duration_seconds,
            result=session.result,
            error_message=session.error_message,
            started_at=session.started_at,
            completed_at=session.completed_at,
            created_at=session.created_at,
            updated_at=session.updated_at,
            voice_agent_name=agents.get(session.voice_agent_id).name
            if agents.get(session.voice_agent_id)
            else None,
            transcript_count=transcript_counts.get(session.id, 0),
        )
        for session in sessions
    ]


def create_voice_session(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: VoiceSessionCreateRequest,
) -> VoiceSession:
    agent = get_voice_agent_or_404(
        db,
        agent_id=payload.voice_agent_id,
        organization_id=organization_id,
    )
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice agent must be active to create a session",
        )

    session = VoiceSession(
        organization_id=organization_id,
        voice_agent_id=payload.voice_agent_id,
        created_by_id=created_by_id,
        title=payload.title,
        status=VoiceSessionStatus.PENDING,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_voice_session(
    db: Session,
    *,
    session: VoiceSession,
    payload: VoiceSessionUpdateRequest,
) -> VoiceSession:
    if payload.title is not None:
        session.title = payload.title
    db.commit()
    db.refresh(session)
    return session


def delete_voice_session(db: Session, *, session: VoiceSession, upload_root: Path) -> None:
    if session.audio_file_path:
        audio_path = upload_root / session.audio_file_path
        if audio_path.exists():
            shutil.rmtree(audio_path.parent, ignore_errors=True)
    db.delete(session)
    db.commit()


def list_session_transcripts(
    db: Session,
    *,
    session_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> list[VoiceTranscript]:
    get_voice_session_or_404(db, session_id=session_id, organization_id=organization_id)
    return list(
        db.scalars(
            select(VoiceTranscript)
            .where(VoiceTranscript.voice_session_id == session_id)
            .order_by(VoiceTranscript.created_at.asc())
        ).all()
    )


def build_voice_session_detail_response(
    db: Session,
    *,
    session: VoiceSession,
) -> VoiceSessionDetailResponse:
    session_with_transcripts = db.scalar(
        select(VoiceSession)
        .where(VoiceSession.id == session.id)
        .options(selectinload(VoiceSession.transcripts))
    )
    if session_with_transcripts is None:
        session_with_transcripts = session

    agent = db.get(VoiceAgent, session.voice_agent_id)
    employee = db.get(AIEmployee, agent.ai_employee_id) if agent else None

    return VoiceSessionDetailResponse(
        id=session_with_transcripts.id,
        organization_id=session_with_transcripts.organization_id,
        voice_agent_id=session_with_transcripts.voice_agent_id,
        created_by_id=session_with_transcripts.created_by_id,
        title=session_with_transcripts.title,
        status=session_with_transcripts.status,
        audio_file_path=session_with_transcripts.audio_file_path,
        audio_mime_type=session_with_transcripts.audio_mime_type,
        audio_duration_seconds=session_with_transcripts.audio_duration_seconds,
        result=session_with_transcripts.result,
        error_message=session_with_transcripts.error_message,
        started_at=session_with_transcripts.started_at,
        completed_at=session_with_transcripts.completed_at,
        created_at=session_with_transcripts.created_at,
        updated_at=session_with_transcripts.updated_at,
        voice_agent_name=agent.name if agent else None,
        ai_employee_name=employee.name if employee else None,
        transcripts=[
            VoiceTranscriptResponse.model_validate(transcript)
            for transcript in session_with_transcripts.transcripts
        ],
    )


async def process_voice_session_audio(
    db: Session,
    *,
    settings: Settings,
    session: VoiceSession,
    file: UploadFile,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> VoiceSessionDetailResponse:
    """Upload audio, transcribe with Whisper, and generate an AI employee response."""
    processing_started = False

    if session.status not in ALLOWED_UPLOAD_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice session audio can only be uploaded when status is pending, failed, or completed",
        )

    agent = get_voice_agent_or_404(
        db,
        agent_id=session.voice_agent_id,
        organization_id=session.organization_id,
    )
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice agent must be active to process audio",
        )

    employee = get_employee_or_404(
        db,
        employee_id=agent.ai_employee_id,
        organization_id=session.organization_id,
    )

    original_filename = _safe_original_filename(file.filename)
    extension = Path(original_filename).suffix.lower()
    if extension not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}",
        )

    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type and content_type not in ALLOWED_AUDIO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio MIME type",
        )

    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file exceeds maximum size of {settings.max_upload_size_mb} MB",
        )
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty",
        )

    upload_root = Path(settings.upload_dir)
    turn_id = uuid.uuid4()
    relative_path = f"{session.organization_id}/voice/{session.id}/turn-{turn_id}{extension}"
    absolute_path = upload_root / relative_path

    existing_transcripts = list_session_transcripts(
        db,
        session_id=session.id,
        organization_id=session.organization_id,
    )
    conversation_history = build_conversation_history(existing_transcripts)

    session.status = VoiceSessionStatus.PROCESSING
    session.started_at = datetime.now(UTC)
    session.error_message = None
    session.completed_at = None
    db.commit()
    processing_started = True

    try:
        absolute_path.parent.mkdir(parents=True, exist_ok=True)
        absolute_path.write_bytes(content)

        session.audio_file_path = relative_path
        session.audio_mime_type = content_type or None
        db.commit()

        transcription = transcribe_audio_file(settings=settings, audio_path=absolute_path)
        caller_text = transcription["text"]
        if not caller_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract speech from the uploaded audio",
            )

        caller_transcript = VoiceTranscript(
            voice_session_id=session.id,
            role=VoiceTranscriptRole.CALLER,
            content=caller_text,
            metadata_={
                "language": transcription.get("language"),
                "segment_count": transcription.get("segments"),
                "audio_file_path": relative_path,
                "audio_mime_type": content_type or None,
            },
        )
        db.add(caller_transcript)
        db.flush()

        ai_answer, sources = _generate_voice_ai_response(
            db=db,
            settings=settings,
            employee=employee,
            question=caller_text,
            conversation_history=conversation_history,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            employee_rag_service=employee_rag_service,
        )

        ai_transcript = VoiceTranscript(
            voice_session_id=session.id,
            author_ai_employee_id=employee.id,
            role=VoiceTranscriptRole.AI_ASSISTANT,
            content=ai_answer,
            metadata_={"sources": citations_to_json(sources) or None},
        )
        db.add(ai_transcript)

        if not session.title:
            session.title = caller_text[:255]

        session.status = VoiceSessionStatus.COMPLETED
        session.completed_at = datetime.now(UTC)
        session.result = {
            "transcription_language": transcription.get("language"),
            "caller_text_length": len(caller_text),
            "ai_response_length": len(ai_answer),
        }
        db.commit()
        db.refresh(session)
        return build_voice_session_detail_response(db, session=session)
    except HTTPException as exc:
        if processing_started:
            db.rollback()
            session = get_voice_session_or_404(
                db,
                session_id=session.id,
                organization_id=session.organization_id,
            )
            session.status = VoiceSessionStatus.FAILED
            detail = exc.detail
            session.error_message = (
                detail if isinstance(detail, str) else "Voice session processing failed"
            )
            session.completed_at = datetime.now(UTC)
            db.commit()
        raise
    except Exception as exc:
        if processing_started:
            db.rollback()
            session = get_voice_session_or_404(
                db,
                session_id=session.id,
                organization_id=session.organization_id,
            )
            session.status = VoiceSessionStatus.FAILED
            session.error_message = str(exc)[:2000]
            session.completed_at = datetime.now(UTC)
            db.commit()
        detail = (
            str(exc)
            if settings.debug
            else "Failed to process voice session audio"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        ) from exc


def build_conversation_history(
    transcripts: list[VoiceTranscript],
) -> list[tuple[str, str]]:
    """Map stored transcripts to RAG conversation history tuples."""
    history: list[tuple[str, str]] = []
    for transcript in transcripts:
        if transcript.role == VoiceTranscriptRole.CALLER:
            history.append(("user", transcript.content))
        elif transcript.role == VoiceTranscriptRole.AI_ASSISTANT:
            history.append(("assistant", transcript.content))
    return history


def _history_messages_from_voice(
    conversation_history: list[tuple[str, str]],
) -> list[HumanMessage | AIMessage]:
    messages: list[HumanMessage | AIMessage] = []
    for role, content in conversation_history:
        if role == "user":
            messages.append(HumanMessage(content=content))
        else:
            messages.append(AIMessage(content=content))
    return messages


def resolve_transcript_audio_path(
    *,
    session: VoiceSession,
    transcript: VoiceTranscript,
    upload_root: Path,
) -> Path | None:
    """Return the on-disk audio path for a caller transcript, if available."""
    if transcript.role != VoiceTranscriptRole.CALLER:
        return None

    metadata = transcript.metadata_ or {}
    relative_path = metadata.get("audio_file_path")
    if not relative_path and session.audio_file_path:
        relative_path = session.audio_file_path

    if not relative_path:
        return None

    absolute_path = upload_root / str(relative_path)
    return absolute_path if absolute_path.is_file() else None


def _generate_voice_ai_response(
    db: Session,
    *,
    settings: Settings,
    employee: AIEmployee,
    question: str,
    conversation_history: list[tuple[str, str]],
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> tuple[str, list[Any]]:
    history_messages = _history_messages_from_voice(conversation_history)
    assignments = list_knowledge_assignments(db, employee=employee)
    if assignments:
        document_ids = [assignment.knowledge_document_id for assignment in assignments]
        return employee_rag_service.answer_for_employee(
            organization_id=employee.organization_id,
            system_prompt=employee.system_prompt,
            question=question,
            document_ids=document_ids,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            conversation_history=conversation_history,
        )

    rag_service = RAGService(settings)
    voice_prompt = (
        f"{employee.system_prompt.strip()}\n\n"
        "You are responding in a voice conversation. "
        "Be concise, helpful, and conversational."
    )
    answer = rag_service._generate_answer(
        question=question,
        context="No knowledge base documents are assigned to this employee.",
        system_prompt=voice_prompt,
        history_messages=history_messages,
    )
    return answer, []


def _safe_original_filename(filename: str | None) -> str:
    if not filename or not filename.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must include a filename",
        )
    return Path(filename.strip()).name
