"""Tests for customer support ticket APIs."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import support_tickets as support_tickets_endpoints
from app.config import get_settings
from app.main import app
from app.services.employee_rag_service import EmployeeRAGService
from tests.test_document_retrieval import MockEmbeddingService


class MockLLM:
    def invoke(self, messages: list) -> object:
        class Response:
            content = (
                "Employees receive 20 days of PTO per year after completing "
                "their probation period."
            )

        return Response()


@pytest.fixture(autouse=True)
def groq_api_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY", "test-groq-key"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def support_ai_client(client: TestClient) -> TestClient:
    app.dependency_overrides[support_tickets_endpoints.get_embedding_service] = (
        lambda: MockEmbeddingService()
    )
    app.dependency_overrides[support_tickets_endpoints.get_employee_rag_service] = (
        lambda: EmployeeRAGService(get_settings(), llm=MockLLM())
    )
    yield client
    app.dependency_overrides.pop(support_tickets_endpoints.get_embedding_service, None)
    app.dependency_overrides.pop(support_tickets_endpoints.get_employee_rag_service, None)


def _create_category(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload: dict[str, object] = {
        "name": "Billing",
        "description": "Billing and payment issues",
        "color": "#6B9BF8",
    }
    payload.update(overrides)
    response = client.post("/api/v1/support-categories", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _create_employee(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload: dict[str, object] = {
        "name": "Support Bot",
        "role": "Customer Support",
        "description": "Handles support tickets",
        "system_prompt": "You are a helpful customer support agent.",
    }
    payload.update(overrides)
    response = client.post("/api/v1/employees", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def _activate_employee(client: TestClient, headers: dict[str, str], employee_id: str) -> dict:
    response = client.post(f"/api/v1/employees/{employee_id}/activate", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_support_category_crud(client: TestClient, auth_headers: dict[str, str]) -> None:
    category = _create_category(client, auth_headers)
    assert category["slug"] == "billing"
    assert category["is_active"] is True

    list_response = client.get("/api/v1/support-categories", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) >= 1

    update_response = client.patch(
        f"/api/v1/support-categories/{category['id']}",
        json={"name": "Billing & Payments", "is_active": True},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Billing & Payments"

    delete_response = client.delete(
        f"/api/v1/support-categories/{category['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204


def test_support_ticket_lifecycle(client: TestClient, auth_headers: dict[str, str]) -> None:
    category = _create_category(client, auth_headers)
    employee = _create_employee(client, auth_headers)
    _activate_employee(client, auth_headers, employee["id"])

    me_response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_response.status_code == 200
    current_user = me_response.json()

    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "Cannot access dashboard",
            "description": "User reports login loop after password reset.",
            "category_id": category["id"],
            "customer_name": "Jane Customer",
            "customer_email": "jane@example.com",
            "priority": "high",
            "assigned_ai_employee_id": employee["id"],
            "initial_message": "Thanks for reaching out — we are looking into this.",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    ticket = create_response.json()
    assert ticket["slug"] == "cannot-access-dashboard"
    assert ticket["status"] == "open"
    assert ticket["priority"] == "high"
    assert ticket["assigned_ai_employee_id"] == employee["id"]

    detail_response = client.get(
        f"/api/v1/support-tickets/{ticket['id']}",
        headers=auth_headers,
    )
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["category_name"] == "Billing"
    assert detail["assigned_ai_employee_name"] == "Support Bot"
    assert detail["message_count"] >= 1

    assign_response = client.patch(
        f"/api/v1/support-tickets/{ticket['id']}",
        json={
            "assigned_user_id": current_user["id"],
            "status": "in_progress",
        },
        headers=auth_headers,
    )
    assert assign_response.status_code == 200
    assert assign_response.json()["status"] == "in_progress"
    assert assign_response.json()["assigned_user_id"] == current_user["id"]

    message_response = client.post(
        f"/api/v1/support-tickets/{ticket['id']}/messages",
        json={
            "content": "We cleared your session cache — please try again.",
            "role": "agent",
        },
        headers=auth_headers,
    )
    assert message_response.status_code == 201, message_response.text

    messages_response = client.get(
        f"/api/v1/support-tickets/{ticket['id']}/messages",
        headers=auth_headers,
    )
    assert messages_response.status_code == 200
    messages = messages_response.json()
    assert len(messages) >= 2

    resolve_response = client.patch(
        f"/api/v1/support-tickets/{ticket['id']}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert resolve_response.status_code == 200
    assert resolve_response.json()["status"] == "resolved"

    analytics_response = client.get("/api/v1/support-tickets/analytics", headers=auth_headers)
    assert analytics_response.status_code == 200
    analytics = analytics_response.json()
    assert analytics["total_tickets"] >= 1
    assert analytics["total_messages"] >= 2

    list_response = client.get(
        "/api/v1/support-tickets?status=resolved",
        headers=auth_headers,
    )
    assert list_response.status_code == 200
    assert any(item["id"] == ticket["id"] for item in list_response.json())

    delete_response = client.delete(
        f"/api/v1/support-tickets/{ticket['id']}",
        headers=auth_headers,
    )
    assert delete_response.status_code == 204


def test_support_ticket_invalid_status_transition(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "Closed ticket test",
            "description": "Testing invalid transitions",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    close_response = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "closed"},
        headers=auth_headers,
    )
    assert close_response.status_code == 200

    invalid_response = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "waiting"},
        headers=auth_headers,
    )
    assert invalid_response.status_code == 400


def test_support_ticket_not_found(client: TestClient, auth_headers: dict[str, str]) -> None:
    missing_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/support-tickets/{missing_id}", headers=auth_headers)
    assert response.status_code == 404


def test_support_ticket_suggest_response_requires_ai_employee(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "PTO balance question",
            "description": "How many PTO days do I have left?",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    response = client.post(
        f"/api/v1/support-tickets/{ticket_id}/suggest-response",
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "assigned AI employee" in response.json()["detail"]


def test_support_ticket_suggest_response(
    support_ai_client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(
        support_ai_client,
        auth_headers,
        name="HR Assistant",
        role="Human Resources",
        system_prompt="You are an HR assistant who answers policy questions.",
    )
    _activate_employee(support_ai_client, auth_headers, employee["id"])

    create_response = support_ai_client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "PTO policy question",
            "description": "How many PTO days do employees receive each year?",
            "assigned_ai_employee_id": employee["id"],
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    suggest_response = support_ai_client.post(
        f"/api/v1/support-tickets/{ticket_id}/suggest-response",
        headers=auth_headers,
    )
    assert suggest_response.status_code == 200, suggest_response.text
    payload = suggest_response.json()
    assert "PTO" in payload["suggestion"]
    assert isinstance(payload["sources"], list)
    assert 0.0 <= payload["confidence"] <= 1.0
    assert payload["recommended_status"] in {
        "open",
        "in_progress",
        "waiting",
        "resolved",
        "closed",
    }
    assert isinstance(payload["reasoning"], str)
    assert payload["reasoning"]
    assert isinstance(payload["can_auto_resolve"], bool)


def test_support_ticket_cannot_resolve_without_reply(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "Missing resolution reply",
            "description": "Customer asked about PTO carryover rules.",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    detail_response = client.get(f"/api/v1/support-tickets/{ticket_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["has_resolution"] is False

    resolve_response = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert resolve_response.status_code == 400
    assert "cannot be resolved" in resolve_response.json()["detail"].lower()


def test_support_ticket_reopen_requires_new_resolution(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "Reopen resolution test",
            "description": "Need updated PTO guidance.",
            "initial_message": "We are reviewing your request.",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    resolve_response = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert resolve_response.status_code == 200

    reopen_response = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "open"},
        headers=auth_headers,
    )
    assert reopen_response.status_code == 200

    detail_response = client.get(f"/api/v1/support-tickets/{ticket_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["has_resolution"] is False

    blocked_resolve = client.patch(
        f"/api/v1/support-tickets/{ticket_id}",
        json={"status": "resolved"},
        headers=auth_headers,
    )
    assert blocked_resolve.status_code == 400


def test_support_ticket_send_and_resolve(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/api/v1/support-tickets",
        json={
            "subject": "Quick PTO question",
            "description": "How do I request time off?",
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    ticket_id = create_response.json()["id"]

    message_response = client.post(
        f"/api/v1/support-tickets/{ticket_id}/messages",
        json={
            "content": "Submit your request in the HR portal at least two weeks in advance.",
            "role": "agent",
            "resolve_ticket": True,
        },
        headers=auth_headers,
    )
    assert message_response.status_code == 201, message_response.text

    ticket_response = client.get(
        f"/api/v1/support-tickets/{ticket_id}",
        headers=auth_headers,
    )
    assert ticket_response.status_code == 200
    ticket = ticket_response.json()
    assert ticket["status"] == "resolved"
    assert ticket["resolved_message_id"] is not None
    assert ticket["resolved_at"] is not None
    assert ticket["has_resolution"] is True
