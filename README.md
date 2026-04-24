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
2. **AI-матчинг** — эмбеддинги профиля соискателя сопоставляются с эмбеддингами вакансий, Groq Llama-3.3 объясняет, почему вакансия подходит.
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
  - Groq (Llama-3.3-70B) — генерация, ранжирование, scam-детект
  - sentence-transformers — локальные эмбеддинги (бесплатно)
```

## Технологии

| Слой | Технология |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| DB | PostgreSQL (Supabase) |
| AI LLM | Groq API (Llama-3.3-70B-versatile) |
| Embeddings | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` |
| Telegram | aiogram 3 |
| Hosting | Vercel (web) + Render/Railway (api + bot) + Supabase (db) |

## Структура репозитория

```
hackaton-project/
├── backend/        # FastAPI + SQLAlchemy + Groq
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
copy .env.example .env       # заполнить DATABASE_URL, GROQ_API_KEY
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
