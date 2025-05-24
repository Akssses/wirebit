from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import aiohttp
import json

from app.database import get_db
from app.models.models import ExchangeRate
from app.schemas.schemas import ExchangeRateBase, ExchangeRate as ExchangeRateSchema
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[ExchangeRateSchema])
async def get_exchange_rates(db: Session = Depends(get_db)):
    """Get all available exchange rates"""
    rates = db.query(ExchangeRate).all()
    return rates

@router.get("/{from_currency}/{to_currency}", response_model=ExchangeRateSchema)
async def get_specific_rate(
    from_currency: str,
    to_currency: str,
    db: Session = Depends(get_db)
):
    """Get exchange rate for a specific currency pair"""
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.from_currency == from_currency.upper(),
        ExchangeRate.to_currency == to_currency.upper()
    ).first()
    
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    return rate

@router.post("/update")
async def update_rates(db: Session = Depends(get_db)):
    """Update exchange rates from WordPress plugin API"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{settings.WP_API_URL}/rates",
                headers={"Authorization": f"Bearer {settings.WP_API_KEY}"}
            ) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail="Failed to fetch rates from WordPress API"
                    )
                
                rates_data = await response.json()
                
                # Update rates in database
                for rate_data in rates_data:
                    rate = db.query(ExchangeRate).filter(
                        ExchangeRate.from_currency == rate_data["from_currency"],
                        ExchangeRate.to_currency == rate_data["to_currency"]
                    ).first()
                    
                    if rate:
                        rate.rate = rate_data["rate"]
                    else:
                        new_rate = ExchangeRate(
                            from_currency=rate_data["from_currency"],
                            to_currency=rate_data["to_currency"],
                            rate=rate_data["rate"]
                        )
                        db.add(new_rate)
                
                db.commit()
                return {"message": "Exchange rates updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating exchange rates: {e}") 