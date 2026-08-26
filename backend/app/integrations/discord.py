import httpx

from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class DiscordAdapter(IntegrationAdapter):
    name = "discord"

    async def send(self, event: dict) -> None:
        creds = get_credentials("discord")
        # DiscordAdapter usa o nome "discord"; reutiliza creds de webhook
        url = creds.get("webhook_url")
        if not url:
            return
        text = f"**[{event['bot_name']}]** {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json={"content": text})
