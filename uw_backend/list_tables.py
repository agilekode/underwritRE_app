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


def list_tables():
    try:
        with engine.connect() as conn:
            # List tables in public schema
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            
            print("\n=== Database Tables ===")
            if not tables:
                print("No tables found!")
            else:
                for table in tables:
                    print(f"- {table}")
            print("=====================")
    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables() 