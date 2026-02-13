import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PRICE_ID = os.getenv("PRICE_ID")

# Create test customer
customer = stripe.Customer.create(
    email="cdurkin@underwritre.com",
    name="cdurkin@underwritre.com"
)
print(f"Customer ID: {customer.id}")

# Create subscription with 14-day trial (no payment method needed in test mode)
sub = stripe.Subscription.create(
    customer=customer.id,
    items=[{"price": PRICE_ID}],
    trial_period_days=14
)
print(f"Subscription ID: {sub.id}")
print(f"Status: {sub.status}")
