from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create engine
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Delete all model types (this will cascade delete sections and fields due to foreign keys)
        result = conn.execute(text('DELETE FROM model_types'))
        conn.commit()
        
        print(f"✅ Successfully deleted all model types!")
        
        # Verify
        verify = conn.execute(text('SELECT COUNT(*) FROM model_types'))
        count = verify.fetchone()[0]
        print(f"Remaining model types: {count}")
        
except Exception as e:
    print(f"❌ Error: {e}")