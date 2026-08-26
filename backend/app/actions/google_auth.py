"""Autenticação Google via conta de serviço (service account JSON na integração)."""
from __future__ import annotations

from typing import Any


def get_google_credentials(credentials_json: str | None = None):
    """Constrói credenciais do Google a partir de um JSON de service account."""
    try:
        from google.oauth2 import service_account  # type: ignore
    except Exception as exc:  # dependência ausente
        raise RuntimeError(
            "Integração Google requer `pip install google-api-python-client google-auth`"
        ) from exc

    if not credentials_json:
        raise RuntimeError("Credenciais do Google não configuradas na integração 'google'")
    info: dict[str, Any] = __import__("json").loads(credentials_json)
    return service_account.Credentials.from_service_account_info(info)


def build_google_service(api: str, version: str, credentials_json: str | None = None):
    from googleapiclient.discovery import build  # type: ignore

    creds = get_google_credentials(credentials_json)
    scoped = creds.with_scopes(
        [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/documents",
        ]
    )
    return build(api, version, credentials=scoped, cache_discovery=False)
