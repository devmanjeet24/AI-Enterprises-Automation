"""Outbound message delivery to external channel connectors."""

from __future__ import annotations

import json
import logging
import smtplib
import ssl
import urllib.error
import urllib.request
from email.message import EmailMessage
from typing import Any

from app.models.enums import OmnichannelChannelType
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage

logger = logging.getLogger(__name__)


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> bool:
    body = json.dumps(payload).encode("utf-8")
    request_headers = {"Content-Type": "application/json", **(headers or {})}
    request = urllib.request.Request(url, data=body, headers=request_headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return 200 <= response.status < 300
    except urllib.error.HTTPError as exc:
        logger.warning("Connector HTTP error %s for %s", exc.code, url)
        return False
    except urllib.error.URLError as exc:
        logger.warning("Connector URL error for %s: %s", url, exc.reason)
        return False


def deliver_outbound_message(
    *,
    channel: OmnichannelChannel,
    conversation: OmnichannelConversation,
    message: OmnichannelMessage,
) -> bool:
    """Deliver a non-internal agent/AI message to the external channel."""
    if message.is_internal:
        return True

    config = channel.config or {}
    content = message.content

    if channel.channel_type == OmnichannelChannelType.WEBSITE_CHAT:
        return True

    if channel.channel_type == OmnichannelChannelType.TELEGRAM:
        return _deliver_telegram(config, conversation, content)

    if channel.channel_type == OmnichannelChannelType.SLACK:
        return _deliver_slack(config, content)

    if channel.channel_type == OmnichannelChannelType.EMAIL:
        return _deliver_email(config, conversation, content)

    if channel.channel_type == OmnichannelChannelType.WHATSAPP:
        return _deliver_whatsapp(config, conversation, content)

    return True


def _deliver_telegram(
    config: dict[str, Any],
    conversation: OmnichannelConversation,
    content: str,
) -> bool:
    bot_token = config.get("bot_token")
    chat_id = conversation.external_contact_id or config.get("default_chat_id")
    if not bot_token or not chat_id:
        logger.info("Telegram connector skipped: missing bot_token or chat_id")
        return False
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    return _post_json(url, {"chat_id": chat_id, "text": content})


def _deliver_slack(config: dict[str, Any], content: str) -> bool:
    webhook_url = config.get("incoming_webhook_url")
    if not webhook_url:
        logger.info("Slack connector skipped: missing incoming_webhook_url")
        return False
    return _post_json(webhook_url, {"text": content})


def _deliver_email(
    config: dict[str, Any],
    conversation: OmnichannelConversation,
    content: str,
) -> bool:
    provider = config.get("provider", "smtp")
    to_address = conversation.external_contact_id or config.get("reply_to")
    if not to_address:
        logger.info("Email connector skipped: missing recipient")
        return False

    if provider == "resend":
        api_key = config.get("api_key")
        from_address = config.get("from_address")
        if not api_key or not from_address:
            return False
        return _post_json(
            "https://api.resend.com/emails",
            {
                "from": from_address,
                "to": [to_address],
                "subject": conversation.subject,
                "text": content,
            },
            headers={"Authorization": f"Bearer {api_key}"},
        )

    smtp_host = config.get("smtp_host")
    smtp_port = int(config.get("smtp_port", 587))
    smtp_user = config.get("smtp_user")
    smtp_password = config.get("smtp_password")
    from_address = config.get("from_address", smtp_user)
    if not smtp_host or not smtp_user or not smtp_password or not from_address:
        logger.info("Email connector skipped: incomplete SMTP config")
        return False

    email = EmailMessage()
    email["Subject"] = conversation.subject
    email["From"] = from_address
    email["To"] = to_address
    email.set_content(content)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_password)
            server.send_message(email)
        return True
    except OSError as exc:
        logger.warning("SMTP delivery failed: %s", exc)
        return False


def _deliver_whatsapp(
    config: dict[str, Any],
    conversation: OmnichannelConversation,
    content: str,
) -> bool:
    access_token = config.get("access_token")
    phone_number_id = config.get("phone_number_id")
    to_number = conversation.external_contact_id
    if not access_token or not phone_number_id or not to_number:
        logger.info("WhatsApp connector skipped: missing credentials or recipient")
        return False
    url = f"https://graph.facebook.com/v21.0/{phone_number_id}/messages"
    return _post_json(
        url,
        {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": content},
        },
        headers={"Authorization": f"Bearer {access_token}"},
    )
