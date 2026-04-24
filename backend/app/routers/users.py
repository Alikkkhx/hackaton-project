from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import EmployerProfile, SeekerProfile, User, UserRole
from app.schemas import (
    EmployerProfileIn,
    EmployerProfileOut,
    SeekerProfileIn,
    SeekerProfileOut,
    UserOut,
)
from app.security import get_current_user
from app.services import embeddings

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


def _profile_text(p: SeekerProfile) -> str:
    return "; ".join(
        filter(
            None,
            [
                p.headline,
                p.about,
                f"Навыки: {', '.join(p.skills)}" if p.skills else "",
                f"Опыт: {p.experience.value}",
                f"Район: {p.district}" if p.district else "",
            ],
        )
    )


@router.get("/me/seeker-profile", response_model=SeekerProfileOut)
def get_seeker_profile(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role != UserRole.seeker:
        raise HTTPException(403, "Только для соискателей")
    profile = db.query(SeekerProfile).filter_by(user_id=user.id).first()
    if not profile:
        profile = SeekerProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return SeekerProfileOut.model_validate(profile)


@router.put("/me/seeker-profile", response_model=SeekerProfileOut)
def upsert_seeker_profile(
    payload: SeekerProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.seeker:
        raise HTTPException(403, "Только для соискателей")

    profile = db.query(SeekerProfile).filter_by(user_id=user.id).first()
    if not profile:
        profile = SeekerProfile(user_id=user.id)
        db.add(profile)

    profile.headline = payload.headline
    profile.about = payload.about
    profile.city = payload.city
    profile.district = payload.district
    profile.experience = payload.experience
    profile.skills = payload.skills
    profile.desired_employment = [e.value for e in payload.desired_employment]

    try:
        profile.embedding = embeddings.embed(_profile_text(profile))
    except Exception:  # embeddings are optional (model may be missing)
        profile.embedding = []

    db.commit()
    db.refresh(profile)
    return SeekerProfileOut.model_validate(profile)


@router.get("/me/employer-profile", response_model=EmployerProfileOut)
def get_employer_profile(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user.role != UserRole.employer:
        raise HTTPException(403, "Только для работодателей")
    profile = db.query(EmployerProfile).filter_by(user_id=user.id).first()
    if not profile:
        profile = EmployerProfile(user_id=user.id, company_name=user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return EmployerProfileOut.model_validate(profile)


@router.put("/me/employer-profile", response_model=EmployerProfileOut)
def upsert_employer_profile(
    payload: EmployerProfileIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != UserRole.employer:
        raise HTTPException(403, "Только для работодателей")
    profile = db.query(EmployerProfile).filter_by(user_id=user.id).first()
    if not profile:
        profile = EmployerProfile(user_id=user.id, company_name=payload.company_name)
        db.add(profile)
    profile.company_name = payload.company_name
    profile.description = payload.description
    profile.industry = payload.industry
    profile.city = payload.city
    db.commit()
    db.refresh(profile)
    return EmployerProfileOut.model_validate(profile)
