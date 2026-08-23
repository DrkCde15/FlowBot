import httpx

from app.config import settings
from app.integrations.base import IntegrationAdapter


class SlackAdapter(IntegrationAdapter):
    name = "slack"

    async def send(self, event: dict) -> None:
        if settings.slack_bot_token:
            await self._post_slack_api(event)
        elif settings.slack_webhook_url:
            await self._post_slack_webhook(event)

    async def _post_slack_webhook(self, event: dict) -> None:
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(settings.slack_webhook_url, json={"text": text})

    async def _post_slack_api(self, event: dict) -> None:
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://slack.com/api/chat.postMessage",
                json={"channel": settings.slack_channel, "text": text},
                headers={"Authorization": f"Bearer {settings.slack_bot_token}"},
            )
