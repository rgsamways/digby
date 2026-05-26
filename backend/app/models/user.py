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
    # Additive capability roles (citizen_scientist, educator, creator, prospector, researcher)
    roles: list[str] = []
    # Domain-inferred signals set at registration (university, school_board, government, mining)
    email_flags: list[str] = []
    # Answers from the optional signup survey
    onboarding_answers: list[str] = []
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
    # Creator programme fields
    is_creator: bool = False
    creator_tier: str | None = None   # explorer | field_geologist | resident_geologist
    social_instagram: str | None = None
    social_tiktok: str | None = None
    social_youtube: str | None = None
    content_url: str | None = None
    # Creator application queue
    creator_application_submitted: bool = False
    creator_application_handle: str | None = None
    creator_application_platform: str | None = None   # instagram | tiktok | youtube | other
    creator_application_short_answer: str | None = None
    creator_application_at: datetime | None = None
    # Expert programme fields
    expert_tier: str | None = None          # verified_expert | community_reviewer | ogs_endorsed
    # P.Geo | P.Eng | MSc/PhD | OGS/GSC | Faculty | GIS | Other
    credential_type: str | None = None
    credential_reference: str | None = None  # private — licence/institution for admin verification
    expert_specialisations: list[str] = []
    institutional_affiliation: str | None = None
    publications_url: str | None = None
    expert_review_count: int = 0
    expert_agreement_rate: float = 0.0

    class Settings:
        name = "users"
        indexes = ["email"]
