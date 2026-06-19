"""Tests for omnichannel automatic AI replies."""

import os
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings


@pytest.fixture(autouse=True)
def groq_api_key_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GROQ_API_KEY", os.getenv("GROQ_API_KEY", "test-groq-key"))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _create_employee(client: TestClient, headers: dict[str, str]) -> dict:
    response = client.post(
        "/api/v1/employees",
        json={
            "name": "Omnichannel Bot",
            "role": "Support",
            "description": "Handles omnichannel chats",
            "system_prompt": "You are a helpful support assistant.",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    employee = response.json()
    activate = client.post(f"/api/v1/employees/{employee['id']}/activate", headers=headers)
    assert activate.status_code == 200, activate.text
    return activate.json()


def _create_website_chat_channel(
    client: TestClient,
    headers: dict[str, str],
    *,
    ai_employee_id: str | None,
) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"Website Support {unique}",
            "slug": f"website-support-{unique}",
            "channel_type": "website_chat",
            "ai_employee_id": ai_employee_id,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Thanks for reaching out. I can help with that.", []),
)
def test_widget_start_conversation_triggers_auto_reply(
    _mock_generate: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)
    channel = _create_website_chat_channel(client, auth_headers, ai_employee_id=employee["id"])
    public_key = channel["public_key"]
    assert public_key

    start_response = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations",
        json={"initial_message": "I need help with billing"},
    )
    assert start_response.status_code == 201, start_response.text
    conversation_id = start_response.json()["id"]

    messages_response = client.get(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
    )
    assert messages_response.status_code == 200, messages_response.text
    messages = messages_response.json()
    roles = [message["role"] for message in messages]
    assert roles == ["customer", "ai_assistant"]
    assert messages[1]["content"] == "Thanks for reaching out. I can help with that."


@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Here is the follow-up answer.", []),
)
def test_widget_customer_message_triggers_auto_reply(
    _mock_generate: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)
    channel = _create_website_chat_channel(client, auth_headers, ai_employee_id=employee["id"])
    public_key = channel["public_key"]

    start_response = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations",
        json={"initial_message": "Hello"},
    )
    assert start_response.status_code == 201, start_response.text
    conversation_id = start_response.json()["id"]

    follow_up = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
        json={"content": "Can you explain pricing?"},
    )
    assert follow_up.status_code == 201, follow_up.text

    messages_response = client.get(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
    )
    assert messages_response.status_code == 200, messages_response.text
    messages = messages_response.json()
    assert messages[-1]["role"] == "ai_assistant"
    assert messages[-1]["content"] == "Here is the follow-up answer."


def test_widget_skips_auto_reply_without_ai_employee(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_website_chat_channel(client, auth_headers, ai_employee_id=None)
    public_key = channel["public_key"]

    start_response = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations",
        json={"initial_message": "Hello"},
    )
    assert start_response.status_code == 201, start_response.text
    conversation_id = start_response.json()["id"]

    messages_response = client.get(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
    )
    assert messages_response.status_code == 200, messages_response.text
    messages = messages_response.json()
    assert len(messages) == 1
    assert messages[0]["role"] == "customer"


@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Initial auto reply.", []),
)
def test_auto_reply_skipped_after_handoff(
    mock_generate: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee = _create_employee(client, auth_headers)
    channel = _create_website_chat_channel(client, auth_headers, ai_employee_id=employee["id"])
    public_key = channel["public_key"]

    start_response = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations",
        json={"initial_message": "Hello"},
    )
    assert start_response.status_code == 201, start_response.text
    conversation_id = start_response.json()["id"]

    handoff_response = client.post(
        f"/api/v1/omnichannel-conversations/{conversation_id}/handoff",
        headers=auth_headers,
    )
    assert handoff_response.status_code == 200, handoff_response.text
    assert handoff_response.json()["handoff_status"] == "requested"

    follow_up = client.post(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
        json={"content": "Anyone there?"},
    )
    assert follow_up.status_code == 201, follow_up.text

    messages_response = client.get(
        f"/api/v1/omnichannel-widget/{public_key}/conversations/{conversation_id}/messages",
    )
    messages = messages_response.json()
    ai_messages = [message for message in messages if message["role"] == "ai_assistant"]
    assert len(ai_messages) == 1
    assert ai_messages[0]["content"] == "Initial auto reply."
    assert mock_generate.call_count == 1
