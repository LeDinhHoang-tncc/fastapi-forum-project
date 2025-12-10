from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/forum_db"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
