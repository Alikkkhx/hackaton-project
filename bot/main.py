"""JumysAQ Telegram Bot.

Commands:
    /start          — приветствие, регистрация в подписке
    /jobs           — последние вакансии
    /subscribe      — настроить персональную подписку
    /stop           — отписаться от уведомлений
"""

from __future__ import annotations

import asyncio
import logging
from urllib.parse import quote

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

from api_client import ApiClient
from config import get_settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

router = Router()
api = ApiClient()

INDUSTRIES = [
    "HoReCa",
    "Ритейл",
    "Строительство",
    "Услуги / Красота",
    "Логистика",
    "Образование",
    "Авто",
    "IT",
    "Другое",
]

AKTAU_DISTRICTS = [
    "Любой",
    "Микрорайон 11",
    "Микрорайон 14",
    "Микрорайон 15",
    "Микрорайон 27",
    "Микрорайон 29",
    "Koktem",
    "Eleven",
    "Shygys",
    "Samal",
]

EXPERIENCE = {
    "Студент": "student",
    "Без опыта": "no_exp",
    "До 3 лет": "junior",
    "3-6 лет": "middle",
    "6+ лет": "senior",
}


class Subscribe(StatesGroup):
    district = State()
    industry = State()
    experience = State()


# ---------- helpers ----------


def _job_caption(job: dict) -> str:
    price = "По договорённости"
    if job.get("salary_min") and job.get("salary_max"):
        price = f"{job['salary_min']//1000}–{job['salary_max']//1000}k ₸"
    elif job.get("salary_min"):
        price = f"от {job['salary_min']//1000}k ₸"

    risk_line = ""
    if (job.get("risk_score") or 0) >= 0.35:
        reasons = ", ".join((job.get("risk_reasons") or [])[:2])
        risk_line = f"\n⚠️ <i>AI-предупреждение: {reasons}</i>"

    verified = " ✅" if job.get("employer_verified") else ""
    district = f", {job['district']}" if job.get("district") else ""

    return (
        f"💼 <b>{job['title']}</b>\n"
        f"🏢 {job.get('employer_name') or 'Компания'}{verified}\n"
        f"📍 {job['city']}{district}\n"
        f"💰 {price}"
        f"{risk_line}\n\n"
        f"{(job.get('description') or '')[:400]}"
    )


def _job_kb(job_id: str) -> InlineKeyboardMarkup:
    app_url = get_settings().app_url.rstrip("/")
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть на сайте",
                    url=f"{app_url}/jobs/{quote(job_id)}",
                ),
            ]
        ]
    )


# ---------- handlers ----------


@router.message(CommandStart())
async def cmd_start(message: Message):
    text = (
        "👋 Привет! Я — бот <b>JumysAQ</b>, единой платформы занятости Мангистау.\n\n"
        "Что я умею:\n"
        "• /jobs — последние вакансии Актау и области\n"
        "• /subscribe — персональные уведомления под твои фильтры\n"
        "• /stop — отписаться\n\n"
        "AI подберёт вакансии под твой профиль и предупредит о подозрительных объявлениях."
    )
    await message.answer(text)


@router.message(Command("jobs"))
async def cmd_jobs(message: Message):
    jobs = await api.list_jobs({"limit": 5})
    if not jobs:
        await message.answer("Пока нет активных вакансий.")
        return
    for job in jobs:
        await message.answer(
            _job_caption(job), reply_markup=_job_kb(job["id"])
        )


@router.message(Command("stop"))
async def cmd_stop(message: Message):
    await api.unsubscribe(str(message.from_user.id))
    await message.answer(
        "Отключил уведомления. Чтобы вернуть — /subscribe.",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.message(Command("subscribe"))
async def cmd_subscribe(message: Message, state: FSMContext):
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=d)] for d in AKTAU_DISTRICTS],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await state.set_state(Subscribe.district)
    await message.answer(
        "В каком районе Актау ищешь работу?", reply_markup=kb
    )


@router.message(Subscribe.district, F.text)
async def subscribe_district(message: Message, state: FSMContext):
    district = message.text if message.text != "Любой" else None
    await state.update_data(district=district)

    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=i)] for i in [*INDUSTRIES, "Любая"]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await state.set_state(Subscribe.industry)
    await message.answer("Какая сфера?", reply_markup=kb)


@router.message(Subscribe.industry, F.text)
async def subscribe_industry(message: Message, state: FSMContext):
    industry = message.text
    industries = [] if industry == "Любая" else [industry]
    await state.update_data(industries=industries)

    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=label)] for label in EXPERIENCE],
        resize_keyboard=True,
        one_time_keyboard=True,
    )
    await state.set_state(Subscribe.experience)
    await message.answer("Твой опыт?", reply_markup=kb)


@router.message(Subscribe.experience, F.text)
async def subscribe_experience(message: Message, state: FSMContext):
    data = await state.get_data()
    experience = EXPERIENCE.get(message.text)
    payload = {
        "telegram_id": str(message.from_user.id),
        "city": "Aktau",
        "district": data.get("district"),
        "industries": data.get("industries", []),
        "experience": experience,
    }
    try:
        await api.subscribe(payload)
    except Exception as exc:  # noqa: BLE001
        log.warning("subscribe error: %s", exc)
        await message.answer(
            "Не удалось сохранить подписку. Попробуй ещё раз позже.",
            reply_markup=ReplyKeyboardRemove(),
        )
        await state.clear()
        return

    await state.clear()
    await message.answer(
        "Готово! 🎉\nБуду присылать свежие вакансии под твои фильтры. "
        "Посмотреть подходящее сейчас — /jobs.",
        reply_markup=ReplyKeyboardRemove(),
    )


@router.callback_query(F.data.startswith("apply:"))
async def cb_apply(call: CallbackQuery):
    await call.answer()
    job_id = call.data.split(":", 1)[1]
    app_url = get_settings().app_url.rstrip("/")
    await call.message.answer(
        f"Чтобы откликнуться, перейди по ссылке и нажми «Откликнуться»:\n"
        f"{app_url}/jobs/{quote(job_id)}"
    )


async def main():
    settings = get_settings()
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    log.info("Bot started")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())
