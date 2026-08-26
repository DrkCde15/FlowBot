import httpx

from app.credentials import get_credentials
from app.integrations.base import IntegrationAdapter


class SlackAdapter(IntegrationAdapter):
    name = "slack"

    async def send(self, event: dict) -> None:
        creds = get_credentials("slack")
        token = creds.get("bot_token")
        if token:
            await self._post_slack_api(event, creds, token)
        elif creds.get("webhook_url"):
            await self._post_slack_webhook(event, creds)

    async def _post_slack_webhook(self, event: dict, creds: dict, token: str | None = None) -> None:
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(creds["webhook_url"], json={"text": text})

    async def _post_slack_api(self, event: dict, creds: dict, token: str) -> None:
        text = f"[{event['bot_name']}] {event.get('variable') or 'answer'}: {event.get('value')}"
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "https://slack.com/api/chat.postMessage",
                json={"channel": creds.get("channel"), "text": text},
                headers={"Authorization": f"Bearer {token}"},
            )
