from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import TelegramSubscription
from app.schemas import TgLinkRequest, TgLinkResponse

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


@router.post("/subscribe", response_model=TgLinkResponse)
def subscribe(payload: TgLinkRequest, db: Session = Depends(get_db)):
    sub = (
        db.query(TelegramSubscription)
        .filter_by(telegram_id=payload.telegram_id)
        .first()
    )
    if not sub:
        sub = TelegramSubscription(telegram_id=payload.telegram_id)
        db.add(sub)

    sub.user_id = payload.user_id
    sub.city = payload.city
    sub.district = payload.district
    sub.industries = payload.industries
    sub.experience = payload.experience
    sub.active = True

    db.commit()
    db.refresh(sub)
    return TgLinkResponse(ok=True, subscription_id=sub.id)


@router.post("/unsubscribe/{telegram_id}")
def unsubscribe(telegram_id: str, db: Session = Depends(get_db)):
    sub = (
        db.query(TelegramSubscription)
        .filter_by(telegram_id=telegram_id)
        .first()
    )
    if sub:
        sub.active = False
        db.commit()
    return {"ok": True}
