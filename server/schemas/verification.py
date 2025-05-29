from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VerificationRequestCreate(BaseModel):
    pass  # File upload will be handled separately

class VerificationRequestResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_size: int
    status: str
    admin_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    
    class Config:
        from_attributes = True

class VerificationRequestUpdate(BaseModel):
    status: str  # approved, rejected
    admin_notes: Optional[str] = None

class UserVerificationStatus(BaseModel):
    is_verified: bool
    verification_status: str
    latest_request: Optional[VerificationRequestResponse] = None

class VerificationCheckResponse(BaseModel):
    verification_required: bool
    message: str 