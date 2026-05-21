from datetime import UTC, date, datetime

from beanie import Document, PydanticObjectId


class WaitlistEntry(Document):
    site_id: PydanticObjectId
    date: date
    visitor_id: PydanticObjectId
    email: str
    notified_at: datetime | None = None
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "waitlist_entries"
        indexes = ["site_id", "visitor_id"]
