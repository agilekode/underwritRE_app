import os
from sqlalchemy import create_engine
from app.db import Base
from app.models.user import User, UserInfo, CompanyInfo, SubscriptionEvent
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///test.db"

def migrate():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    print("Creating tables if they don't exist...")
    Base.metadata.create_all(engine)
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
