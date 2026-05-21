import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.deps import require_operator
from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.specimen_order import OrderStatus, SpecimenOrder
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
        pi_id = event["data"]["object"]["id"]
        booking = await Booking.find_one(Booking.stripe_payment_intent_id == pi_id)
        if booking:
            await booking.set({Booking.status: BookingStatus.CONFIRMED})
        else:
            order = await SpecimenOrder.find_one(SpecimenOrder.stripe_payment_intent_id == pi_id)
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

    elif event["type"] == "account.updated":
        account = event["data"]["object"]
        user = await User.find_one(User.stripe_account_id == account["id"])
        if user:
            await user.set({"stripe_account_enabled": account.get("charges_enabled", False)})

    return JSONResponse({"received": True})
