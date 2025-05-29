from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="not_requested")  # not_requested, pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    exchanges = relationship("ExchangeHistory", back_populates="user")
    verification_requests = relationship("VerificationRequest", back_populates="user", foreign_keys="VerificationRequest.user_id")


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
    wallet_address = Column(String, nullable=True)
    email_used = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Additional data as JSON string
    additional_data = Column(Text, nullable=True)
    
    # Relationship to user
    user = relationship("User", back_populates="exchanges") 


class VerificationRequest(Base):
    __tablename__ = "verification_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin user ID who reviewed
    
    # Relationships
    user = relationship("User", back_populates="verification_requests", foreign_keys=[user_id]) 