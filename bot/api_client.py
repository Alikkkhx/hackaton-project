from __future__ import annotations

import httpx

from config import get_settings


class ApiClient:
    def __init__(self) -> None:
        self.base = get_settings().api_url.rstrip("/")

    async def list_jobs(self, params: dict) -> list[dict]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{self.base}/api/jobs", params=params)
            r.raise_for_status()
            return r.json()

    async def get_job(self, job_id: str) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{self.base}/api/jobs/{job_id}")
            r.raise_for_status()
            return r.json()

    async def subscribe(self, payload: dict) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(
                f"{self.base}/api/telegram/subscribe", json=payload
            )
            r.raise_for_status()
            return r.json()

    async def unsubscribe(self, telegram_id: str) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(f"{self.base}/api/telegram/unsubscribe/{telegram_id}")
