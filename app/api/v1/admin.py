"""Tenant admin endpoints"""
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.database import get_session
from app.db.models import User
from app.utils.security import get_current_user, require_admin
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.yaml_loader import ConfigLoader

router = APIRouter()


class ConfigReloadResponse(BaseModel):
    message: str
    configs_reloaded: int


class CompanyStats(BaseModel):
    total_users: int
    total_applicants: int
    total_projects: int
    total_matches: int
    storage_usage_mb: float


@router.post("/admin/config/reload", response_model=ConfigReloadResponse)
async def reload_config(
    current_user: Annotated[User, Depends(get_current_user)]
) -> ConfigReloadResponse:
    """Hot-reload YAML configurations and clear Redis cache"""
    require_admin(current_user)
    
    count = await ConfigLoader.reload_all_configs()
    return ConfigReloadResponse(
        message="Configurations reloaded successfully",
        configs_reloaded=count
    )


@router.get("/admin/stats", response_model=CompanyStats)
async def get_company_stats(
    current_user: Annotated[User, Depends(get_current_user)]
) -> CompanyStats:
    """Get company statistics"""
    require_admin(current_user)
    
    # TODO: Implement actual stats aggregation
    return CompanyStats(
        total_users=0,
        total_applicants=0,
        total_projects=0,
        total_matches=0,
        storage_usage_mb=0.0
    )


@router.get("/admin/users")
async def list_company_users(
    current_user: Annotated[User, Depends(get_current_user)]
) -> List[dict]:
    """List all users in current company"""
    require_admin(current_user)
    
    # TODO: Implement user listing
    return []


@router.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user: Annotated[User, Depends(get_current_user)]
) -> dict:
    """Update user role"""
    require_admin(current_user)
    
    if role not in ["user", "admin", "viewer"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role"
        )
    
    # TODO: Implement role update
    return {"message": f"User role updated to {role}"}