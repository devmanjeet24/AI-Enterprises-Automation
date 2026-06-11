"""Tests for PDF text chunking."""

import uuid

import fitz
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.db.session import SessionLocal
from app.models.document_chunk import DocumentChunk
from app.services.chunking_service import ChunkingService, approximate_token_count


def _make_pdf_with_pages(pages: list[str]) -> bytes:
    document = fitz.open()
    for page_text in pages:
        page = document.new_page()
        page.insert_text((72, 72), page_text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def _upload_pdf(
    client: TestClient,
    headers: dict[str, str],
    *,
    filename: str,
    content: bytes,
    title: str,
) -> dict:
    response = client.post(
        "/api/v1/documents",
        headers=headers,
        data={"title": title},
        files={"file": (filename, content, "application/pdf")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _process_document(client: TestClient, headers: dict[str, str], document_id: str) -> dict:
    response = client.post(f"/api/v1/documents/{document_id}/process", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_chunking_service_splits_long_page_text() -> None:
    service = ChunkingService(chunk_size=50, chunk_overlap=10)
    long_text = "Policy sentence. " * 30

    chunks = service.split_page_text(long_text)

    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)


def test_approximate_token_count_uses_character_heuristic() -> None:
    assert approximate_token_count("abcd") == 1
    assert approximate_token_count("a" * 40) == 10


def test_chunk_document_creates_records_and_updates_chunk_count(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="handbook.pdf",
        content=_make_pdf_with_pages(
            [
                "Employees receive twenty annual leave days each year.",
                "Expense reimbursements must be submitted within thirty days.",
            ]
        ),
        title="Employee Handbook",
    )
    processed = _process_document(client, auth_headers, created["id"])
    assert processed["status"] == "ready"

    response = client.post(f"/api/v1/documents/{created['id']}/chunk", headers=auth_headers)
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["chunk_count"] > 0

    with SessionLocal() as db:
        chunks = list(
            db.scalars(
                select(DocumentChunk)
                .where(DocumentChunk.document_id == uuid.UUID(created["id"]))
                .order_by(DocumentChunk.chunk_index)
            ).all()
        )
        assert len(chunks) == payload["chunk_count"]
        assert chunks[0].chunk_index == 0
        assert chunks[0].page_number == 1
        assert chunks[0].content
        assert chunks[0].token_count is not None
        assert chunks[-1].page_number == 2


def test_rechunking_replaces_existing_chunks(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="policy.pdf",
        content=_make_pdf_with_pages(["Reimbursement requests require manager approval."]),
        title="Expense Policy",
    )
    _process_document(client, auth_headers, created["id"])

    first_chunk = client.post(f"/api/v1/documents/{created['id']}/chunk", headers=auth_headers)
    assert first_chunk.status_code == 200
    first_count = first_chunk.json()["chunk_count"]

    second_chunk = client.post(f"/api/v1/documents/{created['id']}/chunk", headers=auth_headers)
    assert second_chunk.status_code == 200
    assert second_chunk.json()["chunk_count"] == first_count

    with SessionLocal() as db:
        chunk_count = db.scalar(
            select(func.count())
            .select_from(DocumentChunk)
            .where(DocumentChunk.document_id == uuid.UUID(created["id"]))
        )
        duplicate_indexes = db.scalars(
            select(DocumentChunk.chunk_index)
            .where(DocumentChunk.document_id == uuid.UUID(created["id"]))
            .group_by(DocumentChunk.chunk_index)
            .having(func.count() > 1)
        ).all()
        assert chunk_count == first_count
        assert duplicate_indexes == []


def test_chunk_requires_processed_document(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="pending.pdf",
        content=_make_pdf_with_pages(["Pending policy text"]),
        title="Pending Policy",
    )

    response = client.post(f"/api/v1/documents/{created['id']}/chunk", headers=auth_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Document must be processed before chunking"


def test_chunk_enforces_organization_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="isolated.pdf",
        content=_make_pdf_with_pages(["Private SOP content"]),
        title="Private SOP",
    )
    _process_document(client, auth_headers, created["id"])

    other_unique = uuid.uuid4().hex[:8]
    other_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"chunker.{other_unique}@example.com",
            "password": "securepass123",
            "first_name": "Chunk",
            "last_name": "Other",
            "organization_name": f"Chunk Org {other_unique}",
        },
    )
    assert other_register.status_code == 201
    other_headers = {"Authorization": f"Bearer {other_register.json()['access_token']}"}

    response = client.post(
        f"/api/v1/documents/{created['id']}/chunk",
        headers=other_headers,
    )
    assert response.status_code == 404


@pytest.fixture
def member_headers(client: TestClient) -> dict[str, str]:
    unique = uuid.uuid4().hex[:8]
    admin_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"chunk-admin.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Chunk",
            "last_name": "Admin",
            "organization_name": f"Chunk Admin Org {unique}",
        },
    )
    assert admin_response.status_code == 201
    org_slug = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_response.json()['access_token']}"},
    ).json()["organization_slug"]

    member_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"chunk-member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Chunk",
            "last_name": "Member",
            "organization_slug": org_slug,
        },
    )
    assert member_response.status_code == 201
    return {"Authorization": f"Bearer {member_response.json()['access_token']}"}


def test_member_cannot_chunk_document(
    client: TestClient,
    auth_headers: dict[str, str],
    member_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="restricted.pdf",
        content=_make_pdf_with_pages(["Managers and admins only"]),
        title="Restricted",
    )
    _process_document(client, auth_headers, created["id"])

    response = client.post(
        f"/api/v1/documents/{created['id']}/chunk",
        headers=member_headers,
    )
    assert response.status_code == 403
    assert "documents:write" in response.json()["detail"]
