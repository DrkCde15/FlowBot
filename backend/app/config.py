from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


def _resolve_sqlite(url: str | None, fallback: str) -> str:
    if not url:
        return fallback
    if url.startswith("file:"):
        return url[len("file:"):].lstrip("./")
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "flowbot-backend"
    environment: str = "development"
    log_level: str = "info"

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "sqlite:///" + str(BASE_DIR.parent / "data" / "dev.db")

    cors_allow_origins: str = "http://localhost:3000"

    runtime_rate_limit_per_minute: int = 60
    webhook_rate_limit_per_minute: int = 120

    integrations_secret: str = "change-me-integrations-hmac"

    runtime_dispatch_integrations: str = ""

    webhook_default_url: str | None = None
    webhook_default_secret: str | None = None

    n8n_webhook_url: str | None = None
    n8n_webhook_secret: str | None = None

    slack_webhook_url: str | None = None
    slack_bot_token: str | None = None
    slack_channel: str | None = None

    discord_webhook_url: str | None = None

    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None

    whatsapp_provider: str = "twilio"
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True

    sendgrid_api_key: str | None = None

    crm_webhook_url: str | None = None
    crm_webhook_secret: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


settings = Settings()
