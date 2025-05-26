from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

database_url = settings.SQLALCHEMY_DATABASE_URI or "sqlite://"

engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency, used in API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 