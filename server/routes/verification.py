from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from auth.dependencies import get_db, get_current_active_user
from models.models import User, VerificationRequest
from schemas.verification import VerificationRequestResponse, UserVerificationStatus, VerificationCheckResponse
from datetime import datetime
import os
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/verification", tags=["verification"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads/verification"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types and max size
ALLOWED_EXTENSIONS = {'.gif', '.jpg', '.jpeg', '.jpe', '.png'}
MAX_FILE_SIZE = 128 * 1024 * 1024  # 128MB

def check_verification_required(from_currency: str, to_currency: str) -> bool:
    """Check if verification is required for this exchange"""
    # Verification required for Zelle USD to any RUB payment method
    if from_currency != "Zelle USD":
        return False
    
    rub_payment_methods = [
        "Банковская карта RUB",
        "СБП RUB", 
        "Сбербанк RUB",
        "Т-Банк RUB",
        "Альфа-Банк RUB"
    ]
    
    return to_currency in rub_payment_methods

@router.post("/check-required", response_model=VerificationCheckResponse)
async def check_verification_required_endpoint(
    from_currency: str,
    to_currency: str,
    current_user: User = Depends(get_current_active_user)
):
    """Check if verification is required for this exchange"""
    verification_required = check_verification_required(from_currency, to_currency)
    
    if not verification_required:
        return VerificationCheckResponse(
            verification_required=False,
            message="Верификация не требуется для данного обмена"
        )
    
    if current_user.is_verified:
        return VerificationCheckResponse(
            verification_required=False,
            message="Ваш аккаунт уже верифицирован"
        )
    
    return VerificationCheckResponse(
        verification_required=True,
        message="Для обмена Zelle USD на рублевые платежные системы требуется верификация аккаунта"
    )

@router.get("/status", response_model=UserVerificationStatus)
async def get_verification_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's verification status"""
    # Get latest verification request
    latest_request = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == current_user.id
    ).order_by(VerificationRequest.created_at.desc()).first()
    
    return UserVerificationStatus(
        is_verified=current_user.is_verified,
        verification_status=current_user.verification_status,
        latest_request=latest_request
    )

@router.post("/submit", response_model=VerificationRequestResponse)
async def submit_verification_request(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit verification request with document upload"""
    
    # Check if user already has pending or approved verification
    existing_request = db.query(VerificationRequest).filter(
        VerificationRequest.user_id == current_user.id,
        VerificationRequest.status.in_(["pending", "approved"])
    ).first()
    
    if existing_request:
        if existing_request.status == "approved":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ваш аккаунт уже верифицирован"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="У вас уже есть заявка на верификацию в обработке"
            )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл не выбран"
        )
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недопустимый тип файла. Разрешены: GIF, JPG, JPEG, PNG"
        )
    
    # Read file content to check size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла превышает 128МБ"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка сохранения файла"
        )
    
    # Create verification request record
    verification_request = VerificationRequest(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(file_content),
        status="pending"
    )
    
    db.add(verification_request)
    
    # Update user verification status
    current_user.verification_status = "pending"
    
    db.commit()
    db.refresh(verification_request)
    
    logger.info(f"Verification request submitted by user {current_user.username}")
    
    return verification_request 