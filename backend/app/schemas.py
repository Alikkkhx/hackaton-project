from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import (
    ApplicationStatus,
    EmploymentType,
    ExperienceLevel,
    UserRole,
)


# ---------- Auth / Users ----------


class UserBase(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)
    role: UserRole = UserRole.seeker


class UserLogin(BaseModel):
    login: str  # email or phone
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    role: UserRole
    phone_verified: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PhoneCodeRequest(BaseModel):
    phone: str


class PhoneCodeVerify(BaseModel):
    phone: str
    code: str


# ---------- Seeker Profile ----------


class SeekerProfileIn(BaseModel):
    headline: str = ""
    about: str = ""
    city: str = "Aktau"
    district: str | None = None
    experience: ExperienceLevel = ExperienceLevel.no_exp
    skills: list[str] = []
    desired_employment: list[EmploymentType] = []


class SeekerProfileOut(SeekerProfileIn):
    model_config = ConfigDict(from_attributes=True)
    id: str
    updated_at: datetime


# ---------- Employer Profile ----------


class EmployerProfileIn(BaseModel):
    company_name: str
    description: str = ""
    industry: str | None = None
    city: str = "Aktau"


class EmployerProfileOut(EmployerProfileIn):
    model_config = ConfigDict(from_attributes=True)
    id: str
    verified: bool


# ---------- Jobs ----------


class JobCreate(BaseModel):
    title: str
    description: str
    industry: str
    city: str = "Aktau"
    district: str | None = None
    employment_type: EmploymentType = EmploymentType.full_time
    experience: ExperienceLevel = ExperienceLevel.no_exp
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str = "KZT"
    skills: list[str] = []
    contact: str = ""


class JobOut(JobCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool
    risk_score: float
    risk_reasons: list[str]
    created_at: datetime
    employer_id: str
    employer_name: str | None = None
    employer_verified: bool = False


class JobListFilters(BaseModel):
    q: str | None = None
    city: str | None = None
    district: str | None = None
    industry: str | None = None
    employment_type: EmploymentType | None = None
    experience: ExperienceLevel | None = None
    salary_min: int | None = None
    limit: int = 30
    offset: int = 0


# ---------- Applications ----------


class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: str = ""


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str
    seeker_id: str
    cover_letter: str
    status: ApplicationStatus
    created_at: datetime


class ApplicationWithJob(ApplicationOut):
    job: JobOut


class ApplicationWithSeeker(ApplicationOut):
    seeker: UserOut
    seeker_profile: SeekerProfileOut | None = None


# ---------- Match ----------


class MatchItem(BaseModel):
    job: JobOut
    score: float
    reason: str


class MatchResponse(BaseModel):
    items: list[MatchItem]


# ---------- Telegram ----------


class TgLinkRequest(BaseModel):
    telegram_id: str
    user_id: str | None = None
    city: str = "Aktau"
    district: str | None = None
    industries: list[str] = []
    experience: str | None = None


class TgLinkResponse(BaseModel):
    ok: bool
    subscription_id: str


# ---------- AI Improve ----------


class ImproveDescriptionRequest(BaseModel):
    title: str
    description: str = ""
    industry: str | None = None


class ImproveDescriptionResponse(BaseModel):
    improved_description: str
