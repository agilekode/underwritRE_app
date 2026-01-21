from sqlalchemy import text
import os
from sqlalchemy import create_engine

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Create the engine
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

from sqlalchemy import text


from app.db import Base
from app.models import (
    User, ModelType, ModelTypeSection, ModelTypeSectionField,
    UserModel, UserModelVersion, UserModelFieldValue,
    Unit, MarketRentAssumption
)

print(f"Using DATABASE_URL: {DATABASE_URL}")

# Check if engine is connected
try:
    with engine.connect() as conn:
        print("✅ Successfully connected to the database.")
except Exception as e:
    print(f"❌ Failed to connect to the database: {e}")

# List models to be created
print("Models to be created:")
for cls in Base.__subclasses__():
    if hasattr(cls, '__tablename__'):
        print(f"- {cls.__tablename__}")

# Create all tables
Base.metadata.create_all(bind=engine)

print("✅ Database tables created.")