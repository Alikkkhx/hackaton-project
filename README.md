# JumysAQ — Mangystau Hackathon MVP

**JumysAQ** (от каз. *jumys* — работа) — цифровая платформа занятости для молодёжи и малого бизнеса Мангистауской области.

> Единая площадка для вакансий из Актау и районов, с AI-матчингом, защитой от мошенников и Telegram-ботом для быстрого отклика.

---

## Проблема

- 700K+ жителей области, ~30% — молодёжь до 29 лет.
- Вакансии разбросаны по WhatsApp, Telegram-чатам и Instagram.
- `hh.ru` не охватывает кафе, стройбригады, магазины и мастерские Актау.
- Нет единого фильтра по микрорайону, сфере и уровню опыта.
- Молодёжь не видит работу, которая реально существует рядом.

## Решение

1. **Единая лента вакансий** — все предложения из Актау и сёл в одном месте, с нормальными описаниями (AI дотягивает текст до читаемого).
2. **AI-матчинг** — эмбеддинги профиля соискателя сопоставляются с эмбеддингами вакансий, Google Gemini 2.5 объясняет живым текстом, почему вакансия подходит (упоминает конкретные навыки и район).
3. **AI анти-скам** — каждая новая вакансия проходит проверку LLM на признаки мошенничества («лёгкие деньги», «оплата картой», «без собеседования»).
4. **Верификация работодателя** — подтверждение по телефону + ручная галочка «verified».
5. **Telegram-бот** — мгновенные уведомления о новых вакансиях под профиль и быстрый отклик прямо из чата.
6. **Фильтры под реальность** — сфера, опыт (студент / без опыта / с опытом), тип занятости (полная / частичная / подработка), город/село, микрорайон Актау.

## Архитектура

```
┌────────────────┐     HTTPS      ┌───────────────────┐
│  Next.js (Web) │ ─────────────▶ │  FastAPI (API)    │
└────────────────┘                └─────────┬─────────┘
                                            │ SQLAlchemy
                                            ▼
                                  ┌───────────────────┐
                                  │ Supabase Postgres │
                                  └─────────┬─────────┘
                                            │
     ┌──────────────────┐                   │
     │  Telegram Bot    │ ──────────────────┘
     │  (aiogram)       │
     └──────────────────┘

  AI layer:
  - Google Gemini 2.5 Flash Lite — генерация объяснений, scam-детект (основной)
  - Groq Llama-3.3-70B — fallback LLM-провайдер
  - sentence-transformers (multilingual MiniLM) — локальные эмбеддинги
  - Эвристики по ключевым паттернам — базовый слой анти-скама
```

## Технологии

| Слой | Технология |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend | Python 3.11–3.13, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| DB | PostgreSQL (Supabase) в проде / SQLite локально |
| AI LLM (основной) | Google Gemini API (`gemini-2.5-flash-lite`) |
| AI LLM (fallback) | Groq API (`llama-3.3-70b-versatile`) |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (опционально) |
| Telegram | aiogram 3 |
| Hosting | Vercel (web) + Render/Railway (api + bot) + Supabase (db) |

## Деплой (без входа в этот ноутбук)

1. **Supabase:** создайте проект, вставьте `DATABASE_URL` в формате `postgresql+psycopg://user:pass@host:5432/postgres` (драйвер `psycopg`, без квадратных скобок в пароле). Один раз локально: `cd backend && python -m app.seed` (или уже залито).
2. **Render (API):** [Blueprints → New Blueprint Instance](https://dashboard.render.com/select-repo?type=blueprint), репозиторий `Alikkkhx/hackaton-project`, Render подхватит корневой `render.yaml`. В мастере укажите секрет **`DATABASE_URL`**; при желании **`GEMINI_API_KEY`**. Либо вручную: Web Service → Root `backend`, Python, Build `pip install -r requirements.txt`, Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
3. **Vercel (сайт):** Import Project → тот же репо, **Root Directory** `frontend`, переменная **`NEXT_PUBLIC_API_URL`** = публичный URL Render (например `https://jumysaq-api.onrender.com`).
4. В Render обновите **`CORS_ORIGINS`** на URL Vercel (через запятую, если несколько), перезапустите сервис.

## Структура репозитория

```
hackaton-project/
├── backend/        # FastAPI + SQLAlchemy + Gemini/Groq
├── frontend/       # Next.js 14 (App Router)
├── bot/            # Telegram-бот на aiogram 3
├── docs/           # питч-материалы
└── README.md
```

## Быстрый старт

### 1. Клонировать

```bash
git clone https://github.com/Alikkkhx/hackaton-project.git
cd hackaton-project
```

### 2. Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate     # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
copy .env.example .env       # заполнить DATABASE_URL и GEMINI_API_KEY (или GROQ_API_KEY)
alembic upgrade head
python -m app.seed            # заливает демо-вакансии Актау
uvicorn app.main:app --reload
```

Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Открыть http://localhost:3000

### 4. Telegram-бот

```bash
cd bot
python -m venv .venv && . .venv/Scripts/activate
pip install -r requirements.txt
copy .env.example .env        # BOT_TOKEN, API_URL
python main.py
```

## Переменные окружения

**`backend/.env`**

| Переменная | Назначение | Пример |
|---|---|---|
| `DATABASE_URL` | строка подключения SQLAlchemy | `sqlite:///./jumysaq.db` / `postgresql+psycopg://...` |
| `JWT_SECRET` | секрет для подписи токенов | `change-me` |
| `GEMINI_API_KEY` | ключ Google AI Studio (основной LLM) | `AIza...` |
| `GEMINI_MODEL` | модель Gemini | `gemini-2.5-flash-lite` |
| `GROQ_API_KEY` | ключ Groq (опциональный fallback) | `gsk_...` |
| `GROQ_MODEL` | модель Groq | `llama-3.3-70b-versatile` |

Если не задан ни один LLM-ключ, AI-слой откатывается на эвристики и шаблонные объяснения — продукт остаётся работоспособным.

**`frontend/.env.local`**

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_API_URL` | адрес FastAPI, например `http://localhost:8000` |

## Что показать на питче

1. Соискатель заходит на сайт, заполняет короткий профиль (город, навыки, опыт).
2. Получает персональную ленту — AI объясняет, почему вакансия подходит.
3. Работодатель создаёт вакансию → система автоматически ставит `risk_score` и бейдж «⚠ Проверьте».
4. Соискатель откликается → работодатель получает push в Telegram с кнопками «Открыть контакт / Отклонить».
5. Демо фильтров по микрорайонам Актау: Микрорайон 1–35, Koktem, Eleven, Shygys.

## Команда

Mangystau Hackathon 2026.

## Лицензия

MIT.
