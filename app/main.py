"""FastAPI entrypoint for HomeVerse backend"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import auth, applicants, projects, lenders, reports, admin
from app.db.tenant_context import CompanyKeyMiddleware
from app.utils.logging import setup_logging
from app.utils.yaml_loader import ConfigLoader


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    setup_logging()
    await ConfigLoader.initialize()
    yield
    await ConfigLoader.cleanup()


app = FastAPI(
    title="HomeVerse API",
    description="Multi-tenant SaaS for affordable housing demand/supply analytics",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CompanyKeyMiddleware)

app.include_router(auth.router, prefix="/v1", tags=["auth"])
app.include_router(applicants.router, prefix="/v1", tags=["applicants"])
app.include_router(projects.router, prefix="/v1", tags=["projects"])
app.include_router(lenders.router, prefix="/v1", tags=["lenders"])
app.include_router(reports.router, prefix="/v1", tags=["reports"])
app.include_router(admin.router, prefix="/v1", tags=["admin"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint"""
    return {"status": "healthy", "service": "homeverse-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)