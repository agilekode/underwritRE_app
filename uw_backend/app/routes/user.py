from flask import Blueprint, request, jsonify, current_app as app, g
from flask_cors import cross_origin
from app.db import db
from app.models.user import User, UserInfo, CompanyInfo
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from app.auth import requires_auth
import traceback
from sqlalchemy.orm import Session
import os
import uuid
from datetime import timedelta
import stripe
try:
    from google.cloud import storage  # type: ignore
except Exception:
    storage = None
import base64
from urllib.parse import urlparse, unquote
import requests


user_bp = Blueprint('user', __name__)

origins = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

def get_session():
    with app.app_context():
        return Session(db.engine)


def refresh_user_subscription_from_stripe(session: Session, user: User) -> bool:
    """
    Best-effort refresh of the user's subscription fields from Stripe.
    Returns True if an update was attempted, False if skipped.
    """
    if not user or not user.stripe_customer_id:
        return False
    try:
        lst = stripe.Subscription.list(customer=user.stripe_customer_id, limit=1)
        sub = None
        if getattr(lst, 'data', []):
            try:
                sub = stripe.Subscription.retrieve(lst.data[0].id, expand=["items.data.price"])
            except Exception:
                sub = lst.data[0]
        if sub:
            item = sub.get("items", {}).get("data", [None])[0]
            price = item.get("price") if item else None
            user.stripe_subscription_id = sub.get("id", user.stripe_subscription_id)
            user.subscription_status = sub.get("status")
            user.current_period_end = sub.get("current_period_end")
            user.cancel_at_period_end = bool(sub.get("cancel_at_period_end"))
            user.plan_price_id = (price or {}).get("id")
        else:
            user.stripe_subscription_id = None
            user.subscription_status = None
            user.current_period_end = None
            user.cancel_at_period_end = None
            user.plan_price_id = None
        session.commit()
        return True
    except Exception:
        try:
            session.rollback()
        except Exception:
            pass
        return False

        
@user_bp.before_request
def before_request():
    pass
    # print(f"\n=== New Request ===")
    # print(f"Method: {request.method}")
    # print(f"Headers: {dict(request.headers)}")
    # print(f"URL: {request.url}")
    # print(f"Data: {request.get_data()}")
    # print("==================\n")

@user_bp.after_request
def after_request(response):
    # print(f"\n=== Response ===")
    # print(f"Status: {response.status}")
    # print(f"Headers: {dict(response.headers)}")
    # print("================\n")
    return response


