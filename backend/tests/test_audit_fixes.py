"""Tests for audit-report hardening: department delete, org active gate, IntegrityError."""

import uuid
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.exception_handlers import integrity_error_response
from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.user import User


def test_delete_department_with_teams_returns_409(
    client: TestClient,
    auth_headers: dict[str, str],
    department_id: str,
) -> None:
    unique = uuid.uuid4().hex[:8]
    team_response = client.post(
        "/api/v1/teams",
        json={"department_id": department_id, "name": f"Squad {unique}"},
        headers=auth_headers,
    )
    assert team_response.status_code == 201, team_response.text

    response = client.delete(
        f"/api/v1/departments/{department_id}",
        headers=auth_headers,
    )

    assert response.status_code == 409
    assert "Cannot delete department" in response.json()["detail"]
    assert "team" in response.json()["detail"]


def test_delete_department_without_teams_succeeds(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unique = uuid.uuid4().hex[:8]
    create_response = client.post(
        "/api/v1/departments",
        json={"name": f"Empty Dept {unique}"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201, create_response.text
    department_id = create_response.json()["id"]

    response = client.delete(
        f"/api/v1/departments/{department_id}",
        headers=auth_headers,
    )

    assert response.status_code == 204


def test_inactive_organization_blocks_authenticated_access(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    me_response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_response.status_code == 200, me_response.text
    organization_id = me_response.json()["organization_id"]

    with SessionLocal() as db:
        organization = db.scalar(
            select(Organization).where(Organization.id == organization_id)
        )
        assert organization is not None
        organization.is_active = False
        db.commit()

    try:
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 403
        assert response.json()["detail"] == "Organization is not active"
    finally:
        with SessionLocal() as db:
            organization = db.scalar(
                select(Organization).where(Organization.id == organization_id)
            )
            assert organization is not None
            organization.is_active = True
            db.commit()


@pytest.mark.parametrize(
    "constraint_name,expected_detail",
    [
        (
            "uq_departments_organization_id_slug",
            "Department slug is already taken in this organization",
        ),
        ("ix_users_email", "A user with this email already exists"),
    ],
)
def test_integrity_error_response_maps_known_constraints(
    constraint_name: str,
    expected_detail: str,
) -> None:
    orig = MagicMock()
    orig.pgcode = "23505"
    orig.diag.constraint_name = constraint_name
    exc = IntegrityError("INSERT", {}, orig)

    response = integrity_error_response(exc)

    assert response.status_code == 409
    assert response.body.decode() == f'{{"detail":"{expected_detail}"}}'


def test_integrity_error_response_falls_back_to_pgcode_message() -> None:
    orig = MagicMock()
    orig.pgcode = "23503"
    orig.diag.constraint_name = None
    exc = IntegrityError("DELETE", {}, orig)

    response = integrity_error_response(exc)

    assert response.status_code == 409
    assert "related records exist" in response.body.decode()


def test_register_duplicate_email_returns_409_not_500(client: TestClient) -> None:
    unique = uuid.uuid4().hex[:8]
    payload = {
        "email": f"dup.{unique}@example.com",
        "password": "securepass123",
        "first_name": "Dup",
        "last_name": "User",
        "organization_name": f"Dup Org {unique}",
    }

    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201, first.text

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409
    assert "email" in second.json()["detail"].lower()


def test_inactive_organization_blocks_login_for_existing_user(
    client: TestClient,
) -> None:
    unique = uuid.uuid4().hex[:8]
    email = f"inactive-org.{unique}@example.com"
    password = "securepass123"
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Inactive",
            "last_name": "Org",
            "organization_name": f"Inactive Org {unique}",
        },
    )
    assert register_response.status_code == 201, register_response.text

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None
        organization = db.scalar(
            select(Organization).where(Organization.id == user.organization_id)
        )
        assert organization is not None
        organization.is_active = False
        db.commit()

    try:
        login_response = client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": password},
        )
        assert login_response.status_code == 200

        token = login_response.json()["access_token"]
        me_response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_response.status_code == 403
        assert me_response.json()["detail"] == "Organization is not active"
    finally:
        with SessionLocal() as db:
            user = db.scalar(select(User).where(User.email == email))
            assert user is not None
            organization = db.scalar(
                select(Organization).where(Organization.id == user.organization_id)
            )
            assert organization is not None
            organization.is_active = True
            db.commit()
