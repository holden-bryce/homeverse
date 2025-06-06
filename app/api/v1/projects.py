"""Project management endpoints"""
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.db.crud import (
    create_project, get_projects, get_project_by_id,
    update_project, delete_project, get_available_projects
)
from app.db.database import get_session
from app.db.models import User, Project
from app.utils.security import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    developer_name: str = Field(..., min_length=1, max_length=255)
    location: tuple[float, float] = Field(..., description="Latitude, longitude")
    unit_count: int = Field(..., ge=1)
    ami_min: int = Field(..., ge=30, le=200, description="Minimum AMI percentage")
    ami_max: int = Field(..., ge=30, le=200, description="Maximum AMI percentage")
    est_delivery: Optional[str] = Field(None, description="Estimated delivery date")
    metadata_json: dict = Field(default_factory=dict)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    developer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[tuple[float, float]] = None
    unit_count: Optional[int] = Field(None, ge=1)
    ami_min: Optional[int] = Field(None, ge=30, le=200)
    ami_max: Optional[int] = Field(None, ge=30, le=200)
    est_delivery: Optional[str] = None
    metadata_json: Optional[dict] = None


class ProjectResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    developer_name: str
    location: tuple[float, float]
    unit_count: int
    ami_min: int
    ami_max: int
    est_delivery: Optional[str]
    metadata_json: dict
    created_at: str

    class Config:
        from_attributes = True


@router.post("/projects/", response_model=ProjectResponse)
async def create_new_project(
    project_data: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProjectResponse:
    """Create a new project"""
    project = await create_project(
        session=session,
        company_id=current_user.company_id,
        **project_data.model_dump()
    )
    return ProjectResponse.model_validate(project)


@router.get("/projects/", response_model=List[ProjectResponse])
async def list_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[ProjectResponse]:
    """List projects for current company"""
    projects = await get_projects(
        session=session,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit
    )
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/projects/available", response_model=List[ProjectResponse])
async def list_available_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    lat: float = Query(..., description="Latitude for geo search"),
    lon: float = Query(..., description="Longitude for geo search"),
    radius_miles: float = Query(25.0, ge=0.1, le=100, description="Search radius in miles"),
    ami_band: Optional[str] = Query(None, description="AMI percentage filter")
) -> List[ProjectResponse]:
    """List available projects by location and AMI eligibility"""
    projects = await get_available_projects(
        session=session,
        company_id=current_user.company_id,
        lat=lat,
        lon=lon,
        radius_miles=radius_miles,
        ami_band=ami_band
    )
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProjectResponse:
    """Get project by ID"""
    project = await get_project_by_id(session, project_id, current_user.company_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project_data(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ProjectResponse:
    """Update project"""
    project = await update_project(
        session=session,
        project_id=project_id,
        company_id=current_user.company_id,
        **project_data.model_dump(exclude_unset=True)
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.delete("/projects/{project_id}")
async def delete_project_data(
    project_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """Delete project"""
    success = await delete_project(session, project_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}