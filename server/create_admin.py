#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add the server directory to Python path
server_dir = Path(__file__).parent
sys.path.insert(0, str(server_dir))

from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models.models import User
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    """Create admin user"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Hash password
        hashed_password = pwd_context.hash("123123")
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@gmail.com",
            hashed_password=hashed_password,
            is_active=True,
            is_verified=True,
            verification_status="approved"
        )
        
        db.add(admin_user)
        db.commit()
        
        print("Admin user created successfully!")
        print("Email: admin@gmail.com")
        print("Password: 123123")
        
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin() 