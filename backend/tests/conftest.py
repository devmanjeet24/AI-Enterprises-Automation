"""Pytest configuration and shared fixtures."""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register a unique user and return Authorization headers for protected routes."""
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"audit.{unique}@example.com",
            "password": "securepass123",
            "first_name": "Audit",
            "last_name": "User",
            "organization_name": f"Audit Org {unique}",
        },
    )
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def department_id(client: TestClient, auth_headers: dict[str, str]) -> str:
    """Create a department for the authenticated user's organization."""
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/departments",
        json={"name": f"Engineering {unique}"},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]
