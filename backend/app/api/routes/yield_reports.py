from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import require_operator
from app.models.user import User
from app.models.yield_report import YieldReport

router = APIRouter()


class YieldReportCreate(BaseModel):
    site_id: str
    session_date: date
    minerals_found: list[str] = []
    quantity_notes: str = ""
    notes: str = ""


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_yield_report(
    body: YieldReportCreate,
    operator: User = Depends(require_operator),
) -> dict:
    report = YieldReport(
        site_id=PydanticObjectId(body.site_id),
        operator_id=operator.id,
        session_date=body.session_date,
        minerals_found=body.minerals_found,
        quantity_notes=body.quantity_notes,
        notes=body.notes,
    )
    await report.insert()
    return _report_dict(report)


@router.get("/site/{site_id}")
async def get_site_yield_reports(site_id: str) -> list[dict]:
    reports = await YieldReport.find(
        YieldReport.site_id == PydanticObjectId(site_id)
    ).sort(-YieldReport.session_date).to_list()
    return [_report_dict(r) for r in reports]


@router.get("/my")
async def my_yield_reports(operator: User = Depends(require_operator)) -> list[dict]:
    reports = await YieldReport.find(
        YieldReport.operator_id == operator.id
    ).sort(-YieldReport.session_date).to_list()
    return [_report_dict(r) for r in reports]


@router.delete("/{report_id}")
async def delete_yield_report(
    report_id: PydanticObjectId,
    operator: User = Depends(require_operator),
) -> dict:
    report = await YieldReport.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.operator_id != operator.id:
        raise HTTPException(status_code=403, detail="Not your report")
    await report.delete()
    return {"status": "deleted"}


def _report_dict(r: YieldReport) -> dict:
    return {
        "id": str(r.id),
        "site_id": str(r.site_id),
        "session_date": r.session_date.isoformat(),
        "minerals_found": r.minerals_found,
        "quantity_notes": r.quantity_notes,
        "notes": r.notes,
        "created_at": r.created_at.isoformat(),
    }
