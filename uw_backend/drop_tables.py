from sqlalchemy import create_engine
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Create the engine
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

from sqlalchemy import text

def drop_all_tables():
    with engine.connect() as conn:
        # Disable foreign key checks temporarily
        conn.execute(text("SET session_replication_role = 'replica';"))
        
        # Get all table names
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result]
        
        # Drop each table
        for table in tables:
            print(f"Dropping table: {table}")
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        
        # Re-enable foreign key checks
        conn.execute(text("SET session_replication_role = 'origin';"))
        conn.commit()
        
        print("\nAll tables dropped successfully!")

if __name__ == "__main__":
    drop_all_tables() 