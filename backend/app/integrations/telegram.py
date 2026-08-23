import httpx

from app.config import settings
from app.integrations.base import IntegrationAdapter


class TelegramAdapter(IntegrationAdapter):
    name = "telegram"

    async def send(self, event: dict) -> None:
        if not settings.telegram_bot_token or not settings.telegram_chat_id:
            return
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json={"chat_id": settings.telegram_chat_id, "text": text})
