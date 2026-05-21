import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.api.deps import get_current_user, require_operator
from app.core.config import settings
from app.models.specimen import Specimen
from app.models.specimen_order import SpecimenOrder
from app.models.user import User

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY


class SpecimenCreate(BaseModel):
    title: str
    description: str = ""
    minerals: list[str] = []
    province: str = "Ontario"
    price: float
    images: list[str] = []
    quantity: int = 1
    site_id: str | None = None


class SpecimenUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    quantity: int | None = None
    available: int | None = None
    is_active: bool | None = None
    images: list[str] | None = None


class PurchaseBody(BaseModel):
    shipping_address: str = ""


def _specimen_dict(s: Specimen) -> dict:
    return {
        "id": str(s.id),
        "operator_id": str(s.operator_id),
        "site_id": str(s.site_id) if s.site_id else None,
        "title": s.title,
        "description": s.description,
        "minerals": s.minerals,
        "province": s.province,
        "price": s.price,
        "images": s.images,
        "quantity": s.quantity,
        "available": s.available,
        "is_active": s.is_active,
        "created_at": s.created_at.isoformat(),
    }


def _order_dict(o: SpecimenOrder) -> dict:
    return {
        "id": str(o.id),
        "specimen_id": str(o.specimen_id),
        "buyer_id": str(o.buyer_id),
        "quantity": o.quantity,
        "total_amount": o.total_amount,
        "status": o.status,
        "shipping_address": o.shipping_address,
        "created_at": o.created_at.isoformat(),
    }


@router.get("/")
async def list_specimens(
    mineral: str | None = Query(None),
    province: str | None = Query(None),
    limit: int = Query(20, le=100),
    skip: int = Query(0),
) -> list[dict]:
    query = Specimen.find(Specimen.is_active == True, Specimen.available > 0)  # noqa: E712
    if mineral:
        query = query.find({"minerals": mineral})
    if province:
        query = query.find(Specimen.province == province)
    specimens = await query.skip(skip).limit(limit).to_list()
    return [_specimen_dict(s) for s in specimens]


@router.get("/my")
async def my_specimens(operator: User = Depends(require_operator)) -> list[dict]:
    specimens = await Specimen.find(Specimen.operator_id == operator.id).to_list()
    return [_specimen_dict(s) for s in specimens]


@router.get("/orders/my")
async def my_orders(user: User = Depends(get_current_user)) -> list[dict]:
    orders = await SpecimenOrder.find(SpecimenOrder.buyer_id == user.id).to_list()
    return [_order_dict(o) for o in orders]


@router.get("/{specimen_id}")
async def get_specimen(specimen_id: PydanticObjectId) -> dict:
    s = await Specimen.get(specimen_id)
    if not s or not s.is_active:
        raise HTTPException(status_code=404, detail="Specimen not found")
    return _specimen_dict(s)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_specimen(
    body: SpecimenCreate,
    operator: User = Depends(require_operator),
) -> dict:
    s = Specimen(
        operator_id=operator.id,
        site_id=PydanticObjectId(body.site_id) if body.site_id else None,
        title=body.title,
        description=body.description,
        minerals=body.minerals,
        province=body.province,
        price=body.price,
        images=body.images,
        quantity=body.quantity,
        available=body.quantity,
    )
    await s.insert()
    return _specimen_dict(s)


@router.patch("/{specimen_id}")
async def update_specimen(
    specimen_id: PydanticObjectId,
    body: SpecimenUpdate,
    operator: User = Depends(require_operator),
) -> dict:
    s = await Specimen.get(specimen_id)
    if not s:
        raise HTTPException(status_code=404, detail="Specimen not found")
    if s.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your specimen")
    await s.set(body.model_dump(exclude_none=True))
    await s.sync()
    return _specimen_dict(s)


@router.delete("/{specimen_id}")
async def delete_specimen(
    specimen_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    s = await Specimen.get(specimen_id)
    if not s or s.operator_id != operator.id:
        raise HTTPException(status_code=404, detail="Not found")
    await s.delete()
    return {"deleted": True}


@router.post("/{specimen_id}/purchase")
async def purchase_specimen(
    specimen_id: PydanticObjectId,
    body: PurchaseBody,
    buyer: User = Depends(get_current_user),
) -> dict:
    s = await Specimen.get(specimen_id)
    if not s or not s.is_active or s.available < 1:
        raise HTTPException(status_code=409, detail="Specimen not available")

    operator = await User.get(s.operator_id)
    if not operator or not operator.stripe_account_id or not operator.stripe_account_enabled:
        raise HTTPException(status_code=409, detail="Operator payment account not set up")

    total = round(s.price, 2)
    platform_fee = round(total * settings.STRIPE_PLATFORM_FEE_PERCENT / 100, 2)
    operator_payout = round(total - platform_fee, 2)

    intent = stripe.PaymentIntent.create(
        amount=int(total * 100),
        currency="cad",
        application_fee_amount=int(platform_fee * 100),
        transfer_data={"destination": operator.stripe_account_id},
        metadata={
            "order_type": "specimen",
            "specimen_id": str(s.id),
            "buyer_id": str(buyer.id),
        },
    )

    order = SpecimenOrder(
        specimen_id=s.id,
        buyer_id=buyer.id,
        operator_id=s.operator_id,
        quantity=1,
        total_amount=total,
        platform_fee=platform_fee,
        operator_payout=operator_payout,
        stripe_payment_intent_id=intent.id,
        shipping_address=body.shipping_address,
    )
    await order.insert()

    # Reserve the stock immediately
    await s.set({"available": s.available - 1})

    return {"order_id": str(order.id), "client_secret": intent.client_secret}
