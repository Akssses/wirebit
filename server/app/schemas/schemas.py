from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, OrderStatus, VerificationStatus

class UserBase(BaseModel):
    telegram_id: str
    username: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    role: UserRole
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    from_currency: str
    to_currency: str
    amount: float = Field(..., gt=0)

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    user_id: int
    rate: float
    status: OrderStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ExchangeRateBase(BaseModel):
    from_currency: str
    to_currency: str
    rate: float

class ExchangeRate(ExchangeRateBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class VerificationBase(BaseModel):
    document_id: str
    document_type: str
    card_number: Optional[str]

class VerificationCreate(VerificationBase):
    pass

class Verification(VerificationBase):
    id: int
    user_id: int
    status: VerificationStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    telegram_id: Optional[str] = None 