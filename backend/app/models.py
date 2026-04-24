from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def json_col():
    """Use JSONB on Postgres, JSON on SQLite."""
    return JSON().with_variant(JSONB, "postgresql")


class UserRole(str, enum.Enum):
    seeker = "seeker"
    employer = "employer"
    admin = "admin"


class EmploymentType(str, enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    gig = "gig"
    internship = "internship"


class ExperienceLevel(str, enum.Enum):
    student = "student"
    no_exp = "no_exp"
    junior = "junior"
    middle = "middle"
    senior = "senior"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    viewed = "viewed"
    accepted = "accepted"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.seeker)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    telegram_id: Mapped[str | None] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    seeker_profile: Mapped["SeekerProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    employer_profile: Mapped["EmployerProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    jobs: Mapped[list["Job"]] = relationship(back_populates="employer")
    applications: Mapped[list["Application"]] = relationship(
        back_populates="seeker",
        foreign_keys="Application.seeker_id",
    )


class SeekerProfile(Base):
    __tablename__ = "seeker_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    headline: Mapped[str] = mapped_column(String(255), default="")
    about: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(String(120), default="Aktau")
    district: Mapped[str | None] = mapped_column(String(120))
    experience: Mapped[ExperienceLevel] = mapped_column(
        Enum(ExperienceLevel), default=ExperienceLevel.no_exp
    )
    skills: Mapped[list] = mapped_column(json_col(), default=list)
    desired_employment: Mapped[list] = mapped_column(json_col(), default=list)
    embedding: Mapped[list] = mapped_column(json_col(), default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="seeker_profile")


class EmployerProfile(Base):
    __tablename__ = "employer_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    company_name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    industry: Mapped[str | None] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(120), default="Aktau")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(back_populates="employer_profile")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    employer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    industry: Mapped[str] = mapped_column(String(120), index=True)
    city: Mapped[str] = mapped_column(String(120), index=True, default="Aktau")
    district: Mapped[str | None] = mapped_column(String(120), index=True)
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType), default=EmploymentType.full_time
    )
    experience: Mapped[ExperienceLevel] = mapped_column(
        Enum(ExperienceLevel), default=ExperienceLevel.no_exp
    )
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="KZT")
    skills: Mapped[list] = mapped_column(json_col(), default=list)
    contact: Mapped[str] = mapped_column(String(255), default="")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_reasons: Mapped[list] = mapped_column(json_col(), default=list)

    embedding: Mapped[list] = mapped_column(json_col(), default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    employer: Mapped[User] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "seeker_id", name="uq_application_job_seeker"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    seeker_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    cover_letter: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    job: Mapped[Job] = relationship(back_populates="applications")
    seeker: Mapped[User] = relationship(
        back_populates="applications", foreign_keys=[seeker_id]
    )


class TelegramSubscription(Base):
    __tablename__ = "telegram_subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    telegram_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    city: Mapped[str] = mapped_column(String(120), default="Aktau")
    district: Mapped[str | None] = mapped_column(String(120))
    industries: Mapped[list] = mapped_column(json_col(), default=list)
    experience: Mapped[str | None] = mapped_column(String(32))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
