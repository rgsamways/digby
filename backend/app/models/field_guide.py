from datetime import UTC, datetime

from beanie import Document
from pydantic import Field


class FieldGuide(Document):
    slug: str = Field(..., description="URL-safe identifier, e.g. 'identifying-amethyst'")
    title: str
    mineral_tags: list[str] = []
    difficulty: str = "beginner"   # beginner | intermediate | advanced
    body: str = ""                 # plain text / light markdown
    cover_image: str = ""
    is_published: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "field_guides"
        indexes = ["slug", "mineral_tags", "is_published"]
