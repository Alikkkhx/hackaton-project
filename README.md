# JumysAQ — Маңғыстау өңірінің цифрлық жұмыспен қамту платформасы

**JumysAQ** (қаз. *жұмыс* — работа) — AI негізіндегі жұмыспен қамту платформасы. Маңғыстау өңірінің жастары мен шағын бизнесіне арналған.

> Ақтау мен облыстың барлық вакансиялары бір жерде. AI-матчинг, алаяқтықтан қорғау және Telegram-бот.

---

## Сілтемелер

| Ресурс | Сілтеме |
|--------|---------|
| 🌐 **Веб-сайт (MVP)** | [jumysaq-web.onrender.com](https://jumysaq-web.onrender.com) |
| 📡 **API құжаттамасы** | [jumysaq-api.onrender.com/docs](https://jumysaq-api.onrender.com/docs) |
| 🤖 **Telegram-бот** | [@jumysaq_mangystau_bot](https://t.me/jumysaq_mangystau_bot) |
| 💻 **GitHub** | [github.com/Alikkkhx/hackaton-project](https://github.com/Alikkkhx/hackaton-project) |
| 🎤 **Презентация** | `presentation.html` (репозиторийдің түбірінде) |

---

##  Мәселе

- Маңғыстаудағы шағын бизнестің **85%-ы** вакансияларды тек WhatsApp чаттарына жібереді
- **hh.ru** мен **enbek.kz** Маңғыстау шағын бизнесінің тек **12%-ын** қамтиды
- 18-25 жас арасындағы жастардың жұмыссыздық деңгейі **30%-дан** асады
- Алаяқтық вакансиялар адамдардың ақша мен сенімін жоғалтуда

##  Шешім

1. **Бірыңғай вакансия ленtасы** — Ақтау мен ауылдардың барлық жұмыс мүмкіндіктері бір жерде
2. **AI-матчинг** — Gemini embedding арқылы соискатель дағдылары мен вакансия талаптарын семантикалық деңгейде салыстыру
3. **AI анти-скам** — Әр вакансия автоматты түрде 5 критерий бойынша алаяқтық белгілеріне тексеріледі
4. **AI-редактор** — Жұмыс берушінің қарапайым мәтінін кәсіби сипаттамаға айналдыру
5. **Telegram-бот** — @jumysaq_mangystau_bot: вакансия іздеу, сүзгілеу, жеке хабарландыру алу
6. **Аймақтық сүзгілер** — 8 қала, Ақтаудың 29 ауданы, 10+ сала бойынша іздеу

---

## 🏗️ Архитектура

```
┌────────────────────┐    HTTPS     ┌───────────────────┐
│  Next.js 14 (Web)  │ ──────────▶ │  FastAPI (API)    │
│  Render Web        │             │  Render Web       │
└────────────────────┘             └─────────┬─────────┘
                                             │ SQLAlchemy
                                             ▼
                                   ┌───────────────────┐
                                   │   PostgreSQL      │
                                   │   Render DB       │
                                   └─────────┬─────────┘
                                             │
     ┌──────────────────┐                    │
     │  Telegram Bot    │ ───────────────────┘
     │  aiogram 3       │
     │  Render Web      │
     └──────────────────┘

  AI сервистер:
  - Google Gemini API — матчинг, anti-scam, мәтін жақсарту
  - Embedding-based векторлық іздеу
```

## ⚙️ Технологиялар

| Қабат | Технология |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database | PostgreSQL (Render) |
| AI | Google Gemini API (embedding + generation) |
| Telegram | aiogram 3 |
| Хостинг | Render (API + Web + Bot + DB) |
| Қауіпсіздік | JWT + bcrypt + CORS + OTP |

---

##  Жылдам бастау (локалды)

### 1. Клондау

```bash
git clone https://github.com/Alikkkhx/hackaton-project.git
cd hackaton-project
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate     # Windows
pip install -r requirements.txt
copy .env.example .env      # DATABASE_URL, GEMINI_API_KEY толтыру
uvicorn app.main:app --reload
```

Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
# .env.local файлында NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Сайт: http://localhost:3000

### 4. Telegram-бот

```bash
cd bot
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
# .env файлында BOT_TOKEN, API_URL толтыру
python main.py
```

---

## 🔐 Қоршаған орта айнымалылары

**`backend/.env`**

| Айнымалы | Мақсаты |
|----------|---------|
| `DATABASE_URL` | PostgreSQL қосылу жолы |
| `JWT_SECRET` | JWT токен кілті |
| `GEMINI_API_KEY` | Google AI Studio кілті |
| `CORS_ORIGINS` | Frontend URL |
| `TELEGRAM_BOT_TOKEN` | Бот токені (хабарландыру үшін) |

**`frontend/.env.local`**

| Айнымалы | Мақсаты |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI мекенжайы |

**`bot/.env`**

| Айнымалы | Мақсаты |
|----------|---------|
| `BOT_TOKEN` | BotFather токені |
| `API_URL` | FastAPI мекенжайы |
| `APP_URL` | Веб-сайт мекенжайы |

---

## 📱 Мүмкіндіктер

-  Вакансиялар тізімі + іздеу + сүзгілер (қала, аудан, сала, тип, тәжірибе)
-  Тіркелу / кіру (JWT аутентификация)
-  Жұмыс іздеуші профилі + дағдылар
-  Жұмыс беруші кабинеті + вакансия жасау/өңдеу/жою
-  AI-матчинг (embedding салыстыру + түсіндірме)
-  AI вакансия мәтінін жақсарту (Gemini)
-  AI anti-scam тексеру (risk score + ескертулер)
-  Өтінім жіберу (отклик) + статус басқару
-  Телефон верификациясы (OTP)
-  Telegram-бот (@jumysaq_mangystau_bot) — іздеу, сүзгі, жазылу
-  Мобильді адаптация (responsive + hamburger menu)
-  REST API + Swagger құжаттамасы
-  8 Маңғыстау қаласы + 19 демо вакансия

---

##  Демо сценарий

1. **Вакансиялар тізімі** → Жаңаөзен бойынша сүзгі → нәтиже
2. **Жұмыс беруші** → жаңа вакансия → **✨ AI текст жақсарту** → anti-scam нәтиже
3. **Жұмыс іздеуші** → профиль → **AI-матчинг** → сәйкес вакансиялар
4. **Telegram** → @jumysaq_mangystau_bot → `/start` → `/jobs`
5. **API** → `/docs` ашу → кәсіби backend көрсету

---

## 🗺️ Даму жоспары

| Кезең | Мерзім | Мақсат |
|-------|--------|--------|
| MVP  | Қазір | Хакатон нұсқасы — толық жұмыс істейтін платформа |
| Beta | Q3 2026 | SMS верификация, мобильді қосымша, аналитика |
| Launch | Q4 2026 | ХҚО интеграциясы, монетизация, Маңғыстау пилот |
| Scale | 2027 | Бүкіл Қазақстанға кеңейту |

---

## 👥 Команда

Mangystau Hackathon 2026

## 📄 Лицензия

MIT
