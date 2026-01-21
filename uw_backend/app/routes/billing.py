import os
import stripe
from flask import Blueprint, request, jsonify, g, current_app as app
from app.auth import requires_auth
from sqlalchemy.orm import Session
from app.db import db
from app.models.user import User

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
PRICE_ID = os.environ.get("PRICE_ID")
PROMO_CODE = os.environ.get("STRIPE_PROMO_CODE", "").strip()
PROMO_TRIAL_DAYS = int(os.environ.get("PROMO_TRIAL_DAYS", "60"))

billing_bp = Blueprint("billing", __name__)


def get_session():
    with app.app_context():
        return Session(db.engine)


def get_or_create_customer(auth0_sub: str, email: str | None):
    session = get_session()
    try:
        user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
        if not user:
            user = User(auth0_user_id=auth0_sub, email=email or "")
            session.add(user)
            session.commit()
            session.refresh(user)
        if user.stripe_customer_id:
            # Ensure customer has a friendly name/description
            try:
                stripe.Customer.modify(
                    user.stripe_customer_id,
                    name=(email or None),
                    email=(email or None),
                    description=(email or auth0_sub)
                )
            except Exception:
                pass
            return user.stripe_customer_id
        # Try to find an existing customer by email to avoid duplicates
        if email:
            try:
                existing = stripe.Customer.list(email=email, limit=1)
                if getattr(existing, 'data', []):
                    candidate = existing.data[0]
                    user.stripe_customer_id = candidate.id
                    session.commit()
                    try:
                        stripe.Customer.modify(
                            candidate.id,
                            name=(email or None),
                            email=(email or None),
                            description=(email or auth0_sub),
                            metadata={"auth0_sub": auth0_sub, "auth0_email": email or ""}
                        )
                    except Exception:
                        pass
                    return candidate.id
            except Exception:
                pass
        # Create a new customer
        cust = stripe.Customer.create(
            email=email or None,
            name=email or None,
            description=(email or auth0_sub),
            metadata={"auth0_sub": auth0_sub, "auth0_email": email or ""}
        )
        user.stripe_customer_id = cust.id
        session.commit()
        return cust.id
    finally:
        session.close()


def customer_has_any_subscription(customer_id: str) -> bool:
    statuses = [
        "active",
        "trialing",
        "past_due",
        "unpaid",
        "canceled",
        "incomplete",
        "incomplete_expired",
    ]
    try:
        for s in statuses:
            lst = stripe.Subscription.list(customer=customer_id, status=s, limit=1)
            if getattr(lst, 'data', []):
                return True
    except Exception:
        # Fallback to a simple list without status filter
        try:
            lst = stripe.Subscription.list(customer=customer_id, limit=1)
            if getattr(lst, 'data', []):
                return True
        except Exception:
            pass
    return False


@billing_bp.route("/billing/setup-intent", methods=["POST"])
@requires_auth
def create_setup_intent():
    user = getattr(g, 'current_user', None) or {}
    auth0_sub = user.get('sub')
    email = user.get('email')
    if not auth0_sub:
        return jsonify({"error": "unauthorized"}), 401
    try:
        customer_id = get_or_create_customer(auth0_sub, email)
        # Fetch authoritative email from DB (update it from JWT if missing)
        session = get_session()
        effective_email = email
        try:
            db_user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if db_user:
                if (not db_user.email) and email:
                    db_user.email = email
                    session.commit()
                effective_email = db_user.email or email
        finally:
            session.close()

        # Ensure Stripe customer has email set
        try:
            stripe.Customer.modify(
                customer_id,
                name=auth0_sub,
                email=(effective_email or None),
                description=(effective_email or auth0_sub),
                metadata={"auth0_sub": auth0_sub, "auth0_email": effective_email or ""}
            )
        except Exception:
            pass
        si = stripe.SetupIntent.create(
            customer=customer_id,
            automatic_payment_methods={"enabled": True}
        )
        return jsonify({"clientSecret": si.client_secret})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@billing_bp.route("/billing/start-promo-subscription", methods=["POST"])
