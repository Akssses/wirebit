import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import Base, User, UserRole, VerificationStatus

def create_admin(db: Session, username: str, password: str, email: str):
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin:
        print("Admin user already exists")
        return
    
    admin = User(
        username=username,
        email=email,
        role=UserRole.ADMIN,
        verification_status=VerificationStatus.VERIFIED,
        is_active=True
    )
    admin.set_password(password)
    
    db.add(admin)
    db.commit()
    print(f"Admin user '{username}' created successfully")

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created")

if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        create_admin(
            db,
            username="admin",
            password="admin123",  # Change this in production
            email="admin@wirebit.net"
        )
    finally:
        db.close() 