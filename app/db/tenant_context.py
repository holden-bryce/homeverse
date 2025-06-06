"""Tenant context management for RLS"""
from typing import Callable, Optional
from uuid import UUID

from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session


class CompanyKeyMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and validate company_key header"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip middleware for health checks and docs
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        company_key = request.headers.get("x-company-key")
        if not company_key and request.url.path.startswith("/v1/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing x-company-key header"
            )
        
        if company_key:
            request.state.company_key = company_key
        
        return await call_next(request)


async def set_rls_context(session: AsyncSession, company_key: str) -> None:
    """Set RLS context for the database session"""
    await session.execute(
        text("SELECT set_config('request.company_key', :company_key, true)"),
        {"company_key": company_key}
    )


def with_company_key(func: Callable) -> Callable:
    """Decorator to inject company_key into database session"""
    async def wrapper(*args, **kwargs):
        # Extract session and company_key from kwargs or request context
        session = kwargs.get("session") or kwargs.get("db")
        company_key = kwargs.get("company_key")
        
        if session and company_key:
            await set_rls_context(session, company_key)
        
        return await func(*args, **kwargs)
    
    return wrapper


async def get_company_id_from_key(session: AsyncSession, company_key: str) -> Optional[UUID]:
    """Get company ID from company key"""
    from app.db.models import Company
    from sqlmodel import select
    
    result = await session.execute(
        select(Company.id).where(Company.key == company_key)
    )
    company_id = result.scalar_one_or_none()
    return company_id


async def ensure_company_exists(session: AsyncSession, company_key: str) -> UUID:
    """Ensure company exists, create if not"""
    from app.db.models import Company
    from sqlmodel import select
    
    # Check if company exists
    result = await session.execute(
        select(Company).where(Company.key == company_key)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        # Auto-provision company
        company = Company(
            key=company_key,
            name=f"Company {company_key}",
            plan="trial",
            seats=5
        )
        session.add(company)
        await session.commit()
        await session.refresh(company)
    
    return company.id