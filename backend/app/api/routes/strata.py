from datetime import UTC, datetime

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.strata import (
    TIER_MONTHLY_CENTS,
    TIER_NAMES,
    CollectorCardCode,
    StrataBillingFrequency,
    StrataBox,
    StrataStatus,
    StrataSubscription,
)
from app.models.user import User

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY

ANNUAL_DISCOUNT = 0.90  # 10% off


def _tier_price_cents(tier: str, frequency: str) -> int:
    monthly = TIER_MONTHLY_CENTS[tier]
    if frequency == StrataBillingFrequency.ANNUAL:
        return round(monthly * 12 * ANNUAL_DISCOUNT)
    return monthly


def _sub_dict(s: StrataSubscription) -> dict:
    return {
        "id": str(s.id),
        "tier": s.tier,
        "billing_frequency": s.billing_frequency,
        "status": s.status,
        "shipping_address": s.shipping_address,
        "is_gift": s.is_gift,
        "current_period_end": s.current_period_end.isoformat() if s.current_period_end else None,
        "created_at": s.created_at.isoformat(),
    }


# ── Subscribe ─────────────────────────────────────────────────────────────────

class ShippingAddressIn(BaseModel):
    name: str
    line1: str
    line2: str = ""
    city: str
    province: str
    postal_code: str
    country: str = "CA"


class SubscribeIn(BaseModel):
    tier: str
    billing_frequency: str
    shipping_address: ShippingAddressIn


@router.post("/subscribe")
async def subscribe(
    body: SubscribeIn,
    user: User = Depends(get_current_user),
) -> dict:
    if body.tier not in TIER_MONTHLY_CENTS:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {body.tier}")
    valid_freqs = (StrataBillingFrequency.MONTHLY, StrataBillingFrequency.ANNUAL)
    if body.billing_frequency not in valid_freqs:
        raise HTTPException(status_code=400, detail="frequency must be monthly or annual")

    # Block duplicate active subscriptions
    existing = await StrataSubscription.find_one({
        "user_id": str(user.id),
        "status": {"$in": [StrataStatus.ACTIVE, StrataStatus.PENDING, StrataStatus.PAUSED]},
    })
    if existing:
        raise HTTPException(status_code=409, detail="Active subscription already exists")

    # Create or retrieve Stripe customer
    customer = stripe.Customer.create(
        email=user.email or "",
        name=user.name,
        metadata={"digby_user_id": str(user.id)},
    )

    amount = _tier_price_cents(body.tier, body.billing_frequency)
    interval = "year" if body.billing_frequency == StrataBillingFrequency.ANNUAL else "month"

    sub = stripe.Subscription.create(
        customer=customer["id"],
        items=[{
            "price_data": {  # type: ignore[typeddict-item, typeddict-unknown-key]
                "currency": "cad",
                "unit_amount": amount,
                "recurring": {"interval": interval},  # type: ignore[typeddict-item]
                "product_data": {"name": TIER_NAMES[body.tier]},
            }
        }],
        payment_behavior="default_incomplete",
        payment_settings={"save_default_payment_method": "on_subscription"},
        expand=["latest_invoice.payment_intent"],
        metadata={
            "order_type": "strata",
            "digby_user_id": str(user.id),
            "tier": body.tier,
            "billing_frequency": body.billing_frequency,
        },
    )

    # Persist pending subscription
    record = StrataSubscription(
        user_id=str(user.id),
        tier=body.tier,
        billing_frequency=body.billing_frequency,
        status=StrataStatus.PENDING,
        stripe_customer_id=customer["id"],
        stripe_subscription_id=sub["id"],
        shipping_address=body.shipping_address.model_dump(),
    )
    await record.insert()

    client_secret = sub["latest_invoice"]["payment_intent"]["client_secret"]
    return {
        "subscription_id": sub["id"],
        "client_secret": client_secret,
    }


# ── My subscription ───────────────────────────────────────────────────────────