@requires_auth
def start_promo_subscription():
    """
    Starts a subscription with a long free trial when a valid promo code is supplied.
    Does not require a payment method up-front.
    """
    body = request.get_json() or {}
    promo_code = (body.get("promo_code") or "").strip()
    user_claims = getattr(g, 'current_user', None) or {}
    auth0_sub = user_claims.get('sub')
    email = user_claims.get('email')
    if not auth0_sub:
        return jsonify({"error": "unauthorized"}), 401
    if not PRICE_ID:
        return jsonify({"error": "PRICE_ID not configured"}), 500
    # Validate promo
    if not PROMO_CODE or promo_code.lower() != PROMO_CODE.lower():
        return jsonify({"error": "Invalid promo code"}), 400
    try:
        # Ensure a customer exists
        customer_id = get_or_create_customer(auth0_sub, email)
        # Fetch authoritative email from DB (update it from JWT if missing)
        session = get_session()
        effective_email = email
        try:
            db_user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if db_user:
                if (not db_user.email) and email:
                    db_user.email = email
                    session.commit()
                effective_email = db_user.email or email
        finally:
            session.close()
        # Keep Stripe customer updated with email
        try:
            stripe.Customer.modify(
                customer_id,
                name=auth0_sub,
                email=(effective_email or None),
                description=(effective_email or auth0_sub),
                metadata={"auth0_sub": auth0_sub, "auth0_email": effective_email or ""}
            )
        except Exception:
            pass
        # Create subscription with extended trial; no payment method required
        sub = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": PRICE_ID}],
            trial_period_days=max(1, int(PROMO_TRIAL_DAYS)),
            metadata={"auth0_sub": auth0_sub, "auth0_email": effective_email or "", "promo_code": promo_code}
        )
        # Ensure the subscription is set to cancel at period end by default (no auto-renew)
        try:
            sub = stripe.Subscription.modify(sub.id, cancel_at_period_end=True)
        except Exception:
            # If modify fails, continue with created subscription
            pass
        # Persist to DB
        session = get_session()
        try:
            user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if user:
                user.stripe_subscription_id = sub.id
                user.subscription_status = sub.status
                user.plan_price_id = PRICE_ID
                user.current_period_end = sub.get("current_period_end") or None
                user.cancel_at_period_end = bool(sub.get("cancel_at_period_end")) if hasattr(sub, 'cancel_at_period_end') else False
                session.commit()
        finally:
            session.close()
        return jsonify({"subscriptionId": sub.id, "status": sub.status, "trial_end": sub.get("trial_end")}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@billing_bp.route("/billing/start-subscription", methods=["POST"])
@requires_auth
def start_subscription():
    body = request.get_json() or {}
    payment_method = body.get("payment_method")
    if not payment_method:
        return jsonify({"error": "payment_method required"}), 400
    user_claims = getattr(g, 'current_user', None) or {}
    auth0_sub = user_claims.get('sub')
    email = user_claims.get('email')
    if not auth0_sub:
        return jsonify({"error": "unauthorized"}), 401
    if not PRICE_ID:
        return jsonify({"error": "PRICE_ID not configured"}), 500
    try:
        customer_id = get_or_create_customer(auth0_sub, email)
        # Fetch authoritative email from DB (update it from JWT if missing)
        session = get_session()
        effective_email = email
        try:
            db_user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if db_user:
                if (not db_user.email) and email:
                    db_user.email = email
                    session.commit()
                effective_email = db_user.email or email
        finally:
            session.close()

        # Ensure Stripe customer has email set just before creating subscription
        try:
            stripe.Customer.modify(
                customer_id,
                name=auth0_sub,
                email=(effective_email or None),
                description=(effective_email or auth0_sub),
                metadata={"auth0_sub": auth0_sub, "auth0_email": effective_email or ""}
            )
        except Exception:
            pass
        # Determine trial eligibility: only if customer has never had any subscription
        allow_trial = not customer_has_any_subscription(customer_id)
        create_args = {
            "customer": customer_id,
            "items": [{"price": PRICE_ID}],
            "default_payment_method": payment_method,
            "payment_settings": {"save_default_payment_method": "on_subscription"},
            "metadata": {"auth0_sub": auth0_sub, "auth0_email": email or ""}
        }
        if allow_trial:
            create_args["trial_period_days"] = 14
        sub = stripe.Subscription.create(**create_args)
        # Persist subscription fields
        session = get_session()
        try:
            user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if user:
                user.stripe_subscription_id = sub.id
                user.subscription_status = sub.status
                user.plan_price_id = PRICE_ID
                user.current_period_end = sub.get("current_period_end") or None
                user.cancel_at_period_end = bool(sub.get("cancel_at_period_end")) if hasattr(sub, 'cancel_at_period_end') else False
                session.commit()
        finally:
            session.close()
        return jsonify({"subscriptionId": sub.id, "status": sub.status})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@billing_bp.route("/billing/portal", methods=["POST"])
@requires_auth
def create_billing_portal():
    user_claims = getattr(g, 'current_user', None) or {}
    auth0_sub = user_claims.get('sub')
    email = user_claims.get('email')
    if not auth0_sub:
        return jsonify({"error": "unauthorized"}), 401
    try:
        # Ensure a Stripe customer exists (create if needed)
        customer_id = get_or_create_customer(auth0_sub, email)
        # Use the request host to determine if 'www.' is present, otherwise fall back to APP_URL env
        app_url_env = os.environ.get("APP_URL", "http://localhost:3000")
        host = request.host
        if host.startswith("www."):
            app_url = app_url_env.replace("://", "://www.")
        else:
            app_url = app_url_env.replace("://www.", "://")
        return_url = f"{app_url.rstrip('/')}/settings"
        print("return_url", return_url)
        portal = stripe.billing_portal.Session.create(customer=customer_id, return_url=return_url)
        return jsonify({"url": portal.url})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@billing_bp.route("/billing/subscription", methods=["GET"])
@requires_auth
def get_subscription_details():
    user_claims = getattr(g, 'current_user', None) or {}
    print("user_claims", user_claims);
    auth0_sub = user_claims.get('sub')

    if not auth0_sub:
        return jsonify({"error": "unauthorized"}), 401
    session = get_session()
    try:
        user = session.query(User).filter(User.auth0_user_id == auth0_sub).first()
        if not user:
            return jsonify({"error": "user not found"}), 404

        sub = None
        customer_id = user.stripe_customer_id
        expand = [
            "default_payment_method",
            "items.data.price.product",
            "latest_invoice"
        ]
        # Try by subscription id first (most reliable), even if customer_id is missing
        if user.stripe_subscription_id:
            try:
                sub = stripe.Subscription.retrieve(user.stripe_subscription_id, expand=expand)
            except Exception:
                sub = None
            # If found, make sure we have customer_id persisted
            try:
                if not customer_id and isinstance(sub, dict) and sub.get("customer"):
                    customer_id = sub.get("customer")
                    if customer_id:
                        user.stripe_customer_id = customer_id
                        session.commit()
            except Exception:
                pass
        # If still no sub, but we have a customer id, list to find the latest
        lst = None
        if not sub and customer_id:
            try:
                lst = stripe.Subscription.list(customer=customer_id, limit=1)
            except Exception:
                lst = None
            if lst and getattr(lst, 'data', []):
                try:
                    sub = stripe.Subscription.retrieve(lst.data[0].id, expand=expand)
                except Exception:
                    sub = lst.data[0]

        # Determine if this customer has or had any subscription
        has_had_subscription = False
        if sub:
            has_had_subscription = True
        elif customer_id:
            try:
                if lst is None:
                    lst = stripe.Subscription.list(customer=customer_id, limit=1)
                has_had_subscription = bool(getattr(lst, 'data', [])) or customer_has_any_subscription(customer_id)
            except Exception:
                has_had_subscription = customer_has_any_subscription(customer_id)

        if not sub:
            return jsonify({
                "subscription": None,
                "has_had_subscription": has_had_subscription,
                "eligible_for_trial": not has_had_subscription
            }), 200
        item = sub.get("items", {}).get("data", [None])[0]
        price = item.get("price") if item else None
        recurring = (price or {}).get("recurring", {})
        pm = sub.get("default_payment_method") or {}
        card = pm.get("card") or {}
        latest_invoice = sub.get("latest_invoice") or {}
        if isinstance(latest_invoice, str):
            try:
                latest_invoice = stripe.Invoice.retrieve(latest_invoice)
            except Exception:
                latest_invoice = {}
        # Some Stripe API versions omit top-level current_period_*; fall back to the item values
        current_period_start = sub.get("current_period_start") or (item.get("current_period_start") if item else None)
        current_period_end = sub.get("current_period_end") or (item.get("current_period_end") if item else None)
        response = {
            "status": sub.get("status"),
            "start_date": sub.get("start_date"),
            "trial_start": sub.get("trial_start"),
            "trial_end": sub.get("trial_end"),
            "current_period_start": current_period_start,
            "current_period_end": current_period_end,
            "cancel_at_period_end": sub.get("cancel_at_period_end"),
            "plan_price_id": (price or {}).get("id"),
            "plan_nickname": (price or {}).get("nickname"),
            "amount": (price or {}).get("unit_amount"),
            "currency": (price or {}).get("currency"),
            "interval": recurring.get("interval"),
            "payment_method_brand": card.get("brand"),
            "payment_method_last4": card.get("last4"),
            "hosted_invoice_url": latest_invoice.get("hosted_invoice_url"),
            "invoice_pdf": latest_invoice.get("invoice_pdf"),
            "has_had_subscription": has_had_subscription,
            "eligible_for_trial": not has_had_subscription,
        }
        # Persist latest subscription status to users table to avoid stale values
        try:
            session2 = get_session()
            user = session2.query(User).filter(User.auth0_user_id == auth0_sub).first()
            if user:
                if sub:
                    user.subscription_status = response.get("status")
                    user.current_period_end = response.get("current_period_end")
                    user.cancel_at_period_end = bool(response.get("cancel_at_period_end"))
                    user.plan_price_id = response.get("plan_price_id")
                    if isinstance(sub, dict) and sub.get("id"):
                        user.stripe_subscription_id = sub.get("id")
                else:
                    user.subscription_status = None
                    user.current_period_end = None
                    user.cancel_at_period_end = None
                    user.plan_price_id = None
                    user.stripe_subscription_id = None
                session2.commit()
        except Exception:
            # best-effort; do not block the response if persistence fails
            pass
        finally:
            try:
                session2.close()
            except Exception:
                pass
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()


@billing_bp.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.environ["STRIPE_WEBHOOK_SECRET"]
        )
    except Exception as e:
        return str(e), 400

    t = event["type"]
    data = event["data"]["object"]

    if t == "checkout.session.completed":
        customer_id = data.get("customer")
        sub_id = data.get("subscription")
        if customer_id and sub_id:
            session = get_session()
            try:
                user = session.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    user.stripe_subscription_id = sub_id
                    # status will be updated in the subscription.updated event
                    session.commit()
            finally:
                session.close()

    if t in ("customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"):
        sub = data
        customer_id = sub.get("customer")
        status = sub.get("status")
        current_period_end = sub.get("current_period_end")
        cancel_at_period_end = bool(sub.get("cancel_at_period_end"))
        price_id = None
        try:
            items = sub.get("items", {}).get("data", [])
            if items and items[0].get("price"):
                price_id = items[0]["price"].get("id")
        except Exception:
            price_id = None
        if customer_id:
            session = get_session()
            try:
                user = session.query(User).filter(User.stripe_customer_id == customer_id).first()
                if user:
                    user.subscription_status = status
                    user.current_period_end = current_period_end
                    user.cancel_at_period_end = cancel_at_period_end
                    if price_id:
                        user.plan_price_id = price_id
                    user.stripe_subscription_id = sub.get("id", user.stripe_subscription_id)
                    session.commit()
            finally:
                session.close()

    return "", 200