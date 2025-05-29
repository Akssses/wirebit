from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.dependencies import get_db, get_current_active_user
from models.models import User, VerificationRequest
from schemas.verification import VerificationRequestResponse, VerificationRequestUpdate
from datetime import datetime
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])

def check_admin_access(current_user: User):
    """Check if user has admin access"""
    # For now, let's use a simple check - admin usernames
    # In production, you'd want a proper role system
    admin_usernames = ["admin", "administrator", "wirebit_admin"]
    
    if current_user.username not in admin_usernames:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )

@router.get("/verification-requests", response_model=List[VerificationRequestResponse])
async def get_verification_requests(
    status_filter: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all verification requests for admin review"""
    check_admin_access(current_user)
    
    query = db.query(VerificationRequest)
    
    if status_filter:
        query = query.filter(VerificationRequest.status == status_filter)
    
    requests = query.order_by(VerificationRequest.submitted_at.desc()).all()
    
    # Add user information to each request
    for request in requests:
        request.user  # This will load the user relationship
    
    return requests

@router.get("/verification-requests/{request_id}", response_model=VerificationRequestResponse)
async def get_verification_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific verification request"""
    check_admin_access(current_user)
    
    request = db.query(VerificationRequest).filter(
        VerificationRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found"
        )
    
    return request

@router.put("/verification-requests/{request_id}", response_model=VerificationRequestResponse)
async def update_verification_request(
    request_id: int,
    update_data: VerificationRequestUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update verification request status (approve/reject)"""
    check_admin_access(current_user)
    
    request = db.query(VerificationRequest).filter(
        VerificationRequest.id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found"
        )
    
    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be updated"
        )
    
    # Update request
    request.status = update_data.status
    request.admin_notes = update_data.admin_notes
    request.reviewed_at = datetime.utcnow()
    request.reviewed_by = current_user.username
    
    # Update user verification status
    user = request.user
    if update_data.status == "approved":
        user.is_verified = True
        user.verification_status = "approved"
    elif update_data.status == "rejected":
        user.is_verified = False
        user.verification_status = "rejected"
    
    db.commit()
    db.refresh(request)
    
    logger.info(f"Verification request {request_id} {update_data.status} by admin {current_user.username}")
    
    return request

@router.get("/users", response_model=List[dict])
async def get_users_list(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of all users with verification status"""
    check_admin_access(current_user)
    
    users = db.query(User).order_by(User.created_at.desc()).all()
    
    users_data = []
    for user in users:
        # Get latest verification request
        latest_request = db.query(VerificationRequest).filter(
            VerificationRequest.user_id == user.id
        ).order_by(VerificationRequest.submitted_at.desc()).first()
        
        users_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_verified": user.is_verified,
            "verification_status": user.verification_status,
            "created_at": user.created_at,
            "latest_verification_request": latest_request.id if latest_request else None,
            "latest_request_status": latest_request.status if latest_request else None
        })
    
    return users_data 