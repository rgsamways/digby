from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field


class QuizResult(Document):
    visitor_id: PydanticObjectId
    score: int
    max_score: int = 10
    points_awarded: int
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "quiz_results"
        indexes = ["visitor_id"]
