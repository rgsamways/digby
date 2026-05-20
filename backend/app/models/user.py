from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import EmailStr


class UserRole(StrEnum):
    VISITOR = "visitor"
    OPERATOR = "operator"
    GUIDE = "guide"
    ADMIN = "admin"


class User(Document):
    email: EmailStr
    password_hash: str
    name: str
    phone: str | None = None
    role: UserRole = UserRole.VISITOR
    bio: str = ""
    avatar_url: str | None = None
    # visitor fields
    stripe_customer_id: str | None = None
    # operator fields
    stripe_account_id: str | None = None
    stripe_account_enabled: bool = False
    # guide fields
    specialties: list[str] = []          # e.g. ["amethyst", "fossils"]
    years_experience: int = 0
    certifications: list[str] = []
    rate_per_day: float | None = None    # CAD
    guide_location: str | None = None   # e.g. "Bancroft, ON"
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "users"
        indexes = ["email"]
