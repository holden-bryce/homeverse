"""Lender-specific endpoints"""
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.db.database import get_session
from app.db.models import User
from app.services.matching import MatchingService
from app.services.heatmap import HeatmapService
from app.utils.security import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class LenderDashboardData(BaseModel):
    total_applicants: int
    total_projects: int
    pending_matches: int
    market_coverage: dict
    recent_activity: List[dict]


class MarketAnalytics(BaseModel):
    demand_metrics: dict
    supply_metrics: dict
    gap_analysis: dict
    trend_data: List[dict]


@router.get("/lenders/dashboard", response_model=LenderDashboardData)
async def get_lender_dashboard(
    current_user: Annotated[User, Depends(get_current_user)]
) -> LenderDashboardData:
    """Get lender dashboard summary data"""
    # TODO: Implement dashboard data aggregation
    return LenderDashboardData(
        total_applicants=0,
        total_projects=0,
        pending_matches=0,
        market_coverage={},
        recent_activity=[]
    )


@router.get("/lenders/analytics", response_model=MarketAnalytics)
async def get_market_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    time_period: str = Query("30d", regex="^(7d|30d|90d|1y)$")
) -> MarketAnalytics:
    """Get market analytics for lenders"""
    # TODO: Implement market analytics
    return MarketAnalytics(
        demand_metrics={},
        supply_metrics={},
        gap_analysis={},
        trend_data=[]
    )


@router.get("/lenders/heatmap")
async def get_market_heatmap(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    bounds: str = Query(..., description="Geographic bounds as 'lat1,lon1,lat2,lon2'")
) -> dict:
    """Get GeoJSON heatmap data for market visualization"""
    bounds_coords = [float(x) for x in bounds.split(',')]
    if len(bounds_coords) != 4:
        raise ValueError("Invalid bounds format")
    
    heatmap_service = HeatmapService()
    return await heatmap_service.generate_heatmap(
        company_id=current_user.company_id,
        bounds=bounds_coords
    )


@router.get("/lenders/portfolio")
async def get_lender_portfolio(
    current_user: Annotated[User, Depends(get_current_user)]
) -> dict:
    """Get lender's portfolio overview"""
    # TODO: Implement portfolio aggregation
    return {
        "active_projects": [],
        "funded_projects": [],
        "pipeline_projects": [],
        "performance_metrics": {}
    }