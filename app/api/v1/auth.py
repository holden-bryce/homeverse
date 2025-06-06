"""Authentication endpoints"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr

from app.db.crud import create_user, get_user_by_email, verify_user_credentials
from app.db.database import get_session
from app.utils.security import create_access_token, get_current_user
from app.db.models import User
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    company_key: str
    role: str = "user"


@router.post("/auth/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> LoginResponse:
    """Authenticate user and return JWT token"""
    user = await verify_user_credentials(session, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id
        }
    )


@router.post("/auth/register")
async def register(
    request: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_session)]
) -> dict:
    """Register new user"""
    existing_user = await get_user_by_email(session, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    user = await create_user(
        session=session,
        email=request.email,
        password=request.password,
        company_key=request.company_key,
        role=request.role
    )
    
    return {"message": "User created successfully", "user_id": user.id}


@router.get("/auth/me")
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
) -> dict:
    """Get current user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "company_id": current_user.company_id,
        "created_at": current_user.created_at
    }