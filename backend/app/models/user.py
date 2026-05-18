from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import EmailStr


class UserRole(StrEnum):
    VISITOR = "visitor"
    OPERATOR = "operator"
    ADMIN = "admin"


class User(Document):
    email: EmailStr
    password_hash: str
    name: str
    phone: str | None = None
    role: UserRole = UserRole.VISITOR
    stripe_customer_id: str | None = None   # visitors
    stripe_account_id: str | None = None    # operators (Connect)
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "users"
        indexes = ["email"]
