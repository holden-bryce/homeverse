"""Geospatial heatmap service"""
import json
import math
from typing import List, Dict, Any, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func

from app.db.models import Applicant, Project
from app.utils.yaml_loader import ConfigLoader
from app.utils.logging import get_logger

logger = get_logger("heatmap")


class HeatmapService:
    """Geospatial aggregation and heatmap generation service"""
    
    def __init__(self):
        self.default_hex_size = 1000  # meters
        self.min_hex_size = 100
        self.max_hex_size = 10000
    
    async def generate_heatmap(
        self,
        session: AsyncSession,
        company_id: UUID,
        bounds: List[float],
        hex_size: int = None,
        data_type: str = "demand"
    ) -> Dict[str, Any]:
        """Generate GeoJSON heatmap for given bounds"""
        if hex_size is None:
            hex_size = self._calculate_optimal_hex_size(bounds)
        
        hex_size = max(self.min_hex_size, min(hex_size, self.max_hex_size))
        
        if data_type == "demand":
            features = await self._generate_demand_heatmap(
                session, company_id, bounds, hex_size
            )
        elif data_type == "supply":
            features = await self._generate_supply_heatmap(
                session, company_id, bounds, hex_size
            )
        else:
            features = await self._generate_combined_heatmap(
                session, company_id, bounds, hex_size
            )
        
        # Get color scale from config
        color_scale = await ConfigLoader.get_config(
            str(company_id),
            "heatmap_color_scale",
            {
                "low": "#fee5d9",
                "medium": "#fcae91", 
                "high": "#fb6a4a",
                "very_high": "#de2d26",
                "extreme": "#a50f15"
            }
        )
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "data_type": data_type,
                "hex_size_meters": hex_size,
                "bounds": bounds,
                "color_scale": color_scale,
                "total_features": len(features)
            }
        }
    
    def _calculate_optimal_hex_size(self, bounds: List[float]) -> int:
        """Calculate optimal hex size based on bounds"""
        lat1, lon1, lat2, lon2 = bounds
        
        # Calculate approximate distance
        lat_diff = abs(lat2 - lat1)
        lon_diff = abs(lon2 - lon1)
        
        # Rough distance calculation (not precise but good enough)
        avg_lat = (lat1 + lat2) / 2
        lat_km = lat_diff * 111  # 1 degree lat ≈ 111 km
        lon_km = lon_diff * 111 * abs(math.cos(math.radians(avg_lat)))
        
        max_distance_km = max(lat_km, lon_km)
        
        # Scale hex size based on area
        if max_distance_km < 5:
            return 250  # Small area, small hexes
        elif max_distance_km < 20:
            return 500
        elif max_distance_km < 100:
            return 1000
        else:
            return 2000  # Large area, large hexes
    
    async def _generate_demand_heatmap(
        self,
        session: AsyncSession,
        company_id: UUID,
        bounds: List[float],
        hex_size: int
    ) -> List[Dict[str, Any]]:
        """Generate demand (applicants) heatmap"""
        lat1, lon1, lat2, lon2 = bounds
        
        query = text(f"""
        WITH hex_grid AS (
            SELECT 
                ST_H3ToGeoBoundary(h3_index) as hex_geom,
                h3_index,
                COUNT(*) as applicant_count,
                AVG(CAST(REPLACE(ami_band, '%', '') AS INTEGER)) as avg_ami,
                AVG(household_size) as avg_household_size
            FROM applicants a
            CROSS JOIN LATERAL (
                SELECT h3_geo_to_h3(geo_point, {self._h3_resolution_for_size(hex_size)}) as h3_index
            ) h
            WHERE a.company_id = :company_id
                AND ST_Within(
                    geo_point,
                    ST_MakeEnvelope(:lon1, :lat1, :lon2, :lat2, 4326)
                )
                AND a.status = 'active'
            GROUP BY h3_index
            HAVING COUNT(*) > 0
        )
        SELECT 
            ST_AsGeoJSON(hex_geom) as geometry,
            applicant_count,
            avg_ami,
            avg_household_size
        FROM hex_grid
        ORDER BY applicant_count DESC
        """)
        
        result = await session.execute(query, {
            "company_id": company_id,
            "lat1": lat1,
            "lon1": lon1,
            "lat2": lat2,
            "lon2": lon2
        })
        
        features = []
        max_count = 0
        
        rows = result.fetchall()
        if rows:
            max_count = max(row.applicant_count for row in rows)
        
        for row in rows:
            intensity = row.applicant_count / max(max_count, 1)
            
            features.append({
                "type": "Feature",
                "geometry": json.loads(row.geometry),
                "properties": {
                    "applicant_count": row.applicant_count,
                    "avg_ami": round(row.avg_ami, 1),
                    "avg_household_size": round(row.avg_household_size, 1),
                    "intensity": intensity,
                    "color": self._get_color_for_intensity(intensity),
                    "data_type": "demand"
                }
            })
        
        return features
    
    async def _generate_supply_heatmap(
        self,
        session: AsyncSession,
        company_id: UUID,
        bounds: List[float],
        hex_size: int
    ) -> List[Dict[str, Any]]:
        """Generate supply (projects) heatmap"""
        lat1, lon1, lat2, lon2 = bounds
        
        query = text(f"""
        WITH hex_grid AS (
            SELECT 
                ST_H3ToGeoBoundary(h3_index) as hex_geom,
                h3_index,
                COUNT(*) as project_count,
                SUM(unit_count) as total_units,
                AVG(ami_min) as avg_ami_min,
                AVG(ami_max) as avg_ami_max
            FROM projects p
            CROSS JOIN LATERAL (
                SELECT h3_geo_to_h3(location, {self._h3_resolution_for_size(hex_size)}) as h3_index
            ) h
            WHERE p.company_id = :company_id
                AND ST_Within(
                    location,
                    ST_MakeEnvelope(:lon1, :lat1, :lon2, :lat2, 4326)
                )
                AND p.status = 'active'
            GROUP BY h3_index
            HAVING COUNT(*) > 0
        )
        SELECT 
            ST_AsGeoJSON(hex_geom) as geometry,
            project_count,
            total_units,
            avg_ami_min,
            avg_ami_max
        FROM hex_grid
        ORDER BY total_units DESC
        """)
        
        result = await session.execute(query, {
            "company_id": company_id,
            "lat1": lat1,
            "lon1": lon1,
            "lat2": lat2,
            "lon2": lon2
        })
        
        features = []
        max_units = 0
        
        rows = result.fetchall()
        if rows:
            max_units = max(row.total_units for row in rows)
        
        for row in rows:
            intensity = row.total_units / max(max_units, 1)
            
            features.append({
                "type": "Feature",
                "geometry": json.loads(row.geometry),
                "properties": {
                    "project_count": row.project_count,
                    "total_units": row.total_units,
                    "avg_ami_min": round(row.avg_ami_min, 1),
                    "avg_ami_max": round(row.avg_ami_max, 1),
                    "intensity": intensity,
                    "color": self._get_color_for_intensity(intensity),
                    "data_type": "supply"
                }
            })
        
        return features
    
    async def _generate_combined_heatmap(
        self,
        session: AsyncSession,
        company_id: UUID,
        bounds: List[float],
        hex_size: int
    ) -> List[Dict[str, Any]]:
        """Generate combined demand/supply gap analysis heatmap"""
        # Get both demand and supply data
        demand_features = await self._generate_demand_heatmap(
            session, company_id, bounds, hex_size
        )
        supply_features = await self._generate_supply_heatmap(
            session, company_id, bounds, hex_size
        )
        
        # Create lookup for supply by hex geometry
        supply_lookup = {}
        for feature in supply_features:
            geom_key = json.dumps(feature["geometry"], sort_keys=True)
            supply_lookup[geom_key] = feature["properties"]
        
        # Combine and calculate gaps
        combined_features = []
        
        for demand_feature in demand_features:
            geom_key = json.dumps(demand_feature["geometry"], sort_keys=True)
            supply_props = supply_lookup.get(geom_key, {})
            
            demand_count = demand_feature["properties"]["applicant_count"]
            supply_count = supply_props.get("total_units", 0)
            
            # Calculate gap (positive = demand exceeds supply)
            gap = demand_count - supply_count
            gap_ratio = gap / max(demand_count, 1)
            
            combined_features.append({
                "type": "Feature",
                "geometry": demand_feature["geometry"],
                "properties": {
                    "demand_count": demand_count,
                    "supply_count": supply_count,
                    "gap": gap,
                    "gap_ratio": gap_ratio,
                    "intensity": abs(gap_ratio),
                    "color": self._get_gap_color(gap_ratio),
                    "data_type": "gap_analysis"
                }
            })
        
        return combined_features
    
    def _h3_resolution_for_size(self, hex_size_meters: int) -> int:
        """Convert hex size in meters to H3 resolution"""
        # Approximate mapping from hex size to H3 resolution
        if hex_size_meters >= 5000:
            return 6
        elif hex_size_meters >= 2000:
            return 7
        elif hex_size_meters >= 1000:
            return 8
        elif hex_size_meters >= 500:
            return 9
        else:
            return 10
    
    def _get_color_for_intensity(self, intensity: float) -> str:
        """Get color based on intensity (0-1)"""
        if intensity >= 0.8:
            return "#a50f15"  # extreme
        elif intensity >= 0.6:
            return "#de2d26"  # very_high
        elif intensity >= 0.4:
            return "#fb6a4a"  # high
        elif intensity >= 0.2:
            return "#fcae91"  # medium
        else:
            return "#fee5d9"  # low
    
    def _get_gap_color(self, gap_ratio: float) -> str:
        """Get color for gap analysis (red = excess demand, blue = excess supply)"""
        if gap_ratio >= 0.5:
            return "#d73027"  # High demand excess
        elif gap_ratio >= 0.2:
            return "#f46d43"  # Medium demand excess
        elif gap_ratio >= -0.2:
            return "#fee08b"  # Balanced
        elif gap_ratio >= -0.5:
            return "#74add1"  # Medium supply excess
        else:
            return "#4575b4"  # High supply excess


import math  # Add this import at the top