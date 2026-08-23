import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.config import settings


class _Bucket:
    def __init__(self, limit: int) -> None:
        self.limit = limit
        self.hits: deque[float] = deque()

    def allow(self, now: float) -> bool:
        while self.hits and self.hits[0] <= now - 60:
            self.hits.popleft()
        if len(self.hits) >= self.limit:
            return False
        self.hits.append(now)
        return True


_buckets: dict[str, _Bucket] = defaultdict(lambda: _Bucket(0))


def _client_key(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limited(scope: str, per_minute: int | None = None):
    limit = per_minute or (
        settings.webhook_rate_limit_per_minute
        if scope == "webhook"
        else settings.runtime_rate_limit_per_minute
    )

    def dependency(request: Request) -> None:
        key = f"{scope}:{_client_key(request)}"
        bucket = _buckets.get(key)
        if bucket is None or bucket.limit != limit:
            bucket = _Bucket(limit)
            _buckets[key] = bucket
        if not bucket.allow(time.time()):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Try again later.",
            )

    return dependency
