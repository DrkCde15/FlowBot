import httpx

from app.config import settings
from app.integrations.base import IntegrationAdapter


class WhatsAppAdapter(IntegrationAdapter):
    name = "whatsapp"

    async def send(self, event: dict) -> None:
        if not (settings.twilio_account_sid and settings.twilio_auth_token):
            return
        to = event.get("_to") or settings.twilio_from_number
        if not to:
            return
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
        data = {
            "From": f"whatsapp:{settings.twilio_from_number}",
            "To": f"whatsapp:{to}",
            "Body": text,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                url, data=data, auth=(settings.twilio_account_sid, settings.twilio_auth_token)
            )
