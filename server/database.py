import os
from databases import Database
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL - for dev using SQLite, for prod can use PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wirebit.db")

# For SQLite
if DATABASE_URL.startswith("sqlite"):
    database = Database(DATABASE_URL)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # For PostgreSQL
    database = Database(DATABASE_URL)
    engine = create_engine(DATABASE_URL)

metadata = MetaData()
Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 