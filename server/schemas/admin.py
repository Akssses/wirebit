from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VerificationRequestResponse(BaseModel):
    id: int
    user_id: int
    username: str
    email: str
    file_path: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    admin_comment: Optional[str] = None
    processed_by: Optional[int] = None


class VerificationApprovalRequest(BaseModel):
    comment: Optional[str] = None


class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_verified: bool
    verification_status: Optional[str] = None
    created_at: datetime


class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    pending_verifications: int
    unverified_users: int 