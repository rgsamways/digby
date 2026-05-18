from datetime import datetime

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.core.config import settings
from app.models.availability import Availability
from app.models.booking import Booking, BookingStatus
from app.models.site import Site
from app.models.user import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY


class BookingCreate(BaseModel):
    site_id: str
    date: datetime
    party_size: int
    notes: str = ""


class BookingResponse(BaseModel):
    booking_id: str
    client_secret: str  # Stripe PaymentIntent client_secret


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    body: BookingCreate,
    visitor: User = Depends(get_current_user),
) -> BookingResponse:
    site = await Site.get(PydanticObjectId(body.site_id))
    if not site or not site.is_active:
        raise HTTPException(status_code=404, detail="Site not found")

    avail = await Availability.find_one(
        Availability.site_id == site.id,
        Availability.date == body.date.date(),
    )
    if avail and (avail.is_blocked or avail.slots_remaining < body.party_size):
        raise HTTPException(status_code=409, detail="Not enough availability")

    total = round(site.price_per_person * body.party_size, 2)
    platform_fee = round(total * settings.STRIPE_PLATFORM_FEE_PERCENT / 100, 2)
    operator_payout = round(total - platform_fee, 2)

    # Create Stripe PaymentIntent
    intent = stripe.PaymentIntent.create(
        amount=int(total * 100),  # cents
        currency="cad",
        metadata={
            "site_id": body.site_id,
            "visitor_id": str(visitor.id),
        },
    )

    booking = Booking(
        site_id=site.id,
        visitor_id=visitor.id,
        operator_id=site.operator_id,
        date=body.date,
        party_size=body.party_size,
        total_amount=total,
        platform_fee=platform_fee,
        operator_payout=operator_payout,
        stripe_payment_intent_id=intent.id,
        notes=body.notes,
    )
    await booking.insert()

    return BookingResponse(booking_id=str(booking.id), client_secret=intent.client_secret)


@router.get("/my")
async def my_bookings(visitor: User = Depends(get_current_user)) -> list[dict]:
    bookings = await Booking.find(Booking.visitor_id == visitor.id).to_list()
    return [_booking_dict(b) for b in bookings]


@router.get("/operator")
async def operator_bookings(operator: User = Depends(require_operator)) -> list[dict]:
    bookings = await Booking.find(Booking.operator_id == operator.id).to_list()
    return [_booking_dict(b) for b in bookings]


@router.patch("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: PydanticObjectId,
    user: User = Depends(get_current_user),
) -> dict:
    booking = await Booking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.visitor_id != user.id and booking.operator_id != user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status not in (BookingStatus.PENDING, BookingStatus.CONFIRMED):
        raise HTTPException(status_code=409, detail="Cannot cancel")

    if booking.stripe_payment_intent_id:
        stripe.PaymentIntent.cancel(booking.stripe_payment_intent_id)

    await booking.set({Booking.status: BookingStatus.CANCELLED})
    return {"status": "cancelled"}


def _booking_dict(b: Booking) -> dict:
    return {
        "id": str(b.id),
        "site_id": str(b.site_id),
        "date": b.date.isoformat(),
        "party_size": b.party_size,
        "total_amount": b.total_amount,
        "status": b.status,
        "created_at": b.created_at.isoformat(),
    }
