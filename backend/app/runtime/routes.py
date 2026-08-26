import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.engine import first_block, get_block, get_next_block
from app.engine.flow import Block
from app.integrations import build_event
from app.actions import run_action
from app.models import Answer, Bot, Conversation
from app.security import normalize_slug, rate_limited, sanitize_value
from app.tasks.dispatcher import dispatch

router = APIRouter(prefix="/api/v1/runtime", tags=["runtime"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_flow(raw: str) -> list[Block]:
    return [Block.model_validate(b) for b in json.loads(raw)]


def _bot_or_404(db: Session, slug: str) -> Bot:
    bot = db.scalar(select(Bot).where(Bot.slug == slug))
    if not bot or not bot.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return bot


@router.get("/{slug}")
async def get_flow(slug: str, db: Session = Depends(get_db)) -> dict:
    bot = _bot_or_404(db, normalize_slug(slug))
    return {"name": bot.name, "flow": json.loads(bot.flow), "theme": json.loads(bot.theme)}


@router.post("/{slug}/start")
async def start_conversation(
    slug: str,
    _: None = Depends(rate_limited("runtime")),
    db: Session = Depends(get_db),
) -> dict:
    bot = _bot_or_404(db, normalize_slug(slug))
    conversation = Conversation(id=uuid.uuid4().hex, botId=bot.id, createdAt=_now())
    db.add(conversation)
    db.commit()
    flow = _parse_flow(bot.flow)
    return {"conversationId": conversation.id, "block": first_block(flow)}


@router.post("/{slug}/answer")
async def submit_answer(
    slug: str,
    request: Request,
    _: None = Depends(rate_limited("runtime")),
    db: Session = Depends(get_db),
) -> dict:
    bot = _bot_or_404(db, normalize_slug(slug))
    body = await request.json()
    conversation_id: str | None = body.get("conversationId")
    block_id: str | None = body.get("blockId")
    variable = body.get("variable")
    value = sanitize_value(body.get("value"))

    conversation = db.get(Conversation, conversation_id) if conversation_id else None
    if not conversation or conversation.botId != bot.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    flow = _parse_flow(bot.flow)

    if isinstance(value, str) and value:
        db.add(
            Answer(
                id=uuid.uuid4().hex,
                botId=bot.id,
                conversationId=conversation.id,
                blockId=block_id,
                variable=variable,
                value=value,
                createdAt=_now(),
            )
        )
        db.commit()

    current = get_block(flow, block_id)
    if not current:
        return {"block": None, "completed": True}

    next_block = get_next_block(flow, current, value)

    completed = False
    if not next_block:
        conversation.isCompleted = True
        conversation.completedAt = _now()
        db.commit()
        completed = True

    answers = [
        {"variable": a.variable, "value": a.value}
        for a in db.scalars(
            select(Answer).where(Answer.conversationId == conversation.id)
        ).all()
    ]

    _maybe_dispatch(bot, conversation, variable, value, completed, answers)

    return {"block": next_block, "completed": completed}


def _maybe_dispatch(
    bot: Bot,
    conversation: Conversation,
    variable: str | None,
    value: str | None,
    completed: bool,
    answers: list[dict],
) -> None:
    from app.credentials import get_runtime_dispatch

    names = get_runtime_dispatch()
    if not names:
        return
    event = build_event(
        bot_slug=bot.slug,
        bot_name=bot.name,
        conversation_id=conversation.id,
        variable=variable,
        value=value,
        answers=answers,
        completed=completed,
    )
    asyncio.create_task(dispatch(names, event))


# Tipos de bloco que são "ações" executadas no backend (não pedem input do usuário)
ACTION_TYPES = {
    "ai",
    "whatsapp",
    "telegram",
    "google_sheets",
    "google_docs",
    "http",
    "payment",
    "memory",
    "file",
}


@router.post("/{slug}/action")
async def run_block_action(
    slug: str,
    request: Request,
    _: None = Depends(rate_limited("runtime")),
    db: Session = Depends(get_db),
) -> dict:
    """Executa um bloco de ação (IA, pagamento, Google, HTTP, memória, etc.)."""
    bot = _bot_or_404(db, normalize_slug(slug))
    body = await request.json()
    block = body.get("block") or {}
    conversation_id = body.get("conversationId")
    variables = body.get("variables") or {}
    action_type = block.get("type")
    if not action_type or action_type not in ACTION_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid action block")

    config = block.get(action_type) or {}
    context = {
        "variables": variables,
        "conversation_id": conversation_id,
        "bot_slug": bot.slug,
        "bot_name": bot.name,
    }
    result = await run_action(action_type, config, context)

    # persiste o resultado numa variável para analytics
    if result.get("variable") and result.get("value") is not None and conversation_id:
        db.add(
            Answer(
                id=uuid.uuid4().hex,
                botId=bot.id,
                conversationId=conversation_id,
                blockId=block.get("id"),
                variable=result["variable"],
                value=str(result["value"]),
                createdAt=_now(),
            )
        )
        db.commit()

    return {"result": result}
