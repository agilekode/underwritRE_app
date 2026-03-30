import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    exit(1)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Adding plan_tier column to users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN plan_tier VARCHAR DEFAULT 'freemium';"))
            conn.commit()
            print("Column added successfully.")
        except Exception as e:
            if "already exists" in str(e):
                print("Column plan_tier already exists.")
            else:
                print(f"Error adding column: {e}")
                return

        print("Updating existing users to 'freemium' tier...")
        try:
            conn.execute(text("UPDATE users SET plan_tier = 'freemium' WHERE plan_tier IS NULL;"))
            conn.commit()
            print("Existing users updated.")
        except Exception as e:
            print(f"Error updating users: {e}")

if __name__ == "__main__":
    migrate()
