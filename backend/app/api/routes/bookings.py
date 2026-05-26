import random
from datetime import UTC, datetime

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.core.config import settings
from app.models.availability import Availability
from app.models.booking import Booking, BookingStatus, GroupMember
from app.models.junior import JuniorProfile
from app.models.passport_stamp import PassportStamp
from app.models.site import Site
from app.models.user import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY


class BookingCreate(BaseModel):
    site_id: str
    date: datetime
    party_size: int
    notes: str = ""
    is_group_booking: bool = False
    group_members: list[GroupMember] = []
    # educator / field trip fields
    is_educator_booking: bool = False
    educator_institution: str | None = None
    educator_grade_level: str | None = None
    po_number: str | None = None
    invoice_requested: bool = False
    group_waiver_acknowledged: bool = False


class MysteryBookingCreate(BaseModel):
    date: datetime
    province: str
    mineral: str
    party_size: int = 1


class MembersUpdate(BaseModel):
    group_members: list[GroupMember]


class BookingResponse(BaseModel):
    booking_id: str
    client_secret: str | None = None  # None for invoice/PO bookings
    invoice_requested: bool = False


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

    # ── Invoice / PO path (educator field trips) ──────────────────────────────
    if body.invoice_requested:
        booking = Booking(
            site_id=site.id,
            visitor_id=visitor.id,
            operator_id=site.operator_id,
            date=body.date,
            party_size=body.party_size,
            total_amount=total,
            platform_fee=platform_fee,
            operator_payout=operator_payout,
            notes=body.notes,
            is_group_booking=body.is_group_booking,
            group_members=body.group_members,
            is_educator_booking=body.is_educator_booking,
            educator_institution=body.educator_institution,
            educator_grade_level=body.educator_grade_level,
            po_number=body.po_number,
            invoice_requested=True,
            group_waiver_acknowledged=body.group_waiver_acknowledged,
        )
        await booking.insert()
        return BookingResponse(
            booking_id=str(booking.id),
            client_secret=None,
            invoice_requested=True,
        )

    # ── Standard Stripe path ──────────────────────────────────────────────────
    operator = await User.get(site.operator_id)
    if not operator or not operator.stripe_account_id or not operator.stripe_account_enabled:
        raise HTTPException(status_code=409, detail="Operator payment account not set up")

    intent = stripe.PaymentIntent.create(
        amount=int(total * 100),  # cents
        currency="cad",
        application_fee_amount=int(platform_fee * 100),
        transfer_data={"destination": operator.stripe_account_id},  # type: ignore[typeddict-item]
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
        is_group_booking=body.is_group_booking,
        group_members=body.group_members,
        is_educator_booking=body.is_educator_booking,
        educator_institution=body.educator_institution,
        educator_grade_level=body.educator_grade_level,
        po_number=body.po_number,
        group_waiver_acknowledged=body.group_waiver_acknowledged,
    )
    await booking.insert()

    return BookingResponse(booking_id=str(booking.id), client_secret=intent.client_secret)  # type: ignore[arg-type]


