"""Заливает демо-данные: работодателей, соискателей и реалистичные вакансии Актау.

Использование:
    python -m app.seed
"""

from __future__ import annotations

import logging
import random
from datetime import datetime, timedelta

from app.db import Base, SessionLocal, engine
from app.models import (
    EmployerProfile,
    EmploymentType,
    ExperienceLevel,
    Job,
    SeekerProfile,
    User,
    UserRole,
)
from app.security import hash_password
from app.services import ai, embeddings

log = logging.getLogger(__name__)

AKTAU_DISTRICTS = [
    "Микрорайон 3",
    "Микрорайон 4",
    "Микрорайон 7",
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


EMPLOYERS = [
    {
        "full_name": "Caspian Coffee",
        "email": "hr@caspiancoffee.kz",
        "phone": "+77010000101",
        "industry": "HoReCa",
        "description": "Сеть кофеен в Актау. 4 точки: МКР 11, Koktem, Eleven, Shygys.",
        "verified": True,
    },
    {
        "full_name": "Aktau Build Group",
        "email": "hr@aktaubuild.kz",
        "phone": "+77010000102",
        "industry": "Строительство",
        "description": "Строительная бригада: отделка, электрика, сантехника.",
        "verified": True,
    },
    {
        "full_name": "Magnum Aktau (ТОО Юнекс)",
        "email": "vacancy@magnum-aktau.kz",
        "phone": "+77010000103",
        "industry": "Ритейл",
        "description": "Гипермаркеты и минимаркеты у дома.",
        "verified": True,
    },
    {
        "full_name": "SPA Aktau Riviera",
        "email": "jobs@aktau-riviera.kz",
        "phone": "+77010000104",
        "industry": "Услуги / Красота",
        "description": "SPA и барбершоп рядом с набережной.",
        "verified": False,
    },
    {
        "full_name": "Ozen Logistics",
        "email": "cargo@ozen.kz",
        "phone": "+77010000105",
        "industry": "Логистика",
        "description": "Перевозки по области и вахтовым посёлкам.",
        "verified": True,
    },
    {
        "full_name": "KidsClub Aktau",
        "email": "hr@kidsclub-aktau.kz",
        "phone": "+77010000106",
        "industry": "Образование",
        "description": "Детский развивающий центр: английский, робототехника, шахматы.",
        "verified": True,
    },
    {
        "full_name": "Auto Service \"Kaspi\"",
        "email": "auto@kaspi-ts.kz",
        "phone": "+77010000107",
        "industry": "Авто",
        "description": "Шиномонтаж + мойка + лёгкий ремонт.",
        "verified": False,
    },
    {
        "full_name": "Неизвестная вакансия",
        "email": "fast@money.com",
        "phone": "+77010000199",
        "industry": "Другое",
        "description": "Работа на дому с инвестициями.",
        "verified": False,
    },
]


# (title, industry, experience, employment_type, district, salary_min, salary_max, description, skills, contact)
JOBS_TEMPLATES: list[dict] = [
    # Caspian Coffee
    {
        "employer": "Caspian Coffee",
        "title": "Бариста (МКР 11)",
        "industry": "HoReCa",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.part_time,
        "district": "Микрорайон 11",
        "salary_min": 180000,
        "salary_max": 240000,
        "description": (
            "Ищем бариста в нашу кофейню в МКР 11. Научим всему: латте-арт, кассовая дисциплина, "
            "общение с гостями. График 2/2, смены по 10 часов. Подойдёт студентам."
        ),
        "skills": ["коммуникация", "касса", "клиентский сервис"],
        "contact": "WhatsApp: +7 701 000 01 01",
    },
    {
        "employer": "Caspian Coffee",
        "title": "Официант (Koktem)",
        "industry": "HoReCa",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.part_time,
        "district": "Koktem",
        "salary_min": 160000,
        "salary_max": 220000,
        "description": (
            "В кофейню на Koktem нужен официант. Смены 4/8 часов, гибкий график. "
            "Можно совмещать с учёбой."
        ),
        "skills": ["коммуникация", "внимательность"],
        "contact": "Telegram: @caspian_hr",
    },
    {
        "employer": "Caspian Coffee",
        "title": "Администратор кофейни",
        "industry": "HoReCa",
        "experience": ExperienceLevel.junior,
        "employment_type": EmploymentType.full_time,
        "district": "Eleven",
        "salary_min": 280000,
        "salary_max": 350000,
        "description": (
            "Администратор в кофейню на Eleven. Управление сменой, инвентаризация, "
            "обратная связь от гостей, работа с бариста."
        ),
        "skills": ["управление сменой", "Excel", "iiko"],
        "contact": "hr@caspiancoffee.kz",
    },
    # Aktau Build Group
    {
        "employer": "Aktau Build Group",
        "title": "Электрик на отделку (подработка)",
        "industry": "Строительство",
        "experience": ExperienceLevel.junior,
        "employment_type": EmploymentType.gig,
        "district": "Микрорайон 29",
        "salary_min": 15000,
        "salary_max": 25000,
        "description": (
            "Требуется электрик на отделку квартиры в МКР 29. Оплата за объект или за день. "
            "Нужны свои инструменты."
        ),
        "skills": ["электрика", "штроба", "разводка"],
        "contact": "+7 701 000 01 02",
    },
    {
        "employer": "Aktau Build Group",
        "title": "Разнорабочий на стройку",
        "industry": "Строительство",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.full_time,
        "district": "Микрорайон 27",
        "salary_min": 220000,
        "salary_max": 280000,
        "description": (
            "На стройку в МКР 27 нужны разнорабочие. Вахта 15/15, жильё предоставляем, "
            "обеды включены. Без опыта — научим."
        ),
        "skills": ["физическая работа", "дисциплина"],
        "contact": "WhatsApp: +7 701 000 01 02",
    },
    # Magnum
    {
        "employer": "Magnum Aktau (ТОО Юнекс)",
        "title": "Кассир в Магнум (Samal)",
        "industry": "Ритейл",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.full_time,
        "district": "Samal",
        "salary_min": 200000,
        "salary_max": 240000,
        "description": (
            "Кассир в минимаркет Магнум у дома (район Samal). Смены 2/2 по 12 часов. "
            "Обучаем кассе, возрасту клиентам, планограмме."
        ),
        "skills": ["касса", "вежливость", "внимательность"],
        "contact": "vacancy@magnum-aktau.kz",
    },
    {
        "employer": "Magnum Aktau (ТОО Юнекс)",
        "title": "Мерчендайзер (частичная занятость)",
        "industry": "Ритейл",
        "experience": ExperienceLevel.student,
        "employment_type": EmploymentType.part_time,
        "district": "Микрорайон 15",
        "salary_min": 120000,
        "salary_max": 180000,
        "description": (
            "Студентам: расстановка товара утром перед учёбой (4 часа). "
            "Гипермаркет в МКР 15."
        ),
        "skills": ["внимательность", "физическая работа"],
        "contact": "vacancy@magnum-aktau.kz",
    },
    # SPA Riviera
    {
        "employer": "SPA Aktau Riviera",
        "title": "Администратор SPA-салона",
        "industry": "Услуги / Красота",
        "experience": ExperienceLevel.junior,
        "employment_type": EmploymentType.full_time,
        "district": "Shygys",
        "salary_min": 250000,
        "salary_max": 320000,
        "description": (
            "Администратор в SPA на набережной. Запись клиентов (Yclients), касса, "
            "соцсети салона (Instagram), координация мастеров."
        ),
        "skills": ["Yclients", "Instagram", "клиентский сервис"],
        "contact": "jobs@aktau-riviera.kz",
    },
    {
        "employer": "SPA Aktau Riviera",
        "title": "Мастер маникюра",
        "industry": "Услуги / Красота",
        "experience": ExperienceLevel.middle,
        "employment_type": EmploymentType.full_time,
        "district": "Shygys",
        "salary_min": 350000,
        "salary_max": 600000,
        "description": (
            "Мастер маникюра/педикюра. Процент от услуг 50%. Свои материалы приветствуются."
        ),
        "skills": ["маникюр", "педикюр", "гель-лак"],
        "contact": "WhatsApp: +7 701 000 01 04",
    },
    # Ozen Logistics
    {
        "employer": "Ozen Logistics",
        "title": "Водитель категории С (вахта)",
        "industry": "Логистика",
        "experience": ExperienceLevel.middle,
        "employment_type": EmploymentType.full_time,
        "district": None,
        "salary_min": 500000,
        "salary_max": 700000,
        "description": (
            "Водитель грузовика на вахту Актау — Жанаозен — Тенге. 15/15, жильё, питание."
        ),
        "skills": ["водительское удостоверение C", "знание области"],
        "contact": "cargo@ozen.kz",
    },
    {
        "employer": "Ozen Logistics",
        "title": "Диспетчер (удалённо из Актау)",
        "industry": "Логистика",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.full_time,
        "district": "Микрорайон 14",
        "salary_min": 230000,
        "salary_max": 290000,
        "description": (
            "Принимаем заявки от клиентов, распределяем рейсы, ведём Excel-таблицы. "
            "Офис в МКР 14."
        ),
        "skills": ["Excel", "коммуникация", "1С (будет плюсом)"],
        "contact": "cargo@ozen.kz",
    },
    # KidsClub
    {
        "employer": "KidsClub Aktau",
        "title": "Преподаватель английского (дети 7-12 лет)",
        "industry": "Образование",
        "experience": ExperienceLevel.junior,
        "employment_type": EmploymentType.part_time,
        "district": "Микрорайон 4",
        "salary_min": 200000,
        "salary_max": 320000,
        "description": (
            "Работа с группами 4-6 детей. Занятия 3 раза в неделю по вечерам. "
            "Программа — Cambridge Starters / Movers."
        ),
        "skills": ["английский B2+", "работа с детьми", "Cambridge"],
        "contact": "hr@kidsclub-aktau.kz",
    },
    {
        "employer": "KidsClub Aktau",
        "title": "Тренер по шахматам",
        "industry": "Образование",
        "experience": ExperienceLevel.junior,
        "employment_type": EmploymentType.part_time,
        "district": "Микрорайон 7",
        "salary_min": 150000,
        "salary_max": 250000,
        "description": "Преподавание шахмат детям 6-14 лет. 2 раза в неделю.",
        "skills": ["шахматы", "работа с детьми"],
        "contact": "hr@kidsclub-aktau.kz",
    },
    # Auto Service
    {
        "employer": "Auto Service \"Kaspi\"",
        "title": "Шиномонтажник",
        "industry": "Авто",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.full_time,
        "district": "Микрорайон 27",
        "salary_min": 220000,
        "salary_max": 320000,
        "description": "Обучаем с нуля. График 6/1. Молодой коллектив.",
        "skills": ["физическая работа", "внимательность"],
        "contact": "+7 701 000 01 07",
    },
    {
        "employer": "Auto Service \"Kaspi\"",
        "title": "Автомойщик (подработка вечером)",
        "industry": "Авто",
        "experience": ExperienceLevel.student,
        "employment_type": EmploymentType.part_time,
        "district": "Микрорайон 27",
        "salary_min": 120000,
        "salary_max": 180000,
        "description": "Смена 17:00-22:00. Идеально для студентов.",
        "skills": ["дисциплина", "физическая работа"],
        "contact": "+7 701 000 01 07",
    },
    # Scam-looking
    {
        "employer": "Неизвестная вакансия",
        "title": "Работа на дому. Быстрые лёгкие деньги от 800 000 тг!",
        "industry": "Другое",
        "experience": ExperienceLevel.no_exp,
        "employment_type": EmploymentType.gig,
        "district": None,
        "salary_min": 800000,
        "salary_max": 1500000,
        "description": (
            "Срочно набираем всех! Без опыта и документов. Работа на дому, "
            "оплата на карту сразу. Нужен небольшой взнос/депозит 10 000 тг для страховки. "
            "Пиши в WhatsApp, собеседования не будет."
        ),
        "skills": [],
        "contact": "WhatsApp: +7 701 000 01 99",
    },
]


def _ensure_tables():
    Base.metadata.create_all(bind=engine)


def seed():
    _ensure_tables()
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            log.info("DB already has users; skipping seed.")
            return

        # Employers
        emp_by_name: dict[str, User] = {}
        for e in EMPLOYERS:
            user = User(
                full_name=e["full_name"],
                email=e["email"],
                phone=e["phone"],
                password_hash=hash_password("demo1234"),
                role=UserRole.employer,
                phone_verified=True,
            )
            db.add(user)
            db.flush()
            db.add(
                EmployerProfile(
                    user_id=user.id,
                    company_name=e["full_name"],
                    description=e["description"],
                    industry=e["industry"],
                    city="Aktau",
                    verified=e["verified"],
                )
            )
            emp_by_name[e["full_name"]] = user

        # Demo seekers
        seekers = [
            {
                "full_name": "Айгерим К.",
                "email": "aigerim@example.kz",
                "phone": "+77010000201",
                "headline": "Студентка 3 курса, ищу подработку",
                "skills": ["английский B2", "коммуникация", "Instagram", "Yclients"],
                "experience": ExperienceLevel.student,
                "district": "Koktem",
            },
            {
                "full_name": "Нурлан С.",
                "email": "nurlan@example.kz",
                "phone": "+77010000202",
                "headline": "Электрик с опытом 3 года",
                "skills": ["электрика", "разводка", "штроба"],
                "experience": ExperienceLevel.middle,
                "district": "Микрорайон 29",
            },
            {
                "full_name": "Диас Ж.",
                "email": "dias@example.kz",
                "phone": "+77010000203",
                "headline": "Ищу работу кассиром или в магазине",
                "skills": ["касса", "вежливость", "физическая работа"],
                "experience": ExperienceLevel.no_exp,
                "district": "Samal",
            },
        ]
        for s in seekers:
            user = User(
                full_name=s["full_name"],
                email=s["email"],
                phone=s["phone"],
                password_hash=hash_password("demo1234"),
                role=UserRole.seeker,
                phone_verified=True,
            )
            db.add(user)
            db.flush()
            profile = SeekerProfile(
                user_id=user.id,
                headline=s["headline"],
                about=s["headline"],
                city="Aktau",
                district=s["district"],
                experience=s["experience"],
                skills=s["skills"],
                desired_employment=["part_time", "full_time"],
            )
            try:
                profile.embedding = embeddings.embed(
                    f"{s['headline']}. Навыки: {', '.join(s['skills'])}"
                )
            except Exception:  # noqa: BLE001
                profile.embedding = []
            db.add(profile)

        # Jobs
        for t in JOBS_TEMPLATES:
            emp = emp_by_name[t["employer"]]
            job = Job(
                employer_id=emp.id,
                title=t["title"],
                description=t["description"],
                industry=t["industry"],
                city="Aktau",
                district=t["district"],
                employment_type=t["employment_type"],
                experience=t["experience"],
                salary_min=t["salary_min"],
                salary_max=t["salary_max"],
                currency="KZT",
                skills=t["skills"],
                contact=t["contact"],
                created_at=datetime.utcnow()
                - timedelta(hours=random.randint(0, 72)),
            )

            try:
                score, reasons = ai.evaluate_scam(
                    t["title"], t["description"], t["salary_max"]
                )
            except Exception:
                score, reasons = ai.heuristic_scam_score(
                    f"{t['title']}\n{t['description']}"
                )
            job.risk_score = score
            job.risk_reasons = reasons

            try:
                job.embedding = embeddings.embed(
                    f"{job.title}. {job.description}. {' '.join(job.skills)}"
                )
            except Exception:
                job.embedding = []

            db.add(job)

        db.commit()
        log.info("Seed OK: %d jobs, %d employers, %d seekers",
                 len(JOBS_TEMPLATES), len(EMPLOYERS), len(seekers))
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed()
