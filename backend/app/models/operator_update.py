from datetime import UTC, datetime

from beanie import Document, PydanticObjectId


class OperatorUpdate(Document):
    title: str
    body: str
    category: str = "general"  # general | payout | product | opportunity | urgent
    action_label: str = ""     # e.g. "Confirm banking details"
    action_url: str = ""       # e.g. "/dashboard/settings"
    is_active: bool = True
    author_id: PydanticObjectId | None = None
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "operator_updates"
        indexes = ["is_active", "created_at"]
