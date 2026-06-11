"""Tests for AI employee chat and conversation APIs."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import employees as employees_endpoints
from app.config import get_settings
from app.main import app
from app.schemas.knowledge_query import NO_RELEVANT_INFORMATION_MESSAGE
from app.services.employee_rag_service import EmployeeRAGService
from tests.test_ai_employee_management import (
    _create_employee,
    _employee_payload,
    _upload_ready_embedded_document,
)
from tests.test_document_retrieval import MockEmbeddingService


class MockLLM:
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
def chat_client(
    client: TestClient,
    upload_settings,
    chroma_settings,
) -> TestClient:
    app.dependency_overrides[employees_endpoints.get_embedding_service] = (
        lambda: MockEmbeddingService()
    )
    app.dependency_overrides[employees_endpoints.get_employee_rag_service] = (
        lambda: EmployeeRAGService(get_settings(), llm=MockLLM())
    )
    yield client
    app.dependency_overrides.pop(employees_endpoints.get_embedding_service, None)
    app.dependency_overrides.pop(employees_endpoints.get_employee_rag_service, None)


def _prepare_active_employee_with_knowledge(
    client: TestClient,
    headers: dict[str, str],
) -> tuple[dict, dict]:
    employee = _create_employee(client, headers)
    document = _upload_ready_embedded_document(client, headers, title="Employee Handbook")

    assign = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [document["id"]]},
        headers=headers,
    )
    assert assign.status_code == 200, assign.text

    activate = client.post(
        f"/api/v1/employees/{employee['id']}/activate",
        headers=headers,
    )
    assert activate.status_code == 200, activate.text
    return employee, document


def test_chat_returns_answer_with_citations_and_saves_conversation(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee, _document = _prepare_active_employee_with_knowledge(chat_client, auth_headers)

    response = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["employee_id"] == employee["id"]
    assert payload["employee_name"] == employee["name"]
    assert "twenty annual leave days" in payload["answer"].lower()
    assert payload["sources"]
    assert payload["sources"][0]["document_title"] == "Employee Handbook"

    conversations = chat_client.get(
        f"/api/v1/employees/{employee['id']}/conversations",
        headers=auth_headers,
    )
    assert conversations.status_code == 200
    assert len(conversations.json()) == 1

    conversation_id = payload["conversation_id"]
    detail = chat_client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers=auth_headers,
    )
    assert detail.status_code == 200
    messages = detail.json()["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"
    assert messages[1]["sources"]


def test_chat_continues_existing_conversation(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee, _document = _prepare_active_employee_with_knowledge(chat_client, auth_headers)

    first = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    assert first.status_code == 200
    conversation_id = first.json()["conversation_id"]

    second = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={
            "message": "Can you confirm that again?",
            "conversation_id": conversation_id,
        },
    )
    assert second.status_code == 200
    assert second.json()["conversation_id"] == conversation_id

    detail = chat_client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers=auth_headers,
    )
    assert len(detail.json()["messages"]) == 4


def test_chat_rejects_inactive_employee(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(chat_client, auth_headers)
    document = _upload_ready_embedded_document(chat_client, auth_headers, title="Handbook")
    chat_client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [document["id"]]},
        headers=auth_headers,
    )

    response = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


def test_chat_rejects_employee_without_assigned_knowledge(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(chat_client, auth_headers)
    chat_client.post(f"/api/v1/employees/{employee['id']}/activate", headers=auth_headers)

    response = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 400
    assert "no assigned knowledge" in response.json()["detail"].lower()


def test_chat_returns_no_information_when_retrieval_is_empty(
    chat_client: TestClient,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("RETRIEVAL_MIN_SIMILARITY_SCORE", "0.99")
    get_settings.cache_clear()

    employee, _document = _prepare_active_employee_with_knowledge(chat_client, auth_headers)

    response = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "What is the company refund policy for Mars travel?"},
    )
    assert response.status_code == 200
    assert response.json()["answer"] == NO_RELEVANT_INFORMATION_MESSAGE
    assert response.json()["sources"] == []


def test_chat_handles_groq_failure(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    app.dependency_overrides[employees_endpoints.get_employee_rag_service] = (
        lambda: EmployeeRAGService(get_settings(), llm=FailingMockLLM())
    )

    employee, _document = _prepare_active_employee_with_knowledge(chat_client, auth_headers)

    response = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    assert response.status_code == 502

    conversations = chat_client.get(
        f"/api/v1/employees/{employee['id']}/conversations",
        headers=auth_headers,
    )
    assert conversations.json() == []


def test_conversation_enforces_organization_isolation(
    chat_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee, _document = _prepare_active_employee_with_knowledge(chat_client, auth_headers)
    chat = chat_client.post(
        f"/api/v1/employees/{employee['id']}/chat",
        headers=auth_headers,
        json={"message": "How many annual leaves are allowed?"},
    )
    conversation_id = chat.json()["conversation_id"]

    other_unique = uuid.uuid4().hex[:8]
    other_register = chat_client.post(
        "/api/v1/auth/register",
        json={
            "email": f"chat-other.{other_unique}@example.com",
            "password": "securepass123",
            "first_name": "Other",
            "last_name": "User",
            "organization_name": f"Other Org {other_unique}",
        },
    )
    other_headers = {"Authorization": f"Bearer {other_register.json()['access_token']}"}

    response = chat_client.get(
        f"/api/v1/conversations/{conversation_id}",
        headers=other_headers,
    )
    assert response.status_code == 404
