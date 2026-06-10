"""Tests for knowledge document upload."""

import uuid

import pytest
from fastapi.testclient import TestClient

MINIMAL_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj\n<< /Type /Catalog >>\nendobj\n"
    b"xref\n0 1\ntrailer\n<< /Root 1 0 R >>\nstartxref\n9\n%%EOF"
)


def test_admin_can_upload_pdf(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/documents",
        headers=auth_headers,
        data={"title": f"Employee Handbook {unique}", "document_type": "handbook"},
        files={"file": (f"handbook-{unique}.pdf", MINIMAL_PDF, "application/pdf")},
    )
    assert response.status_code == 201, response.text

    payload = response.json()
    assert payload["title"] == f"Employee Handbook {unique}"
    assert payload["document_type"] == "handbook"
    assert payload["status"] == "pending"
    assert payload["chunk_count"] == 0
    assert payload["original_filename"] == f"handbook-{unique}.pdf"
    assert payload["mime_type"] == "application/pdf"

    saved_file = upload_settings / payload["file_path"]
    assert saved_file.is_file()
    assert saved_file.read_bytes() == MINIMAL_PDF


def test_upload_rejects_non_pdf(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    response = client.post(
        "/api/v1/documents",
        headers=auth_headers,
        files={"file": ("notes.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 400
    assert "Only PDF files are allowed" in response.json()["detail"]


def test_upload_rejects_oversized_file(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings,
) -> None:
    oversized_pdf = MINIMAL_PDF + (b"0" * (1024 * 1024))
    response = client.post(
        "/api/v1/documents",
        headers=auth_headers,
        files={"file": ("large.pdf", oversized_pdf, "application/pdf")},
    )
    assert response.status_code == 413


@pytest.fixture
def member_headers(client: TestClient) -> dict[str, str]:
    """Register an organization admin, then a member in the same organization."""
    unique = uuid.uuid4().hex[:8]
    admin_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"doc-admin.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Doc",
            "last_name": "Admin",
            "organization_name": f"Doc Org {unique}",
        },
    )
    assert admin_response.status_code == 201, admin_response.text

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_response.json()['access_token']}"},
    )
    assert me_response.status_code == 200
    org_slug = me_response.json()["organization_slug"]

    member_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"doc-member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Doc",
            "last_name": "Member",
            "organization_slug": org_slug,
        },
    )
    assert member_response.status_code == 201, member_response.text
    token = member_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_member_cannot_upload_document(
    client: TestClient,
    member_headers: dict[str, str],
    upload_settings,
) -> None:
    response = client.post(
        "/api/v1/documents",
        headers=member_headers,
        files={"file": ("policy.pdf", MINIMAL_PDF, "application/pdf")},
    )
    assert response.status_code == 403
    assert "documents:write" in response.json()["detail"]
