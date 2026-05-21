from datetime import UTC, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.site import Site
from app.models.site_question import SiteQuestion
from app.models.user import User

router = APIRouter()


class QuestionCreate(BaseModel):
    site_id: str
    question: str


class AnswerBody(BaseModel):
    answer: str


def _q_dict(q: SiteQuestion) -> dict:
    return {
        "id": str(q.id),
        "site_id": str(q.site_id),
        "visitor_name": q.visitor_name,
        "question": q.question,
        "answer": q.answer,
        "answered_at": q.answered_at.isoformat() if q.answered_at else None,
        "created_at": q.created_at.isoformat(),
    }


@router.get("/site/{site_id}")
async def list_questions(site_id: PydanticObjectId) -> list[dict]:
    questions = await SiteQuestion.find(
        SiteQuestion.site_id == site_id,
        SiteQuestion.is_visible == True,  # noqa: E712
    ).sort(SiteQuestion.created_at).to_list()
    return [_q_dict(q) for q in questions]


@router.post("/")
async def ask_question(
    body: QuestionCreate,
    visitor: User = Depends(get_current_user),
) -> dict:
    q = SiteQuestion(
        site_id=PydanticObjectId(body.site_id),
        visitor_id=visitor.id,
        visitor_name=visitor.name,
        question=body.question,
    )
    await q.insert()
    return _q_dict(q)


@router.patch("/{question_id}/answer")
async def answer_question(
    question_id: PydanticObjectId,
    body: AnswerBody,
    operator: User = Depends(get_current_user),
) -> dict:
    q = await SiteQuestion.get(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    site = await Site.get(q.site_id)
    if not site or site.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your site")

    await q.set({
        "answer": body.answer,
        "answered_at": datetime.now(UTC),
    })
    await q.sync()
    return _q_dict(q)


@router.delete("/{question_id}")
async def delete_question(
    question_id: PydanticObjectId,
    user: User = Depends(get_current_user),
) -> dict:
    from app.models.user import UserRole
    q = await SiteQuestion.get(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    site = await Site.get(q.site_id)
    is_site_operator = site and site.operator_id == user.id
    if not is_site_operator and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Forbidden")

    await q.set({"is_visible": False})
    return {"deleted": True}
