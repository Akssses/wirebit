from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.models import User, Verification, VerificationStatus, UserRole
from app.schemas.schemas import VerificationCreate, Verification as VerificationSchema
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=VerificationSchema)
async def submit_verification(
    verification: VerificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit verification documents"""
    # Check if user already has a verification request
    existing_verification = db.query(Verification).filter(
        Verification.user_id == current_user.id
    ).first()
    
    if existing_verification:
        raise HTTPException(
            status_code=400,
            detail="Verification request already exists"
        )
    
    # Create new verification request
    db_verification = Verification(
        user_id=current_user.id,
        document_id=verification.document_id,
        document_type=verification.document_type,
        card_number=verification.card_number,
        status=VerificationStatus.PENDING
    )
    
    db.add(db_verification)
    current_user.verification_status = VerificationStatus.PENDING
    db.commit()
    db.refresh(db_verification)
    return db_verification

@router.get("/status", response_model=VerificationSchema)
async def get_verification_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's verification status"""
    verification = db.query(Verification).filter(
        Verification.user_id == current_user.id
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=404,
            detail="No verification request found"
        )
    return verification

@router.put("/{verification_id}/approve")
async def approve_verification(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a verification request (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    verification = db.query(Verification).filter(
        Verification.id == verification_id
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found"
        )
    
    verification.status = VerificationStatus.VERIFIED
    user = db.query(User).filter(User.id == verification.user_id).first()
    user.verification_status = VerificationStatus.VERIFIED
    
    db.commit()
    return {"message": "Verification approved successfully"}

@router.put("/{verification_id}/reject")
async def reject_verification(
    verification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a verification request (admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    verification = db.query(Verification).filter(
        Verification.id == verification_id
    ).first()
    
    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found"
        )
    
    verification.status = VerificationStatus.REJECTED
    user = db.query(User).filter(User.id == verification.user_id).first()
    user.verification_status = VerificationStatus.REJECTED
    
    db.commit()
    return {"message": "Verification rejected successfully"} 