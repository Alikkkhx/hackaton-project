from __future__ import annotations

import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import (
    EmployerProfile,
    EmploymentType,
    ExperienceLevel,
    Job,
    TelegramSubscription,
    User,
    UserRole,
)
from app.schemas import JobCreate, JobOut
from app.security import get_current_user
from app.services import ai, embeddings, notifications

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _to_job_out(job: Job, db: Session) -> JobOut:
    employer_name = None
    employer_verified = False
    employer_profile = (
        db.query(EmployerProfile).filter_by(user_id=job.employer_id).first()
    )
    if employer_profile:
        employer_name = employer_profile.company_name
        employer_verified = employer_profile.verified

    data = {
        "id": job.id,
        "employer_id": job.employer_id,
        "title": job.title,
        "description": job.description,
        "industry": job.industry,
        "city": job.city,
        "district": job.district,
        "employment_type": job.employment_type,
        "experience": job.experience,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "skills": job.skills or [],
        "contact": job.contact,
        "is_active": job.is_active,
        "risk_score": job.risk_score,
        "risk_reasons": job.risk_reasons or [],
        "created_at": job.created_at,
        "employer_name": employer_name,
        "employer_verified": employer_verified,
    }
    return JobOut(**data)


def _job_text(job: Job) -> str:
    parts = [
        job.title,
        job.description,
        f"Навыки: {', '.join(job.skills or [])}",
        f"Сфера: {job.industry}",
        f"Опыт: {job.experience.value}",
        f"Город: {job.city}",
    ]
    if job.district:
        parts.append(f"Район: {job.district}")
    return "; ".join(parts)


async def _notify_subscribers(job_id: str, title: str, city: str, district: str | None, industry: str):
    """Fire-and-forget telegram notifications for subscribers matching this job."""
    from app.db import SessionLocal

    app_url = get_settings().public_app_url.rstrip("/")
    with SessionLocal() as db:
        subs = db.query(TelegramSubscription).filter_by(active=True, city=city).all()
        chat_ids: list[str] = []
        for s in subs:
            if s.district and district and s.district.lower() != district.lower():
                continue
            if s.industries and industry not in s.industries:
                continue
            chat_ids.append(s.telegram_id)

    text = notifications.format_new_job(title, city, district, job_id, app_url)
    await asyncio.gather(*(notifications.send_message(cid, text) for cid in chat_ids))


@router.get("", response_model=list[JobOut])
def list_jobs(
    q: str | None = Query(None),
    city: str | None = Query(None),
    district: str | None = Query(None),
    industry: str | None = Query(None),
    employment_type: EmploymentType | None = Query(None),
    experience: ExperienceLevel | None = Query(None),
    salary_min: int | None = Query(None, ge=0),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Job).filter(Job.is_active.is_(True))

    if city:
        query = query.filter(Job.city.ilike(f"%{city}%"))
    if district:
        query = query.filter(Job.district.ilike(f"%{district}%"))
    if industry:
        query = query.filter(Job.industry == industry)
    if employment_type:
        query = query.filter(Job.employment_type == employment_type)
    if experience:
        query = query.filter(Job.experience == experience)
    if salary_min is not None:
        query = query.filter(
            or_(Job.salary_max.is_(None), Job.salary_max >= salary_min)
        )
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(Job.title.ilike(like), Job.description.ilike(like))
        )

    query = query.order_by(Job.created_at.desc()).limit(limit).offset(offset)
    jobs = query.all()
    return [_to_job_out(j, db) for j in jobs]


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Вакансия не найдена")
    return _to_job_out(job, db)


@router.post("", response_model=JobOut, status_code=201)
def create_job(
    payload: JobCreate,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.employer:
        raise HTTPException(403, "Только для работодателей")

    job = Job(
        employer_id=user.id,
        title=payload.title,
        description=payload.description,
        industry=payload.industry,
        city=payload.city,
        district=payload.district,
        employment_type=payload.employment_type,
        experience=payload.experience,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        currency=payload.currency,
        skills=payload.skills,
        contact=payload.contact,
    )

    # AI anti-scam
    try:
        score, reasons = ai.evaluate_scam(
            payload.title, payload.description, payload.salary_max
        )
    except Exception:  # noqa: BLE001
        score, reasons = ai.heuristic_scam_score(f"{payload.title}\n{payload.description}")

    job.risk_score = score
    job.risk_reasons = reasons

    # Embedding
    try:
        job.embedding = embeddings.embed(
            f"{job.title}. {job.description}. {' '.join(job.skills or [])}"
        )
    except Exception:  # noqa: BLE001
        job.embedding = []

    db.add(job)
    db.commit()
    db.refresh(job)

    # Push notifications to Telegram subscribers
    background.add_task(
        _notify_subscribers,
        job.id,
        job.title,
        job.city,
        job.district,
        job.industry,
    )

    return _to_job_out(job, db)


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Вакансия не найдена")
    if job.employer_id != user.id and user.role != UserRole.admin:
        raise HTTPException(403, "Нельзя удалить чужую вакансию")
    db.delete(job)
    db.commit()


@router.get("/mine/all", response_model=list[JobOut])
def my_jobs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != UserRole.employer:
        raise HTTPException(403, "Только для работодателей")
    jobs = (
        db.query(Job)
        .filter(Job.employer_id == user.id)
        .order_by(Job.created_at.desc())
        .all()
    )
    return [_to_job_out(j, db) for j in jobs]
