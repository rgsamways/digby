from datetime import UTC, datetime

from beanie import Document, PydanticObjectId


class SiteQuestion(Document):
    site_id: PydanticObjectId
    visitor_id: PydanticObjectId | None = None
    visitor_name: str = "Visitor"
    question: str
    answer: str = ""
    answered_at: datetime | None = None
    is_visible: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "site_questions"
        indexes = ["site_id", "is_visible"]
