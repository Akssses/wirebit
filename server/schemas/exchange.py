from pydantic import BaseModel, Field, field_validator
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
    
    # Поля для крипто обменов
    account_to: Optional[str] = None
    
    # Поля для рублевых обменов
    account2: Optional[str] = None  # номер карты
    cfgive8: Optional[str] = None  # имя владельца карты
    cf11: Optional[str] = None     # telegram/whatsapp
    
    # Общее поле
    cf6: str = Field(min_length=1)  # email
    
    class Config:
        populate_by_name = True


class CreateExchangeResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    bid_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    verification_required: Optional[bool] = False
    
    @field_validator('bid_id', mode='before')
    @classmethod
    def convert_bid_id_to_string(cls, v):
        """Convert bid_id to string if it's an integer"""
        if v is not None:
            return str(v)
        return v


class StatusResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    status: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
