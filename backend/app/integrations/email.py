import aiosmtplib
import httpx

from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class EmailAdapter(IntegrationAdapter):
    name = "email"

    async def send(self, event: dict) -> None:
        creds = get_credentials("email")
        if not creds.get("smtp_host") and not creds.get("sendgrid_api_key"):
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
        if creds.get("sendgrid_api_key"):
            await self._sendgrid(to, subject, body, creds)
        else:
            await self._smtp(to, subject, body, creds)

    async def _sendgrid(self, to: str, subject: str, body: str, creds: dict) -> None:
        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": creds.get("smtp_from")},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}],
        }
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=payload,
                headers={"Authorization": f"Bearer {creds['sendgrid_api_key']}"},
            )

    async def _smtp(self, to: str, subject: str, body: str, creds: dict) -> None:
        await aiosmtplib.send(
            message=body,
            sender=creds.get("smtp_from"),
            recipients=[to],
            subject=subject,
            hostname=creds.get("smtp_host"),
            port=int(creds.get("smtp_port", 587)),
            username=creds.get("smtp_user"),
            password=creds.get("smtp_password"),
            start_tls=bool(creds.get("smtp_use_tls", True)),
        )
