from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import require_admin, require_operator
from app.models.operator_update import OperatorUpdate
from app.models.user import User
from fastapi import Depends

router = APIRouter()


class UpdateCreate(BaseModel):
    title: str
    body: str
    category: str = "general"
    action_label: str = ""
    action_url: str = ""


class UpdateOut(BaseModel):
    id: str
    title: str
    body: str
    category: str
    action_label: str
    action_url: str
    created_at: datetime


def _out(u: OperatorUpdate) -> UpdateOut:
    return UpdateOut(
        id=str(u.id),
        title=u.title,
        body=u.body,
        category=u.category,
        action_label=u.action_label,
        action_url=u.action_url,
        created_at=u.created_at,
    )


@router.get("/", response_model=list[UpdateOut])
async def list_updates(
    _: User = Depends(require_operator),
) -> list[UpdateOut]:
    updates = await OperatorUpdate.find(
        OperatorUpdate.is_active == True  # noqa: E712
    ).sort(-OperatorUpdate.created_at).limit(20).to_list()
    return [_out(u) for u in updates]


@router.post("/", response_model=UpdateOut, status_code=status.HTTP_201_CREATED)
async def create_update(
    body: UpdateCreate,
    admin: User = Depends(require_admin),
) -> UpdateOut:
    u = OperatorUpdate(
        title=body.title,
        body=body.body,
        category=body.category,
        action_label=body.action_label,
        action_url=body.action_url,
        author_id=admin.id,
    )
    await u.insert()
    return _out(u)


@router.delete("/{update_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_update(
    update_id: str,
    _: User = Depends(require_admin),
) -> None:
    u = await OperatorUpdate.get(update_id)
    if not u:
        raise HTTPException(status_code=404, detail="Update not found")
    u.is_active = False
    u.updated_at = datetime.now(UTC)  # type: ignore[attr-defined]
    await u.save()
