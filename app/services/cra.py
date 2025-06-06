"""CRA compliance and gap analysis service"""
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func
from datetime import datetime, timedelta

from app.db.models import Applicant, Project, Match
from app.utils.logging import get_logger

logger = get_logger("cra")


class CRAService:
    """CRA gap metrics and reserve relief calculation service"""
    
    def __init__(self):
        self.ami_thresholds = {
            "very_low": 50,    # ≤50% AMI
            "low": 80,         # 51-80% AMI
            "moderate": 120    # 81-120% AMI
        }
    
    async def generate_cra_report(
        self,
        session: AsyncSession,
        company_id: UUID,
        geography: Optional[str] = None,
        time_period_days: int = 365
    ) -> Dict[str, Any]:
        """Generate comprehensive CRA compliance report"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=time_period_days)
        
        # Core metrics
        demand_metrics = await self._calculate_demand_metrics(
            session, company_id, start_date, end_date, geography
        )
        
        supply_metrics = await self._calculate_supply_metrics(
            session, company_id, start_date, end_date, geography
        )
        
        gap_analysis = await self._calculate_gap_analysis(
            demand_metrics, supply_metrics
        )
        
        lending_metrics = await self._calculate_lending_metrics(
            session, company_id, start_date, end_date, geography
        )
        
        geographic_distribution = await self._calculate_geographic_distribution(
            session, company_id, start_date, end_date
        )
        
        return {
            "report_metadata": {
                "company_id": str(company_id),
                "generated_at": end_date.isoformat(),
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "geography": geography or "All Areas"
            },
            "demand_metrics": demand_metrics,
            "supply_metrics": supply_metrics,
            "gap_analysis": gap_analysis,
            "lending_metrics": lending_metrics,
            "geographic_distribution": geographic_distribution,
            "cra_scores": await self._calculate_cra_scores(
                demand_metrics, supply_metrics, lending_metrics
            )
        }
    
    async def _calculate_demand_metrics(
        self,
        session: AsyncSession,
        company_id: UUID,
        start_date: datetime,
        end_date: datetime,
        geography: Optional[str]
    ) -> Dict[str, Any]:
        """Calculate demand-side metrics"""
        base_query = """
        SELECT 
            COUNT(*) as total_applicants,
            COUNT(CASE WHEN CAST(REPLACE(ami_band, '%', '') AS INTEGER) <= 50 THEN 1 END) as very_low_income,
            COUNT(CASE WHEN CAST(REPLACE(ami_band, '%', '') AS INTEGER) BETWEEN 51 AND 80 THEN 1 END) as low_income,
            COUNT(CASE WHEN CAST(REPLACE(ami_band, '%', '') AS INTEGER) BETWEEN 81 AND 120 THEN 1 END) as moderate_income,
            AVG(household_size) as avg_household_size,
            COUNT(CASE WHEN household_size >= 5 THEN 1 END) as large_families
        FROM applicants 
        WHERE company_id = :company_id 
            AND created_at BETWEEN :start_date AND :end_date
            AND status = 'active'
        """
        
        result = await session.execute(text(base_query), {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        row = result.fetchone()
        
        total = row.total_applicants or 0
        
        return {
            "total_applicants": total,
            "by_income_level": {
                "very_low_income": {
                    "count": row.very_low_income or 0,
                    "percentage": (row.very_low_income or 0) / max(total, 1) * 100
                },
                "low_income": {
                    "count": row.low_income or 0,
                    "percentage": (row.low_income or 0) / max(total, 1) * 100
                },
                "moderate_income": {
                    "count": row.moderate_income or 0,
                    "percentage": (row.moderate_income or 0) / max(total, 1) * 100
                }
            },
            "demographics": {
                "avg_household_size": round(row.avg_household_size or 0, 2),
                "large_families": {
                    "count": row.large_families or 0,
                    "percentage": (row.large_families or 0) / max(total, 1) * 100
                }
            }
        }
    
    async def _calculate_supply_metrics(
        self,
        session: AsyncSession,
        company_id: UUID,
        start_date: datetime,
        end_date: datetime,
        geography: Optional[str]
    ) -> Dict[str, Any]:
        """Calculate supply-side metrics"""
        base_query = """
        SELECT 
            COUNT(*) as total_projects,
            SUM(unit_count) as total_units,
            COUNT(CASE WHEN ami_max <= 50 THEN 1 END) as very_low_projects,
            COUNT(CASE WHEN ami_max <= 80 THEN 1 END) as low_projects,
            COUNT(CASE WHEN ami_max <= 120 THEN 1 END) as moderate_projects,
            SUM(CASE WHEN ami_max <= 50 THEN unit_count ELSE 0 END) as very_low_units,
            SUM(CASE WHEN ami_max <= 80 THEN unit_count ELSE 0 END) as low_units,
            SUM(CASE WHEN ami_max <= 120 THEN unit_count ELSE 0 END) as moderate_units,
            AVG(unit_count) as avg_project_size
        FROM projects 
        WHERE company_id = :company_id 
            AND created_at BETWEEN :start_date AND :end_date
            AND status = 'active'
        """
        
        result = await session.execute(text(base_query), {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        row = result.fetchone()
        
        total_projects = row.total_projects or 0
        total_units = row.total_units or 0
        
        return {
            "total_projects": total_projects,
            "total_units": total_units,
            "by_income_level": {
                "very_low_income": {
                    "projects": row.very_low_projects or 0,
                    "units": row.very_low_units or 0,
                    "unit_percentage": (row.very_low_units or 0) / max(total_units, 1) * 100
                },
                "low_income": {
                    "projects": row.low_projects or 0,
                    "units": row.low_units or 0,
                    "unit_percentage": (row.low_units or 0) / max(total_units, 1) * 100
                },
                "moderate_income": {
                    "projects": row.moderate_projects or 0,
                    "units": row.moderate_units or 0,
                    "unit_percentage": (row.moderate_units or 0) / max(total_units, 1) * 100
                }
            },
            "avg_project_size": round(row.avg_project_size or 0, 1)
        }
    
    async def _calculate_gap_analysis(
        self,
        demand_metrics: Dict[str, Any],
        supply_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate supply-demand gap analysis"""
        gaps = {}
        
        for income_level in ["very_low_income", "low_income", "moderate_income"]:
            demand_count = demand_metrics["by_income_level"][income_level]["count"]
            supply_units = supply_metrics["by_income_level"][income_level]["units"]
            
            gap = demand_count - supply_units
            gap_percentage = (gap / max(demand_count, 1)) * 100 if demand_count > 0 else 0
            
            gaps[income_level] = {
                "demand": demand_count,
                "supply": supply_units,
                "gap": gap,
                "gap_percentage": round(gap_percentage, 2),
                "supply_ratio": round(supply_units / max(demand_count, 1), 2)
            }
        
        # Overall gap
        total_demand = demand_metrics["total_applicants"]
        total_supply = supply_metrics["total_units"]
        overall_gap = total_demand - total_supply
        
        gaps["overall"] = {
            "demand": total_demand,
            "supply": total_supply,
            "gap": overall_gap,
            "gap_percentage": round((overall_gap / max(total_demand, 1)) * 100, 2),
            "supply_ratio": round(total_supply / max(total_demand, 1), 2)
        }
        
        return gaps
    
    async def _calculate_lending_metrics(
        self,
        session: AsyncSession,
        company_id: UUID,
        start_date: datetime,
        end_date: datetime,
        geography: Optional[str]
    ) -> Dict[str, Any]:
        """Calculate lending and matching metrics"""
        match_query = """
        SELECT 
            COUNT(*) as total_matches,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_matches,
            COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_matches,
            AVG(score) as avg_match_score
        FROM matches 
        WHERE company_id = :company_id 
            AND created_at BETWEEN :start_date AND :end_date
        """
        
        result = await session.execute(text(match_query), {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        row = result.fetchone()
        
        total_matches = row.total_matches or 0
        
        return {
            "total_matches": total_matches,
            "approved_matches": row.approved_matches or 0,
            "funded_matches": row.funded_matches or 0,
            "approval_rate": (row.approved_matches or 0) / max(total_matches, 1) * 100,
            "funding_rate": (row.funded_matches or 0) / max(total_matches, 1) * 100,
            "avg_match_score": round(row.avg_match_score or 0, 3)
        }
    
    async def _calculate_geographic_distribution(
        self,
        session: AsyncSession,
        company_id: UUID,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate geographic distribution metrics"""
        # This would typically use census tract or county-level analysis
        # For now, returning a placeholder structure
        
        return {
            "coverage_areas": [],
            "lmi_area_percentage": 0.0,
            "rural_area_percentage": 0.0,
            "distressed_area_percentage": 0.0
        }
    
    async def _calculate_cra_scores(
        self,
        demand_metrics: Dict[str, Any],
        supply_metrics: Dict[str, Any],
        lending_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate CRA performance scores"""
        # Calculate composite scores based on CRA criteria
        
        # LMI service score (based on low-moderate income focus)
        lmi_demand_pct = (
            demand_metrics["by_income_level"]["very_low_income"]["percentage"] +
            demand_metrics["by_income_level"]["low_income"]["percentage"]
        )
        
        lmi_supply_pct = (
            supply_metrics["by_income_level"]["very_low_income"]["unit_percentage"] +
            supply_metrics["by_income_level"]["low_income"]["unit_percentage"]
        )
        
        lmi_service_score = min(100, (lmi_supply_pct / max(lmi_demand_pct, 1)) * 100)
        
        # Community development score
        cd_score = min(100, lending_metrics["funding_rate"] * 2)  # Scale funding rate
        
        # Overall CRA score (weighted average)
        overall_score = (lmi_service_score * 0.6) + (cd_score * 0.4)
        
        return {
            "lmi_service_score": round(lmi_service_score, 1),
            "community_development_score": round(cd_score, 1),
            "overall_cra_score": round(overall_score, 1),
            "rating": self._get_cra_rating(overall_score)
        }
    
    def _get_cra_rating(self, score: float) -> str:
        """Convert score to CRA rating"""
        if score >= 85:
            return "Outstanding"
        elif score >= 70:
            return "Satisfactory"
        elif score >= 50:
            return "Needs to Improve"
        else:
            return "Substantial Noncompliance"