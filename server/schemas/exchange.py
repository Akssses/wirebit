from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union


class DirectionResponse(BaseModel):
    direction_id: str
    from_: str = None
    to: str
    from_logo: Optional[str] = None
    to_logo: Optional[str] = None
    rate: float
    min: float
    max: float
    
    class Config:
        populate_by_name = True
        alias_generator = lambda field_name: "from" if field_name == "from_" else field_name


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
    message: Optional[str] = None
    bid_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    verification_required: Optional[bool] = False


class StatusResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
