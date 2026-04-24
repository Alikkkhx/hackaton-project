"""Simple Telegram notifier used by the API to push events to subscribers and
employers. Uses Bot API directly via httpx to avoid importing aiogram here."""

from __future__ import annotations

import logging
from urllib.parse import quote

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)


def _token() -> str | None:
    return get_settings().telegram_bot_token


async def send_message(chat_id: str, text: str) -> bool:
    token = _token()
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                url,
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
            return r.status_code == 200
    except Exception as exc:  # noqa: BLE001
        log.warning("Telegram send failed: %s", exc)
        return False


def format_new_application(job_title: str, seeker_name: str, cover: str) -> str:
    cover = (cover or "").strip()
    cover_block = f"\n\n<i>{cover[:400]}</i>" if cover else ""
    return (
        f"📩 <b>Новый отклик</b>\n"
        f"Вакансия: <b>{job_title}</b>\n"
        f"Кандидат: {seeker_name}"
        f"{cover_block}"
    )


def format_new_job(job_title: str, city: str, district: str | None, job_id: str, app_url: str) -> str:
    where = f"{city}" + (f", {district}" if district else "")
    link = f"{app_url.rstrip('/')}/jobs/{quote(job_id)}"
    return (
        f"🆕 <b>Новая вакансия</b>\n"
        f"<b>{job_title}</b>\n"
        f"📍 {where}\n\n"
        f"🔗 {link}"
    )
