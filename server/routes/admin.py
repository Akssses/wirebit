from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from auth.dependencies import get_db, get_current_admin
from models.models import User, VerificationRequest
from schemas.admin import (
    VerificationRequestResponse,
    VerificationApprovalRequest,
    UserListResponse,
    AdminStatsResponse
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


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