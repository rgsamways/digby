import json
from datetime import UTC, datetime

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.deps import require_operator
from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.product import Product
from app.models.shop_order import ShopOrder, ShopOrderItem, ShopOrderStatus
from app.models.specimen_order import OrderStatus, SpecimenOrder
from app.models.strata import StrataStatus, StrataSubscription
from app.models.user import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/connect/onboard")
async def stripe_connect_onboard(operator: User = Depends(require_operator)) -> dict:
    """Generate a Stripe Connect onboarding link for an operator."""
    if not operator.stripe_account_id:
        account = stripe.Account.create(type="express", country="CA")
        await operator.set({"stripe_account_id": account.id})
        account_id = account.id
    else:
        account_id = operator.stripe_account_id

    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url="https://www.digby.rocks/dashboard/stripe/refresh",
        return_url="https://www.digby.rocks/dashboard/stripe/complete",
        type="account_onboarding",
    )
    return {"url": link.url}


@router.post("/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """Handle Stripe webhooks: payment_intent.succeeded, etc."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        pi_id = pi["id"]
        if pi.get("metadata", {}).get("order_type") == "shop":
            await _handle_shop_order_succeeded(pi)
        else:
            booking = await Booking.find_one(Booking.stripe_payment_intent_id == pi_id)
            if booking:
                await booking.set({Booking.status: BookingStatus.CONFIRMED})
            else:
                order = await SpecimenOrder.find_one(
                    SpecimenOrder.stripe_payment_intent_id == pi_id
                )
                if order:
                    await order.set({SpecimenOrder.status: OrderStatus.CONFIRMED})

    elif event["type"] == "payment_intent.payment_failed":
        pi_id = event["data"]["object"]["id"]
        booking = await Booking.find_one(Booking.stripe_payment_intent_id == pi_id)
        if booking:
            await booking.set({Booking.status: BookingStatus.CANCELLED})
        else:
            from app.models.specimen import Specimen
            order = await SpecimenOrder.find_one(SpecimenOrder.stripe_payment_intent_id == pi_id)
            if order:
                await order.set({SpecimenOrder.status: OrderStatus.CANCELLED})
                specimen = await Specimen.get(order.specimen_id)
                if specimen:
                    await specimen.set({"available": specimen.available + 1})

    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        sub_id = invoice.get("subscription")
        if sub_id:
            sub = await StrataSubscription.find_one(
                StrataSubscription.stripe_subscription_id == sub_id
            )
            if sub:
                lines = invoice.get("lines", {}).get("data", [{}])
                period_end = lines[0].get("period", {}).get("end") if lines else None
                update: dict = {"status": StrataStatus.ACTIVE, "updated_at": datetime.now(UTC)}
                if period_end:
                    update["current_period_end"] = datetime.fromtimestamp(period_end, tz=UTC)
                for k, v in update.items():
                    setattr(sub, k, v)
                await sub.save()

    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        sub_id = invoice.get("subscription")
        if sub_id:
            sub = await StrataSubscription.find_one(
                StrataSubscription.stripe_subscription_id == sub_id
            )
            if sub:
                sub.status = StrataStatus.PAST_DUE
                sub.updated_at = datetime.now(UTC)
                await sub.save()

    elif event["type"] == "customer.subscription.deleted":
        stripe_sub = event["data"]["object"]
        sub = await StrataSubscription.find_one(
            StrataSubscription.stripe_subscription_id == stripe_sub["id"]
        )
        if sub:
            sub.status = StrataStatus.CANCELLED
            sub.updated_at = datetime.now(UTC)
            await sub.save()

    elif event["type"] == "account.updated":
        account = event["data"]["object"]
        user = await User.find_one(User.stripe_account_id == account["id"])
        if user:
            await user.set({"stripe_account_enabled": account.get("charges_enabled", False)})

    return JSONResponse({"received": True})


async def _handle_shop_order_succeeded(pi: dict) -> None:
    pi_id = pi["id"]
    existing = await ShopOrder.find_one(ShopOrder.stripe_payment_intent_id == pi_id)
    if existing:
        return

    metadata = pi.get("metadata", {})
    user_id = metadata.get("user_id", "")
    raw_cart = json.loads(metadata.get("cart", "[]"))
    shipping_address = json.loads(metadata.get("shipping_address", "{}"))

    items = [ShopOrderItem(**i) for i in raw_cart]

    for item in items:
        try:
            product = await Product.get(PydanticObjectId(item.product_id))
            if product and not product.dropship:
                new_stock = max(0, product.stock - item.qty)
                await product.set({"stock": new_stock})
        except Exception:
            pass

    order = ShopOrder(
        user_id=user_id,
        items=items,
        total=pi["amount"],
        status=ShopOrderStatus.CONFIRMED,
        stripe_payment_intent_id=pi_id,
        shipping_address=shipping_address,
    )
    await order.insert()
