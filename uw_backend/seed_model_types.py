from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from app.models.model import ModelType

# Load environment variables
load_dotenv()

# Create engine and session
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Define model types based on your dev environment
model_types = [
    {
        'name': 'Industrial',
        'description': None,
        'is_active': True,
        'google_sheet_url': None,
        'show_retail': False,
        'show_rental_units': False
    },
    {
        'name': 'Multifamily',
        'description': 'Only residential units (i.e. apartments, townhomes, mobile homes), plus any amenity income',
        'is_active': True,
        'google_sheet_url': None,
        'show_retail': False,
        'show_rental_units': True
    },
    {
        'name': 'The Best Mixed Use Model',
        'description': 'Newest model',
        'is_active': True,
        'google_sheet_url': None,
        'show_retail': True,
        'show_rental_units': True
    },
    {
        'name': 'Multifamily and Mixed-Use Development',
        'description': 'COMING SOON',
        'is_active': False,
        'google_sheet_url': None,
        'show_retail': True,
        'show_rental_units': True
    }
]

try:
    # Insert model types
    for mt_data in model_types:
        model_type = ModelType(**mt_data)
        session.add(model_type)
    
    session.commit()
    print(f"✅ Successfully seeded {len(model_types)} model types!")
    
except Exception as e:
    session.rollback()
    print(f"❌ Error seeding model types: {e}")
finally:
    session.close()