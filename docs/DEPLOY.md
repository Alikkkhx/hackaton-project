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

## 2. Groq API key

1. [console.groq.com/keys](https://console.groq.com/keys) → Create API Key.
2. Скопировать `gsk_...`. Free tier подходит для хакатона.

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
3. Render увидит `backend/render.yaml` и предложит создать 2 сервиса (api + bot).
4. Заполнить секреты:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | строка из Supabase |
   | `GROQ_API_KEY` | ключ из Groq |
   | `TELEGRAM_BOT_TOKEN` | токен из BotFather |
   | `CORS_ORIGINS` | `https://<ваш-проект>.vercel.app` |
   | `BOT_TOKEN` (для bot) | тот же токен Telegram |
   | `API_URL` (для bot) | `https://<ваш-api>.onrender.com` |
   | `APP_URL` (для bot) | `https://<ваш-проект>.vercel.app` |
5. Первый деплой выполнит seed автоматически.
6. Swagger будет доступен: `https://<api>.onrender.com/docs`.

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
