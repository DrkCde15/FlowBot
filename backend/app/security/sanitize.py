import re

_MAX_VALUE_LEN = 4000
_SLUG_RE = re.compile(r"[^a-zA-Z0-9_-]")


def sanitize_value(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if len(cleaned) > _MAX_VALUE_LEN:
        cleaned = cleaned[:_MAX_VALUE_LEN]
    return cleaned


def normalize_slug(slug: str) -> str:
    return _SLUG_RE.sub("", slug)
