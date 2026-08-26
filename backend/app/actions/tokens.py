"""Estimativa de contagem de tokens (contador exibido no builder/AI)."""
from __future__ import annotations

try:
    import tiktoken  # type: ignore

    _TIKTOKEN = True
except Exception:  # pragma: no cover - dependência opcional
    _TIKTOKEN = False


def count_tokens(text: str, model: str | None = None) -> int:
    text = text or ""
    if _TIKTOKEN and model and model.startswith("gpt"):
        try:
            enc = tiktoken.encoding_for_model(model)
        except Exception:
            enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    # heurística: ~4 caracteres por token para modelos latinos
    return max(1, len(text) // 4)
