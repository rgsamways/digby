from datetime import UTC, datetime

import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings
from app.models.specimen_drop import SpecimenDrop

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


def _drop_status(drop: SpecimenDrop) -> str:
    now = datetime.now(UTC)
    if not drop.is_published:
        return "draft"
    if now < drop.opens_at:
        return "upcoming"
    if now <= drop.closes_at:
        return "active"
    return "closed"


def _drop_dict(drop: SpecimenDrop) -> dict:
    return {
        "id": str(drop.id),
        "slug": drop.slug,
        "title": drop.title,
        "subtitle": drop.subtitle,
        "description": drop.description,
        "opens_at": drop.opens_at.isoformat(),
        "closes_at": drop.closes_at.isoformat(),
        "status": _drop_status(drop),
        "pieces": [
            {
                "id": p.id,
                "mineral_name": p.mineral_name,
                "formation": p.formation,
                "photo_url": p.photo_url,
                "price_cad": p.price_cad,
                "description": p.description,
                "status": p.status,
                "buyer_city": p.buyer_city if p.status == "sold" else None,
            }
            for p in drop.pieces
        ],
        "total_pieces": len(drop.pieces),
        "available_count": sum(1 for p in drop.pieces if p.status == "available"),
    }


@router.get("/")
async def list_drops() -> list[dict]:
    drops = await SpecimenDrop.find(
        SpecimenDrop.is_published == True  # noqa: E712
    ).sort(-SpecimenDrop.opens_at).to_list()
    return [_drop_dict(d) for d in drops]


@router.get("/{slug}")
async def get_drop(slug: str) -> dict:
    drop = await SpecimenDrop.find_one(
        SpecimenDrop.slug == slug,
        SpecimenDrop.is_published == True,  # noqa: E712
    )
    if not drop:
        raise HTTPException(404, "Drop not found")
    return _drop_dict(drop)


class NotifyRequest(BaseModel):
    email: str


@router.post("/{slug}/notify")
async def add_notification(slug: str, body: NotifyRequest) -> dict:
    drop = await SpecimenDrop.find_one(SpecimenDrop.slug == slug)
    if not drop:
        raise HTTPException(404, "Drop not found")
    if body.email not in drop.notification_emails:
        drop.notification_emails.append(body.email)
        await drop.save()
    return {"ok": True}


class PurchaseRequest(BaseModel):
    buyer_city: str = ""


@router.post("/{slug}/pieces/{piece_id}/purchase")
async def purchase_piece(slug: str, piece_id: str, body: PurchaseRequest) -> dict:
    drop = await SpecimenDrop.find_one(
        SpecimenDrop.slug == slug,
        SpecimenDrop.is_published == True,  # noqa: E712
    )
    if not drop:
        raise HTTPException(404, "Drop not found")

    status = _drop_status(drop)
    if status != "active":
        raise HTTPException(400, f"Drop is {status}")

    piece = next((p for p in drop.pieces if p.id == piece_id), None)
    if not piece:
        raise HTTPException(404, "Piece not found")
    if piece.status != "available":
        raise HTTPException(400, "This piece is no longer available")

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(503, "Payments not configured")

    intent = stripe.PaymentIntent.create(
        amount=int(piece.price_cad * 100),
        currency="cad",
        metadata={
            "order_type": "drop",
            "drop_slug": slug,
            "piece_id": piece_id,
            "buyer_city": body.buyer_city,
        },
    )

    piece.status = "reserved"
    piece.stripe_payment_intent_id = intent.id
    await drop.save()

    return {"client_secret": intent.client_secret}
