from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document
from pydantic import BaseModel
from pymongo import ASCENDING, IndexModel


class StrataStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"


class StrataTier(StrEnum):
    DISCOVERER = "discoverer"
    COLLECTOR = "collector"
    GEOLOGIST = "geologist"


class StrataBillingFrequency(StrEnum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


# Monthly prices in CAD cents; annual = monthly * 12 * 0.90
TIER_MONTHLY_CENTS: dict[str, int] = {
    StrataTier.DISCOVERER: 3900,
    StrataTier.COLLECTOR: 5900,
    StrataTier.GEOLOGIST: 8900,
}

TIER_NAMES: dict[str, str] = {
    StrataTier.DISCOVERER: "Digby Strata — Discoverer",
    StrataTier.COLLECTOR: "Digby Strata — Collector",
    StrataTier.GEOLOGIST: "Digby Strata — Geologist",
}


class StrataSubscription(Document):
    user_id: str
    tier: str
    billing_frequency: str
    status: StrataStatus = StrataStatus.PENDING
    stripe_customer_id: str = ""
    stripe_subscription_id: str = ""
    shipping_address: dict = {}
    is_gift: bool = False
    gift_recipient_email: str = ""
    current_period_end: datetime | None = None
    created_at: datetime = datetime.now(UTC)
    updated_at: datetime = datetime.now(UTC)

    class Settings:
        name = "strata_subscriptions"
        indexes = [
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("stripe_subscription_id", ASCENDING)], unique=True, sparse=True),
            IndexModel([("stripe_customer_id", ASCENDING)]),
        ]


class BoxSiteLink(BaseModel):
    site_slug: str
    site_name: str
    mineral: str


class StrataBox(Document):
    month_number: int
    theme: str
    subtitle: str = ""
    field_card_text: str = ""
    formation_map_url: str = ""
    cover_image_url: str = ""
    contents: list[str] = []
    site_links: list[BoxSiteLink] = []
    shipped_at: datetime | None = None
    is_published: bool = False
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "strata_boxes"
        indexes = [
            IndexModel([("month_number", ASCENDING)], unique=True),
            IndexModel([("is_published", ASCENDING)]),
        ]


class CollectorCardCode(Document):
    code: str
    mineral_id: str = ""
    mineral_name: str = ""
    box_id: str = ""
    box_month: int = 0
    redeemed_by: str | None = None
    redeemed_at: datetime | None = None
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "collector_card_codes"
        indexes = [
            IndexModel([("code", ASCENDING)], unique=True),
            IndexModel([("redeemed_by", ASCENDING)]),
        ]
