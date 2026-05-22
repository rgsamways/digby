from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, PydanticObjectId
from pydantic import Field


class FindVisibility(StrEnum):
    PRIVATE = "private"
    PUBLIC = "public"


class VerificationStatus(StrEnum):
    UNVERIFIED = "unverified"
    AI_LIKELY = "ai_likely"
    COMMUNITY_VERIFIED = "community_verified"
    OGS_REVIEWED = "ogs_reviewed"
    DISPUTED = "disputed"


class Find(Document):
    user_id: PydanticObjectId
    date: datetime
    mineral_name: str
    notes: str = ""
    photo_urls: list[str] = []

    # Location
    gps_lat: float | None = None
    gps_lng: float | None = None
    site_id: PydanticObjectId | None = None
    site_name: str | None = None

    # Geology context
    host_rock: str | None = None
    geological_province: str | None = None
    formation: str | None = None
    specimen_quality: str | None = None

    # Verification pipeline
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED

    # Citizen science
    citizen_science_opted_in: bool = False
    citizen_science_eligible: bool = False  # computed on save

    # Social
    visibility: FindVisibility = FindVisibility.PUBLIC
    save_count: int = 0
    is_featured: bool = False
    is_junior_submission: bool = False

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "finds"
        indexes = [
            "user_id",
            "verification_status",
            "geological_province",
            "mineral_name",
            [("visibility", 1), ("created_at", -1)],
            [("is_featured", 1), ("created_at", -1)],
        ]


class FindSave(Document):
    user_id: PydanticObjectId
    find_id: PydanticObjectId
    saved_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "find_saves"
        indexes = [
            [("user_id", 1), ("find_id", 1)],
        ]
