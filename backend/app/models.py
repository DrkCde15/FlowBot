from sqlalchemy import (
    Boolean,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Bot(Base):
    __tablename__ = "Bot"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, unique=True)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    flow: Mapped[str] = mapped_column(Text, default="[]")
    theme: Mapped[str] = mapped_column(Text, default="{}")
    createdAt: Mapped[str | None] = mapped_column(String, nullable=True)
    updatedAt: Mapped[str | None] = mapped_column(String, nullable=True)


class Conversation(Base):
    __tablename__ = "Conversation"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    botId: Mapped[str] = mapped_column(String)
    createdAt: Mapped[str | None] = mapped_column(String, nullable=True)
    completedAt: Mapped[str | None] = mapped_column(String, nullable=True)
    isCompleted: Mapped[bool] = mapped_column(Boolean, default=False)


class Answer(Base):
    __tablename__ = "Answer"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    botId: Mapped[str] = mapped_column(String)
    conversationId: Mapped[str] = mapped_column(String)
    blockId: Mapped[str] = mapped_column(String)
    variable: Mapped[str | None] = mapped_column(String, nullable=True)
    value: Mapped[str] = mapped_column(Text)
    createdAt: Mapped[str | None] = mapped_column(String, nullable=True)
