"""Applicant management endpoints"""
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from geoalchemy2 import Geography

from app.db.crud import (
    create_applicant, get_applicants, get_applicant_by_id,
    update_applicant, delete_applicant
)
from app.db.database import get_session
from app.db.models import User, Applicant
from app.utils.security import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class ApplicantCreate(BaseModel):
    geo_point: tuple[float, float] = Field(..., description="Latitude, longitude")
    ami_band: str = Field(..., description="AMI percentage band (e.g., '80%', '120%')")
    household_size: int = Field(..., ge=1, le=10)
    preferences: dict = Field(default_factory=dict)


class ApplicantUpdate(BaseModel):
    geo_point: Optional[tuple[float, float]] = None
    ami_band: Optional[str] = None
    household_size: Optional[int] = Field(None, ge=1, le=10)
    preferences: Optional[dict] = None


class ApplicantResponse(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID
    geo_point: tuple[float, float]
    ami_band: str
    household_size: int
    preferences: dict
    created_at: str

    class Config:
        from_attributes = True


@router.post("/applicants/", response_model=ApplicantResponse)
async def create_new_applicant(
    applicant_data: ApplicantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ApplicantResponse:
    """Create a new applicant"""
    applicant = await create_applicant(
        session=session,
        user_id=current_user.id,
        company_id=current_user.company_id,
        geo_point=applicant_data.geo_point,
        ami_band=applicant_data.ami_band,
        household_size=applicant_data.household_size,
        preferences=applicant_data.preferences
    )
    return ApplicantResponse.model_validate(applicant)


@router.get("/applicants/", response_model=List[ApplicantResponse])
async def list_applicants(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
) -> List[ApplicantResponse]:
    """List applicants for current company"""
    applicants = await get_applicants(
        session=session,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit
    )
    return [ApplicantResponse.model_validate(a) for a in applicants]


@router.get("/applicants/{applicant_id}", response_model=ApplicantResponse)
async def get_applicant(
    applicant_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ApplicantResponse:
    """Get applicant by ID"""
    applicant = await get_applicant_by_id(session, applicant_id, current_user.company_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return ApplicantResponse.model_validate(applicant)


@router.put("/applicants/{applicant_id}", response_model=ApplicantResponse)
async def update_applicant_data(
    applicant_id: UUID,
    applicant_data: ApplicantUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> ApplicantResponse:
    """Update applicant"""
    applicant = await update_applicant(
        session=session,
        applicant_id=applicant_id,
        company_id=current_user.company_id,
        **applicant_data.model_dump(exclude_unset=True)
    )
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return ApplicantResponse.model_validate(applicant)


@router.delete("/applicants/{applicant_id}")
async def delete_applicant_data(
    applicant_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """Delete applicant"""
    success = await delete_applicant(session, applicant_id, current_user.company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return {"message": "Applicant deleted successfully"}