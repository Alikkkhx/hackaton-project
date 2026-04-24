# Деплой JumysAQ

Минимальный бесплатный набор: **Supabase (DB) + Render (API + Bot) + Vercel (Web)**.

## 1. Supabase Postgres

1. [supabase.com](https://supabase.com/) → `New project`. Регион `eu-central-1`.
2. Project settings → Database → **Connection string → URI (Session pooler)**.
3. Скопировать строку и адаптировать под `psycopg`:
   ```
   postgresql+psycopg://postgres.xxxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
4. В SQL Editor выполнить (опционально) `create extension if not exists vector;` — на будущее.

## 2. LLM-ключи

1. **Gemini (основной):** [Google AI Studio](https://aistudio.google.com/app/apikey) → API key → в Render как `GEMINI_API_KEY`.
2. **Groq (опционально, fallback):** [console.groq.com/keys](https://console.groq.com/keys) → `GROQ_API_KEY`.

## 3. Telegram бот

1. [@BotFather](https://t.me/BotFather) → `/newbot` → получить токен `1234:ABC...`.
2. `/setdescription`, `/setabouttext`, `/setcommands`:
   ```
   start - начать
   jobs - последние вакансии
   subscribe - настроить уведомления
   stop - отписаться
   ```

## 4. Backend + Bot — Render

1. Зарегистрироваться на [render.com](https://render.com/), `New → Blueprint`.
2. Подключить репозиторий `Alikkkhx/hackaton-project`.
3. Render подхватит **корневой** `render.yaml` (сервис API `jumysaq-api`). Отдельный worker для бота при необходимости подключите вручную.
4. Заполнить секреты (минимум):
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | строка из Supabase |
   | `GEMINI_API_KEY` | ключ Google AI Studio |
   | `GROQ_API_KEY` | опционально |
   | `TELEGRAM_BOT_TOKEN` | токен из BotFather (уведомления с API) |
   | `CORS_ORIGINS` | `https://<ваш-проект>.vercel.app` или временно `*` |
   | `PUBLIC_APP_URL` | `https://<ваш-проект>.vercel.app` (ссылки в Telegram) |
   | В папке `bot` при отдельном сервисе: `API_URL`, токен бота — см. `bot/.env.example` |
5. Демо-данные: один раз локально `python -m app.seed` с тем же `DATABASE_URL` (см. [LAUNCH.md](LAUNCH.md)).
6. Swagger: `https://<api>.onrender.com/docs`.

## 5. Frontend — Vercel

1. [vercel.com/new](https://vercel.com/new) → Import `Alikkkhx/hackaton-project`.
2. **Root Directory**: `frontend`.
3. Environment Variables:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<ваш-api>.onrender.com` |
4. Deploy.

## 6. Проверка

- Открыть `https://<vercel>.app` → зайти под `aigerim@example.kz / demo1234` → `/match`.
- Открыть бота → `/start` → `/jobs`.
- Войти как работодатель `hr@caspiancoffee.kz / demo1234` → создать вакансию → увидеть risk_score.
