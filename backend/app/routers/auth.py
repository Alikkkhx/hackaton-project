import logging
import random
import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import EmployerProfile, SeekerProfile, User, UserRole
from app.schemas import PhoneCodeRequest, PhoneCodeVerify, TokenOut, UserCreate, UserLogin, UserOut
from app.security import create_access_token, get_current_user, hash_password, verify_password

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory OTP store: {phone: (code, expires_at)}
_otp_store: dict[str, tuple[str, float]] = {}


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


@router.post("/request-phone-code")
def request_phone_code(payload: PhoneCodeRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(400, "Укажите номер телефона")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(404, "Пользователь с таким телефоном не найден")

    if user.phone_verified:
        return {"ok": True, "message": "Телефон уже подтверждён"}

    code = f"{random.randint(1000, 9999)}"
    _otp_store[phone] = (code, time.time() + 300)  # 5 min TTL

    # Mock SMS — print to console
    log.info("📱 OTP для %s: %s", phone, code)
    print(f"\n{'='*40}\n📱 SMS-код для {phone}: {code}\n{'='*40}\n")

    return {"ok": True, "message": "Код отправлен (см. консоль сервера)"}


@router.post("/verify-phone")
def verify_phone(
    payload: PhoneCodeVerify,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    phone = payload.phone.strip()
    code = payload.code.strip()

    stored = _otp_store.get(phone)
    if not stored:
        raise HTTPException(400, "Код не запрашивался. Отправьте код заново.")

    expected_code, expires_at = stored
    if time.time() > expires_at:
        _otp_store.pop(phone, None)
        raise HTTPException(400, "Код истёк. Отправьте заново.")

    if code != expected_code:
        raise HTTPException(400, "Неверный код")

    _otp_store.pop(phone, None)
    user.phone_verified = True
    db.commit()
    db.refresh(user)

    return {"ok": True, "phone_verified": True}
