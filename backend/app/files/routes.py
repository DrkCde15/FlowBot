"""Importação e exportação de arquivos (fluxos de bot e respostas)."""
from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Answer, Bot
from app.security import normalize_slug

router = APIRouter(prefix="/api/v1/files", tags=["files"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/export")
async def export_file(
    slug: str, format: str = "json", db: Session = Depends(get_db)
):
    """Exporta um bot (JSON) ou todas as respostas (CSV)."""
    bot = db.scalar(select(Bot).where(Bot.slug == normalize_slug(slug)))
    if not bot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if format == "csv":
        answers = db.scalars(select(Answer).where(Answer.botId == bot.id)).all()
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["conversationId", "blockId", "variable", "value", "createdAt"])
        for a in answers:
            writer.writerow([a.conversationId, a.blockId, a.variable or "", a.value, a.createdAt or ""])
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={bot.slug}-answers.csv"},
        )

    payload = {
        "name": bot.name,
        "slug": bot.slug,
        "published": bot.published,
        "flow": json.loads(bot.flow),
        "theme": json.loads(bot.theme),
    }
    data = json.dumps(payload, indent=2, ensure_ascii=False)
    return StreamingResponse(
        iter([data]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={bot.slug}.json"},
    )


@router.post("/import")
async def import_file(request: Request, db: Session = Depends(get_db)):
    """Importa um fluxo de bot a partir de um JSON exportado.

    Corpo: {"name": str, "slug": str, "flow": [...], "theme": {...}, "published"?: bool}
    Cria um NOVO bot (id único). Se o slug já existir, recebe sufixo.
    """
    body = await request.json()
    flow = body.get("flow")
    if not isinstance(flow, list):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="flow (array) required")

    base_slug = normalize_slug(body.get("slug") or body.get("name") or "imported")
    slug = base_slug
    n = 1
    while db.scalar(select(Bot).where(Bot.slug == slug)):
        n += 1
        slug = f"{base_slug}-{n}"

    bot = Bot(
        id=uuid.uuid4().hex,
        name=body.get("name") or "Imported bot",
        slug=slug,
        published=bool(body.get("published", False)),
        flow=json.dumps(flow, ensure_ascii=False),
        theme=json.dumps(body.get("theme") or {}, ensure_ascii=False),
        createdAt=_now(),
        updatedAt=_now(),
    )
    db.add(bot)
    db.commit()
    return {"id": bot.id, "slug": bot.slug, "name": bot.name}
