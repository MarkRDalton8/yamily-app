from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#SQLite database url - creates a file called yamily.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./yamily.db"

#crete the database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

#create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Base class for our models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()