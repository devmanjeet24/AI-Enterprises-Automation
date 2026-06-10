"""Tests for knowledge document list, detail, and delete APIs."""

import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import get_settings
from app.db.session import SessionLocal
from app.models.document_chunk import DocumentChunk
from app.models.knowledge_document import KnowledgeDocument
from tests.test_document_upload import MINIMAL_PDF


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


def test_list_documents_returns_org_records_only(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    first = _upload_document(client, auth_headers, title="First Handbook")
    second = _upload_document(client, auth_headers, title="Second Handbook")

    response = client.get("/api/v1/documents", headers=auth_headers)
    assert response.status_code == 200

    payload = response.json()
    titles = {item["title"] for item in payload}
    assert first["title"] in titles
    assert second["title"] in titles
    assert all(item["organization_id"] == first["organization_id"] for item in payload)


def test_list_documents_filters_by_status(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    _upload_document(client, auth_headers, title="Pending Document")

    response = client.get(
        "/api/v1/documents",
        headers=auth_headers,
        params={"status": "pending"},
    )
    assert response.status_code == 200
    assert response.json()
    assert all(item["status"] == "pending" for item in response.json())

    empty_response = client.get(
        "/api/v1/documents",
        headers=auth_headers,
        params={"status": "ready"},
    )
    assert empty_response.status_code == 200
    assert empty_response.json() == []


def test_get_document_returns_details(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    created = _upload_document(client, auth_headers, title="Policy Document")

    response = client.get(f"/api/v1/documents/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]
    assert response.json()["title"] == "Policy Document"


def test_get_document_enforces_organization_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    created = _upload_document(client, auth_headers, title="Private Document")

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
    assert other_register.status_code == 201, other_register.text
    other_headers = {
        "Authorization": f"Bearer {other_register.json()['access_token']}",
    }

    response = client.get(f"/api/v1/documents/{created['id']}", headers=other_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found"


def test_delete_document_removes_database_record_and_file(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    created = _upload_document(client, auth_headers, title="Delete Me")
    document_id = created["id"]
    saved_file = upload_settings / created["file_path"]
    assert saved_file.is_file()

    with SessionLocal() as db:
        db.add(
            DocumentChunk(
                document_id=uuid.UUID(document_id),
                organization_id=uuid.UUID(created["organization_id"]),
                chunk_index=0,
                content="Sample chunk for delete test",
            )
        )
        db.commit()

    response = client.delete(f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 204

    assert not saved_file.exists()

    with SessionLocal() as db:
        document = db.scalar(
            select(KnowledgeDocument).where(KnowledgeDocument.id == uuid.UUID(document_id))
        )
        chunks = list(
            db.scalars(
                select(DocumentChunk).where(DocumentChunk.document_id == uuid.UUID(document_id))
            ).all()
        )
        assert document is None
        assert chunks == []

    get_response = client.get(f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_delete_document_succeeds_when_file_is_missing(
    client: TestClient,
    auth_headers: dict[str, str],
    upload_settings: Path,
) -> None:
    created = _upload_document(client, auth_headers, title="Missing File")
    document_id = created["id"]
    saved_file = upload_settings / created["file_path"]
    saved_file.unlink()

    response = client.delete(f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 204

    get_response = client.get(f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert get_response.status_code == 404


@pytest.fixture
def org_admin_and_member_headers(client: TestClient) -> dict[str, dict[str, str]]:
    """Create one organization with separate admin and member tokens."""
    unique = uuid.uuid4().hex[:8]
    admin_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"mgmt-admin.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Mgmt",
            "last_name": "Admin",
            "organization_name": f"Mgmt Org {unique}",
        },
    )
    assert admin_response.status_code == 201, admin_response.text
    admin_headers = {"Authorization": f"Bearer {admin_response.json()['access_token']}"}

    me_response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert me_response.status_code == 200
    org_slug = me_response.json()["organization_slug"]

    member_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"mgmt-member.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Mgmt",
            "last_name": "Member",
            "organization_slug": org_slug,
        },
    )
    assert member_response.status_code == 201, member_response.text
    member_headers = {"Authorization": f"Bearer {member_response.json()['access_token']}"}

    return {"admin": admin_headers, "member": member_headers}


def test_member_can_list_but_cannot_delete_document(
    client: TestClient,
    org_admin_and_member_headers: dict[str, dict[str, str]],
    upload_settings: Path,
) -> None:
    created = _upload_document(
        client,
        org_admin_and_member_headers["admin"],
        title="Shared Document",
    )

    list_response = client.get(
        "/api/v1/documents",
        headers=org_admin_and_member_headers["member"],
    )
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json())

    delete_response = client.delete(
        f"/api/v1/documents/{created['id']}",
        headers=org_admin_and_member_headers["member"],
    )
    assert delete_response.status_code == 403
    assert "documents:delete" in delete_response.json()["detail"]
