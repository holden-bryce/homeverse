"""CRA and risk analytics report endpoints"""
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.db.crud import create_report_run, get_report_runs, get_report_run_by_id
from app.db.database import get_session
from app.db.models import User, ReportRun
from app.utils.security import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.workers.tasks import generate_cra_report

router = APIRouter()


class ReportRequest(BaseModel):
    report_type: str = Field(..., regex="^(cra|risk|portfolio)$")
    parameters: dict = Field(default_factory=dict)
    format: str = Field("pdf", regex="^(pdf|xlsx|json)$")


class ReportResponse(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID
    type: str
    params_json: dict
    status: str
    url: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


@router.post("/reports/", response_model=ReportResponse)
async def create_report(
    report_request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ReportResponse:
    """Create a new report generation request"""
    report_run = await create_report_run(
        session=session,
        company_id=current_user.company_id,
        user_id=current_user.id,
        report_type=report_request.report_type,
        params_json=report_request.parameters
    )
    
    # Queue background task for report generation
    if report_request.report_type == "cra":
        background_tasks.add_task(generate_cra_report, str(report_run.id))
    
    return ReportResponse.model_validate(report_run)


@router.get("/reports/", response_model=List[ReportResponse])
async def list_reports(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> List[ReportResponse]:
    """List all reports for current company"""
    reports = await get_report_runs(session, current_user.company_id)
    return [ReportResponse.model_validate(r) for r in reports]


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ReportResponse:
    """Get report by ID"""
    report = await get_report_run_by_id(session, report_id, current_user.company_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)


@router.get("/reports/cra")
async def get_cra_report(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """Generate CRA compliance report (legacy endpoint)"""
    # Create report run and queue task
    report_run = await create_report_run(
        session=session,
        company_id=current_user.company_id,
        user_id=current_user.id,
        report_type="cra",
        params_json={}
    )
    
    # Queue the background task
    from app.workers.celery_app import celery_app
    task = celery_app.send_task(
        "app.workers.tasks.generate_cra_report",
        args=[str(report_run.id)]
    )
    
    return {
        "report_id": report_run.id,
        "task_id": task.id,
        "status": "queued",
        "message": "CRA report generation started"
    }