@router.get("/my")
async def my_subscription(user: User = Depends(get_current_user)) -> dict:
    sub = await StrataSubscription.find_one(
        {"user_id": str(user.id), "status": {"$nin": [StrataStatus.CANCELLED]}}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    return _sub_dict(sub)


class UpdateSubIn(BaseModel):
    tier: str | None = None
    billing_frequency: str | None = None
    shipping_address: ShippingAddressIn | None = None
    paused: bool | None = None


@router.patch("/my")
async def update_subscription(
    body: UpdateSubIn,
    user: User = Depends(get_current_user),
) -> dict:
    sub = await StrataSubscription.find_one(
        {"user_id": str(user.id), "status": {"$nin": [StrataStatus.CANCELLED]}}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")

    if body.shipping_address:
        sub.shipping_address = body.shipping_address.model_dump()

    if body.paused is True and sub.status == StrataStatus.ACTIVE:
        stripe.Subscription.modify(
            sub.stripe_subscription_id, pause_collection={"behavior": "void"}
        )
        sub.status = StrataStatus.PAUSED

    if body.paused is False and sub.status == StrataStatus.PAUSED:
        stripe.Subscription.modify(sub.stripe_subscription_id, pause_collection="")
        sub.status = StrataStatus.ACTIVE

    sub.updated_at = datetime.now(UTC)
    await sub.save()
    return _sub_dict(sub)


@router.delete("/my")
async def cancel_subscription(user: User = Depends(get_current_user)) -> dict:
    sub = await StrataSubscription.find_one(
        {"user_id": str(user.id), "status": {"$nin": [StrataStatus.CANCELLED]}}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")

    if sub.stripe_subscription_id:
        stripe.Subscription.modify(sub.stripe_subscription_id, cancel_at_period_end=True)

    sub.status = StrataStatus.CANCELLED
    sub.updated_at = datetime.now(UTC)
    await sub.save()
    return {"ok": True, "message": "Subscription cancelled at end of billing period"}


# ── Gift subscriptions ────────────────────────────────────────────────────────

class GiftIn(BaseModel):
    tier: str
    billing_frequency: str
    months: int = 3
    recipient_email: str
    recipient_name: str
    shipping_address: ShippingAddressIn


@router.post("/gift")
async def gift_subscription(
    body: GiftIn,
    user: User = Depends(get_current_user),
) -> dict:
    if body.tier not in TIER_MONTHLY_CENTS:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {body.tier}")

    monthly = TIER_MONTHLY_CENTS[body.tier]
    total = monthly * body.months

    customer = stripe.Customer.create(
        email=user.email or "",
        name=user.name,
        metadata={"digby_user_id": str(user.id), "gift": "true"},
    )

    intent = stripe.PaymentIntent.create(
        amount=total,
        currency="cad",
        customer=customer["id"],
        metadata={
            "order_type": "strata_gift",
            "digby_user_id": str(user.id),
            "tier": body.tier,
            "months": str(body.months),
            "recipient_email": body.recipient_email,
            "recipient_name": body.recipient_name,
        },
    )

    # Store gift subscription record (pending activation by recipient)
    record = StrataSubscription(
        user_id=str(user.id),
        tier=body.tier,
        billing_frequency=body.billing_frequency,
        status=StrataStatus.PENDING,
        stripe_customer_id=customer["id"],
        shipping_address=body.shipping_address.model_dump(),
        is_gift=True,
        gift_recipient_email=body.recipient_email,
    )
    await record.insert()

    return {
        "client_secret": intent["client_secret"],
        "total": total,
        "months": body.months,
    }


# ── Box archive ───────────────────────────────────────────────────────────────

@router.get("/boxes")
async def list_boxes() -> list[dict]:
    boxes = await StrataBox.find({"is_published": True}).sort("month_number").to_list()
    return [_box_dict(b) for b in boxes]


@router.get("/boxes/{month}")
async def get_box(month: int) -> dict:
    box = await StrataBox.find_one({"month_number": month, "is_published": True})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return _box_dict(box)


def _box_dict(b: StrataBox) -> dict:
    return {
        "id": str(b.id),
        "month_number": b.month_number,
        "theme": b.theme,
        "subtitle": b.subtitle,
        "field_card_text": b.field_card_text,
        "formation_map_url": b.formation_map_url,
        "cover_image_url": b.cover_image_url,
        "contents": b.contents,
        "site_links": [s.model_dump() for s in b.site_links],
        "shipped_at": b.shipped_at.isoformat() if b.shipped_at else None,
    }


# ── Collector card redemption ─────────────────────────────────────────────────

@router.get("/redeem/{code}")
async def redeem_collector_card(
    code: str,
    user: User = Depends(get_current_user),
) -> dict:
    card = await CollectorCardCode.find_one({"code": code.upper()})
    if not card:
        raise HTTPException(status_code=404, detail="Code not found")
    if card.redeemed_by:
        if card.redeemed_by == str(user.id):
            return {"ok": True, "already_redeemed": True, "mineral_name": card.mineral_name}
        raise HTTPException(status_code=409, detail="Code already redeemed")

    card.redeemed_by = str(user.id)
    card.redeemed_at = datetime.now(UTC)
    await card.save()
    return {
        "ok": True,
        "already_redeemed": False,
        "mineral_name": card.mineral_name,
        "box_month": card.box_month,
    }
