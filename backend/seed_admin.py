"""
Seed / remove dummy admin data for UI testing.

Usage:
    uv run python seed_admin.py          # insert seed data
    uv run python seed_admin.py --remove # delete all seed data
"""

import asyncio
import sys
from datetime import UTC, datetime

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import hash_password
from app.models.product import Product
from app.models.shop_order import ShopOrder, ShopOrderItem, ShopOrderStatus
from app.models.strata import StrataBox, StrataFulfilment, StrataStatus, StrataSubscription
from app.models.user import User

SEED_TAG = "_seed"
SEED_EMAIL_1 = "alice.seed@digby-test.internal"
SEED_EMAIL_2 = "bob.seed@digby-test.internal"
SEED_EMAIL_3 = "carol.seed@digby-test.internal"


async def connect():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[User, Product, ShopOrder, StrataSubscription, StrataBox, StrataFulfilment],
    )


async def seed():
    await connect()

    # ── Products ────────────────────────────────────────────────────────────────
    products = [
        Product(
            name="Bancroft Sodalite Rough",
            slug="seed-bancroft-sodalite-rough",
            category="specimens",
            subcategory="rough",
            description="Hand-collected sodalite rough from the Bancroft pegmatite belt. Deep royal blue with white veining.",
            price=2400,
            cost=800,
            images=[],
            sku="SOD-001",
            supplier="Bancroft Gem Co.",
            stock=15,
            dropship=False,
            active=True,
            tags=["sodalite", "rough", "ontario", SEED_TAG],
            related_products=[],
            site_recommendations=[],
        ),
        Product(
            name="Haliburton Amethyst Cluster",
            slug="seed-haliburton-amethyst-cluster",
            category="specimens",
            subcategory="clusters",
            description="Natural amethyst cluster from the Haliburton Highlands. Deep purple points on matrix.",
            price=6500,
            cost=2200,
            images=[],
            sku="AME-002",
            supplier="Highland Minerals",
            stock=4,
            dropship=False,
            active=True,
            tags=["amethyst", "cluster", "ontario", SEED_TAG],
            related_products=[],
            site_recommendations=[],
        ),
        Product(
            name="Ontario Microcline Feldspar",
            slug="seed-ontario-microcline-feldspar",
            category="specimens",
            subcategory="minerals",
            description="Large amazonite-green microcline feldspar crystal. Museum quality.",
            price=18900,
            cost=7500,
            images=[],
            sku="FEL-003",
            supplier="OGS Collection",
            stock=1,
            dropship=False,
            active=True,
            tags=["feldspar", "microcline", "museum", SEED_TAG],
            related_products=[],
            site_recommendations=[],
        ),
    ]
    for p in products:
        await p.insert()
    print(f"Inserted {len(products)} products")

    # ── Seed users ───────────────────────────────────────────────────────────────
    pw = hash_password("seed1234!")
    addr_alice = {
        "name": "Alice Testerson",
        "line1": "123 Quartz Lane",
        "line2": "",
        "city": "Bancroft",
        "province": "ON",
        "postal_code": "K0L 1C0",
        "country": "CA",
    }
    addr_bob = {
        "name": "Bob Crystalton",
        "line1": "456 Feldspar Ave",
        "line2": "Apt 2",
        "city": "Haliburton",
        "province": "ON",
        "postal_code": "K0M 1S0",
        "country": "CA",
    }
    addr_carol = {
        "name": "Carol Geode",
        "line1": "789 Apatite Rd",
        "line2": "",
        "city": "Peterborough",
        "province": "ON",
        "postal_code": "K9J 5T2",
        "country": "CA",
    }

    # delete existing seed users first to avoid duplicate email errors
    for email in [SEED_EMAIL_1, SEED_EMAIL_2, SEED_EMAIL_3]:
        existing = await User.find_one({"email": email})
        if existing:
            await existing.delete()

    alice = User(email=SEED_EMAIL_1, password_hash=pw, name="Alice Testerson")
    bob   = User(email=SEED_EMAIL_2, password_hash=pw, name="Bob Crystalton")
    carol = User(email=SEED_EMAIL_3, password_hash=pw, name="Carol Geode")
    for u in (alice, bob, carol):
        await u.insert()
    print("Inserted 3 seed users")

    # ── Orders ───────────────────────────────────────────────────────────────────
    p0, p1, p2 = products
    orders = [
        ShopOrder(
            user_id=str(alice.id),
            items=[ShopOrderItem(product_id=str(p0.id), product_name=p0.name, qty=2, price=p0.price)],
            total=p0.price * 2,
            status=ShopOrderStatus.SHIPPED,
            stripe_payment_intent_id=f"seed_pi_shipped_001",
            shipping_address=addr_alice,
            tracking_number="1Z999AA10123456784",
        ),
        ShopOrder(
            user_id=str(bob.id),
            items=[
                ShopOrderItem(product_id=str(p1.id), product_name=p1.name, qty=1, price=p1.price),
                ShopOrderItem(product_id=str(p2.id), product_name=p2.name, qty=1, price=p2.price),
            ],
            total=p1.price + p2.price,
            status=ShopOrderStatus.CONFIRMED,
            stripe_payment_intent_id=f"seed_pi_confirmed_002",
            shipping_address=addr_bob,
        ),
        ShopOrder(
            user_id=str(carol.id),
            items=[ShopOrderItem(product_id=str(p0.id), product_name=p0.name, qty=1, price=p0.price)],
            total=p0.price,
            status=ShopOrderStatus.PENDING,
            stripe_payment_intent_id=f"seed_pi_pending_003",
            shipping_address=addr_carol,
        ),
    ]
    for o in orders:
        await o.insert()
    print(f"Inserted {len(orders)} orders")

    # ── Strata box + subscriptions ───────────────────────────────────────────────
    # Remove existing seed box if any
    existing_box = await StrataBox.find_one({"month_number": 1})
    if not existing_box:
        box = StrataBox(
            month_number=1,
            theme="Bancroft Minerals",
            subtitle="Exploring the pegmatites of the Grenville Province",
            contents=["Sodalite rough", "Feldspar crystal", "Apatite specimen", "Field notes card"],
            is_published=True,
        )
        await box.insert()
        print("Inserted Strata box month 1")
    else:
        print("Strata box month 1 already exists — skipping")

    subs = [
        StrataSubscription(
            user_id=str(alice.id),
            tier="discoverer",
            billing_frequency="monthly",
            status=StrataStatus.ACTIVE,
            stripe_subscription_id=f"seed_sub_alice",
            shipping_address=addr_alice,
            current_period_end=datetime(2026, 6, 23, tzinfo=UTC),
        ),
        StrataSubscription(
            user_id=str(bob.id),
            tier="collector",
            billing_frequency="annual",
            status=StrataStatus.ACTIVE,
            stripe_subscription_id=f"seed_sub_bob",
            shipping_address=addr_bob,
            current_period_end=datetime(2027, 5, 23, tzinfo=UTC),
        ),
        StrataSubscription(
            user_id=str(carol.id),
            tier="geologist",
            billing_frequency="monthly",
            status=StrataStatus.PAUSED,
            stripe_subscription_id=f"seed_sub_carol",
            shipping_address=addr_carol,
            current_period_end=datetime(2026, 6, 1, tzinfo=UTC),
        ),
    ]
    for s in subs:
        await s.insert()

    # Mark alice as shipped for box 1
    await StrataFulfilment(
        subscription_id=str(subs[0].id),
        box_month=1,
        shipped_at=datetime.now(UTC),
        tracking_number="1Z999AA10123456784",
    ).insert()

    print(f"Inserted {len(subs)} Strata subscriptions (alice shipped, bob+carol pending)")
    print("\nDone. Run with --remove to clean up.")


