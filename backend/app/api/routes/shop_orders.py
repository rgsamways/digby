import json

import stripe
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.product import Product
from app.models.shop_order import ShopOrder, ShopOrderItem
from app.models.user import User

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY

FLAT_SHIPPING_CENTS = 1299  # $12.99
FREE_SHIPPING_THRESHOLD = 10000  # $100.00


class CartItemIn(BaseModel):
    product_id: str
    qty: int


class ShippingAddress(BaseModel):
    name: str
    line1: str
    line2: str = ""
    city: str
    province: str
    postal_code: str
    country: str = "CA"


class OrderIntentRequest(BaseModel):
    items: list[CartItemIn]
    shipping_address: ShippingAddress


def _order_dict(o: ShopOrder) -> dict:
    return {
        "id": str(o.id),
        "items": [i.model_dump() for i in o.items],
        "total": o.total,
        "status": o.status,
        "shipping_address": o.shipping_address,
        "tracking_number": o.tracking_number,
        "created_at": o.created_at.isoformat(),
    }


@router.post("/intent")
async def create_order_intent(
    payload: OrderIntentRequest,
    user: User = Depends(get_current_user),
) -> dict:
    subtotal = 0
    cart_items: list[ShopOrderItem] = []

    for item in payload.items:
        try:
            product = await Product.get(PydanticObjectId(item.product_id))
        except Exception:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if not product or not product.active:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if not product.dropship and product.stock < item.qty:
            raise HTTPException(status_code=400, detail=f"{product.name} is out of stock")
        subtotal += product.price * item.qty
        cart_items.append(
            ShopOrderItem(
                product_id=str(product.id),
                product_name=product.name,
                qty=item.qty,
                price=product.price,
            )
        )

    shipping = 0 if subtotal >= FREE_SHIPPING_THRESHOLD else FLAT_SHIPPING_CENTS
    total = subtotal + shipping

    intent = stripe.PaymentIntent.create(
        amount=total,
        currency="cad",
        metadata={
            "order_type": "shop",
            "user_id": str(user.id),
            "cart": json.dumps([i.model_dump() for i in cart_items]),
            "shipping_address": json.dumps(payload.shipping_address.model_dump()),
        },
    )

    return {
        "client_secret": intent["client_secret"],
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
    }


@router.get("/my")
async def my_orders(user: User = Depends(get_current_user)) -> list[dict]:
    orders = await ShopOrder.find({"user_id": str(user.id)}).sort("-created_at").to_list()
    return [_order_dict(o) for o in orders]


@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(get_current_user)) -> dict:
    try:
        order = await ShopOrder.get(PydanticObjectId(order_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order or order.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_dict(order)
