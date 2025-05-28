from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to exchange history
    exchanges = relationship("ExchangeHistory", back_populates="user")


class ExchangeHistory(Base):
    __tablename__ = "exchange_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Exchange details
    direction_id = Column(String, nullable=False)
    from_currency = Column(String, nullable=False)
    to_currency = Column(String, nullable=False)
    amount_give = Column(Float, nullable=False)
    amount_get = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    
    # Wirebit API response data
    bid_id = Column(String, nullable=True)  # ID from Wirebit
    status = Column(String, default="new")
    payment_address = Column(String, nullable=True)
    wirebit_url = Column(String, nullable=True)
    
    # User data
    wallet_address = Column(String, nullable=False)  # Where user wants to receive
    email_used = Column(String, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional data as JSON string
    additional_data = Column(Text, nullable=True)
    
    # Relationship to user
    user = relationship("User", back_populates="exchanges") 