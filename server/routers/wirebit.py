from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import logging
from api.wirebit_api import create_wirebit_client, CreateBidRequest

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic models
class DirectionRequest(BaseModel):
    from_currency: str = Field(..., description="Currency to exchange from", alias="from")

class StatusRequest(BaseModel):
    exchange_id: str = Field(..., description="Exchange ID to check status")

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

@router.get("/api/available-to")
async def get_available_to(from_currency: str = Query(..., alias="from")):
    """Get available currencies for a specific from currency"""
    try:
        async with create_wirebit_client() as client:
            available = await client.get_available_currencies(from_currency)
            return {"success": True, "data": available}
    except Exception as e:
        logger.error(f"Failed to get available currencies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/create-exchange")
async def create_exchange(request: CreateBidRequest):
    """Create a new exchange request"""
    try:
        logger.info(f"Creating exchange with data: {request}")
        async with create_wirebit_client() as client:
            result = await client.create_bid(request)
            logger.info(f"Exchange created successfully: {result}")
            return {"success": True, "data": result}
    except HTTPException as e:
        logger.error(f"HTTP exception in create_exchange: {e.detail}")
        # Re-raise HTTP exceptions as-is
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_exchange: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

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