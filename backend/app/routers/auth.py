from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import EmployerProfile, SeekerProfile, User, UserRole
from app.schemas import TokenOut, UserCreate, UserLogin, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if not payload.email and not payload.phone:
        raise HTTPException(400, "Укажите email или телефон")

    exists = db.query(User).filter(
        or_(
            User.email == payload.email if payload.email else False,
            User.phone == payload.phone if payload.phone else False,
        )
    ).first()
    if exists:
        raise HTTPException(409, "Пользователь с таким email или телефоном уже есть")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        phone_verified=bool(payload.phone),  # MVP: считаем телефон валидным после регистрации
    )
    db.add(user)
    db.flush()

    if user.role == UserRole.seeker:
        db.add(SeekerProfile(user_id=user.id, headline="", about=""))
    elif user.role == UserRole.employer:
        db.add(
            EmployerProfile(
                user_id=user.id,
                company_name=payload.full_name,
                description="",
            )
        )
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    login = payload.login.strip()
    user = (
        db.query(User)
        .filter(or_(User.email == login, User.phone == login))
        .first()
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Неверный логин или пароль")
    token = create_access_token(user.id)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))