@user_bp.route('/user_info', methods=['GET', 'PUT', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def user_info_handler():
    session = get_session()
    try:
        # Resolve current user
        email = request.headers.get('X-User-Email')
        if not email:
            return jsonify({'error': 'Email header missing'}), 400
        user = session.query(User).filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # GET: fetch current user's user_info
        if request.method == 'GET':
            info = session.query(UserInfo).filter_by(user_id=user.id).first()
            if not info:
                return jsonify({'exists': False}), 200
            return jsonify({
                'exists': True,
                'id': str(info.id),
                'user_id': str(user.id),
                'job_role': info.job_role,
                'company': info.company,
                'experience_level': info.experience_level,
                'asset_type_focus': info.asset_type_focus,
                'typical_deal_size': info.typical_deal_size,
                'geographic_focus': info.geographic_focus,
                'hear_about_us': info.hear_about_us,
                'keep_updated': info.keep_updated,
                'accepted_terms_and_conditions': info.accepted_terms_and_conditions,
                'accepted_terms_and_conditions_date': info.accepted_terms_and_conditions_date.isoformat() if info.accepted_terms_and_conditions_date else None,
                'time_created': info.time_created.isoformat() if info.time_created else None
            }), 200

        # PUT: upsert current user's user_info
        if request.method == 'PUT':
            payload = request.get_json(force=True) or {}

            info = session.query(UserInfo).filter_by(user_id=user.id).first()
            if not info:
                info = UserInfo(user_id=user.id)

            # Map fields (accept partial updates)
            info.job_role = payload.get('job_role', info.job_role)
            info.company = payload.get('company', info.company)
            info.experience_level = payload.get('experience_level', info.experience_level)
            info.asset_type_focus = payload.get('asset_type_focus', info.asset_type_focus)
            info.typical_deal_size = payload.get('typical_deal_size', info.typical_deal_size)
            info.geographic_focus = payload.get('geographic_focus', info.geographic_focus)
            info.hear_about_us = payload.get('hear_about_us', info.hear_about_us)
            keep_updated = payload.get('keep_updated', None)
            if keep_updated is not None:
                info.keep_updated = bool(keep_updated)
            atc = payload.get('accepted_terms_and_conditions', None)
            if atc is not None:
                info.accepted_terms_and_conditions = bool(atc)
            atc_date = payload.get('accepted_terms_and_conditions_date', None)
            if atc_date is not None:
                # Expect ISO string from frontend
                from datetime import datetime
                try:
                    # Support trailing 'Z' from ISO 8601
                    iso = atc_date.replace('Z', '+00:00') if isinstance(atc_date, str) else atc_date
                    info.accepted_terms_and_conditions_date = datetime.fromisoformat(iso)
                except Exception:
                    info.accepted_terms_and_conditions_date = None

            # Use the same session used for querying to avoid cross-session attachment errors
            session.add(info)
            session.commit()

            return jsonify({'message': 'ok'}), 200

        return jsonify({'error': 'Method not allowed'}), 405
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@user_bp.route('/company_logo/data_url', methods=['GET', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def company_logo_data_url():
    session = get_session()
    try:
        email = request.headers.get('X-User-Email')
        if not email:
            return jsonify({'error': 'Email header missing'}), 400
        user = session.query(User).filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        info = session.query(CompanyInfo).filter_by(user_id=user.id).first()
        if not info or not info.company_logo_url:
            return jsonify({'exists': False}), 200
        url = info.company_logo_url
        content = None
        content_type = 'image/png'
        # Try GCS client first
        ok = False
        try:
            if storage is not None and url.startswith('https://storage.googleapis.com/'):
                p = urlparse(url)
                path = unquote(p.path.lstrip('/'))
                # path is bucket/obj
                parts = path.split('/', 1)
                if len(parts) == 2:
                    bucket_name, object_name = parts
                    client = storage.Client()
                    bucket = client.bucket(bucket_name)
                    blob = bucket.blob(object_name)
                    content = blob.download_as_bytes()
                    content_type = blob.content_type or content_type
                    ok = True
        except Exception as e:
            print(f"[company_logo/data_url] GCS download failed: {e}")
            ok = False
        # Fallback: HTTP GET (signed URL works server-side)
        if not ok:
            try:
                r = requests.get(url, timeout=20)
                r.raise_for_status()
                content = r.content
                content_type = r.headers.get('Content-Type', content_type)
                ok = True
            except Exception as e:
                print(f"[company_logo/data_url] HTTP fetch failed: {e}")
                return jsonify({'error': 'Could not fetch logo'}), 500
        data_url = f"data:{content_type};base64,{base64.b64encode(content).decode('ascii')}"
        return jsonify({'exists': True, 'dataUrl': data_url}), 200
    except Exception as e:
        print("[company_logo/data_url] Exception:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

        
@user_bp.route('/company_info', methods=['GET', 'PUT', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def company_info_handler():
    session = get_session()
    try:
        # Resolve current user
        email = request.headers.get('X-User-Email')
        if not email:
            return jsonify({'error': 'Email header missing'}), 400
        user = session.query(User).filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            info = session.query(CompanyInfo).filter_by(user_id=user.id).first()
            if not info:
                return jsonify({'exists': False}), 200
            return jsonify({
                'exists': True,
                'id': str(info.id),
                'user_id': str(user.id),
                'company_name': info.company_name,
                'company_email': info.company_email,
                'company_phone_number': info.company_phone_number,
                'company_logo_url': info.company_logo_url,
                'created_at': info.created_at.isoformat() if info.created_at else None,
                'updated_at': info.updated_at.isoformat() if info.updated_at else None,
            }), 200

        if request.method == 'PUT':
            payload = request.get_json(force=True) or {}
            info = session.query(CompanyInfo).filter_by(user_id=user.id).first()
            if not info:
                info = CompanyInfo(user_id=user.id)

            # Accept partial updates
            if 'company_name' in payload:
                info.company_name = payload.get('company_name')
            if 'company_email' in payload:
                info.company_email = payload.get('company_email')
            if 'company_phone_number' in payload:
                info.company_phone_number = payload.get('company_phone_number')
            if 'company_logo_url' in payload:
                info.company_logo_url = payload.get('company_logo_url')

            session.add(info)
            session.commit()
            return jsonify({'message': 'ok', 'id': str(info.id)}), 200

        return jsonify({'error': 'Method not allowed'}), 405
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@user_bp.route('/company_logo/upload', methods=['POST', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def upload_company_logo():
    """
    Upload company logo image to GCS bucket and update CompanyInfo.company_logo_url.
    Env required:
      - GCS_LOGO_BUCKET_NAME (e.g. underwritre_image_uploads)
      - GCS_LOGO_FOLDER (optional, default: 'logos')
      - GOOGLE_APPLICATION_CREDENTIALS or workload identity for GCS
      - GCS_LOGO_MAKE_PUBLIC (optional: 'true' to make public and use public_url)
    """
    if storage is None:
        print("[company_logo/upload] google-cloud-storage not installed")
        return jsonify({'error': 'google-cloud-storage not installed on server'}), 500

    session = get_session()
    try:
        # Resolve current user
        email = request.headers.get('X-User-Email')
        if not email:
            print("[company_logo/upload] Missing X-User-Email header")
            return jsonify({'error': 'Email header missing'}), 400
        user = session.query(User).filter_by(email=email).first()
        if not user:
            print(f"[company_logo/upload] User not found for email={email}")
            return jsonify({'error': 'User not found'}), 404

        if 'file' not in request.files:
            print("[company_logo/upload] No file part in request")
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if not file or file.filename == '':
            print("[company_logo/upload] Empty filename")
            return jsonify({'error': 'Empty file'}), 400

        bucket_name = os.getenv('GCS_LOGO_BUCKET_NAME', 'underwritre_image_uploads')
        folder = os.getenv('GCS_LOGO_FOLDER', 'logos')
        make_public = os.getenv('GCS_LOGO_MAKE_PUBLIC', 'false').lower() == 'true'
        gac = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        print(f"[company_logo/upload] Start upload: email={email} user_id={user.id} "
              f"bucket={bucket_name} folder={folder} make_public={make_public} "
              f"filename={file.filename} mimetype={file.mimetype} "
              f"GOOGLE_APPLICATION_CREDENTIALS_set={bool(gac)}")
        if gac and not os.path.exists(gac):
            print(f"[company_logo/upload] WARNING: GOOGLE_APPLICATION_CREDENTIALS path does not exist: {gac}")

        try:
            client = storage.Client()
        except Exception as e:
            print(f"[company_logo/upload] storage.Client() failed: {e}")
            raise
        try:
            bucket = client.bucket(bucket_name)
        except Exception as e:
            print(f"[company_logo/upload] Could not get bucket {bucket_name}: {e}")
            raise
        # Build object path logos/<user_id>/<uuid>.<ext>
        _, ext = os.path.splitext(file.filename)
        ext = ext or ''
        object_name = f"{folder}/{user.id}/{uuid.uuid4()}{ext}"
        blob = bucket.blob(object_name)
        blob.cache_control = "public, max-age=31536000"
        content_type = file.mimetype or 'application/octet-stream'
        try:
            blob.upload_from_file(file.stream, content_type=content_type)
            print(f"[company_logo/upload] Uploaded to gs://{bucket_name}/{object_name}")
        except Exception as e:
            print(f"[company_logo/upload] upload_from_file failed: {e}")
            raise

        public_url = None
        signed_url = None
        if make_public:
            try:
                blob.make_public()
                public_url = blob.public_url
                print(f"[company_logo/upload] Made public URL: {public_url}")
            except Exception:
                print("[company_logo/upload] make_public failed", traceback.format_exc())
                public_url = None
        if not public_url:
            try:
                signed_url = blob.generate_signed_url(expiration=timedelta(days=3650), method='GET')
                print(f"[company_logo/upload] Generated signed URL")
            except Exception:
                print("[company_logo/upload] generate_signed_url failed", traceback.format_exc())
                signed_url = None

        final_url = public_url or signed_url
        if not final_url:
            print("[company_logo/upload] No final URL generated")
            return jsonify({'error': 'Could not generate URL for uploaded file'}), 500

        # Upsert CompanyInfo and save URL
        try:
            info = session.query(CompanyInfo).filter_by(user_id=user.id).first()
        except Exception as e:
            print(f"[company_logo/upload] DB query CompanyInfo failed: {e}")
            raise
        if not info:
            info = CompanyInfo(user_id=user.id)
        info.company_logo_url = str(final_url)
        try:
            session.add(info)
            session.commit()
        except Exception as e:
            print(f"[company_logo/upload] DB commit failed: {e}")
            raise

        return jsonify({
            'message': 'uploaded',
            'url': final_url,
            'object_name': object_name
        }), 200
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        print("[company_logo/upload] Exception:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


        
@user_bp.route('/check_user', methods=['GET', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def check_user():
    session = get_session()
    try:
        email = request.headers.get('X-User-Email')
        if not email:
            return jsonify({'error': 'Email header missing'}), 400
        
        # Try to find by email OR auth0_user_id to avoid duplicates
        print("g.current_user", g.current_user);
        auth0_user_id = g.current_user.get("sub") if hasattr(g, 'current_user') else None
        user = None
        if auth0_user_id:
            user = session.query(User).filter(or_(User.email == email, User.auth0_user_id == auth0_user_id)).first()
        else:
            user = session.query(User).filter_by(email=email).first()
        # print("CHECKING USER", user)
        # print("AUTH0 USER ID", g.current_user)
        if user is None:
            auth0_user_id = auth0_user_id or g.current_user.get("sub")
            # print("AUTH0 USER ID", auth0_user_id)
            if not auth0_user_id:
                raise ValueError("auth0_user_id is required and missing from token")
            user = User(email=email, auth0_user_id=auth0_user_id, is_active=True)
            try:
                session.add(user)
                session.commit()
                return jsonify({'message': 'User created', 
                                'id': str(user.id),
                                'email': user.email,
                                'is_active': user.is_active,
                                'stripe_customer_id': user.stripe_customer_id,
                                'stripe_subscription_id': user.stripe_subscription_id,
                                'subscription_status': user.subscription_status,
                                'current_period_end': user.current_period_end,
                                'cancel_at_period_end': user.cancel_at_period_end,
                                'plan_price_id': user.plan_price_id}), 201
            except IntegrityError:
                # Another concurrent request created the user; fetch and return existing
                session.rollback()
                user = session.query(User).filter(or_(User.email == email, User.auth0_user_id == auth0_user_id)).first()
                if not user:
                    raise
                # Refresh from Stripe if we already have a customer
                try:
                    refresh_user_subscription_from_stripe(session, user)
                except Exception:
                    pass
                return jsonify({
                    'message': 'User exists',
                    'id': str(user.id),
                    'email': user.email,
                    'is_active': user.is_active,
                    'stripe_customer_id': user.stripe_customer_id,
                    'stripe_subscription_id': user.stripe_subscription_id,
                    'subscription_status': user.subscription_status,
                    'current_period_end': user.current_period_end,
                    'cancel_at_period_end': user.cancel_at_period_end,
                    'plan_price_id': user.plan_price_id
                }), 200
        # Refresh from Stripe on login if we have a customer id
        try:
            refresh_user_subscription_from_stripe(session, user)
        except Exception:
            pass
        return jsonify({
            'message': 'User exists',
            'id': str(user.id),
            'email': user.email,
            'is_active': user.is_active,
            'stripe_customer_id': user.stripe_customer_id,
            'stripe_subscription_id': user.stripe_subscription_id,
            'subscription_status': user.subscription_status,
            'current_period_end': user.current_period_end,
            'cancel_at_period_end': user.cancel_at_period_end,
            'plan_price_id': user.plan_price_id
        }), 200
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()