from datetime import datetime

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_guide
from app.core.config import settings
from app.models.guide_booking import GuideBooking, GuideBookingStatus
from app.models.user import User, UserRole

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


class GuideBookingCreate(BaseModel):
    guide_id: str
    date: datetime
    party_size: int = 1
    location_description: str = ""
    notes: str = ""


class GuideBookingResponse(BaseModel):
    booking_id: str
    client_secret: str


@router.post("/", response_model=GuideBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_guide_booking(
    body: GuideBookingCreate,
    visitor: User = Depends(get_current_user),
) -> GuideBookingResponse:
    guide = await User.get(PydanticObjectId(body.guide_id))
    if not guide or guide.role != UserRole.GUIDE or not guide.is_active:
        raise HTTPException(status_code=404, detail="Guide not found")
    if not guide.rate_per_day:
        raise HTTPException(status_code=400, detail="Guide has not set a rate")

    total = round(guide.rate_per_day * body.party_size, 2)
    platform_fee = round(total * settings.STRIPE_PLATFORM_FEE_PERCENT / 100, 2)
    guide_payout = round(total - platform_fee, 2)

    intent = stripe.PaymentIntent.create(
        amount=int(total * 100),
        currency="cad",
        metadata={"guide_id": body.guide_id, "visitor_id": str(visitor.id)},
    )

    booking = GuideBooking(
        guide_id=guide.id,
        visitor_id=visitor.id,
        date=body.date,
        party_size=body.party_size,
        location_description=body.location_description,
        total_amount=total,
        platform_fee=platform_fee,
        guide_payout=guide_payout,
        stripe_payment_intent_id=intent.id,
        notes=body.notes,
    )
    await booking.insert()
    return GuideBookingResponse(booking_id=str(booking.id), client_secret=intent.client_secret)  # type: ignore[arg-type]


@router.get("/my")
async def my_guide_bookings(visitor: User = Depends(get_current_user)) -> list[dict]:
    bookings = await GuideBooking.find(GuideBooking.visitor_id == visitor.id).to_list()
    return [_booking_dict(b) for b in bookings]


@router.get("/incoming")
async def incoming_guide_bookings(guide: User = Depends(require_guide)) -> list[dict]:
    bookings = await GuideBooking.find(GuideBooking.guide_id == guide.id).to_list()
    return [_booking_dict(b) for b in bookings]


@router.patch("/{booking_id}/confirm")
async def confirm_guide_booking(
    booking_id: PydanticObjectId,
    guide: User = Depends(require_guide),
) -> dict:
    booking = await GuideBooking.get(booking_id)
    if not booking or booking.guide_id != guide.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    await booking.set({GuideBooking.status: GuideBookingStatus.CONFIRMED})
    return {"status": "confirmed"}


@router.patch("/{booking_id}/cancel")
async def cancel_guide_booking(
    booking_id: PydanticObjectId,
    user: User = Depends(get_current_user),
) -> dict:
    booking = await GuideBooking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.visitor_id != user.id and booking.guide_id != user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.stripe_payment_intent_id:
        stripe.PaymentIntent.cancel(booking.stripe_payment_intent_id)
    await booking.set({GuideBooking.status: GuideBookingStatus.CANCELLED})
    return {"status": "cancelled"}


def _booking_dict(b: GuideBooking) -> dict:
    return {
        "id": str(b.id),
        "guide_id": str(b.guide_id),
        "visitor_id": str(b.visitor_id),
        "date": b.date.isoformat(),
        "party_size": b.party_size,
        "location_description": b.location_description,
        "total_amount": b.total_amount,
        "status": b.status,
        "notes": b.notes,
        "created_at": b.created_at.isoformat(),
    }
