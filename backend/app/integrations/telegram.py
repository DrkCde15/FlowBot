import httpx

from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class TelegramAdapter(IntegrationAdapter):
    name = "telegram"

    async def send(self, event: dict) -> None:
        creds = get_credentials("telegram")
        token = creds.get("bot_token")
        chat_id = event.get("_to") or event.get("chat_id") or creds.get("chat_id")
        if not token or not chat_id:
            return
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json={"chat_id": chat_id, "text": text})
