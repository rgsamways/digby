from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.guide_booking import GuideBooking, GuideBookingStatus
from app.models.guide_review import GuideReview
from app.models.user import User

router = APIRouter()


class ReviewCreate(BaseModel):
    guide_booking_id: str
    rating: int = Field(..., ge=1, le=5)
    body: str = ""


def _review_dict(r: GuideReview) -> dict:
    return {
        "id": str(r.id),
        "guide_id": r.guide_id,
        "visitor_id": r.visitor_id,
        "guide_booking_id": r.guide_booking_id,
        "rating": r.rating,
        "body": r.body,
        "visitor_name": r.visitor_name,
        "created_at": r.created_at.isoformat(),
    }


@router.get("/guide/{guide_id}")
async def list_guide_reviews(guide_id: str) -> dict:
    reviews = await GuideReview.find(GuideReview.guide_id == guide_id).to_list()
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    return {
        "reviews": [_review_dict(r) for r in reviews],
        "average_rating": avg,
        "review_count": len(reviews),
    }


@router.post("/")
async def create_review(
    body: ReviewCreate,
    user: User = Depends(get_current_user),
) -> dict:
    from beanie import PydanticObjectId

    # Verify the guide booking exists, belongs to this visitor, and is completed
    try:
        booking = await GuideBooking.get(PydanticObjectId(body.guide_booking_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.visitor_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status != GuideBookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed guide sessions")

    # One review per booking
    existing = await GuideReview.find_one(GuideReview.guide_booking_id == body.guide_booking_id)
    if existing:
        raise HTTPException(status_code=409, detail="Already reviewed this booking")

    review = GuideReview(
        guide_id=booking.guide_id,
        visitor_id=str(user.id),
        guide_booking_id=body.guide_booking_id,
        rating=body.rating,
        body=body.body,
        visitor_name=user.name,
    )
    await review.insert()
    return _review_dict(review)


@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    user: User = Depends(get_current_user),
) -> dict:
    from beanie import PydanticObjectId

    from app.models.user import UserRole

    review = await GuideReview.get(PydanticObjectId(review_id))
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.visitor_id != str(user.id) and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")
    await review.delete()
    return {"deleted": True}
