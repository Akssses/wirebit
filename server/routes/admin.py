from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from auth.dependencies import get_db, get_current_admin
from models.models import User, VerificationRequest, ExchangeHistory
from schemas.admin import (
    VerificationRequestResponse,
    VerificationApprovalRequest,
    UserListResponse,
    AdminStatsResponse
)
from schemas.history import ExchangeHistoryResponse, ExchangeHistoryUpdate
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

class ExchangeStatusUpdate(BaseModel):
    status: str
    admin_comment: Optional[str] = None

class AdminExchangeResponse(BaseModel):
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
    # User info
    user_id: int
    username: str
    user_email: str
    
    class Config:
        from_attributes = True


@router.get("/verification-requests", response_model=List[VerificationRequestResponse])
async def get_verification_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all pending verification requests"""
    try:
        requests = db.query(VerificationRequest).options(
            joinedload(VerificationRequest.user)
        ).filter(
            VerificationRequest.status == "pending"
        ).order_by(VerificationRequest.created_at.desc()).all()
        
        return [
            VerificationRequestResponse(
                id=req.id,
                user_id=req.user_id,
                username=req.user.username if req.user else "Unknown",
                email=req.user.email if req.user else "Unknown",
                file_path=req.file_path,
                status=req.status,
                created_at=req.created_at,
                admin_comment=req.admin_comment
            )
            for req in requests
        ]
    except Exception as e:
        logger.error(f"Error getting verification requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verification-requests/all", response_model=List[VerificationRequestResponse])
async def get_all_verification_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all verification requests (approved, rejected, pending)"""
    try:
        requests = db.query(VerificationRequest).options(
            joinedload(VerificationRequest.user)
        ).order_by(VerificationRequest.created_at.desc()).all()
        
        return [
            VerificationRequestResponse(
                id=req.id,
                user_id=req.user_id,
                username=req.user.username if req.user else "Unknown",
                email=req.user.email if req.user else "Unknown",
                file_path=req.file_path,
                status=req.status,
                created_at=req.created_at,
                updated_at=req.updated_at,
                admin_comment=req.admin_comment,
                processed_by=req.processed_by
            )
            for req in requests
        ]
    except Exception as e:
        logger.error(f"Error getting all verification requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verification-requests/{request_id}/approve")
