from app.integrations import get_adapter, available
from app.security.sanitize import normalize_slug, sanitize_value


def test_available_integrations():
    names = available()
    for expected in ("webhook", "n8n", "slack", "discord", "telegram", "whatsapp", "email", "crm"):
        assert expected in names


def test_get_adapter_unknown():
    assert get_adapter("does-not-exist") is None


def test_normalize_slug():
    assert normalize_slug("My Bot!/") == "MyBot"


def test_sanitize_value_truncates():
    long = "x" * 5000
    assert len(sanitize_value(long)) == 4000


def test_sanitize_value_none():
    assert sanitize_value(None) is None
