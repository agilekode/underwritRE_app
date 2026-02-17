"""
One-time migration: Add tag_color column to model_tags table.
Run with: python add_tag_color_column.py
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Check if column already exists
    result = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'model_tags' AND column_name = 'tag_color'"
    ))
    if result.fetchone():
        print("Column 'tag_color' already exists on model_tags. No changes needed.")
    else:
        conn.execute(text("ALTER TABLE model_tags ADD COLUMN tag_color VARCHAR"))
        conn.commit()
        print("Successfully added 'tag_color' column to model_tags table.")
