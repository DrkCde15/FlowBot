import hashlib
import hmac

from fastapi import HTTPException, Request, status


def verify_signature(secret: str, raw_body: bytes, signature: str | None) -> None:
    if not secret:
        return
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing signature header.",
        )
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    provided = signature.removeprefix("sha256=")
    if not hmac.compare_digest(expected, provided):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature.",
        )


async def read_body(request: Request) -> bytes:
    return await request.body()