@router.post("/mystery", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_mystery_booking(
    body: MysteryBookingCreate,
    visitor: User = Depends(get_current_user),
) -> BookingResponse:
    all_sites = await Site.find(
        Site.is_active == True,  # noqa: E712
        Site.province == body.province,
    ).to_list()

    mineral_lower = body.mineral.lower()
    mineral_sites = [s for s in all_sites if mineral_lower in [m.lower() for m in s.minerals]]
    pool = mineral_sites if mineral_sites else all_sites

    valid: list[tuple[Site, User]] = []
    for site in pool:
        if site.max_group_size < body.party_size:
            continue
        operator = await User.get(site.operator_id)
        if not operator or not operator.stripe_account_id or not operator.stripe_account_enabled:
            continue
        avail = await Availability.find_one(
            Availability.site_id == site.id,
            Availability.date == body.date.date(),
        )
        if avail and (avail.is_blocked or avail.slots_remaining < body.party_size):
            continue
        valid.append((site, operator))

    if not valid:
        raise HTTPException(status_code=409, detail="No mystery sites available for those criteria")

    site, operator = random.choice(valid)

    total = round(site.price_per_person * body.party_size, 2)
    platform_fee = round(total * settings.STRIPE_PLATFORM_FEE_PERCENT / 100, 2)
    operator_payout = round(total - platform_fee, 2)

    intent = stripe.PaymentIntent.create(
        amount=int(total * 100),
        currency="cad",
        application_fee_amount=int(platform_fee * 100),
        transfer_data={"destination": operator.stripe_account_id},  # type: ignore[typeddict-item]
        metadata={"site_id": str(site.id), "visitor_id": str(visitor.id)},
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
        is_mystery=True,
        mystery_province=body.province,
        notes=f"Mystery booking — {body.mineral} in {body.province}",
    )
    await booking.insert()
    return BookingResponse(booking_id=str(booking.id), client_secret=intent.client_secret)  # type: ignore[arg-type]


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

    # Notify first waitlist entry for this slot
    from app.core.email import send_email
    from app.models.waitlist_entry import WaitlistEntry
    waiter = await WaitlistEntry.find_one(
        WaitlistEntry.site_id == booking.site_id,
        WaitlistEntry.date == booking.date.date(),
        WaitlistEntry.notified_at == None,  # noqa: E711
    )
    if waiter:
        site = await Site.get(booking.site_id)
        site_name = site.name if site else "the site"
        send_email(
            waiter.email,
            f"Spot available at {site_name}!",
            f"A spot just opened at {site_name} on {booking.date.date()}.\n\n"
            f"Book quickly at https://digby.rocks/sites/{booking.site_id} — "
            "spots are first-come, first-served.",
        )
        await waiter.set({"notified_at": datetime.now(UTC)})

    return {"status": "cancelled"}


@router.patch("/{booking_id}/members")
async def update_members(
    booking_id: PydanticObjectId,
    body: MembersUpdate,
    visitor: User = Depends(get_current_user),
) -> dict:
    booking = await Booking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.visitor_id != visitor.id:
        raise HTTPException(status_code=403, detail="Only the booking leader can edit members")
    await booking.set({
        Booking.group_members: body.group_members,  # type: ignore[dict-item]
        Booking.is_group_booking: len(body.group_members) > 0,  # type: ignore[dict-item]
    })
    return _booking_dict(booking)


@router.patch("/{booking_id}/complete")
async def complete_booking(
    booking_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    booking = await Booking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=409, detail="Only confirmed bookings can be completed")

    site = await Site.get(booking.site_id)
    site_name = site.name if site else "Unknown site"

    existing = await PassportStamp.find_one(PassportStamp.booking_id == booking.id)
    if not existing:
        stamp = PassportStamp(
            visitor_id=booking.visitor_id,
            site_id=booking.site_id,
            site_name=site_name,
            minerals_found=[],
            visited_at=booking.date,
            booking_id=booking.id,
        )
        await stamp.insert()

    await booking.set({Booking.status: BookingStatus.COMPLETED})

    # Award junior booking badge to all junior profiles under the visitor account
    visitor_id = str(booking.visitor_id)
    junior_profiles = await JuniorProfile.find(JuniorProfile.parent_id == visitor_id).to_list()
    if junior_profiles:
        from app.api.routes.junior import award_booking_badge
        for jp in junior_profiles:
            await award_booking_badge(visitor_id, str(jp.id), site_id=str(booking.site_id))

    return {"status": "completed"}


def _booking_dict(b: Booking) -> dict:
    reveal_site = not b.is_mystery or b.status != BookingStatus.PENDING
    return {
        "id": str(b.id),
        "site_id": str(b.site_id) if reveal_site else None,
        "is_mystery": b.is_mystery,
        "mystery_province": b.mystery_province,
        "date": b.date.isoformat(),
        "party_size": b.party_size,
        "total_amount": b.total_amount,
        "status": b.status,
        "created_at": b.created_at.isoformat(),
        "is_group_booking": b.is_group_booking,
        "group_members": [m.model_dump() for m in b.group_members],
        "notes": b.notes,
    }
