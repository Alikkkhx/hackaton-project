from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    Application,
    ApplicationStatus,
    Job,
    SeekerProfile,
    User,
    UserRole,
)
from app.routers.jobs import _to_job_out
from app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationWithJob,
    ApplicationWithSeeker,
    SeekerProfileOut,
    UserOut,
)
from app.security import get_current_user
from app.services import notifications

router = APIRouter(prefix="/api/applications", tags=["applications"])


async def _notify_employer(employer_telegram_id: str | None, job_title: str, seeker_name: str, cover: str):
    if not employer_telegram_id:
        return
    text = notifications.format_new_application(job_title, seeker_name, cover)
    await notifications.send_message(employer_telegram_id, text)


@router.post("", response_model=ApplicationOut, status_code=201)
def apply_to_job(
    payload: ApplicationCreate,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.seeker:
        raise HTTPException(403, "Только соискатели могут откликаться")

    job = db.get(Job, payload.job_id)
    if not job or not job.is_active:
        raise HTTPException(404, "Вакансия не найдена или неактивна")

    existing = (
        db.query(Application)
        .filter_by(job_id=payload.job_id, seeker_id=user.id)
        .first()
    )
    if existing:
        raise HTTPException(409, "Вы уже откликнулись на эту вакансию")

    app = Application(
        job_id=payload.job_id,
        seeker_id=user.id,
        cover_letter=payload.cover_letter,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # notify employer via telegram if linked
    employer = db.get(User, job.employer_id)
    if employer and employer.telegram_id:
        background.add_task(
            _notify_employer,
            employer.telegram_id,
            job.title,
            user.full_name,
            payload.cover_letter,
        )

    return ApplicationOut.model_validate(app)


@router.get("/mine", response_model=list[ApplicationWithJob])
def my_applications(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role != UserRole.seeker:
        raise HTTPException(403, "Только для соискателей")
    items = (
        db.query(Application)
        .filter(Application.seeker_id == user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    out: list[ApplicationWithJob] = []
    for a in items:
        out.append(
            ApplicationWithJob(
                id=a.id,
                job_id=a.job_id,
                seeker_id=a.seeker_id,
                cover_letter=a.cover_letter,
                status=a.status,
                created_at=a.created_at,
                job=_to_job_out(a.job, db),
            )
        )
    return out


@router.get("/for-job/{job_id}", response_model=list[ApplicationWithSeeker])
def applications_for_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Вакансия не найдена")
    if job.employer_id != user.id and user.role != UserRole.admin:
        raise HTTPException(403, "Нет доступа к откликам этой вакансии")

    items = (
        db.query(Application)
        .filter(Application.job_id == job_id)
        .order_by(Application.created_at.desc())
        .all()
    )
    out: list[ApplicationWithSeeker] = []
    for a in items:
        profile = (
            db.query(SeekerProfile).filter_by(user_id=a.seeker_id).first()
        )
        out.append(
            ApplicationWithSeeker(
                id=a.id,
                job_id=a.job_id,
                seeker_id=a.seeker_id,
                cover_letter=a.cover_letter,
                status=a.status,
                created_at=a.created_at,
                seeker=UserOut.model_validate(a.seeker),
                seeker_profile=(
                    SeekerProfileOut.model_validate(profile) if profile else None
                ),
            )
        )
    return out


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: str,
    status: ApplicationStatus,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = db.get(Application, application_id)
    if not app:
        raise HTTPException(404, "Отклик не найден")
    job = db.get(Job, app.job_id)
    if not job or (job.employer_id != user.id and user.role != UserRole.admin):
        raise HTTPException(403, "Нет доступа")
    app.status = status
    db.commit()
    db.refresh(app)
    return ApplicationOut.model_validate(app)
