import httpx

from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class WhatsAppAdapter(IntegrationAdapter):
    name = "whatsapp"

    async def send(self, event: dict) -> None:
        creds = get_credentials("whatsapp")
        sid = creds.get("account_sid")
        token = creds.get("auth_token")
        from_number = creds.get("from_number")
        if not (sid and token):
            return
        to = event.get("_to") or from_number
        if not to:
            return
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        data = {
            "From": f"whatsapp:{from_number}",
            "To": f"whatsapp:{to}",
            "Body": text,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, data=data, auth=(sid, token))
