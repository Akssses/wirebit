from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import logging
from api.wirebit_api import create_wirebit_client

router = APIRouter()
logger = logging.getLogger(__name__)

# ... existing code ...

@router.get("/api/directions")
async def get_directions():
    """Get available exchange directions"""
    try:
        async with create_wirebit_client() as client:
            directions = await client.get_directions()
            return {"success": True, "data": directions}
    except Exception as e:
        logger.error(f"Failed to get directions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/currencies")
async def get_currencies():
    """Get all available currencies"""
    try:
        async with create_wirebit_client() as client:
            currencies = await client.get_currencies()
            return {"success": True, "data": currencies}
    except Exception as e:
        logger.error(f"Failed to get currencies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/available-to")
async def get_available_to(request: DirectionRequest):
    """Get available currencies for a specific direction"""
    try:
        async with create_wirebit_client() as client:
            available = await client.get_available_currencies(request.direction_id)
            return {"success": True, "data": available}
    except Exception as e:
        logger.error(f"Failed to get available currencies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/create-exchange")
async def create_exchange(request: CreateExchangeRequest):
    """Create a new exchange request"""
    try:
        async with create_wirebit_client() as client:
            result = await client.create_bid(
                direction_id=request.direction_id,
                amount=request.amount,
                wallet=request.wallet,
                email=request.email
            )
            return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to create exchange: {str(e)}")
        # Provide more specific error messages based on the exception
        if "Invalid wallet address" in str(e):
            raise HTTPException(status_code=400, detail="Invalid wallet address format")
        elif "Invalid email" in str(e):
            raise HTTPException(status_code=400, detail="Invalid email format")
        elif "Amount too small" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        elif "Amount exceeds" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        elif "Invalid exchange direction" in str(e):
            raise HTTPException(status_code=400, detail="Invalid exchange direction")
        else:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/status")
async def check_status(request: StatusRequest):
    """Check the status of an exchange"""
    try:
        async with create_wirebit_client() as client:
            status = await client.check_status(request.exchange_id)
            return {"success": True, "data": status}
    except Exception as e:
        logger.error(f"Failed to check status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 