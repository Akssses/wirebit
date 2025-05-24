from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from app.database import get_db
from app.routes import auth, exchange_rates, orders, users, verification
from app.core.config import settings

app = FastAPI(
    title="Crypto Exchange API",
    description="API for cryptocurrency and fiat exchange platform",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(exchange_rates.router, prefix="/api/rates", tags=["Exchange Rates"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(verification.router, prefix="/api/verification", tags=["Verification"])

@app.get("/")
async def root():
    return {"message": "Welcome to Crypto Exchange API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 