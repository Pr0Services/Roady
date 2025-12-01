"""
ROADY Construction - Main Application Entry Point
FastAPI Application with all routers and middleware
"""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from prometheus_client import make_asgi_app, Counter, Histogram
import time

from src.config import settings
from src.database import engine, Base, check_db_connection, check_redis_connection
from src.logging_config import setup_logging, get_logger, LoggingMiddleware

# ============================================================
# PROMETHEUS METRICS
# ============================================================

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# ============================================================
# LIFESPAN (Startup/Shutdown)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    logger = get_logger("roady.main")
    
    # === STARTUP ===
    logger.info("🚀 Starting ROADY Construction API...")
    
    # Setup logging
    setup_logging(
        service="roady-api",
        environment=settings.APP_ENV,
        log_level=settings.LOG_LEVEL
    )
    
    # Create database tables (dev only)
    if settings.APP_ENV == "development":
        async with engine.begin() as conn:
            # await conn.run_sync(Base.metadata.create_all)
            pass
    
    logger.info(f"✅ ROADY API started in {settings.APP_ENV} mode")
    logger.info(f"📚 API Docs: http://localhost:{settings.API_PORT}/docs")
    
    yield  # Application runs here
    
    # === SHUTDOWN ===
    logger.info("👋 Shutting down ROADY Construction API...")
    
    # Close database connections
    await engine.dispose()
    
    logger.info("✅ Shutdown complete")

# ============================================================
# CREATE APPLICATION
# ============================================================

app = FastAPI(
    title="ROADY Construction API",
    description="API pour la gestion de projets de construction",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
    openapi_url="/openapi.json" if settings.APP_ENV != "production" else None,
    lifespan=lifespan,
)

# ============================================================
# MIDDLEWARE
# ============================================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Correlation-ID", "X-Request-ID"],
)

# Gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Custom logging middleware
app.add_middleware(LoggingMiddleware)

# Request timing middleware
@app.middleware("http")
async def add_timing_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Add timing header
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
    
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(process_time)
    
    return response

# ============================================================
# EXCEPTION HANDLERS
# ============================================================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation error",
                "details": exc.errors(),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger = get_logger("roady.error")
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": "Internal server error" if settings.APP_ENV == "production" else str(exc),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

# ============================================================
# HEALTH & READY ENDPOINTS
# ============================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "roady-api",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check - verifies all dependencies"""
    db_ok = await check_db_connection()
    redis_ok = await check_redis_connection()
    
    all_ok = db_ok and redis_ok
    
    return JSONResponse(
        status_code=status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "ready" if all_ok else "not ready",
            "database": "connected" if db_ok else "disconnected",
            "redis": "connected" if redis_ok else "disconnected",
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "🏗️ Welcome to ROADY Construction API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }

# ============================================================
# MOUNT PROMETHEUS METRICS
# ============================================================

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# ============================================================
# INCLUDE ROUTERS
# ============================================================

from src.auth.router import router as auth_router
from src.projects.router import router as projects_router
from src.tasks.router import router as tasks_router
from src.rfis.router import router as rfis_router
from src.reports.router import router as reports_router
from src.notifications.router import router as notifications_router
from src.geolocation.router import router as geolocation_router
from src.calculators.router import router as calculators_router
from src.llm.router import router as llm_router
from src.agents.router import router as agents_router

# Auth
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# Core modules
app.include_router(projects_router, prefix="/projects", tags=["Projects"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
app.include_router(rfis_router, prefix="/rfis", tags=["RFIs"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])

# Features
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(geolocation_router, prefix="/geolocation", tags=["Geolocation"])
app.include_router(calculators_router, prefix="/calculators", tags=["Calculators"])

# AI
app.include_router(llm_router, prefix="/llm", tags=["LLM"])
app.include_router(agents_router, prefix="/agents", tags=["Agents"])

# ============================================================
# RUN (for development)
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=settings.APP_ENV == "development",
        workers=1 if settings.APP_ENV == "development" else 4,
    )
