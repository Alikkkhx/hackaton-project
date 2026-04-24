from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Job, SeekerProfile, User, UserRole
from app.routers.jobs import _to_job_out
from app.schemas import MatchItem, MatchResponse
from app.security import get_current_user
from app.services import ai, embeddings

router = APIRouter(prefix="/api/match", tags=["match"])


def _rule_based_score(profile: SeekerProfile, job: Job) -> float:
    """Fallback score when embeddings are missing."""
    score = 0.0

    p_skills = {s.lower() for s in (profile.skills or [])}
    j_skills = {s.lower() for s in (job.skills or [])}
    if j_skills:
        overlap = len(p_skills & j_skills) / len(j_skills)
        score += 0.55 * overlap

    if profile.city and job.city and profile.city.lower() == job.city.lower():
        score += 0.15
    if profile.district and job.district and profile.district.lower() == job.district.lower():
        score += 0.20

    exp_order = ["student", "no_exp", "junior", "middle", "senior"]
    try:
        pi = exp_order.index(profile.experience.value)
        ji = exp_order.index(job.experience.value)
        if pi >= ji:
            score += 0.10
    except ValueError:
        pass

    return min(score, 1.0)


@router.get("/for-me", response_model=MatchResponse)
def match_for_me(
    limit: int = Query(10, ge=1, le=30),
    explain: bool = Query(True, description="Попросить AI объяснить совпадение"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.seeker:
        raise HTTPException(403, "Матчинг работает для соискателей")

    profile = db.query(SeekerProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(400, "Сначала заполните профиль")

    jobs = (
        db.query(Job)
        .filter(Job.is_active.is_(True), Job.risk_score < 0.7)
        .all()
    )

    # Компонент 1: эмбеддинги
    items: list[tuple[float, Job]] = []
    if profile.embedding:
        for job in jobs:
            if job.embedding:
                sim = embeddings.cosine(profile.embedding, job.embedding)
            else:
                sim = _rule_based_score(profile, job)
            # Блендим с правилами на случай пустого embedding
            rule = _rule_based_score(profile, job)
            final = 0.65 * sim + 0.35 * rule
            items.append((final, job))
    else:
        for job in jobs:
            items.append((_rule_based_score(profile, job), job))

    items.sort(key=lambda x: x[0], reverse=True)
    top = items[:limit]

    result: list[MatchItem] = []
    for score, job in top:
        reason = ""
        if explain:
            try:
                reason = ai.explain_match(
                    seeker_headline=profile.headline or "",
                    seeker_skills=profile.skills or [],
                    seeker_experience=profile.experience.value,
                    seeker_district=profile.district,
                    job_title=job.title,
                    job_skills=job.skills or [],
                    job_experience=job.experience.value,
                    job_district=job.district,
                    score=score,
                )
            except Exception:  # noqa: BLE001
                reason = ai.fallback_reason(
                    profile.skills or [],
                    job.skills or [],
                    profile.district,
                    job.district,
                )
        result.append(MatchItem(job=_to_job_out(job, db), score=round(score, 3), reason=reason))

    return MatchResponse(items=result)
