"""YAML configuration loader with Redis caching"""
import os
import json
from typing import Dict, Any, Optional
import yaml
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.models import ClientConfig


class ConfigLoader:
    """YAML configuration loader with Redis caching"""
    
    _redis_client: Optional[redis.Redis] = None
    _cache_prefix = "homeverse:config:"
    _cache_ttl = 3600  # 1 hour
    
    @classmethod
    async def initialize(cls) -> None:
        """Initialize Redis connection"""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        cls._redis_client = redis.from_url(redis_url, decode_responses=True)
        await cls._redis_client.ping()
    
    @classmethod
    async def cleanup(cls) -> None:
        """Cleanup Redis connection"""
        if cls._redis_client:
            await cls._redis_client.close()
    
    @classmethod
    async def get_config(
        cls,
        company_id: str,
        config_key: str,
        default: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get configuration from cache or database"""
        cache_key = f"{cls._cache_prefix}{company_id}:{config_key}"
        
        # Try Redis cache first
        if cls._redis_client:
            cached_config = await cls._redis_client.get(cache_key)
            if cached_config:
                return json.loads(cached_config)
        
        # Fallback to database
        async for session in get_session():
            config = await cls._load_from_db(session, company_id, config_key)
            if config:
                parsed_config = yaml.safe_load(config.config_yaml)
                
                # Cache the result
                if cls._redis_client:
                    await cls._redis_client.setex(
                        cache_key,
                        cls._cache_ttl,
                        json.dumps(parsed_config)
                    )
                
                return parsed_config
        
        return default or {}
    
    @classmethod
    async def _load_from_db(
        cls,
        session: AsyncSession,
        company_id: str,
        config_key: str
    ) -> Optional[ClientConfig]:
        """Load configuration from database"""
        from sqlmodel import select
        from uuid import UUID
        
        result = await session.execute(
            select(ClientConfig).where(
                ClientConfig.company_id == UUID(company_id),
                ClientConfig.config_key == config_key,
                ClientConfig.is_active == True
            ).order_by(ClientConfig.version.desc())
        )
        return result.scalar_one_or_none()
    
    @classmethod
    async def set_config(
        cls,
        company_id: str,
        config_key: str,
        config_data: Dict[str, Any]
    ) -> None:
        """Set configuration in database and cache"""
        async for session in get_session():
            # Convert to YAML
            config_yaml = yaml.dump(config_data, default_flow_style=False)
            
            # Save to database
            from uuid import UUID
            config = ClientConfig(
                company_id=UUID(company_id),
                config_key=config_key,
                config_yaml=config_yaml,
                version=1,
                is_active=True
            )
            session.add(config)
            await session.commit()
            
            # Update cache
            if cls._redis_client:
                cache_key = f"{cls._cache_prefix}{company_id}:{config_key}"
                await cls._redis_client.setex(
                    cache_key,
                    cls._cache_ttl,
                    json.dumps(config_data)
                )
    
    @classmethod
    async def invalidate_cache(cls, company_id: str, config_key: str) -> None:
        """Invalidate specific config cache"""
        if cls._redis_client:
            cache_key = f"{cls._cache_prefix}{company_id}:{config_key}"
            await cls._redis_client.delete(cache_key)
    
    @classmethod
    async def reload_all_configs(cls) -> int:
        """Reload all configurations and clear cache"""
        if cls._redis_client:
            # Clear all config cache
            pattern = f"{cls._cache_prefix}*"
            keys = await cls._redis_client.keys(pattern)
            if keys:
                await cls._redis_client.delete(*keys)
            return len(keys)
        return 0


# Default configurations
DEFAULT_CONFIGS = {
    "fields": {
        "applicant_fields": [
            {"name": "ami_band", "type": "select", "required": True},
            {"name": "household_size", "type": "number", "required": True},
            {"name": "location", "type": "geo", "required": True},
        ],
        "project_fields": [
            {"name": "name", "type": "text", "required": True},
            {"name": "developer", "type": "text", "required": True},
            {"name": "location", "type": "geo", "required": True},
            {"name": "unit_count", "type": "number", "required": True},
        ]
    },
    "api_push": {
        "enabled": True,
        "webhook_url": None,
        "batch_size": 100,
        "retry_attempts": 3
    },
    "heatmap_color_scale": {
        "low": "#fee5d9",
        "medium": "#fcae91",
        "high": "#fb6a4a",
        "very_high": "#de2d26",
        "extreme": "#a50f15"
    },
    "validation_rules": {
        "ami_bands": ["30%", "50%", "60%", "80%", "100%", "120%"],
        "max_household_size": 8,
        "min_unit_count": 1,
        "max_search_radius_miles": 50
    }
}