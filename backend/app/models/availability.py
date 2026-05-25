from datetime import UTC, date, datetime

from beanie import Document, PydanticObjectId


class Availability(Document):
    site_id: PydanticObjectId
    date: date
    slots_total: int
    slots_remaining: int
    is_blocked: bool = False
    updated_at: datetime = datetime.now(UTC)

    class Settings:
        name = "availability"
        indexes = [
            [("site_id", 1), ("date", 1)],
        ]
