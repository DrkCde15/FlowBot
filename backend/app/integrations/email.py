import aiosmtplib
import httpx

from app.config import settings
from app.integrations.base import IntegrationAdapter


class EmailAdapter(IntegrationAdapter):
    name = "email"

    async def send(self, event: dict) -> None:
        if not settings.smtp_host and not settings.sendgrid_api_key:
            return
        to = event.get("_to")
        if not to:
            return
        subject = f"New answer from {event['bot_name']}"
        body = (
            f"Bot: {event['bot_name']} ({event['bot_slug']})\n"
            f"Conversation: {event['conversation_id']}\n"
            f"{event.get('variable') or 'answer'}: {event.get('value')}\n"
        )
        if settings.sendgrid_api_key:
            await self._sendgrid(to, subject, body)
        else:
            await self._smtp(to, subject, body)

    async def _sendgrid(self, to: str, subject: str, body: str) -> None:
        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": settings.smtp_from},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}],
        }
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={"Authorization": f"Bearer {settings.sendgrid_api_key}"},
            )

    async def _smtp(self, to: str, subject: str, body: str) -> None:
        await aiosmtplib.send(
            message=body,
            sender=settings.smtp_from,
            recipients=[to],
            subject=subject,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            start_tls=settings.smtp_use_tls,
        )
