from flask import Flask
from flask_cors import CORS
from app.db import db
from app.routes.user import user_bp
from app.routes.model import model_bp
import os
from dotenv import load_dotenv
import os

from google.auth import default, exceptions as google_auth_exceptions
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from app.routes.health import health_bp  # Add this line near your other imports
from app.routes.billing import billing_bp

import logging
logging.basicConfig(level=logging.INFO)

load_dotenv()

SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE")


def test_gdrive_access():
    try:
        SCOPES = ["https://www.googleapis.com/auth/drive.file"]

        # Use local service account file if available, otherwise use default creds
        if SERVICE_ACCOUNT_FILE and os.path.exists("./" + SERVICE_ACCOUNT_FILE):
            print("🔑 Using local service account credentials. (init.py)")
            creds = Credentials.from_service_account_file("./" + SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            logging.info("🔑 Using local service account credentials.")
        else:
            print("🔑 Using default GCP credentials (Cloud Run). (init.py)")
            creds, _ = default(scopes=SCOPES)
            logging.info("🔐 Using default GCP credentials (Cloud Run).")

        # Try accessing the Drive API
        drive_service = build("drive", "v3", credentials=creds)
        drive_service.files().list(pageSize=1).execute()
        logging.info("✅ Google Drive access verified successfully.")

    except google_auth_exceptions.DefaultCredentialsError as e:
        logging.error(f"❌ DefaultCredentialsError: {e}")
    except Exception as e:
        logging.error(f"❌ Google Drive API access failed: {e}")


origins = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
print("ORIGINS", origins)
def create_app():
    try:
        load_dotenv()
        test_gdrive_access()
        app = Flask(__name__)

        # Set the database URI from environment or fallback
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800
        }

        db.init_app(app)
        logging.info(f"✅ ALLOWED ORIGINS: {origins}")
        # Configure CORS
        CORS(app, 
            supports_credentials=True,
            resources={
            r"/api/*": {
                "origins": origins,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-User-Email"],
            }
        })

        # Register blueprints
        app.register_blueprint(user_bp, url_prefix="/api")
        app.register_blueprint(model_bp, url_prefix="/api")
        app.register_blueprint(health_bp, url_prefix="/api")
        app.register_blueprint(billing_bp, url_prefix="/api")

        return app
    except Exception as e:
            import traceback
            print("❌ App failed to load:", e)
            traceback.print_exc()
            raise