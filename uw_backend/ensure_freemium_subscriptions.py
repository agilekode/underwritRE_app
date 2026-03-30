from dotenv import load_dotenv
import os

load_dotenv()

import stripe
from app import create_app
from app.db import db
from app.models.user import User
from app.routes.billing import ensure_freemium_subscription
from sqlalchemy.orm import Session

def run():
    print("🚀 Starting ensure_freemium_subscriptions script...")
    app = create_app()
    with app.app_context():
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        price_id_freemium = os.getenv("PRICE_ID_FREEMIUM")
        
        if not price_id_freemium:
            print("❌ PRICE_ID_FREEMIUM is not set in environment variables.")
            return

        session = Session(db.engine)
        try:
            users = session.query(User).all()
            print(f"🔍 Found {len(users)} users to check.")

            for user in users:
                print(f"--- Processing User: {user.email or user.auth0_user_id} ---")
                
                if user.stripe_subscription_id and user.subscription_status in ("active", "trialing"):
                    print(f"✅ User already has an active subscription: {user.stripe_subscription_id} (Status: {user.subscription_status})")
                    continue
                print(f"⏳ Ensuring freemium subscription for user...")
                sub = ensure_freemium_subscription(user.auth0_user_id, user.email)
                
                if sub:
                    print(f"🚀 Successfully ensured/created subscription: {sub.id} (Status: {sub.status})")
                else:
                    print(f"⚠️ Could not ensure freemium subscription for user {user.auth0_user_id}")

        except Exception as e:
            print(f"❌ Error during processing: {e}")
        finally:
            session.close()

if __name__ == "__main__":
    run()
