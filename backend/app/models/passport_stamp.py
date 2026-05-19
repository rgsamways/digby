from datetime import UTC, datetime

from beanie import Document, PydanticObjectId


class PassportStamp(Document):
    visitor_id: PydanticObjectId
    site_id: PydanticObjectId
    site_name: str
    minerals_found: list[str] = []
    visited_at: datetime
    booking_id: PydanticObjectId
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "passport_stamps"
        indexes = ["visitor_id", "site_id"]
