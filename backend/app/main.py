from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.integrations_routes import router as credentials_router
from app.db import init_db
from app.runtime.routes import router as runtime_router
from app.tasks.routes import router as tasks_router
from app.webhooks import router as webhooks_router
from app.files.routes import router as files_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runtime_router)
app.include_router(tasks_router)
app.include_router(webhooks_router)
app.include_router(files_router)
app.include_router(credentials_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": settings.app_name}
