import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.deps import get_current_user, require_operator
from app.core.config import settings
from app.models.booking import Booking, BookingStatus
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
        refresh_url="https://digby.rocks/dashboard/stripe/refresh",
        return_url="https://digby.rocks/dashboard/stripe/complete",
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

    elif event["type"] == "payment_intent.payment_failed":
        pi_id = event["data"]["object"]["id"]
        booking = await Booking.find_one(Booking.stripe_payment_intent_id == pi_id)
        if booking:
            await booking.set({Booking.status: BookingStatus.CANCELLED})

    return JSONResponse({"received": True})
