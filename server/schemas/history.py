from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ExchangeHistoryCreate(BaseModel):
    direction_id: str
    from_currency: str
    to_currency: str
    amount_give: float
    amount_get: float
    exchange_rate: float
    bid_id: Optional[str] = None
    status: str = "new"
    payment_address: Optional[str] = None
    wirebit_url: Optional[str] = None
    wallet_address: str
    email_used: str
    additional_data: Optional[str] = None


class ExchangeHistoryResponse(BaseModel):
    id: int
    direction_id: str
    from_currency: str
    to_currency: str
    amount_give: float
    amount_get: float
    exchange_rate: float
    bid_id: Optional[str] = None
    status: str
    payment_address: Optional[str] = None
    wirebit_url: Optional[str] = None
    wallet_address: str
    email_used: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ExchangeHistoryUpdate(BaseModel):
    status: Optional[str] = None
    payment_address: Optional[str] = None
    additional_data: Optional[str] = None 