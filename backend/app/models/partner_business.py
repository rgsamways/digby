from datetime import UTC, datetime

from beanie import Document


class PartnerBusiness(Document):
    name: str
    tagline: str = ""                      # e.g. "Lapidary supplies & gem identification"
    url: str = ""                          # website or social link
    perk: str = ""                         # e.g. "Show your Digby passport for 10% off"
    region: str                            # e.g. "Thunder Bay, ON"  — used for matching
    categories: list[str] = []            # e.g. ["gear", "accommodation", "lapidary", "gem-shop"]
    is_active: bool = True
    created_at: datetime = datetime.now(UTC)

    class Settings:
        name = "partner_businesses"
        indexes = ["region", "is_active"]
