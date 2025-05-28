from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from auth.dependencies import get_db, get_current_active_user
from models.models import User, ExchangeHistory
from schemas.history import ExchangeHistoryCreate, ExchangeHistoryResponse, ExchangeHistoryUpdate
import logging
import json

router = APIRouter(prefix="/api/history", tags=["history"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[ExchangeHistoryResponse])
async def get_user_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get exchange history for current user"""
    try:
        query = db.query(ExchangeHistory).filter(ExchangeHistory.user_id == current_user.id)
        
        if status_filter:
            query = query.filter(ExchangeHistory.status == status_filter)
        
        history = query.order_by(ExchangeHistory.created_at.desc()).offset(skip).limit(limit).all()
        return history
        
    except Exception as e:
        logger.error(f"Error getting user history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get exchange history"
        )


@router.post("/", response_model=ExchangeHistoryResponse)
async def create_exchange_record(
    exchange_data: ExchangeHistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new exchange history record"""
    try:
        db_exchange = ExchangeHistory(
            user_id=current_user.id,
            **exchange_data.dict()
        )
        
        db.add(db_exchange)
        db.commit()
        db.refresh(db_exchange)
        
        logger.info(f"Exchange record created for user {current_user.username}: {db_exchange.id}")
        return db_exchange
        
    except Exception as e:
        logger.error(f"Error creating exchange record: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create exchange record"
        )


@router.get("/{exchange_id}", response_model=ExchangeHistoryResponse)
async def get_exchange_details(
    exchange_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific exchange details"""
    try:
        exchange = db.query(ExchangeHistory).filter(
            ExchangeHistory.id == exchange_id,
            ExchangeHistory.user_id == current_user.id
        ).first()
        
        if not exchange:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        return exchange
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exchange details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get exchange details"
        )


@router.put("/{exchange_id}", response_model=ExchangeHistoryResponse)
async def update_exchange_status(
    exchange_id: int,
    update_data: ExchangeHistoryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update exchange status (usually called by webhooks or status checker)"""
    try:
        exchange = db.query(ExchangeHistory).filter(
            ExchangeHistory.id == exchange_id,
            ExchangeHistory.user_id == current_user.id
        ).first()
        
        if not exchange:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(exchange, field, value)
        
        db.commit()
        db.refresh(exchange)
        
        logger.info(f"Exchange {exchange_id} updated for user {current_user.username}")
        return exchange
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating exchange: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update exchange"
        ) 