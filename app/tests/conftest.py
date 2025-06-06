"""Pytest configuration and fixtures"""
import asyncio
import os
from typing import AsyncGenerator, Generator
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import get_session
from app.db.models import Company, User
from app.utils.security import create_access_token

# Test database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/homeverse_test"
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    TestSessionLocal = sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
def test_client(test_session) -> Generator[TestClient, None, None]:
    """Create test client with database override"""
    
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield test_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_company(test_session: AsyncSession) -> Company:
    """Create test company"""
    company = Company(
        key="test-company",
        name="Test Company",
        plan="basic",
        seats=10
    )
    test_session.add(company)
    await test_session.commit()
    await test_session.refresh(company)
    return company


@pytest.fixture
async def test_user(test_session: AsyncSession, test_company: Company) -> User:
    """Create test user"""
    from app.db.crud import create_user
    
    user = await create_user(
        session=test_session,
        email="test@example.com",
        password="testpass123",
        company_key=test_company.key,
        role="admin"
    )
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for test user"""
    access_token = create_access_token(data={"sub": str(test_user.id)})
    return {
        "Authorization": f"Bearer {access_token}",
        "x-company-key": "test-company"
    }


@pytest.fixture
async def test_applicants(test_session: AsyncSession, test_company: Company, test_user: User):
    """Create test applicants"""
    from app.db.crud import create_applicant
    
    applicants = []
    test_data = [
        {"lat": 40.7128, "lon": -74.0060, "ami": "80%", "household_size": 3},
        {"lat": 40.7589, "lon": -73.9851, "ami": "60%", "household_size": 2},
        {"lat": 40.6782, "lon": -73.9442, "ami": "100%", "household_size": 4},
    ]
    
    for data in test_data:
        applicant = await create_applicant(
            session=test_session,
            user_id=test_user.id,
            company_id=test_company.id,
            geo_point=(data["lat"], data["lon"]),
            ami_band=data["ami"],
            household_size=data["household_size"],
            preferences={"preferred_area": "downtown"}
        )
        applicants.append(applicant)
    
    return applicants


@pytest.fixture
async def test_projects(test_session: AsyncSession, test_company: Company):
    """Create test projects"""
    from app.db.crud import create_project
    
    projects = []
    test_data = [
        {
            "name": "Downtown Commons",
            "developer": "ABC Development",
            "lat": 40.7128,
            "lon": -74.0060,
            "units": 100,
            "ami_min": 60,
            "ami_max": 120
        },
        {
            "name": "Midtown Gardens",
            "developer": "XYZ Properties",
            "lat": 40.7589,
            "lon": -73.9851,
            "units": 50,
            "ami_min": 80,
            "ami_max": 100
        },
    ]
    
    for data in test_data:
        project = await create_project(
            session=test_session,
            company_id=test_company.id,
            name=data["name"],
            developer_name=data["developer"],
            location=(data["lat"], data["lon"]),
            unit_count=data["units"],
            ami_min=data["ami_min"],
            ami_max=data["ami_max"],
            metadata_json={"transit_score": 8}
        )
        projects.append(project)
    
    return projects