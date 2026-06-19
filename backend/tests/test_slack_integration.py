"""Tests for production Slack omnichannel integration."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings


def _sign_slack_body(body: bytes, signing_secret: str) -> dict[str, str]:
    timestamp = str(int(time.time()))
    basestring = f"v0:{timestamp}:{body.decode('utf-8')}"
    signature = (
        "v0="
        + hmac.new(
            signing_secret.encode("utf-8"),
            basestring.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    )
    return {
        "X-Slack-Request-Timestamp": timestamp,
        "X-Slack-Signature": signature,
    }


@pytest.fixture(autouse=True)
def slack_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SLACK_SIGNING_SECRET", "test-signing-secret")
    monkeypatch.setenv("SLACK_BOT_TOKEN", "xoxb-test-token")
    monkeypatch.setenv("SLACK_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("SLACK_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("API_PUBLIC_URL", "https://api.example.com")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def _create_slack_channel(client: TestClient, headers: dict[str, str]) -> dict:
    unique = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"Slack Support {unique}",
            "slug": f"slack-support-{unique}",
            "channel_type": "slack",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_slack_url_verification_requires_valid_signature(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    channel = _create_slack_channel(client, auth_headers)
    payload = {"type": "url_verification", "challenge": "challenge-token"}
    body = json.dumps(payload).encode("utf-8")

    unsigned = client.post(
        f"/api/v1/omnichannel-webhooks/slack/{channel['id']}",
        content=body,
        headers={"Content-Type": "application/json"},
    )
    assert unsigned.status_code == 401

    signed = client.post(
        f"/api/v1/omnichannel-webhooks/slack/{channel['id']}",
        content=body,
        headers={
            "Content-Type": "application/json",
            **_sign_slack_body(body, "test-signing-secret"),
        },
    )
    assert signed.status_code == 200, signed.text
    assert signed.json() == {"challenge": "challenge-token"}


@patch("app.services.omnichannel_webhook_service.get_bot_user_id", return_value="B999")
@patch(
    "app.services.omnichannel_webhook_service.resolve_user_display_name",
    return_value="Jane Doe",
)
@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Here is your answer from the knowledge base.", []),
)
@patch(
    "app.services.omnichannel_connector_service.post_chat_message",
    return_value={"ok": True, "ts": "2000.1"},
)
def test_slack_dm_message_routes_reply_to_same_channel_and_thread(
    _mock_post: object,
    _mock_generate: object,
    _mock_user: object,
    _mock_bot: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee_response = client.post(
        "/api/v1/employees",
        json={
            "name": "Slack Bot",
            "role": "Support",
            "description": "Slack support",
            "system_prompt": "You are helpful.",
        },
        headers=auth_headers,
    )
    assert employee_response.status_code == 201, employee_response.text
    employee_id = employee_response.json()["id"]
    activate = client.post(f"/api/v1/employees/{employee_id}/activate", headers=auth_headers)
    assert activate.status_code == 200, activate.text

    unique = uuid.uuid4().hex[:8]
    channel = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"Slack Support {unique}",
            "slug": f"slack-support-{unique}",
            "channel_type": "slack",
            "ai_employee_id": employee_id,
        },
        headers=auth_headers,
    ).json()

    payload = {
        "type": "event_callback",
        "team_id": "T123",
        "event_id": f"Ev-{uuid.uuid4().hex}",
        "event": {
            "type": "message",
            "channel": "D123456",
            "channel_type": "im",
            "user": "U123",
            "text": "Hello from Slack",
            "ts": "1000.1",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    response = client.post(
        f"/api/v1/omnichannel-webhooks/slack/{channel['id']}",
        content=body,
        headers={
            "Content-Type": "application/json",
            **_sign_slack_body(body, "test-signing-secret"),
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["message_id"]

    from app.services.omnichannel_connector_service import post_chat_message

    post_chat_message.assert_called_once()
    call_kwargs = post_chat_message.call_args.kwargs
    assert call_kwargs["channel"] == "D123456"
    assert call_kwargs["thread_ts"] == "1000.1"
    assert "knowledge base" in call_kwargs["text"]


@patch("app.services.omnichannel_webhook_service.get_bot_user_id", return_value="B999")
@patch(
    "app.services.omnichannel_webhook_service.resolve_user_display_name",
    return_value="Jane Doe",
)
@patch(
    "app.services.omnichannel_conversation_service._generate_ai_response",
    return_value=("Thread reply", []),
)
@patch(
    "app.services.omnichannel_connector_service.post_chat_message",
    return_value={"ok": True, "ts": "2000.2"},
)
def test_slack_channel_thread_reply_uses_parent_thread_ts(
    _mock_post: object,
    _mock_generate: object,
    _mock_user: object,
    _mock_bot: object,
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    employee_response = client.post(
        "/api/v1/employees",
        json={
            "name": "Slack Bot",
            "role": "Support",
            "description": "Slack support",
            "system_prompt": "You are helpful.",
        },
        headers=auth_headers,
    )
    employee_id = employee_response.json()["id"]
    client.post(f"/api/v1/employees/{employee_id}/activate", headers=auth_headers)

    unique = uuid.uuid4().hex[:8]
    channel = client.post(
        "/api/v1/omnichannel-channels",
        json={
            "name": f"Slack Support {unique}",
            "slug": f"slack-support-{unique}",
            "channel_type": "slack",
            "ai_employee_id": employee_id,
        },
        headers=auth_headers,
    ).json()

    payload = {
        "type": "event_callback",
        "team_id": "T123",
        "event_id": f"Ev-{uuid.uuid4().hex}",
        "event": {
            "type": "message",
            "channel": "C123456",
            "channel_type": "channel",
            "user": "U123",
            "text": "Need help in this thread",
            "ts": "1000.9",
            "thread_ts": "1000.1",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    response = client.post(
        f"/api/v1/omnichannel-webhooks/slack/{channel['id']}",
        content=body,
        headers={
            "Content-Type": "application/json",
            **_sign_slack_body(body, "test-signing-secret"),
        },
    )
    assert response.status_code == 200, response.text

    from app.services.omnichannel_connector_service import post_chat_message

    call_kwargs = post_chat_message.call_args.kwargs
    assert call_kwargs["channel"] == "C123456"
    assert call_kwargs["thread_ts"] == "1000.1"
