# Финиш до 100%: прод + демо

Сделайте по порядку. Время: ~45–90 минут, если ключи и аккаунты уже есть.

## 1. База (Supabase)

- [ ] Проект создан, строка **`DATABASE_URL`** в формате `postgresql+psycopg://...` (pooler 6543).
- [ ] Один раз залили демо-данные (с локальной машины с тем же `DATABASE_URL` в `.env`):

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head   # если используете миграции
python -m app.seed
```

## 2. API (Render)

- [ ] [Blueprint](https://dashboard.render.com/select-repo?type=blueprint) из корня репо → сервис `jumysaq-api`.
- [ ] В Environment заданы как минимум:
  - **`DATABASE_URL`**
  - **`GEMINI_API_KEY`** (для матчинга и анти-скама)
  - **`CORS_ORIGINS`** — после шага 3: `https://ВАШ-САЙТ.vercel.app,http://localhost:3000` (или временно `*` для проверки)
  - **`PUBLIC_APP_URL`** — тот же URL фронта **без** слэша в конце (ссылки в Telegram)
- [ ] Дождаться зелёного деплоя → открыть `https://ВАШ-API.onrender.com/api/health` → `{"ok":true}`.
- [ ] Опционально: **`TELEGRAM_BOT_TOKEN`** — чтобы бэкенд слал уведомления работодателю о новых откликах.

## 3. Сайт (Vercel)

- [ ] Import Git → **Root Directory** = `frontend`.
- [ ] Environment: **`NEXT_PUBLIC_API_URL`** = URL Render API (без слэша в конце).
- [ ] Deploy → открыть прод-URL, проверить ленту `/jobs`.

## 4. Свести CORS и ссылки

- [ ] В Render обновить **`CORS_ORIGINS`** на прод-домен Vercel (и при необходимости preview-URL через запятую).
- [ ] **`PUBLIC_APP_URL`** совпадает с основным URL фронта (как в Vercel Production).
- [ ] Manual Deploy / Clear cache Vercel, если меняли только env на Render.

## 5. Telegram-бот (если показываете)

- [ ] В `bot/.env`: **`API_URL`** = URL Render API.
- [ ] Процесс бота запущен (локально или второй сервис на Render с `python main.py` из папки `bot`).
- [ ] `/start`, `/subscribe`, `/jobs` — смок.

## 6. Смок-тест прод (5 минут)

Либо вручную в браузере, либо:

```powershell
# Windows, из корня репо:
.\scripts\smoke.ps1 -ApiUrl "https://ВАШ-API.onrender.com"
```

Чеклист в браузере:

- [ ] `/jobs` — список вакансий.
- [ ] Регистрация / логин (соискатель).
- [ ] `/match` — ответ без 500 (при наличии `GEMINI_API_KEY`).
- [ ] Логин работодателя → `/employer` → отклики на вакансию (см. `docs/PITCH.md`).

## 7. Питч

- [ ] Слайды: скопировать структуру из **`docs/SLIDES.md`** в Gamma / Google Slides / Canva.
- [ ] Один прогон по **`docs/PITCH.md`** с таймером 4–5 минут.

После этого «готовность к защите» = выполненные галочки + один успешный полный прогон демо на **прод-URL**.
