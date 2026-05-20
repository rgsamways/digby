import uuid
from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field


class HuntItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    hint: str = ""
    points: int = 10


class ScavengerHunt(Document):
    site_id: PydanticObjectId
    operator_id: PydanticObjectId
    title: str
    description: str = ""
    items: list[HuntItem] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "scavenger_hunts"
        indexes = ["site_id", "operator_id"]