async def remove():
    await connect()

    # Products
    products = await Product.find({"tags": SEED_TAG}).to_list()
    for p in products:
        await p.delete()
    print(f"Deleted {len(products)} seed products")

    # Orders
    orders = await ShopOrder.find({"stripe_payment_intent_id": {"$regex": "^seed_"}}).to_list()
    for o in orders:
        await o.delete()
    print(f"Deleted {len(orders)} seed orders")

    # Strata subscriptions
    subs = await StrataSubscription.find(
        {"stripe_subscription_id": {"$regex": "^seed_sub_"}}
    ).to_list()
    sub_ids = [str(s.id) for s in subs]
    for s in subs:
        await s.delete()
    print(f"Deleted {len(subs)} seed subscriptions")

    # Strata fulfilments for those subs
    for sub_id in sub_ids:
        existing = await StrataFulfilment.find_one({"subscription_id": sub_id})
        if existing:
            await existing.delete()
    print(f"Cleaned up fulfilment records")

    # Seed users
    for email in [SEED_EMAIL_1, SEED_EMAIL_2, SEED_EMAIL_3]:
        u = await User.find_one({"email": email})
        if u:
            await u.delete()
    print("Deleted 3 seed users")

    print("\nDone.")


if __name__ == "__main__":
    if "--remove" in sys.argv:
        asyncio.run(remove())
    else:
        asyncio.run(seed())
