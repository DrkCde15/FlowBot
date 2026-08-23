import httpx

from app.config import settings
from app.integrations.base import IntegrationAdapter


class DiscordAdapter(IntegrationAdapter):
    name = "discord"

    async def send(self, event: dict) -> None:
        if not settings.discord_webhook_url:
            return
        text = f"**[{event['bot_name']}]** {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(settings.discord_webhook_url, json={"content": text})
