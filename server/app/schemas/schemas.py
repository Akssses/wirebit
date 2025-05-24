from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, OrderStatus, VerificationStatus

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    role: UserRole
    is_active: bool
    verification_status: VerificationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

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
    updated_at: Optional[datetime] = None

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
    card_number: Optional[str] = None

class VerificationCreate(VerificationBase):
    pass

class Verification(VerificationBase):
    id: int
    user_id: int
    status: VerificationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True 