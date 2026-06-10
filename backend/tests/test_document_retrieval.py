"""Tests for embeddings, ChromaDB storage, and semantic search."""

import math
import uuid

import fitz
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.api.v1.endpoints import documents as documents_endpoints
from app.db.session import SessionLocal
from app.main import app
from app.models.document_chunk import DocumentChunk


KEYWORDS = (
    "annual",
    "leave",
    "reimbursement",
    "probation",
    "refund",
    "employee",
    "policy",
)


class MockEmbeddingService:
    """Deterministic local embeddings for fast retrieval tests."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [_keyword_vector(text) for text in texts]

    def embed_query(self, query: str) -> list[float]:
        return _keyword_vector(query)


def _keyword_vector(text: str) -> list[float]:
    lowered = text.lower()
    values = [1.0 if keyword in lowered else 0.0 for keyword in KEYWORDS]
    values.append(min(len(lowered) / 1000.0, 1.0))
    norm = math.sqrt(sum(value * value for value in values)) or 1.0
    return [value / norm for value in values]


def _make_pdf_with_pages(pages: list[str]) -> bytes:
    document = fitz.open()
    for page_text in pages:
        page = document.new_page()
        page.insert_text((72, 72), page_text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def _upload_process_chunk_embed(
    client: TestClient,
    headers: dict[str, str],
    *,
    title: str,
    page_text: str,
) -> dict:
    unique = uuid.uuid4().hex[:8]
    upload = client.post(
        "/api/v1/documents",
        headers=headers,
        data={"title": title},
        files={"file": (f"{unique}.pdf", _make_pdf_with_pages([page_text]), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    document_id = upload.json()["id"]

    process = client.post(f"/api/v1/documents/{document_id}/process", headers=headers)
    assert process.status_code == 200, process.text

    chunk = client.post(f"/api/v1/documents/{document_id}/chunk", headers=headers)
    assert chunk.status_code == 200, chunk.text

    embed = client.post(f"/api/v1/documents/{document_id}/embed", headers=headers)
    assert embed.status_code == 200, embed.text
    return embed.json()


@pytest.fixture
def retrieval_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    """Client with mocked embeddings and isolated Chroma storage."""
    app.dependency_overrides[documents_endpoints.get_embedding_service] = lambda: MockEmbeddingService()
    yield client
    app.dependency_overrides.pop(documents_endpoints.get_embedding_service, None)


def test_embed_document_stores_chroma_ids_and_embedded_at(
    retrieval_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload = _upload_process_chunk_embed(
        retrieval_client,
        auth_headers,
        title="Leave Policy",
        page_text="Employees receive twenty annual leave days each year.",
    )
    assert payload["embedded_at"] is not None

    with SessionLocal() as db:
        chunks = list(
            db.scalars(
                select(DocumentChunk).where(DocumentChunk.document_id == uuid.UUID(payload["id"]))
            ).all()
        )
        assert chunks
        assert all(chunk.chroma_id == str(chunk.id) for chunk in chunks)


def test_reembed_replaces_vectors_without_duplicate_chunks(
    retrieval_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload = _upload_process_chunk_embed(
        retrieval_client,
        auth_headers,
        title="Expense Policy",
        page_text="Expense reimbursement requests must be submitted within thirty days.",
    )

    second_embed = retrieval_client.post(
        f"/api/v1/documents/{payload['id']}/embed",
        headers=auth_headers,
    )
    assert second_embed.status_code == 200

    with SessionLocal() as db:
        chunks = list(
            db.scalars(
                select(DocumentChunk).where(DocumentChunk.document_id == uuid.UUID(payload["id"]))
            ).all()
        )
        assert len(chunks) == payload["chunk_count"]
        assert all(chunk.chroma_id == str(chunk.id) for chunk in chunks)


def test_search_returns_matching_chunks_with_metadata(
    retrieval_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    _upload_process_chunk_embed(
        retrieval_client,
        auth_headers,
        title="Employee Handbook",
        page_text="Employees receive twenty annual leave days each year.",
    )

    response = retrieval_client.post(
        "/api/v1/documents/search",
        headers=auth_headers,
        json={"query": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["query"] == "How many annual leaves are allowed?"
    assert payload["results"]
    top_result = payload["results"][0]
    assert top_result["document_title"] == "Employee Handbook"
    assert "annual leave" in top_result["content"].lower()
    assert 0.0 <= top_result["similarity_score"] <= 1.0
    assert top_result["chunk_index"] >= 0


def test_embed_requires_chunked_document(
    retrieval_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unique = uuid.uuid4().hex[:8]
    upload = retrieval_client.post(
        "/api/v1/documents",
        headers=auth_headers,
        data={"title": "Unchunked"},
        files={
            "file": (
                f"{unique}.pdf",
                _make_pdf_with_pages(["Employees receive annual leave."]),
                "application/pdf",
            )
        },
    )
    document_id = upload.json()["id"]
    retrieval_client.post(f"/api/v1/documents/{document_id}/process", headers=auth_headers)

    response = retrieval_client.post(
        f"/api/v1/documents/{document_id}/embed",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Document must be chunked before embedding"


def test_search_returns_empty_results_when_nothing_is_embedded(
    retrieval_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = retrieval_client.post(
        "/api/v1/documents/search",
        headers=auth_headers,
        json={"query": "annual leave policy"},
    )
    assert response.status_code == 200
    assert response.json()["results"] == []
