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
# Blocos de mensagem/entrada + ações (integrações executadas no runtime)
BlockType = Literal[
    "text",
    "image",
    "input",
    "buttons",
    "date",
    # ações / integrações
    "ai",
    "whatsapp",
    "telegram",
    "google_sheets",
    "google_docs",
    "http",
    "payment",
    "memory",
    "file",
]


class AIBlock(BaseModel):
    provider: str = "openai"  # openai | anthropic | google
    model: str = "gpt-4o-mini"
    system: Optional[str] = None
    prompt: str = ""  # suporta {{variavel}}
    variable: Optional[str] = None  # salva a resposta numa variável
    maxTokens: int = 512


class MessagingBlock(BaseModel):
    to: Optional[str] = None  # destinatário (whatsapp) ou chat_id (telegram)
    message: str = ""  # suporta {{variavel}}


class GoogleSheetsBlock(BaseModel):
    spreadsheetId: str = ""
    sheet: str = "Sheet1"
    values: str = ""  # colunas separadas por vírgula, suporta {{variavel}}


class GoogleDocsBlock(BaseModel):
    documentId: str = ""
    text: str = ""  # suporta {{variavel}}


class HTTPBlock(BaseModel):
    method: str = "POST"
    url: str = ""
    headers: str = "{}"  # JSON opcional
    body: Optional[str] = None  # JSON ou texto, suporta {{variavel}}
    authUser: Optional[str] = None
    authPass: Optional[str] = None


class PaymentBlock(BaseModel):
    provider: str = "mercadopago"  # mercadopago | link
    amount: int = 1000  # em centavos
    currency: str = "BRL"
    description: str = ""
    variable: Optional[str] = None  # salva a URL de pagamento


class MemoryBlock(BaseModel):
    operation: str = "set"  # set | get | list
    key: str = ""
    value: Optional[str] = None  # suporta {{variavel}}
    dbType: str = "sqlite"  # sqlite | postgres | mysql
    connection: Optional[str] = None  # obrigatório p/ não-sqlite
    user: Optional[str] = None
    password: Optional[str] = None


class FileBlock(BaseModel):
    operation: str = "export_json"  # export_json | export_csv


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

    # ações / integrações
    ai: Optional[AIBlock] = None
    whatsapp: Optional[MessagingBlock] = None
    telegram: Optional[MessagingBlock] = None
    google_sheets: Optional[GoogleSheetsBlock] = None
    google_docs: Optional[GoogleDocsBlock] = None
    http: Optional[HTTPBlock] = None
    payment: Optional[PaymentBlock] = None
    memory: Optional[MemoryBlock] = None
    file: Optional[FileBlock] = None
