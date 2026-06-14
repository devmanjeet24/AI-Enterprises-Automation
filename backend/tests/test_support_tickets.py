"""Tests for customer support ticket APIs."""

import uuid

from fastapi.testclient import TestClient


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
