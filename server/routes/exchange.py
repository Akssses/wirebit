from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from schemas.exchange import (
    DirectionResponse,
    CurrencyResponse,
    CreateExchangeRequest,
    CreateExchangeResponse,
    StatusResponse,
    ErrorResponse
)
from services.wirebit_client import wirebit_client


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["exchange"])


@router.get("/directions", response_model=List[DirectionResponse])
async def get_directions():
    """Get all exchange directions from Wirebit"""
    try:
        directions = wirebit_client.get_directions()
        return directions
    except Exception as e:
        logger.error(f"Error in get_directions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/currencies", response_model=List[CurrencyResponse])
async def get_currencies():
    """Get list of unique currencies available for sending"""
    try:
        directions = wirebit_client.get_directions()
        
        # Extract unique "from" currencies
        currencies_dict = {}
        for direction in directions:
            from_currency = direction.get("from")
            from_logo = direction.get("from_logo")
            
            if from_currency and from_currency not in currencies_dict:
                currencies_dict[from_currency] = {
                    "title": from_currency,
                    "logo": from_logo
                }
        
        return list(currencies_dict.values())
        
    except Exception as e:
        logger.error(f"Error in get_currencies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available-to", response_model=List[CurrencyResponse])
async def get_available_to(from_currency: str = Query(..., alias="from")):
    """Get list of currencies available to receive for a given 'from' currency"""
    try:
        directions = wirebit_client.get_directions()
        
        # Filter directions by from_currency and extract unique "to" currencies
        currencies_dict = {}
        for direction in directions:
            if direction.get("from") == from_currency:
                to_currency = direction.get("to")
                to_logo = direction.get("to_logo")
                
                if to_currency and to_currency not in currencies_dict:
                    currencies_dict[to_currency] = {
                        "title": to_currency,
                        "logo": to_logo
                    }
        
        return list(currencies_dict.values())
        
    except Exception as e:
        logger.error(f"Error in get_available_to: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-exchange", response_model=CreateExchangeResponse)
async def create_exchange(request: CreateExchangeRequest):
    """Create exchange bid"""
    try:
        result = wirebit_client.create_bid(
            direction_id=request.direction_id,
            amount=request.amount,
            account_to=request.account_to,
            cf6=request.cf6
        )
        
        return CreateExchangeResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in create_exchange: {str(e)}")
        return CreateExchangeResponse(
            success=False,
            message=str(e)
        )


@router.get("/status", response_model=StatusResponse)
async def get_status(bid_id: str = Query(...)):
    """Get bid status"""
    try:
        result = wirebit_client.get_status(bid_id)
        return StatusResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in get_status: {str(e)}")
        return StatusResponse(
            success=False,
            message=str(e)
        )
