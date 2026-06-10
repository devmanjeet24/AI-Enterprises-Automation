"""Tests for RAG knowledge question answering."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import knowledge as knowledge_endpoints
from app.config import get_settings
from app.main import app
from app.schemas.knowledge_query import NO_RELEVANT_INFORMATION_MESSAGE
from app.services.rag_service import RAGService
from tests.test_document_retrieval import (
    MockEmbeddingService,
    _upload_process_chunk_embed,
)


class MockLLM:
    """Return a deterministic grounded answer for tests."""

    def invoke(self, messages: list) -> object:
        class Response:
            content = "Employees receive twenty annual leave days each year."

        return Response()


class FailingMockLLM:
    def invoke(self, messages: list) -> object:
        raise RuntimeError("Groq API unavailable")


@pytest.fixture(autouse=True)
def groq_api_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY", "test-groq-key"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def rag_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    """Client with mocked embeddings and mocked Groq generation."""
    app.dependency_overrides[knowledge_endpoints.get_embedding_service] = lambda: MockEmbeddingService()
    app.dependency_overrides[knowledge_endpoints.get_rag_service] = (
        lambda: RAGService(get_settings(), llm=MockLLM())
    )
    yield client
    app.dependency_overrides.pop(knowledge_endpoints.get_embedding_service, None)
    app.dependency_overrides.pop(knowledge_endpoints.get_rag_service, None)


def test_query_returns_answer_with_citations(
    rag_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    _upload_process_chunk_embed(
        rag_client,
        auth_headers,
        title="Employee Handbook",
        page_text="Employees receive twenty annual leave days each year.",
    )

    response = rag_client.post(
        "/api/v1/knowledge/query",
        headers=auth_headers,
        json={"question": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert "twenty annual leave days" in payload["answer"].lower()
    assert payload["sources"]
    assert payload["sources"][0]["document_title"] == "Employee Handbook"
    assert payload["sources"][0]["similarity_score"] > 0


def test_query_returns_no_information_when_knowledge_base_is_empty(
    rag_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = rag_client.post(
        "/api/v1/knowledge/query",
        headers=auth_headers,
        json={"question": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200
    assert response.json()["answer"] == NO_RELEVANT_INFORMATION_MESSAGE
    assert response.json()["sources"] == []


def test_query_returns_no_information_for_low_confidence_matches(
    rag_client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RETRIEVAL_MIN_SIMILARITY_SCORE", "0.99")
    get_settings.cache_clear()

    _upload_process_chunk_embed(
        rag_client,
        auth_headers,
        title="Unrelated Handbook",
        page_text="The office cafeteria opens at 8 AM on weekdays.",
    )

    response = rag_client.post(
        "/api/v1/knowledge/query",
        headers=auth_headers,
        json={"question": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200
    assert response.json()["answer"] == NO_RELEVANT_INFORMATION_MESSAGE
    assert response.json()["sources"] == []


def test_query_handles_groq_failure(
    rag_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    app.dependency_overrides[knowledge_endpoints.get_rag_service] = (
        lambda: RAGService(get_settings(), llm=FailingMockLLM())
    )

    _upload_process_chunk_embed(
        rag_client,
        auth_headers,
        title="Employee Handbook",
        page_text="Employees receive twenty annual leave days each year.",
    )

    response = rag_client.post(
        "/api/v1/knowledge/query",
        headers=auth_headers,
        json={"question": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to generate answer from language model"


def test_member_can_query_knowledge_base(
    rag_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unique = uuid.uuid4().hex[:8]
    admin_me = rag_client.get("/api/v1/auth/me", headers=auth_headers).json()
    org_slug = admin_me["organization_slug"]

    member_register = rag_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"rag-member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Rag",
            "last_name": "Member",
            "organization_slug": org_slug,
        },
    )
    assert member_register.status_code == 201
    member_headers = {"Authorization": f"Bearer {member_register.json()['access_token']}"}

    _upload_process_chunk_embed(
        rag_client,
        auth_headers,
        title="Leave Policy",
        page_text="Employees receive twenty annual leave days each year.",
    )

    response = rag_client.post(
        "/api/v1/knowledge/query",
        headers=member_headers,
        json={"question": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200
    assert response.json()["sources"]
