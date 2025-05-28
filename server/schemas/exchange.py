from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


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
    account_to: str = Field(min_length=1, alias="account_to")
    cf6: str = Field(alias="cf6")
    
    class Config:
        populate_by_name = True


class CreateExchangeResponse(BaseModel):
    success: bool
    bid_id: Optional[Union[str, int]] = None
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class StatusResponse(BaseModel):
    success: bool
    status: Optional[str] = None
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
