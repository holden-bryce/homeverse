"""Simplified models for testing"""
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class SimpleCompany(SQLModel, table=True):
    """Simplified company model"""
    __tablename__ = "companies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    name: str
    plan: str = Field(default="basic")
    seats: int = Field(default=10)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SimpleUser(SQLModel, table=True):
    """Simplified user model"""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id")
    email: str = Field(unique=True, index=True)
    role: str = Field(default="user")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SimpleApplicant(SQLModel, table=True):
    """Simplified applicant model"""
    __tablename__ = "applicants"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id")
    name: str
    email: Optional[str] = None
    household_size: int = Field(default=1)
    ami_band: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SimpleProject(SQLModel, table=True):
    """Simplified project model"""
    __tablename__ = "projects"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="companies.id")
    name: str
    developer_name: str
    unit_count: int = Field(default=1)
    ami_min: Optional[int] = None
    ami_max: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)