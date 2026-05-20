from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field


class DiaryEntry(Document):
    visitor_id: PydanticObjectId
    booking_id: PydanticObjectId
    site_id: PydanticObjectId
    site_name: str
    visit_date: datetime
    title: str
    body: str = ""
    minerals_found: list[str] = []
    photo_urls: list[str] = []
    is_public: bool = True
    points_awarded: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "diary_entries"
        indexes = ["visitor_id", "booking_id", "site_id"]
