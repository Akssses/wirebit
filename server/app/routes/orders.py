from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.models import Order, User, ExchangeRate, OrderStatus
from app.schemas.schemas import OrderCreate, Order as OrderSchema
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=OrderSchema)
async def create_order(
    order: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new exchange order"""
    # Get current exchange rate
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.from_currency == order.from_currency.upper(),
        ExchangeRate.to_currency == order.to_currency.upper()
    ).first()
    
    if not rate:
        raise HTTPException(
            status_code=404,
            detail="Exchange rate not found for the specified currency pair"
        )
    
    # Create new order
    db_order = Order(
        user_id=current_user.id,
        from_currency=order.from_currency.upper(),
        to_currency=order.to_currency.upper(),
        amount=order.amount,
        rate=rate.rate,
        status=OrderStatus.PENDING
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/", response_model=List[OrderSchema])
async def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for the current user"""
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    return orders

@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific order by ID"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a pending order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be cancelled"
        )
    
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Order cancelled successfully"} 