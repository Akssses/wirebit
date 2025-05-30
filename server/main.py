import sys
import os
# Add the server directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from core.config import settings
from routes import exchange, auth, history, verification, admin
from database import engine
from models.models import Base

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Wirebit Exchange API",
    description="Backend API for cryptocurrency exchange integration with Wirebit",
    version="1.0.0",
    root_path="/api"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")

# Include routers with prefixes
app.include_router(exchange.router, prefix="/exchange")
app.include_router(auth.router, prefix="/auth")
app.include_router(history.router, prefix="/history")
app.include_router(verification.router, prefix="/verification")
app.include_router(admin.router, prefix="/admin")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception handler caught: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Внутренняя ошибка сервера"
        }
    )


@app.get("/")
async def root():
    return {
        "message": "Wirebit Exchange API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "wirebit-exchange-api"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )
