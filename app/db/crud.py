"""CRUD operations for all models"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, and_, func
from sqlmodel import select
from passlib.context import CryptContext

from app.db.models import (
    Company, User, Applicant, Project, Match, ReportRun, AuditLog
)
from app.db.tenant_context import ensure_company_exists, get_company_id_from_key

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Company CRUD
async def get_company_by_key(session: AsyncSession, key: str) -> Optional[Company]:
    """Get company by key"""
    result = await session.execute(select(Company).where(Company.key == key))
    return result.scalar_one_or_none()


async def create_company(session: AsyncSession, key: str, name: str, plan: str = "basic") -> Company:
    """Create new company"""
    company = Company(key=key, name=name, plan=plan)
    session.add(company)
    await session.commit()
    await session.refresh(company)
    return company


# User CRUD
async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    """Get user by email"""
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> Optional[User]:
    """Get user by ID"""
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    email: str,
    password: str,
    company_key: str,
    role: str = "user"
) -> User:
    """Create new user"""
    company_id = await ensure_company_exists(session, company_key)
    hashed_password = pwd_context.hash(password)
    
    user = User(
        email=email,
        hashed_password=hashed_password,
        company_id=company_id,
        role=role
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def verify_user_credentials(session: AsyncSession, email: str, password: str) -> Optional[User]:
    """Verify user credentials"""
    user = await get_user_by_email(session, email)
    if user and pwd_context.verify(password, user.hashed_password):
        return user
    return None


# Applicant CRUD
async def create_applicant(
    session: AsyncSession,
    user_id: UUID,
    company_id: UUID,
    geo_point: Tuple[float, float],
    ami_band: str,
    household_size: int,
    preferences: dict
) -> Applicant:
    """Create new applicant"""
    # Convert geo_point tuple to PostGIS POINT
    point_wkt = f"POINT({geo_point[1]} {geo_point[0]})"  # lon lat
    
    applicant = Applicant(
        user_id=user_id,
        company_id=company_id,
        geo_point=point_wkt,
        ami_band=ami_band,
        household_size=household_size,
        preferences=preferences
    )
    session.add(applicant)
    await session.commit()
    await session.refresh(applicant)
    return applicant


async def get_applicants(
    session: AsyncSession,
    company_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[Applicant]:
    """Get applicants for company"""
    result = await session.execute(
        select(Applicant)
        .where(Applicant.company_id == company_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_applicant_by_id(
    session: AsyncSession,
    applicant_id: UUID,
    company_id: UUID
) -> Optional[Applicant]:
    """Get applicant by ID"""
    result = await session.execute(
        select(Applicant).where(
            and_(Applicant.id == applicant_id, Applicant.company_id == company_id)
        )
    )
    return result.scalar_one_or_none()


async def update_applicant(
    session: AsyncSession,
    applicant_id: UUID,
    company_id: UUID,
    **updates
) -> Optional[Applicant]:
    """Update applicant"""
    applicant = await get_applicant_by_id(session, applicant_id, company_id)
    if not applicant:
        return None
    
    for key, value in updates.items():
        if hasattr(applicant, key) and value is not None:
            if key == "geo_point" and isinstance(value, tuple):
                value = f"POINT({value[1]} {value[0]})"
            setattr(applicant, key, value)
    
    await session.commit()
    await session.refresh(applicant)
    return applicant


async def delete_applicant(
    session: AsyncSession,
    applicant_id: UUID,
    company_id: UUID
) -> bool:
    """Delete applicant"""
    applicant = await get_applicant_by_id(session, applicant_id, company_id)
    if not applicant:
        return False
    
    await session.delete(applicant)
    await session.commit()
    return True


# Project CRUD
async def create_project(
    session: AsyncSession,
    company_id: UUID,
    name: str,
    developer_name: str,
    location: Tuple[float, float],
    unit_count: int,
    ami_min: int,
    ami_max: int,
    est_delivery: Optional[str] = None,
    metadata_json: dict = None
) -> Project:
    """Create new project"""
    point_wkt = f"POINT({location[1]} {location[0]})"  # lon lat
    
    project = Project(
        company_id=company_id,
        name=name,
        developer_name=developer_name,
        location=point_wkt,
        unit_count=unit_count,
        ami_min=ami_min,
        ami_max=ami_max,
        est_delivery=est_delivery,
        metadata_json=metadata_json or {}
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return project


async def get_projects(
    session: AsyncSession,
    company_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> List[Project]:
    """Get projects for company"""
    result = await session.execute(
        select(Project)
        .where(Project.company_id == company_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_project_by_id(
    session: AsyncSession,
    project_id: UUID,
    company_id: UUID
) -> Optional[Project]:
    """Get project by ID"""
    result = await session.execute(
        select(Project).where(
            and_(Project.id == project_id, Project.company_id == company_id)
        )
    )
    return result.scalar_one_or_none()


async def get_available_projects(
    session: AsyncSession,
    company_id: UUID,
    lat: float,
    lon: float,
    radius_miles: float,
    ami_band: Optional[str] = None
) -> List[Project]:
    """Get projects within radius and AMI eligibility"""
    # Convert miles to meters for PostGIS
    radius_meters = radius_miles * 1609.34
    
    query = select(Project).where(
        and_(
            Project.company_id == company_id,
            text(f"ST_DWithin(location, ST_GeogFromText('POINT({lon} {lat})'), {radius_meters})")
        )
    )
    
    if ami_band:
        # Extract percentage from AMI band (e.g., "80%" -> 80)
        ami_pct = int(ami_band.rstrip('%'))
        query = query.where(
            and_(Project.ami_min <= ami_pct, Project.ami_max >= ami_pct)
        )
    
    result = await session.execute(query)
    return result.scalars().all()


async def update_project(
    session: AsyncSession,
    project_id: UUID,
    company_id: UUID,
    **updates
) -> Optional[Project]:
    """Update project"""
    project = await get_project_by_id(session, project_id, company_id)
    if not project:
        return None
    
    for key, value in updates.items():
        if hasattr(project, key) and value is not None:
            if key == "location" and isinstance(value, tuple):
                value = f"POINT({value[1]} {value[0]})"
            setattr(project, key, value)
    
    await session.commit()
    await session.refresh(project)
    return project


async def delete_project(
    session: AsyncSession,
    project_id: UUID,
    company_id: UUID
) -> bool:
    """Delete project"""
    project = await get_project_by_id(session, project_id, company_id)
    if not project:
        return False
    
    await session.delete(project)
    await session.commit()
    return True


# Match CRUD
async def create_match(
    session: AsyncSession,
    company_id: UUID,
    applicant_id: UUID,
    project_id: UUID,
    score: float,
    metadata: dict = None
) -> Match:
    """Create new match"""
    match = Match(
        company_id=company_id,
        applicant_id=applicant_id,
        project_id=project_id,
        score=score,
        metadata=metadata or {}
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)
    return match


async def get_matches_for_applicant(
    session: AsyncSession,
    applicant_id: UUID,
    company_id: UUID
) -> List[Match]:
    """Get matches for applicant"""
    result = await session.execute(
        select(Match).where(
            and_(
                Match.applicant_id == applicant_id,
                Match.company_id == company_id
            )
        ).order_by(Match.score.desc())
    )
    return result.scalars().all()


# Report CRUD
async def create_report_run(
    session: AsyncSession,
    company_id: UUID,
    user_id: UUID,
    report_type: str,
    params_json: dict
) -> ReportRun:
    """Create new report run"""
    report = ReportRun(
        company_id=company_id,
        user_id=user_id,
        type=report_type,
        params_json=params_json
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


async def get_report_runs(
    session: AsyncSession,
    company_id: UUID
) -> List[ReportRun]:
    """Get report runs for company"""
    result = await session.execute(
        select(ReportRun)
        .where(ReportRun.company_id == company_id)
        .order_by(ReportRun.created_at.desc())
    )
    return result.scalars().all()


async def get_report_run_by_id(
    session: AsyncSession,
    report_id: UUID,
    company_id: UUID
) -> Optional[ReportRun]:
    """Get report run by ID"""
    result = await session.execute(
        select(ReportRun).where(
            and_(ReportRun.id == report_id, ReportRun.company_id == company_id)
        )
    )
    return result.scalar_one_or_none()


async def update_report_status(
    session: AsyncSession,
    report_id: UUID,
    status: str,
    url: Optional[str] = None,
    error_message: Optional[str] = None
) -> bool:
    """Update report status"""
    result = await session.execute(
        select(ReportRun).where(ReportRun.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        return False
    
    report.status = status
    if url:
        report.url = url
    if error_message:
        report.error_message = error_message
    
    await session.commit()
    return True


# Audit CRUD
async def create_audit_log(
    session: AsyncSession,
    company_id: UUID,
    action: str,
    resource_type: str,
    user_id: Optional[UUID] = None,
    resource_id: Optional[UUID] = None,
    details: dict = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Create audit log entry"""
    audit = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address
    )
    session.add(audit)
    await session.commit()
    return audit