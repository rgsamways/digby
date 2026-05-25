from datetime import UTC, datetime

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class FindVerification(Document):
    find_id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_tier: str
    # confirm | correct | confirm_with_note | request_photos | unidentifiable | escalate
    action: str
    corrected_mineral: str | None = None
    note: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "find_verifications"
        indexes = [
            IndexModel([("find_id", ASCENDING)]),
            IndexModel([("reviewer_id", ASCENDING)]),
        ]
