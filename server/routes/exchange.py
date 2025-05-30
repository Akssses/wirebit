from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
import logging
import requests
from fastapi.responses import Response

from schemas.exchange import (
    DirectionResponse,
    CurrencyResponse,
    CreateExchangeRequest,
    CreateExchangeResponse,
    StatusResponse,
    ErrorResponse
)
from services.wirebit_client import wirebit_client
from auth.dependencies import get_db, get_current_user_optional
from models.models import User, ExchangeHistory
from sqlalchemy.orm import Session
from routes.verification import check_verification_required
import json


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
async def create_exchange(
    request: CreateExchangeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Create exchange bid"""
    try:
        # Get direction details for verification check
        directions = wirebit_client.get_directions()
        direction = next((d for d in directions if d["direction_id"] == request.direction_id), None)
        
        if not direction:
            raise HTTPException(
                status_code=400,
                detail="Направление обмена не найдено"
            )
        
        from_currency = direction["from"]
        to_currency = direction["to"]
        
        # Check if verification is required
        verification_required = check_verification_required(from_currency, to_currency)
        
        if verification_required:
            if not current_user:
                return CreateExchangeResponse(
                    success=False,
                    message="Для обмена Zelle USD на рублевые платежные системы требуется авторизация и верификация аккаунта. Пожалуйста, войдите в аккаунт."
                )
            
            if not current_user.is_verified:
                if current_user.verification_status == "pending":
                    return CreateExchangeResponse(
                        success=False,
                        message="Ваша заявка на верификацию находится в обработке. Дождитесь подтверждения администратора."
                    )
                elif current_user.verification_status == "rejected":
                    return CreateExchangeResponse(
                        success=False,
                        message="Ваша заявка на верификацию была отклонена. Обратитесь в службу поддержки."
                    )
                else:
                    return CreateExchangeResponse(
                        success=False,
                        message="Для обмена Zelle USD на рублевые платежные системы требуется верификация аккаунта. Пройдите верификацию в профиле.",
                        verification_required=True
                    )
        
        result = wirebit_client.create_bid(
            direction_id=request.direction_id,
            amount=request.amount,
            account_to=request.account_to,
            account2=request.account2,
            cfgive8=request.cfgive8,
            cf6=request.cf6,
            cf11=request.cf11
        )
        
        # If user is authenticated and exchange was successful, save to history
        if current_user and result.get("success") and result.get("data"):
            try:
                exchange_data = result["data"]
                
                if direction:
                    # Prepare wallet_address and additional data based on exchange type
                    wallet_address = request.account_to or request.account2
                    
                    # Prepare additional data for ruble exchanges
                    additional_fields = {}
                    if request.account2:  # This is a ruble exchange
                        additional_fields.update({
                            "card_number": request.account2,
                            "card_holder_name": request.cfgive8,
                            "telegram": request.cf11
                        })
                    
                    # Create history record
                    history_record = ExchangeHistory(
                        user_id=current_user.id,
                        direction_id=request.direction_id,
                        from_currency=direction["from"],
                        to_currency=direction["to"],
                        amount_give=float(exchange_data.get("amount_give", request.amount)),
                        amount_get=float(exchange_data.get("amount_get", 0)),
                        exchange_rate=float(exchange_data.get("course_get", direction["rate"])),
                        bid_id=str(exchange_data.get("id")),
                        status=exchange_data.get("status", "new"),
                        payment_address=exchange_data.get("api_actions", {}).get("address"),
                        wirebit_url=exchange_data.get("url"),
                        wallet_address=wallet_address,
                        email_used=request.cf6,
                        additional_data=json.dumps({**exchange_data, **additional_fields})
                    )
                    
                    db.add(history_record)
                    db.commit()
                    logger.info(f"Exchange saved to history for user {current_user.username}")
                    
            except Exception as history_error:
                logger.error(f"Failed to save exchange to history: {str(history_error)}")
                # Don't fail the main exchange if history saving fails
                pass
        
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


@router.get("/rates")
async def get_rates():
    """Get exchange rates from Wirebit XML feed"""
    try:
        response = requests.get('https://wirebit.net/request-exportxml.xml', 
                              headers={'Accept': 'application/xml'})
        
        if not response.ok:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch rates from Wirebit"
            )
        
        return Response(
            content=response.text,
            media_type="application/xml"
        )
    except Exception as e:
        logger.error(f"Error fetching rates: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
