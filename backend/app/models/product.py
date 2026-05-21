from datetime import UTC, datetime

from beanie import Document
from pymongo import ASCENDING, IndexModel


class Product(Document):
    name: str
    slug: str
    category: str  # get-started | field-gear | identify-display | bancroft-collection
    subcategory: str = ""
    description: str = ""
    price: int = 0  # cents
    cost: int = 0  # cents
    images: list[str] = []
    sku: str = ""
    supplier: str = ""
    stock: int = 0
    dropship: bool = False
    active: bool = True
    tags: list[str] = []
    related_products: list[str] = []  # product IDs
    site_recommendations: list[str] = []  # site slugs
    created_at: datetime = datetime.now(UTC)
    updated_at: datetime = datetime.now(UTC)

    class Settings:
        name = "products"
        indexes = [
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("category", ASCENDING)]),
            IndexModel([("tags", ASCENDING)]),
            IndexModel([("site_recommendations", ASCENDING)]),
            IndexModel([("active", ASCENDING)]),
        ]
