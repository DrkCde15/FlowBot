from typing import Literal, Optional

from pydantic import BaseModel, Field


class Branch(BaseModel):
    id: str
    label: str = ""
    variable: Optional[str] = None
    operator: Optional[Literal["equals", "contains", "notEquals", "greater", "less"]] = None
    value: Optional[str] = None
    next: Optional[str] = None


InputKind = Literal["text", "email", "number", "phone"]
BlockType = Literal["text", "image", "input", "buttons", "date", "stripe"]


class Block(BaseModel):
    id: str
    type: BlockType
    x: Optional[float] = None
    y: Optional[float] = None
    next: Optional[str] = None
    branches: list[Branch] = Field(default_factory=list)

    content: Optional[str] = None
    url: Optional[str] = None
    alt: Optional[str] = None

    label: Optional[str] = None
    placeholder: Optional[str] = None
    inputKind: Optional[InputKind] = None
    variable: Optional[str] = None

    options: list[dict] = Field(default_factory=list)
    format: Optional[str] = None

    stripe: Optional[dict] = None
