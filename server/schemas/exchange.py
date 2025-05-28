from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any


class DirectionResponse(BaseModel):
    direction_id: str
    from_currency: str = Field(alias="from")
    to_currency: str = Field(alias="to")
    from_logo: Optional[str] = None
    to_logo: Optional[str] = None
    rate: Optional[float] = 1
    min: Optional[float] = 0
    max: Optional[float] = 999999
    
    class Config:
        populate_by_name = True


class CurrencyResponse(BaseModel):
    title: str
    logo: Optional[str] = None


class CreateExchangeRequest(BaseModel):
    direction_id: str
    amount: float = Field(gt=0)
    account: str = Field(min_length=1)
    email: EmailStr


class CreateExchangeResponse(BaseModel):
    success: bool
    bid_id: Optional[str] = None
    message: Optional[str] = None


class StatusResponse(BaseModel):
    success: bool
    status: Optional[str] = None
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
