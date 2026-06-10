"""Tests for PDF document processing."""

import uuid

import fitz
import pytest
from fastapi.testclient import TestClient



def _make_pdf_with_text(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


def _make_blank_page_pdf() -> bytes:
    document = fitz.open()
    document.new_page()
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


def test_process_document_extracts_text_and_marks_ready(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="handbook.pdf",
        content=_make_pdf_with_text("Employees receive 20 annual leave days."),
        title="Leave Policy",
    )
    assert created["status"] == "pending"

    response = client.post(
        f"/api/v1/documents/{created['id']}/process",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["page_count"] == 1
    assert payload["processed_at"] is not None
    assert payload["error_message"] is None
    assert payload["chunk_count"] == 0


def test_process_document_fails_for_pdf_without_text(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="blank.pdf",
        content=_make_blank_page_pdf(),
        title="Blank PDF",
    )

    response = client.post(
        f"/api/v1/documents/{created['id']}/process",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text

    payload = response.json()
    assert payload["status"] == "failed"
    assert payload["error_message"] == "No extractable text found in PDF"
    assert payload["page_count"] is None
    assert payload["processed_at"] is None


def test_process_document_fails_when_file_is_missing(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="missing.pdf",
        content=_make_pdf_with_text("Temporary content"),
        title="Missing File",
    )
    saved_file = upload_settings / created["file_path"]
    saved_file.unlink()

    response = client.post(
        f"/api/v1/documents/{created['id']}/process",
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "failed"
    assert response.json()["error_message"] == "PDF file not found on disk"


def test_process_document_enforces_organization_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="private.pdf",
        content=_make_pdf_with_text("Private policy text"),
        title="Private Policy",
    )

    other_unique = uuid.uuid4().hex[:8]
    other_register = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"processor.{other_unique}@example.com",
            "password": "securepass123",
            "first_name": "Processor",
            "last_name": "Other",
            "organization_name": f"Processor Org {other_unique}",
        },
    )
    assert other_register.status_code == 201, other_register.text
    other_headers = {
        "Authorization": f"Bearer {other_register.json()['access_token']}",
    }

    response = client.post(
        f"/api/v1/documents/{created['id']}/process",
        headers=other_headers,
    )
    assert response.status_code == 404


@pytest.fixture
def member_headers(client: TestClient) -> dict[str, str]:
    unique = uuid.uuid4().hex[:8]
    admin_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"process-admin.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Process",
            "last_name": "Admin",
            "organization_name": f"Process Org {unique}",
        },
    )
    assert admin_response.status_code == 201, admin_response.text

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_response.json()['access_token']}"},
    )
    org_slug = me_response.json()["organization_slug"]

    member_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"process-member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Process",
            "last_name": "Member",
            "organization_slug": org_slug,
        },
    )
    assert member_response.status_code == 201, member_response.text
    return {"Authorization": f"Bearer {member_response.json()['access_token']}"}


def test_member_cannot_process_document(
    client: TestClient,
    auth_headers: dict[str, str],
    member_headers: dict[str, str],
    upload_settings,
) -> None:
    created = _upload_pdf(
        client,
        auth_headers,
        filename="restricted.pdf",
        content=_make_pdf_with_text("Managers and admins only"),
        title="Restricted",
    )

    response = client.post(
        f"/api/v1/documents/{created['id']}/process",
        headers=member_headers,
    )
    assert response.status_code == 403
    assert "documents:write" in response.json()["detail"]
