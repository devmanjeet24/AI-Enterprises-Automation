"""Tests for AI Employee Studio management APIs."""

import uuid

import fitz
import pytest
from fastapi.testclient import TestClient

from tests.test_document_upload import MINIMAL_PDF


def _employee_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": "Maya",
        "role": "HR Assistant",
        "description": "Answers HR policy questions",
        "system_prompt": "You are a helpful HR assistant. Answer only from assigned documents.",
    }
    payload.update(overrides)
    return payload


def _create_employee(
    client: TestClient,
    headers: dict[str, str],
    **overrides: object,
) -> dict:
    response = client.post(
        "/api/v1/employees",
        json=_employee_payload(**overrides),
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _upload_document(
    client: TestClient,
    headers: dict[str, str],
    *,
    title: str,
) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/documents",
        headers=headers,
        data={"title": title},
        files={"file": (f"{unique}.pdf", MINIMAL_PDF, "application/pdf")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _make_pdf_with_text(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def _upload_ready_embedded_document(
    client: TestClient,
    headers: dict[str, str],
    *,
    title: str,
) -> dict:
    unique = uuid.uuid4().hex[:8]
    upload = client.post(
        "/api/v1/documents",
        headers=headers,
        data={"title": title},
        files={
            "file": (
                f"{unique}.pdf",
                _make_pdf_with_text("Employees receive twenty annual leave days."),
                "application/pdf",
            )
        },
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


def test_create_and_list_employees(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    created = _create_employee(client, auth_headers, name="Support Bot")

    response = client.get("/api/v1/employees", headers=auth_headers)
    assert response.status_code == 200
    names = {item["name"] for item in response.json()}
    assert "Support Bot" in names
    assert created["status"] == "inactive"
    assert created["created_by_id"] is not None


def test_get_employee_detail_includes_assignments(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
    chroma_settings,
) -> None:
    employee = _create_employee(client, auth_headers)
    document = _upload_ready_embedded_document(client, auth_headers, title="HR Handbook")

    tools_response = client.put(
        f"/api/v1/employees/{employee['id']}/tools",
        json={"tools": [{"tool_slug": "knowledge_search", "is_enabled": True}]},
        headers=auth_headers,
    )
    assert tools_response.status_code == 200, tools_response.text

    knowledge_response = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [document["id"]]},
        headers=auth_headers,
    )
    assert knowledge_response.status_code == 200, knowledge_response.text

    detail = client.get(f"/api/v1/employees/{employee['id']}", headers=auth_headers)
    assert detail.status_code == 200
    body = detail.json()
    assert len(body["document_assignments"]) == 1
    assert body["document_assignments"][0]["knowledge_document_id"] == document["id"]
    assert len(body["tools"]) == 1
    assert body["tools"][0]["tool_slug"] == "knowledge_search"


def test_update_and_delete_employee(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)

    patch = client.patch(
        f"/api/v1/employees/{employee['id']}",
        json={"name": "Updated Maya", "status": "active"},
        headers=auth_headers,
    )
    assert patch.status_code == 200
    assert patch.json()["name"] == "Updated Maya"
    assert patch.json()["status"] == "active"

    delete = client.delete(f"/api/v1/employees/{employee['id']}", headers=auth_headers)
    assert delete.status_code == 204

    missing = client.get(f"/api/v1/employees/{employee['id']}", headers=auth_headers)
    assert missing.status_code == 404


def test_patch_employee_requires_fields(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)
    response = client.patch(
        f"/api/v1/employees/{employee['id']}",
        json={},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_employee_enforces_organization_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)

    other_unique = uuid.uuid4().hex[:8]
    other_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"other.{other_unique}@example.com",
            "password": "securepass123",
            "first_name": "Other",
            "last_name": "User",
            "organization_name": f"Other Org {other_unique}",
        },
    )
    assert other_register.status_code == 201
    other_headers = {"Authorization": f"Bearer {other_register.json()['access_token']}"}

    response = client.get(f"/api/v1/employees/{employee['id']}", headers=other_headers)
    assert response.status_code == 404


def test_assign_only_ready_embedded_documents(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    employee = _create_employee(client, auth_headers)
    pending = _upload_document(client, auth_headers, title="Pending Handbook")

    response = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [pending["id"]]},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "embedded" in response.text.lower()


def test_replace_knowledge_assignments_deduplicates_ids(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
    chroma_settings,
) -> None:
    employee = _create_employee(client, auth_headers)
    document = _upload_ready_embedded_document(client, auth_headers, title="Policy Doc")

    response = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": [document["id"], document["id"]]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1

    clear = client.put(
        f"/api/v1/employees/{employee['id']}/knowledge",
        json={"knowledge_document_ids": []},
        headers=auth_headers,
    )
    assert clear.status_code == 200
    assert clear.json() == []

    listed = client.get(
        f"/api/v1/employees/{employee['id']}/knowledge",
        headers=auth_headers,
    )
    assert listed.status_code == 200
    assert listed.json() == []


def test_replace_tool_assignments_validates_slugs(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)

    unknown = client.put(
        f"/api/v1/employees/{employee['id']}/tools",
        json={"tools": [{"tool_slug": "unknown_tool", "is_enabled": True}]},
        headers=auth_headers,
    )
    assert unknown.status_code == 400
    assert "Unknown tool slug" in unknown.text

    duplicate = client.put(
        f"/api/v1/employees/{employee['id']}/tools",
        json={
            "tools": [
                {"tool_slug": "calculator", "is_enabled": True},
                {"tool_slug": "calculator", "is_enabled": False},
            ]
        },
        headers=auth_headers,
    )
    assert duplicate.status_code == 422
    assert "Duplicate tool slugs" in duplicate.text


def test_activate_and_deactivate_employee(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)

    activate = client.post(
        f"/api/v1/employees/{employee['id']}/activate",
        headers=auth_headers,
    )
    assert activate.status_code == 200
    assert activate.json()["status"] == "active"

    deactivate = client.post(
        f"/api/v1/employees/{employee['id']}/deactivate",
        headers=auth_headers,
    )
    assert deactivate.status_code == 200
    assert deactivate.json()["status"] == "inactive"

    second_activate = client.post(
        f"/api/v1/employees/{employee['id']}/activate",
        headers=auth_headers,
    )
    assert second_activate.status_code == 200
    assert second_activate.json()["status"] == "active"


def test_list_employees_filters_by_status(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    active_employee = _create_employee(client, auth_headers, name="Active Bot", status="active")
    _create_employee(client, auth_headers, name="Inactive Bot", status="inactive")

    active_only = client.get(
        "/api/v1/employees",
        headers=auth_headers,
        params={"status": "active"},
    )
    assert active_only.status_code == 200
    ids = {item["id"] for item in active_only.json()}
    assert active_employee["id"] in ids
    assert all(item["status"] == "active" for item in active_only.json())


def test_member_cannot_create_employees(client: TestClient) -> None:
    unique = uuid.uuid4().hex[:8]
    admin_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"admin.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Admin",
            "last_name": "User",
            "organization_name": f"Employee Org {unique}",
        },
    )
    assert admin_register.status_code == 201
    admin_headers = {"Authorization": f"Bearer {admin_register.json()['access_token']}"}
    me_response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_response.status_code == 200
    org_slug = me_response.json()["organization_slug"]

    member_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Member",
            "last_name": "User",
            "organization_slug": org_slug,
        },
    )
    assert member_register.status_code == 201
    member_headers = {
        "Authorization": f"Bearer {member_register.json()['access_token']}"
    }

    response = client.post(
        "/api/v1/employees",
        json=_employee_payload(),
        headers=member_headers,
    )
    assert response.status_code == 403
