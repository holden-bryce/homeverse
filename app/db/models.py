"""SQLModel database models with RLS support"""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON, String, Text


class BaseModel(SQLModel):
    """Base model with common fields"""
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)


class Company(BaseModel, table=True):
    """Company/tenant model"""
    __tablename__ = "companies"
    
    key: str = Field(unique=True, index=True, max_length=50)
    name: str = Field(max_length=255)
    plan: str = Field(default="basic", max_length=50)
    seats: int = Field(default=10, ge=1)
    settings: str = Field(default="{}", sa_column=Column(Text))


class User(BaseModel, table=True):
    """User model with company association"""
    __tablename__ = "users"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    role: str = Field(default="user", max_length=50)
    is_active: bool = Field(default=True)
    last_login: Optional[datetime] = Field(default=None)


class Applicant(BaseModel, table=True):
    """Housing applicant model"""
    __tablename__ = "applicants"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    geo_point: str = Field(default="")  # Simplified for SQLite
    ami_band: str = Field(max_length=10, index=True)
    household_size: int = Field(ge=1, le=10)
    preferences: str = Field(default="{}", sa_column=Column(Text))
    status: str = Field(default="active", max_length=50)


class Project(BaseModel, table=True):
    """Development project model"""
    __tablename__ = "projects"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    name: str = Field(max_length=255, index=True)
    developer_name: str = Field(max_length=255)
    location: str = Field(default="")  # Simplified for SQLite
    unit_count: int = Field(ge=1)
    ami_min: int = Field(ge=30, le=200)
    ami_max: int = Field(ge=30, le=200)
    est_delivery: Optional[str] = Field(default=None, max_length=50)
    metadata_json: str = Field(default="{}", sa_column=Column(Text))
    status: str = Field(default="active", max_length=50)


class Match(BaseModel, table=True):
    """Applicant-project matching record"""
    __tablename__ = "matches"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    applicant_id: str = Field(foreign_key="applicants.id", index=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    score: float = Field(ge=0.0, le=1.0)
    status: str = Field(default="pending", max_length=50)
    match_metadata: str = Field(default="{}", sa_column=Column(Text))


class ReportRun(BaseModel, table=True):
    """Report generation tracking"""
    __tablename__ = "report_runs"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    type: str = Field(max_length=50, index=True)
    params_json: str = Field(default="{}", sa_column=Column(Text))
    status: str = Field(default="pending", max_length=50)
    url: Optional[str] = Field(default=None, max_length=500)
    error_message: Optional[str] = Field(default=None)


class AuditLog(BaseModel, table=True):
    """Audit trail for compliance"""
    __tablename__ = "audit_logs"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    user_id: Optional[str] = Field(foreign_key="users.id", default=None)
    action: str = Field(max_length=100, index=True)
    resource_type: str = Field(max_length=50)
    resource_id: Optional[str] = Field(default=None)
    details: str = Field(default="{}", sa_column=Column(Text))
    ip_address: Optional[str] = Field(default=None, max_length=45)


class ClientConfig(BaseModel, table=True):
    """Client configuration storage"""
    __tablename__ = "client_configs"
    
    company_id: str = Field(foreign_key="companies.id", index=True)
    config_key: str = Field(max_length=100, index=True)
    config_yaml: str = Field(default="")
    version: int = Field(default=1, ge=1)
    is_active: bool = Field(default=True)