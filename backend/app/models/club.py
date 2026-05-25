from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field
from pymongo import IndexModel


class Club(Document):
    name: str
    description: str = ""
    owner_id: Indexed(str)
    slug: Indexed(str)  # url-safe, unique
    is_public: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "clubs"
        indexes = [
            IndexModel([("slug", 1)], unique=True),
            IndexModel([("owner_id", 1)]),
        ]


class ClubMembership(Document):
    club_id: Indexed(str)
    user_id: Indexed(str)
    role: str = "member"  # "owner" | "member"
    joined_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "club_memberships"
        indexes = [
            IndexModel([("club_id", 1), ("user_id", 1)], unique=True),
            IndexModel([("user_id", 1)]),
        ]