async def approve_verification(
    request_id: int,
    approval_data: VerificationApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Approve verification request"""
    try:
        verification_request = db.query(VerificationRequest).filter(
            VerificationRequest.id == request_id
        ).first()
        
        if not verification_request:
            raise HTTPException(
                status_code=404,
                detail="Verification request not found"
            )
        
        if verification_request.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="Verification request is not pending"
            )
        
        # Update verification request
        verification_request.status = "approved"
        verification_request.admin_comment = approval_data.comment
        verification_request.processed_by = admin.id
        verification_request.updated_at = datetime.utcnow()
        
        # Update user
        user = db.query(User).filter(User.id == verification_request.user_id).first()
        if user:
            user.is_verified = True
            user.verification_status = "approved"
        
        db.commit()
        
        return {"success": True, "message": "Verification approved successfully"}
        
    except Exception as e:
        logger.error(f"Error approving verification: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verification-requests/{request_id}/reject")
async def reject_verification(
    request_id: int,
    rejection_data: VerificationApprovalRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Reject verification request"""
    try:
        verification_request = db.query(VerificationRequest).filter(
            VerificationRequest.id == request_id
        ).first()
        
        if not verification_request:
            raise HTTPException(
                status_code=404,
                detail="Verification request not found"
            )
        
        if verification_request.status != "pending":
            raise HTTPException(
                status_code=400,
                detail="Verification request is not pending"
            )
        
        # Update verification request
        verification_request.status = "rejected"
        verification_request.admin_comment = rejection_data.comment
        verification_request.processed_by = admin.id
        verification_request.updated_at = datetime.utcnow()
        
        # Update user
        user = db.query(User).filter(User.id == verification_request.user_id).first()
        if user:
            user.is_verified = False
            user.verification_status = "rejected"
        
        db.commit()
        
        return {"success": True, "message": "Verification rejected successfully"}
        
    except Exception as e:
        logger.error(f"Error rejecting verification: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users", response_model=List[UserListResponse])
async def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all users"""
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        return [
            UserListResponse(
                id=user.id,
                username=user.username,
                email=user.email,
                is_active=user.is_active,
                is_verified=user.is_verified,
                verification_status=user.verification_status,
                created_at=user.created_at
            )
            for user in users
        ]
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    try:
        total_users = db.query(User).count()
        verified_users = db.query(User).filter(User.is_verified == True).count()
        pending_verifications = db.query(VerificationRequest).filter(
            VerificationRequest.status == "pending"
        ).count()
        
        return AdminStatsResponse(
            total_users=total_users,
            verified_users=verified_users,
            pending_verifications=pending_verifications,
            unverified_users=total_users - verified_users
        )
    except Exception as e:
        logger.error(f"Error getting admin stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchanges", response_model=List[AdminExchangeResponse])
async def get_all_exchanges(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all exchanges for admin management"""
    try:
        query = db.query(ExchangeHistory).options(
            joinedload(ExchangeHistory.user)
        )
        
        if status_filter:
            query = query.filter(ExchangeHistory.status == status_filter)
        
        exchanges = query.order_by(ExchangeHistory.created_at.desc()).offset(skip).limit(limit).all()
        
        return [
            AdminExchangeResponse(
                id=exchange.id,
                direction_id=exchange.direction_id,
                from_currency=exchange.from_currency,
                to_currency=exchange.to_currency,
                amount_give=exchange.amount_give,
                amount_get=exchange.amount_get,
                exchange_rate=exchange.exchange_rate,
                bid_id=exchange.bid_id,
                status=exchange.status,
                payment_address=exchange.payment_address,
                wirebit_url=exchange.wirebit_url,
                wallet_address=exchange.wallet_address,
                email_used=exchange.email_used,
                created_at=exchange.created_at,
                updated_at=exchange.updated_at,
                user_id=exchange.user_id,
                username=exchange.user.username if exchange.user else "Unknown",
                user_email=exchange.user.email if exchange.user else "Unknown"
            )
            for exchange in exchanges
        ]
    except Exception as e:
        logger.error(f"Error getting exchanges: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/exchanges/{exchange_id}/status")
async def update_exchange_status_admin(
    exchange_id: int,
    status_update: ExchangeStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update exchange status as admin"""
    try:
        exchange = db.query(ExchangeHistory).filter(
            ExchangeHistory.id == exchange_id
        ).first()
        
        if not exchange:
            raise HTTPException(
                status_code=404,
                detail="Exchange not found"
            )
        
        # Update status
        exchange.status = status_update.status
        exchange.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(exchange)
        
        logger.info(f"Exchange {exchange_id} status updated to {status_update.status} by admin {admin.username}")
        
        return {"success": True, "message": f"Status updated to {status_update.status}"}
        
    except Exception as e:
        logger.error(f"Error updating exchange status: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exchanges/{exchange_id}")
async def get_exchange_details_admin(
    exchange_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get exchange details for admin"""
    try:
        exchange = db.query(ExchangeHistory).options(
            joinedload(ExchangeHistory.user)
        ).filter(ExchangeHistory.id == exchange_id).first()
        
        if not exchange:
            raise HTTPException(
                status_code=404,
                detail="Exchange not found"
            )
        
        return AdminExchangeResponse(
            id=exchange.id,
            direction_id=exchange.direction_id,
            from_currency=exchange.from_currency,
            to_currency=exchange.to_currency,
            amount_give=exchange.amount_give,
            amount_get=exchange.amount_get,
            exchange_rate=exchange.exchange_rate,
            bid_id=exchange.bid_id,
            status=exchange.status,
            payment_address=exchange.payment_address,
            wirebit_url=exchange.wirebit_url,
            wallet_address=exchange.wallet_address,
            email_used=exchange.email_used,
            created_at=exchange.created_at,
            updated_at=exchange.updated_at,
            user_id=exchange.user_id,
            username=exchange.user.username if exchange.user else "Unknown",
            user_email=exchange.user.email if exchange.user else "Unknown"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exchange details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 