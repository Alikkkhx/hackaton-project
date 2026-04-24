from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Base, engine
from app.routers import applications, auth, jobs, match, telegram, users

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="JumysAQ API",
    version="0.1.0",
    description="Цифровая платформа занятости для Мангистау (MVP для Mangystau Hackathon).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Dev-friendly: auto-create tables. In production prefer Alembic migrations.
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "JumysAQ API",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["meta"])
def health():
    return {"ok": True}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(match.router)
app.include_router(telegram.router)
