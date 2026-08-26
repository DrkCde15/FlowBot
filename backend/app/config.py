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
    # Configuração de INFRAESTRUTURA apenas.
    # Credenciais de integração NÃO ficam aqui: são salvas no banco
    # (tabela IntegrationConfig) e gerenciadas pela UI em /integrations.
    # As variáveis abaixo são lidas do ambiente da aplicação (deploy),
    # não de um arquivo .env.
    model_config = SettingsConfigDict(extra="ignore")

    app_name: str = "flowbot-backend"
    environment: str = "development"
    log_level: str = "info"

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = "sqlite:///" + str(BASE_DIR.parent / "data" / "dev.db")

    cors_allow_origins: str = "http://localhost:3000"

    runtime_rate_limit_per_minute: int = 60
    webhook_rate_limit_per_minute: int = 120

    # Segredo HMAC para verificar webhooks de entrada do sistema.
    integrations_secret: str = "change-me-integrations-hmac"

    # --- Arquivos / memória (caminhos no disco) ---
    memory_db_path: str = str(BASE_DIR.parent / "data" / "memory.db")
    data_dir: str = str(BASE_DIR.parent / "data")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


settings = Settings()
