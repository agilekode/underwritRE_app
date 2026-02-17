from flask import Blueprint, request, jsonify, current_app as app, send_file
from flask_cors import cross_origin
from app.db import db
from app.models.model import (
    ModelType, ModelTypeSection, ModelTypeSectionField,
    UserModel, UserModelVersion, UserModelFieldValue,
    Unit, MarketRentAssumption, GrowthRates, AmenityIncome, OperatingExpenses, 
    RetailIncome, Expenses, Issue, ModelNote, ModelPicture, ModelTag
)
from app.auth import requires_auth
from sqlalchemy.orm import Session
import uuid
from app.models.user import User
import gspread
from google.oauth2.service_account import Credentials
from google.auth import default
import re
import logging
from app.services.google_drive_service import generate_google_sheet_for_user_model, update_google_sheet_and_get_values, update_google_sheet_and_get_values_final, update_google_sheet_and_get_values_intermediate, update_google_sheet_field_values_and_get_values, update_user_model_expense_table, generate_sensitivity_analysis_tables, extract_variables_from_sheet_batch
from app.services.google_drive_service import export_google_sheet, gs_client
from datetime import datetime
import os
from google.auth import default
import traceback
from flask import g
try:
    from google.cloud import storage  # type: ignore
except Exception:
    storage = None
from sqlalchemy import text
from sqlalchemy.sql import func
import base64
import requests
# Configure logging
logging.basicConfig(level=logging.DEBUG)

SERVICE_ACCOUNT_FILE = os.getenv("SERVICE_ACCOUNT_FILE")

model_bp = Blueprint('model', __name__)

origins = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")

def get_session():
    with app.app_context():
        return Session(db.engine)

# Model Type CRUD
@model_bp.route('/model_types', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_model_types():
    session = get_session()
    try:
        model_types = session.query(ModelType).all()
        return jsonify([{
            'id': str(mt.id),
            'name': mt.name,
            'is_active': mt.is_active,
            'show_retail': mt.show_retail,
            'show_rental_units': mt.show_rental_units,
            'description': mt.description,
            'created_at': mt.created_at.isoformat() if mt.created_at else None,
            'updated_at': mt.updated_at.isoformat() if mt.updated_at else None,
            'google_sheet_url': mt.google_sheet_url
        } for mt in model_types]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_types/<uuid:model_type_id>', methods=['PUT', 'PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_type(model_type_id):
    session = get_session()
    try:
        
        model_type = session.query(ModelType).get(model_type_id)
        if model_type is None:
            return jsonify({'error': 'Model type not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            model_type.name = data['name']
        if 'description' in data:
            model_type.description = data['description']
        if 'is_active' in data:
            model_type.is_active = data['is_active']
        if 'show_retail' in data:
            model_type.show_retail = data['show_retail']
        if 'show_rental_units' in data:
            model_type.show_rental_units = data['show_rental_units']
            
        session.commit()
        return jsonify({
            'id': str(model_type.id),
            'name': model_type.name,
            'description': model_type.description,
            'is_active': model_type.is_active,
            'show_retail': model_type.show_retail,
            'show_rental_units': model_type.show_rental_units
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_types/<uuid:model_type_id>', methods=['DELETE'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def delete_model_type(model_type_id):
    session = get_session()
    try:
        
        model_type = session.query(ModelType).get(model_type_id)
        if model_type is None:
            return jsonify({'error': 'Model type not found'}), 404
        model_type.is_active = False
        session.commit()
        return jsonify({'message': 'Model type deactivated successfully'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_types/<uuid:model_type_id>', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_model_type(model_type_id):
    session = get_session()
    try:
        logging.debug(f"Fetching model type with ID: {model_type_id}")
        
        model_type = session.query(ModelType).get(model_type_id)
        if model_type is None:
            logging.warning(f"Model type not found for ID: {model_type_id}")
            return jsonify({'error': 'Model type not found'}), 404
        sections = session.query(ModelTypeSection).filter_by(model_type_id=model_type.id).all()
        sections_data = []
        for section in sections:
            fields = session.query(ModelTypeSectionField).filter_by(section_id=section.id).all()
            fields_data = [{
                'id': str(field.id),
                'description': field.description,
                'field_title': field.field_title,
                'field_key': field.field_key,
                'field_type': field.field_type,
                'default_value': field.default_value,
                'required': field.required,
                'time_phased': field.time_phased,
                'order': field.order,
                'active': field.active
            } for field in fields]
            sections_data.append({
                'id': str(section.id),
                'name': section.name,
                'order': section.order,
                'fields': fields_data,
                'active': section.active
            })
        return jsonify({
            'id': str(model_type.id),
            'name': model_type.name,
            'description': model_type.description,
            'created_at': model_type.created_at.isoformat() if model_type.created_at else None,
            'updated_at': model_type.updated_at.isoformat() if model_type.updated_at else None,
            'is_active': model_type.is_active,
            'google_sheet_url': model_type.google_sheet_url,
            'show_retail': model_type.show_retail,
            'show_rental_units': model_type.show_rental_units,
            'sections': sections_data
        }), 200
    except Exception as e:
        logging.error(f"Error fetching model type: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_types/full', methods=['POST', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_full_model_type():
    """
    Create a new model type with sections and fields.
    Required fields in request body:
    - name: string
    - sections: array of section objects (each with name and fields)
    
    Optional fields:
    - description: string
    - google_sheet_url: string (can be added later via update endpoint)
    """
    session = get_session()
    data = request.get_json()
    print(data)
    try:
        
        # Create the model type (google_sheet_url is optional)
        model_type = ModelType(
            name=data['name'],
            description=data.get('description'),
            is_active=False,
            show_retail=data.get('show_retail', True),
            show_rental_units=data.get('show_rental_units', True),
            google_sheet_url=data.get('google_sheet_url')  # Optional, can be added later
        )
        session.add(model_type)
        session.flush()  # get model_type.id
        print(f"Created ModelType: {model_type}")

        # If google_sheet_url is provided, validate it
        if data.get('google_sheet_url'):
            try:
                # Extract spreadsheet ID from URL
                match = re.search(r'/d/([a-zA-Z0-9-_]+)', data['google_sheet_url'])
                if not match:
                    raise ValueError('Invalid Google Sheet URL')

                spreadsheet_id = match.group(1)

                # Load credentials and authorize
                scopes = [
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive"
                ]
                creds, _ = default(scopes=scopes)
                client = gspread.authorize(creds)

                # Open the spreadsheet
                spreadsheet = client.open_by_key(spreadsheet_id)
                
                # Check if required sheets exist
                required_sheets = ['Model Variable Mapping', 'Variable Mapping', 'Table Mapping']
                existing_sheets = [ws.title for ws in spreadsheet.worksheets()]
                
                missing_sheets = [sheet for sheet in required_sheets if sheet not in existing_sheets]
                if missing_sheets:
                    raise ValueError(f'Missing required sheets: {", ".join(missing_sheets)}')

            except Exception as e:
                session.rollback()
                return jsonify({'error': f'Error validating Google Sheet: {str(e)}'}), 400

        # Create sections
        sections = []
        for section_data in data.get('sections', []):
            section = ModelTypeSection(
                model_type_id=model_type.id,
                name=section_data['name'],
                order=section_data.get('order', 0)
            )
            session.add(section)
            session.flush()  # get section.id
            print(f"Created Section: {section}")
            sections.append(section)

            # Create fields for this section
            for field_data in section_data.get('fields', []):
                field = ModelTypeSectionField(
                    section_id=section.id,
                    description=field_data.get('description'),
                    field_title=field_data.get('field_title'),
                    field_key=field_data.get('field_key'),
                    field_type=field_data.get('field_type'),
                    default_value=field_data.get('default_value'),
                    required=field_data.get('required', False),
                    time_phased=field_data.get('time_phased', False),
                    order=field_data.get('order', 0)
                )
                session.add(field)
                print(f"Created Field: {field}")
        session.commit()
        return jsonify({'message': 'Model type created successfully', 'id': str(model_type.id)}), 201
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/user_models', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_user_model():
    session = get_session()
    try:
        print("🚀 Starting user model creation...")
        data = request.get_json()

        print(data.get('user_model_field_values'))
        # Validate UUIDs
        # Filter out badly formed field_values (missing or invalid field_id)
        valid_field_values = []
        for field_value in data.get('user_model_field_values', []):
            try:
                uuid.UUID(field_value['field_id'])
                valid_field_values.append(field_value)
            except Exception:
                print(f"⚠️ Skipping badly formed field_value: {field_value}")
        data['user_model_field_values'] = valid_field_values
        print("✅ Field UUIDs validated.")

        # Create user model
        user_model = UserModel(
            user_id=data['user_id'],
            model_type_id=data['model_type_id'],
            name=data['name'],
            street_address=data.get('street_address'),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code')
        )
        session.add(user_model)
        session.flush()
        print(f"✅ Created UserModel with ID: {user_model.id}")

        # Create version 1
        user_model_version = UserModelVersion(
            user_model_id=user_model.id,
            version_number=1,
            google_sheet_url=data.get('google_sheet_url')  # Use the provided sheet URL
        )
        session.add(user_model_version)
        session.flush()
        print(f"✅ Created UserModelVersion with ID: {user_model_version.id}")

        # Add units
        for unit in data.get('units', []):
            new_unit = Unit(
                user_model_version_id=user_model_version.id,
                rent_type=unit['rent_type'],
                vacate_flag=unit['vacate_flag'],
                layout=unit['layout'],
                square_feet=unit['square_feet'],
                vacate_month=unit['vacate_month'],
                current_rent=unit['current_rent']
            )
            session.add(new_unit)

        # Add market rent assumptions
        for assumption in data.get('market_rent_assumptions', []):
            new_assumption = MarketRentAssumption(
                user_model_version_id=user_model_version.id,
                layout=assumption['layout'],
                pf_rent=assumption['pf_rent']
            )
            session.add(new_assumption)

        # Add growth rates
        for rate in data.get('growth_rates', []):
            new_rate = GrowthRates(
                user_model_version_id=user_model_version.id,
                name=rate['name'],
                value=rate['value'],
                type=rate['type']
            )
            session.add(new_rate)

        # Add amenity income
        for amenity in data.get('amenity_income', []):
            new_amenity = AmenityIncome(
                user_model_version_id=user_model_version.id,
                name=amenity['name'],
                start_month=amenity['start_month'],
                utilization=amenity['utilization'],
                unit_count=amenity['unit_count'],
                monthly_fee=amenity['monthly_fee']
            )
            session.add(new_amenity)

        # Add operating expenses
        for expense in data.get('operating_expenses', []):
            new_expense = OperatingExpenses(
                user_model_version_id=user_model_version.id,
                name=expense['name'],
                factor=expense['factor'],
                broker=expense['broker'],
                cost_per=expense['cost_per']
            )
            session.add(new_expense)
        
        for expense in data.get('expenses', []):
            new_expense = Expenses(
                user_model_version_id=user_model_version.id,
                name=expense['name'],
                factor=expense['factor'],
                cost_per=expense['cost_per'],
                statistic=expense['statistic'],
                start_month=expense['start_month'],
                end_month=expense['end_month'],
                type=expense['type'],
                rent_type_included=expense.get('rent_type_included')
            )   
            session.add(new_expense)


        # Add retail income
        for income in data.get('retail_income', []):
            new_income = RetailIncome(
                user_model_version_id=user_model_version.id,
                suite=income['suite'],
                tenant_name=income['tenant_name'],
                square_feet=income['square_feet'],
                rent_start_month=income['rent_start_month'],
                annual_bumps=income['annual_bumps'],
                rent_per_square_foot_per_year=income['rent_per_square_foot_per_year'],
                rent_type=income.get('rent_type'),
                lease_start_month=income['lease_start_month'],
                lease_end_month=income.get('lease_end_month'),
                recovery_start_month=income['recovery_start_month']
            )
            session.add(new_income)

        # Get all section fields and build lookup by field_id
        section_fields = session.query(ModelTypeSectionField).join(
            ModelTypeSection, ModelTypeSection.id == ModelTypeSectionField.section_id
        ).filter(ModelTypeSection.model_type_id == user_model.model_type_id).add_columns(
            ModelTypeSection.name.label("section_name")
        ).all()

        field_title_lookup = {str(f[0].id): f[0].field_title for f in section_fields}
        field_key_lookup = {str(f[0].id): f[0].field_key for f in section_fields}
        field_type_lookup = {str(f[0].id): f[0].field_type for f in section_fields}
        section_lookup = {str(f[0].id): f[1] for f in section_fields}

        # Add field values
        field_values = []
        for field_value in data.get('user_model_field_values', []):
            field_id = field_value['field_id']
            fv = UserModelFieldValue(
                user_model_version_id=user_model_version.id,
                field_id=field_id,
                value=field_value['value'],
                start_month=field_value.get('start_month',''),
                end_month=field_value.get('end_month','')
            )
            session.add(fv)

            field_values.append({
                "field_id": field_id,
                "field_title": field_title_lookup.get(field_id),
                "field_key": field_key_lookup.get(field_id),
                "field_type": field_type_lookup.get(field_id),
                "section": section_lookup.get(field_id),
                "value": field_value['value'],
                "start_month": field_value.get('start_month'),
                "end_month": field_value.get('end_month')
            })
        
        print(f"✅ Added {len(field_values)} field values.")

        # Resolve relationships
        user_model.user = session.query(User).get(user_model.user_id)
        user_model.model_type = session.query(ModelType).get(user_model.model_type_id)
        print(f"🔄 Linked user and model_type to user_model.")

        # Call Google Sheet generation service
        print("🧾 Generating Google Sheet for user model...")
        print(field_values)

        # Extract the Google Sheet ID from the provided URL
        google_sheet_url = data.get('google_sheet_url')
        if not google_sheet_url or '/d/' not in google_sheet_url:
            raise Exception("Invalid or missing Google Sheet URL")
        sheet_id = google_sheet_url.split('/d/')[1].split('/')[0]

        # Generate outputs from Google Sheet
        result = update_google_sheet_and_get_values_final(
            copied_sheet_id=sheet_id,
            copied_sheet_url=google_sheet_url,
            mapped_values=field_values,
            market_json=data.get('market_rent_assumptions'),
            rental_assumptions_json=data.get('units'),
            rental_growth_json=data.get('growth_rates'),
            amenity_income_json=data.get('amenity_income'),
            expenses_json=data.get('operating_expenses'),
            retail_income_json=data.get('retail_income')
        )

        # Save outputs to DB
        user_model_version.levered_irr = result['levered_irr']
        user_model_version.levered_moic = result['levered_moic']
        user_model_version.table_mapping_output = result['tables']
        user_model_version.variables = result['variables']
        print("📦 Saved sheet URL, variables, and tables to UserModelVersion.")
        session.commit()
        print("💾 Transaction committed successfully.")

        return jsonify({"id": str(user_model.id)}), 201

    except Exception as e:
        session.rollback()
        print(f"❌ Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



@model_bp.route('/user_models/<uuid:user_model_id>/pictures/upload', methods=['POST', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def upload_model_picture(user_model_id):
    """
    Upload a model picture to GCS and persist a ModelPicture row.
    Uses:
      - GCS_LOGO_BUCKET_NAME (bucket name)
      - GCS_PROPERTY_IMAGES_FOLDER (folder/prefix, default 'property_images')
      - GCS_LOGO_MAKE_PUBLIC (optional 'true' to make object public; else signed URL)
    """
    if storage is None:
        return jsonify({'error': 'google-cloud-storage not installed on server'}), 500
    session = get_session()
    try:
        # Auth/ownership
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model or str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({'error': 'Empty file'}), 400

        description = request.form.get('description') or ''

        bucket_name = os.getenv('GCS_LOGO_BUCKET_NAME', 'underwritre_image_uploads')
        folder = os.getenv('GCS_PROPERTY_IMAGES_FOLDER', 'property_images')
        make_public = os.getenv('GCS_LOGO_MAKE_PUBLIC', 'false').lower() == 'true'
        gac = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

        client = storage.Client()
        bucket = client.bucket(bucket_name)
        _, ext = os.path.splitext(file.filename)
        ext = ext or ''
        object_name = f"{folder}/{user_model_id}/{uuid.uuid4()}{ext}"
        blob = bucket.blob(object_name)
        blob.cache_control = "public, max-age=31536000"
        content_type = file.mimetype or 'application/octet-stream'
        blob.upload_from_file(file.stream, content_type=content_type)

        public_url = None
        signed_url = None
        if make_public:
            try:
                blob.make_public()
                public_url = blob.public_url
            except Exception:
                public_url = None
        if not public_url:
            try:
                from datetime import timedelta
                signed_url = blob.generate_signed_url(expiration=timedelta(days=3650), method='GET')
            except Exception:
                signed_url = None

        final_url = public_url or signed_url
        if not final_url:
            return jsonify({'error': 'Could not generate URL for uploaded file'}), 500

        # Determine next highest picture_order so new images appear last
        try:
            max_order = session.query(func.max(ModelPicture.picture_order)).filter(
                ModelPicture.user_model_id == user_model.id,
                ModelPicture.status == 'active'
            ).scalar()
            next_order = (int(max_order) + 1) if max_order is not None else 0
        except Exception:
            next_order = 0

        pic = ModelPicture(
            user_model_id=user_model.id,
            picture_url=str(final_url),
            description=str(description),
            picture_order=next_order,
            status='active'
        )
        session.add(pic)
        session.commit()
        return jsonify({
            'id': str(pic.id),
            'user_model_id': str(pic.user_model_id),
            'picture_url': pic.picture_url,
            'description': pic.description,
            'picture_order': pic.picture_order,
            'status': pic.status
        }), 201
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/user_models/<uuid:user_model_id>/pictures', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def list_model_pictures(user_model_id):
    session = get_session()
    try:
        # Auth/ownership
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model or str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        rows = session.query(ModelPicture).filter_by(user_model_id=user_model.id).filter(ModelPicture.status == 'active').order_by(ModelPicture.picture_order.asc().nulls_last(), ModelPicture.created_at.desc()).all()
        data = [{
            'id': str(p.id),
            'user_model_id': str(p.user_model_id),
            'picture_url': p.picture_url,
            'description': p.description,
            'picture_order': p.picture_order,
            'status': p.status,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'updated_at': p.updated_at.isoformat() if p.updated_at else None
        } for p in rows]
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/pictures/<uuid:picture_id>', methods=['PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_picture(picture_id):
    session = get_session()
    try:
        payload = request.get_json(silent=True) or {}
        pic = session.query(ModelPicture).get(picture_id)
        if not pic:
            return jsonify({'error': 'Picture not found'}), 404
        # Ownership
        user_model = session.query(UserModel).get(pic.user_model_id)
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj or not user_model or str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        only_order = 'picture_order' in payload and not any(k in payload for k in ('description','status'))
        if only_order:
            # Update only order without touching updated_at
            try:
                new_order = int(payload.get('picture_order')) if payload.get('picture_order') is not None else None
            except Exception:
                new_order = None
            if new_order is not None:
                session.execute(
                    text("UPDATE model_pictures SET picture_order = :po WHERE id = :pid"),
                    {"po": new_order, "pid": str(picture_id)}
                )
                session.commit()
                return jsonify({'id': str(pic.id), 'picture_order': new_order}), 200

        if 'description' in payload:
            pic.description = str(payload.get('description') or '')
        if 'picture_order' in payload:
            try:
                pic.picture_order = int(payload.get('picture_order')) if payload.get('picture_order') is not None else None
            except Exception:
                pic.picture_order = None
        if 'status' in payload:
            pic.status = str(payload.get('status') or pic.status)
        session.commit()
        return jsonify({'id': str(pic.id)}), 200
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/pictures/<uuid:picture_id>/remove', methods=['PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def remove_model_picture(picture_id):
    session = get_session()
    try:
        pic = session.query(ModelPicture).get(picture_id)
        if not pic:
            return jsonify({'error': 'Picture not found'}), 404
        # Ownership
        user_model = session.query(UserModel).get(pic.user_model_id)
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj or not user_model or str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        pic.status = 'removed'
        session.commit()
        return jsonify({'id': str(pic.id), 'status': pic.status}), 200
    except Exception as e:
        try:
            session.rollback()
        except Exception:
            pass
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/user_models/<uuid:user_model_id>/pictures/data_urls', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_model_pictures_data_urls(user_model_id):
    session = get_session()
    try:
        # Auth/ownership
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model or str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        rows = session.query(ModelPicture).filter_by(user_model_id=user_model.id).filter(ModelPicture.status == 'active').order_by(
            ModelPicture.picture_order.asc().nulls_last(),
            ModelPicture.created_at.desc()
        ).all()

        out = []
        for p in rows:
            url = p.picture_url
            data_url = None
            try:
                resp = requests.get(url, timeout=10)
                if resp.ok:
                    content = resp.content
                    ctype = resp.headers.get('Content-Type') or 'image/jpeg'
                    b64 = base64.b64encode(content).decode('utf-8')
                    data_url = f"data:{ctype};base64,{b64}"
            except Exception:
                data_url = None
            out.append({
                'id': str(p.id),
                'description': p.description,
                'picture_url': data_url or url
            })
        return jsonify(out), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/user_models_new_version', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_user_model_new_version():
    session = get_session()
    try:
        print("🚀 Starting new version creation for existing user model...")
        data = request.get_json()
        print("data", data)
        user_model_id = data.get('id')
        if not user_model_id:
            raise Exception("Missing id in request data")

        # Fetch the existing user model
        user_model = session.query(UserModel).filter_by(id=user_model_id).first()
        if not user_model:
            raise Exception(f"UserModel with id {user_model_id} not found")

        print(f"Found UserModel with ID: {user_model.id}")

        # Update core model fields (editable in Edit Model) only if changed
        def set_if_changed(obj, attr, new_value):
            if new_value is None:
                return False
            current = getattr(obj, attr)
            if current != new_value:
                setattr(obj, attr, new_value)
                return True
            return False

        set_if_changed(user_model, 'name', data.get('name'))
        set_if_changed(user_model, 'street_address', data.get('street_address'))
        set_if_changed(user_model, 'city', data.get('city'))
        set_if_changed(user_model, 'state', data.get('state'))
        set_if_changed(user_model, 'zip_code', data.get('zip_code'))

        # Validate UUIDs for field values
        valid_field_values = []
        for field_value in data.get('user_model_field_values', []):
            try:
                uuid.UUID(field_value['field_id'])
                valid_field_values.append(field_value)
            except Exception:
                print(f"⚠️ Skipping badly formed field_value: {field_value}")
        data['user_model_field_values'] = valid_field_values
        print("✅ Field UUIDs validated.")

        # Determine the next version number
        max_version = session.query(UserModelVersion).filter_by(user_model_id=user_model.id).order_by(UserModelVersion.version_number.desc()).first()
        if max_version:
            next_version_number = max_version.version_number + 1
        else:
            next_version_number = 1  # Should not happen, but fallback

        print(f"Next version number for UserModel {user_model.id}: {next_version_number}")

        # Create new version
        user_model_version = UserModelVersion(
            user_model_id=user_model.id,
            version_number=next_version_number,
            google_sheet_url=data.get('google_sheet_url')  # Use the provided sheet URL
        )
        session.add(user_model_version)
        session.flush()
        print(f"✅ Created UserModelVersion with ID: {user_model_version.id}")

        # Add units
        for unit in data.get('units', []):
            new_unit = Unit(
                user_model_version_id=user_model_version.id,
                rent_type=unit['rent_type'],
                vacate_flag=unit['vacate_flag'],
                layout=unit['layout'],
                square_feet=unit['square_feet'],
                vacate_month=unit['vacate_month'],
                current_rent=unit['current_rent']
            )
            session.add(new_unit)

        # Add market rent assumptions
        for assumption in data.get('market_rent_assumptions', []):
            new_assumption = MarketRentAssumption(
                user_model_version_id=user_model_version.id,
                layout=assumption['layout'],
                pf_rent=assumption['pf_rent']
            )
            session.add(new_assumption)

        # Add growth rates
        for rate in data.get('growth_rates', []):
            new_rate = GrowthRates(
                user_model_version_id=user_model_version.id,
                name=rate['name'],
                value=rate['value'],
                type=rate['type']
            )
            session.add(new_rate)

        # Add amenity income
        for amenity in data.get('amenity_income', []):
            new_amenity = AmenityIncome(
                user_model_version_id=user_model_version.id,
                name=amenity['name'],
                start_month=amenity['start_month'],
                utilization=amenity['utilization'],
                unit_count=amenity['unit_count'],
                monthly_fee=amenity['monthly_fee']
            )
            session.add(new_amenity)

        # Add operating expenses
        for expense in data.get('operating_expenses', []):
            new_expense = OperatingExpenses(
                user_model_version_id=user_model_version.id,
                name=expense['name'],
                factor=expense['factor'],
                broker=expense['broker'],
                cost_per=expense['cost_per']
            )
            session.add(new_expense)
        
        for expense in data.get('expenses', []):
            new_expense = Expenses(
                user_model_version_id=user_model_version.id,
                name=expense['name'],
                factor=expense['factor'],
                cost_per=expense['cost_per'],
                statistic=expense['statistic'],
                start_month=expense['start_month'],
                end_month=expense['end_month'],
                type=expense['type'],
                rent_type_included=expense.get('rent_type_included')
            )   
            session.add(new_expense)

        # Add retail income
        for income in data.get('retail_income', []):
            new_income = RetailIncome(
                user_model_version_id=user_model_version.id,
                suite=income['suite'],
                tenant_name=income['tenant_name'],
                square_feet=income['square_feet'],
                rent_start_month=income['rent_start_month'],
                annual_bumps=income['annual_bumps'],
                rent_per_square_foot_per_year=income['rent_per_square_foot_per_year'],
                rent_type=income.get('rent_type'),
                lease_start_month=income['lease_start_month'],
                lease_end_month=income.get('lease_end_month'),
                recovery_start_month=income['recovery_start_month']
            )
            session.add(new_income)

        # Get all section fields and build lookup by field_id
        section_fields = session.query(ModelTypeSectionField).join(
            ModelTypeSection, ModelTypeSection.id == ModelTypeSectionField.section_id
        ).filter(ModelTypeSection.model_type_id == user_model.model_type_id).add_columns(
            ModelTypeSection.name.label("section_name")
        ).all()

        field_title_lookup = {str(f[0].id): f[0].field_title for f in section_fields}
        field_key_lookup = {str(f[0].id): f[0].field_key for f in section_fields}
        field_type_lookup = {str(f[0].id): f[0].field_type for f in section_fields}
        section_lookup = {str(f[0].id): f[1] for f in section_fields}

        # Add field values
        field_values = []
        for field_value in data.get('user_model_field_values', []):
            field_id = field_value['field_id']
            fv = UserModelFieldValue(
                user_model_version_id=user_model_version.id,
                field_id=field_id,
                value=field_value['value'],
                start_month=field_value.get('start_month',''),
                end_month=field_value.get('end_month','')
            )
            session.add(fv)

            field_values.append({
                "field_id": field_id,
                "field_title": field_title_lookup.get(field_id),
                "field_key": field_key_lookup.get(field_id),
                "field_type": field_type_lookup.get(field_id),
                "section": section_lookup.get(field_id),
                "value": field_value['value'],
                "start_month": field_value.get('start_month'),
                "end_month": field_value.get('end_month')
            })
        
        print(f"✅ Added {len(field_values)} field values.")

        # Resolve relationships
        user_model.user = session.query(User).get(user_model.user_id)
        user_model.model_type = session.query(ModelType).get(user_model.model_type_id)
        print(f"🔄 Linked user and model_type to user_model.")

        # Call Google Sheet generation service
        print("🧾 Generating Google Sheet for user model version...")
        print(field_values)

        # Extract the Google Sheet ID from the provided URL
        google_sheet_url = data.get('google_sheet_url')
        if not google_sheet_url or '/d/' not in google_sheet_url:
            raise Exception("Invalid or missing Google Sheet URL")
        sheet_id = google_sheet_url.split('/d/')[1].split('/')[0]

        result = update_google_sheet_and_get_values_final(
            copied_sheet_id=sheet_id,
            copied_sheet_url=google_sheet_url,
            mapped_values=field_values,
            market_json=data.get('market_rent_assumptions'),
            rental_assumptions_json=data.get('units'),
            rental_growth_json=data.get('growth_rates'),
            amenity_income_json=data.get('amenity_income'),
            expenses_json=data.get('operating_expenses'),
            retail_income_json=data.get('retail_income')
        )

        # Save outputs to DB
        user_model_version.levered_irr = result['levered_irr']
        user_model_version.levered_moic = result['levered_moic']
        user_model_version.table_mapping_output = result['tables']
        user_model_version.variables = result['variables']
        print("📦 Saved sheet URL, variables, and tables to UserModelVersion.")

        session.commit()
        print("💾 Transaction committed successfully.")

        return jsonify({
            "id": str(user_model.id),
            "version_id": str(user_model_version.id),
            "version_number": user_model_version.version_number
        }), 201

    except Exception as e:
        session.rollback()
        print(f"❌ Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



@model_bp.route('/user_models_single_field_updates', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def user_models_single_field_update():
    try:
        data = request.get_json()
        print("data", data)
        google_sheet_url = data.get('google_sheet_url')
        if not google_sheet_url or '/d/' not in google_sheet_url:
            raise Exception("Invalid or missing Google Sheet URL")
        sheet_id = google_sheet_url.split('/d/')[1].split('/')[0]

        result = update_google_sheet_field_values_and_get_values(
            copied_sheet_id=sheet_id,
            mapped_values=data.get('updates'),
            model_mapping=data.get('model_mapping'),
            variable_mapping=data.get('variable_mapping')
        )



        print("result", result)
        print(f"🔄 Linked user and model_type to user_model.")

        return jsonify({"result": result}), 201

    except Exception as e:
        
        print(f"❌ Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500



@model_bp.route('/user_models_intermediate', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_user_model_intermediate():
    session = get_session()
    try:
        print("🚀 Starting user model creation...")
        data = request.get_json()

        print("data", data)

        address = data.get('street_address', '') + ' ' + data.get('city', '') + ', ' + data.get('state', '') + ' ' + data.get('zip_code', '')

        # Extract the Google Sheet ID from the provided URL
        google_sheet_url = data.get('google_sheet_url')
        if not google_sheet_url or '/d/' not in google_sheet_url:
            raise Exception("Invalid or missing Google Sheet URL")
        sheet_id = google_sheet_url.split('/d/')[1].split('/')[0]

        result = update_google_sheet_and_get_values_intermediate(
            copied_sheet_id=sheet_id,
            copied_sheet_url=google_sheet_url,
            mapped_values=data.get('user_model_field_values'),
            market_json=data.get('market_rent_assumptions'),
            rental_assumptions_json=data.get('units'),
            rental_growth_json=data.get('growth_rates'),
            amenity_income_json=data.get('amenity_income'),
            operating_expenses_json=data.get('operating_expenses'),
            retail_income_json=data.get('retail_income'),
            address=address,
            expenses_json=data.get('expenses'),
            property_name=data.get('name')
        )

        return jsonify({"result": result}), 201

    except Exception as e:
        session.rollback()
        print(f"❌ Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



@model_bp.route('/user_models_expense', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_user_expense_table():

    try:
        print("🚀 Starting user model creation...")
        data = request.get_json()

        print("data", data)
        
        google_sheet_url = data.get('google_sheet_url')
        if not google_sheet_url or '/d/' not in google_sheet_url:
            raise Exception("Invalid or missing Google Sheet URL")
        sheet_id = google_sheet_url.split('/d/')[1].split('/')[0]

        result = update_user_model_expense_table(
            copied_sheet_id=sheet_id,
            sheet_name=data.get('sheet_name'),
            expenses=data.get('expenses')
        )
        
        return jsonify({"result": result}), 201

    except Exception as e:

        print(f"❌ Exception occurred: {str(e)}")
        return jsonify({'error': str(e)}), 500


@model_bp.route('/user_models/<uuid:user_model_id>', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_user_model(user_model_id):
    session = get_session()
    try:
        # Accept optional version_id as query param
        version_id = request.args.get('version_id', default=None, type=str)

        user_model = session.query(UserModel).get(user_model_id)
        if user_model is None:
            return jsonify({'error': 'User model not found'}), 404

        # --- User ID check ---
        # Assumes requires_auth sets g.current_user or similar
        # If not, adapt to your auth system
        current_user = getattr(g, "current_user", None)
        # Get the Auth0 user id from the JWT (current_user.sub)
        # and look up the internal user id from the User table
        auth0_user_id = None
        if current_user and "sub" in current_user:
            auth0_user_id = current_user.get("sub")
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        current_user_id = user_obj.id

        # user_model.user_id is UUID, current_user_id may be str or UUID
        if str(user_model.user_id) != str(current_user_id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        # Get the model type
        model_type = session.query(ModelType).get(user_model.model_type_id)
        if model_type is None:
            return jsonify({'error': 'Model type not found'}), 404

        # Get all versions for this user model, sorted by version_number desc
        all_versions = session.query(UserModelVersion).filter_by(user_model_id=user_model.id).order_by(UserModelVersion.version_number.desc()).all()
        if not all_versions:
            return jsonify({'error': 'User model version not found'}), 404

        # Prepare version list for response
        version_list = [
            {
                'version': v.version_number,
                'version_id': str(v.id)
            }
            for v in all_versions
        ]

        # Determine which version to use
        user_model_version = None
        if version_id:
            # Try to find the version with this id
            user_model_version = next((v for v in all_versions if str(v.id) == version_id), None)
            if user_model_version is None:
                return jsonify({'error': 'User model version not found for provided version_id'}), 404
        else:
            # Use most recent
            user_model_version = all_versions[0]

        # Get field values for the selected version
        field_values = (
            session.query(UserModelFieldValue, ModelTypeSectionField)
            .join(ModelTypeSectionField, UserModelFieldValue.field_id == ModelTypeSectionField.id)
            .filter(UserModelFieldValue.user_model_version_id == user_model_version.id)
            .all()
        )
        field_values_data = [{
            'field_id': str(fv.field_id),
            'field_key': field.field_key,
            'value': fv.value,
            'start_month': fv.start_month,
            'end_month': fv.end_month
        } for fv, field in field_values]

        # Get model sections and fields
        sections = session.query(ModelTypeSection).filter_by(model_type_id=model_type.id).all()
        sections_data = []
        for section in sections:
            fields = session.query(ModelTypeSectionField).filter_by(section_id=section.id).all()
            fields_data = [{
                'id': str(field.id),
                'description': field.description,
                'field_title': field.field_title,
                'field_key': field.field_key,
                'field_type': field.field_type,
                'default_value': field.default_value,
                'required': field.required,
                'time_phased': field.time_phased,
                'order': field.order,
                'active': field.active
            } for field in fields]
            sections_data.append({
                'id': str(section.id),
                'name': section.name,
                'order': section.order,
                'fields': fields_data
            })

        # Add units to the response
        units = session.query(Unit).filter_by(user_model_version_id=user_model_version.id).all()
        units_data = [{
            'rent_type': unit.rent_type,
            'vacate_flag': unit.vacate_flag,
            'layout': unit.layout,
            'square_feet': unit.square_feet,
            'vacate_month': unit.vacate_month,
            'current_rent': unit.current_rent
        } for unit in units]

        # Add market rent assumptions to the response
        market_rent_assumptions = session.query(MarketRentAssumption).filter_by(user_model_version_id=user_model_version.id).all()
        market_rent_assumptions_data = [{
            'layout': assumption.layout,
            'pf_rent': assumption.pf_rent
        } for assumption in market_rent_assumptions]

        # Add growth rates to the response
        growth_rates = session.query(GrowthRates).filter_by(user_model_version_id=user_model_version.id).all()
        growth_rates_data = [{
            'name': rate.name,
            'value': rate.value,
            'type': rate.type
        } for rate in growth_rates]

        # Add amenity income to the response
        amenity_income = session.query(AmenityIncome).filter_by(user_model_version_id=user_model_version.id).all()
        amenity_income_data = [{
            'name': amenity.name,
            'start_month': amenity.start_month,
            'utilization': amenity.utilization,
            'unit_count': amenity.unit_count,
            'monthly_fee': amenity.monthly_fee
        } for amenity in amenity_income]

        # Add operating expenses to the response
        operating_expenses = session.query(OperatingExpenses).filter_by(user_model_version_id=user_model_version.id).all()
        operating_expenses_data = [{
            'name': expense.name,
            'factor': expense.factor,
            'broker': expense.broker,
            'cost_per': expense.cost_per
        } for expense in operating_expenses]

        # Add expenses to the response
        expenses = session.query(Expenses).filter_by(user_model_version_id=user_model_version.id).all()
        expenses_data = [{
            'id': str(expense.id),
            'name': expense.name,
            'factor': expense.factor,
            'cost_per': expense.cost_per,
            'statistic': expense.statistic,
            'start_month': expense.start_month,
            'end_month': expense.end_month,
            'type': expense.type,
            'rent_type_included': expense.rent_type_included
        } for expense in expenses]

        retail_income = session.query(RetailIncome).filter_by(user_model_version_id=user_model_version.id).all()
        retail_income_data = [{
            'id': str(income.id),
            'suite': income.suite,
            'tenant_name': income.tenant_name,
            'square_feet': income.square_feet,
            'rent_start_month': income.rent_start_month,
            'annual_bumps': income.annual_bumps,
            'rent_per_square_foot_per_year': income.rent_per_square_foot_per_year,
            'rent_type': income.rent_type,
            'lease_start_month': income.lease_start_month,
            'lease_end_month': income.lease_end_month,
            'recovery_start_month': income.recovery_start_month
        } for income in retail_income]

        return jsonify({
            'id': str(user_model.id),
            'name': user_model.name,
            'street_address': user_model.street_address,
            'city': user_model.city,
            'state': user_model.state,
            'zip_code': user_model.zip_code,
            'version_number': user_model_version.version_number,
            'version_id': str(user_model_version.id),
            'versions': version_list,
            'user_model_field_values': field_values_data,
            'variables': user_model_version.variables,
            'model_type': {
                'id': str(model_type.id),
                'name': model_type.name,
                'description': model_type.description,
                'is_active': model_type.is_active,
                'show_retail': model_type.show_retail,
                'show_rental_units': model_type.show_rental_units
            },
            'sections': sections_data,
            'google_sheet_url': user_model_version.google_sheet_url,
            'levered_irr': user_model_version.levered_irr,
            'levered_moic': user_model_version.levered_moic,
            'table_mapping_output': user_model_version.table_mapping_output,
            'sensitivity_tables': user_model_version.sensitivity_tables,
            'units': units_data,
            'market_rent_assumptions': market_rent_assumptions_data,
            'growth_rates': growth_rates_data,
            'amenity_income': amenity_income_data,
            'operating_expenses': operating_expenses_data,
            'expenses': expenses_data,
            'retail_income': retail_income_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



@model_bp.route('/user_models_version/<uuid:user_model_version_id>', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_user_model_version(user_model_version_id):
    session = get_session()
    try:
        # Get the user model version by id
        user_model_version = session.query(UserModelVersion).get(user_model_version_id)
        if user_model_version is None:
            return jsonify({'error': 'User model version not found'}), 404

        # Get the user model from the version
        user_model = session.query(UserModel).get(user_model_version.user_model_id)
        if user_model is None:
            return jsonify({'error': 'User model not found'}), 404

        # Get the model type
        model_type = session.query(ModelType).get(user_model.model_type_id)
        if model_type is None:
            return jsonify({'error': 'Model type not found'}), 404

        # --- User ID check ---
        # Assumes requires_auth sets g.current_user or similar
        # If not, adapt to your auth system
        current_user = getattr(g, "current_user", None)
        # Get the Auth0 user id from the JWT (current_user.sub)
        # and look up the internal user id from the User table
        auth0_user_id = None
        if current_user and "sub" in current_user:
            auth0_user_id = current_user.get("sub")
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        current_user_id = user_obj.id

        # user_model.user_id is UUID, current_user_id may be str or UUID
        if str(user_model.user_id) != str(current_user_id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403


        # Get model sections and fields first
        sections = session.query(ModelTypeSection).filter_by(model_type_id=model_type.id).all()
        sections_data = []
        for section in sections:
            fields = session.query(ModelTypeSectionField).filter_by(section_id=section.id).all()
  
            fields_data = [{
                'id': str(field.id),
                'description': field.description,
                'field_title': field.field_title,
                'field_key': field.field_key,
                'field_type': field.field_type,
                'default_value': field.default_value,
                'required': field.required,
                'time_phased': field.time_phased,
                'order': field.order,
                'active': field.active
            } for field in fields]
            print("FIELDS_DATA", fields_data);
            sections_data.append({
                'id': str(section.id),
                'name': section.name,
                'order': section.order,
                'fields': fields_data
            })

        # Now get field values with field_key lookup (include missing fields as null)
        field_values = session.query(UserModelFieldValue).filter_by(user_model_version_id=user_model_version.id).all()

        # Create lookups for field properties by field_id
        field_key_lookup = {}
        field_type_lookup = {}
        for section in sections_data:
            for field in section['fields']:
                field_key_lookup[field['id']] = field['field_key']
                field_type_lookup[field['id']] = field['field_type']

        # Map existing values by field_id (string)
        values_by_id = {str(fv.field_id): fv for fv in field_values}

        # Build a complete list for all fields
        field_values_data = []
        for section in sections_data:
            for f in section['fields']:
                existing = values_by_id.get(f['id'])
                field_values_data.append({
                    'field_id': f['id'],
                    'field_key': f['field_key'],
                    'field_type': f['field_type'],
                    'value': getattr(existing, 'value', None),
                    'start_month': getattr(existing, 'start_month', None),
                    'end_month': getattr(existing, 'end_month', None)
                })

        # Add units to the response
        units = session.query(Unit).filter_by(user_model_version_id=user_model_version.id).all()
        units_data = [{
            'id': str(unit.id),
            'rent_type': unit.rent_type,
            'vacate_flag': unit.vacate_flag,
            'layout': unit.layout,
            'square_feet': unit.square_feet,
            'vacate_month': unit.vacate_month,
            'current_rent': unit.current_rent
        } for unit in units]

        # Add market rent assumptions to the response
        market_rent_assumptions = session.query(MarketRentAssumption).filter_by(user_model_version_id=user_model_version.id).all()
        market_rent_assumptions_data = [{
            'id': str(assumption.id),
            'layout': assumption.layout,
            'pf_rent': assumption.pf_rent
        } for assumption in market_rent_assumptions]

        # Add growth rates to the response
        growth_rates = session.query(GrowthRates).filter_by(user_model_version_id=user_model_version.id).all()
        growth_rates_data = [{
            'id': str(rate.id),
            'name': rate.name,
            'value': rate.value,
            'type': rate.type
        } for rate in growth_rates]

        # Add amenity income to the response
        amenity_income = session.query(AmenityIncome).filter_by(user_model_version_id=user_model_version.id).all()
        amenity_income_data = [{
            'id': str(amenity.id),
            'name': amenity.name,
            'start_month': amenity.start_month,
            'utilization': amenity.utilization,
            'unit_count': amenity.unit_count,
            'monthly_fee': amenity.monthly_fee
        } for amenity in amenity_income]

        # Add operating expenses to the response
        operating_expenses = session.query(OperatingExpenses).filter_by(user_model_version_id=user_model_version.id).all()
        operating_expenses_data = [{
            'id': str(expense.id),
            'name': expense.name,
            'factor': expense.factor,
            'broker': expense.broker,
            'cost_per': expense.cost_per
        } for expense in operating_expenses]

        # Add expenses to the response
        expenses = session.query(Expenses).filter_by(user_model_version_id=user_model_version.id).all()
        expenses_data = [{
            'id': str(expense.id),
            'name': expense.name,
            'factor': expense.factor,
            'cost_per': expense.cost_per,
            'statistic': expense.statistic,
            'start_month': expense.start_month,
            'end_month': expense.end_month,
            'type': expense.type,
            'rent_type_included': expense.rent_type_included
        } for expense in expenses]

        retail_income = session.query(RetailIncome).filter_by(user_model_version_id=user_model_version.id).all()
        retail_income_data = [{
            'id': str(income.id),
            'suite': income.suite,
            'tenant_name': income.tenant_name,
            'square_feet': income.square_feet,
            'rent_start_month': income.rent_start_month,
            'annual_bumps': income.annual_bumps,
            'rent_per_square_foot_per_year': income.rent_per_square_foot_per_year,
            'rent_type': income.rent_type,
            'lease_start_month': income.lease_start_month,
            'lease_end_month': income.lease_end_month,
            'recovery_start_month': income.recovery_start_month
        } for income in retail_income]

        return jsonify({
            'id': str(user_model.id),
            'name': user_model.name,
            'street_address': user_model.street_address,
            'city': user_model.city,
            'state': user_model.state,
            'zip_code': user_model.zip_code,
            'version_number': user_model_version.version_number,
            'version_id': str(user_model_version.id),
            'user_model_field_values': field_values_data,
            'variables': user_model_version.variables,
            'model_type': {
                'id': str(model_type.id),
                'name': model_type.name,
                'description': model_type.description,
                'is_active': model_type.is_active,
                'show_retail': model_type.show_retail,
                'show_rental_units': model_type.show_rental_units
            },
            'sections': sections_data,
            'google_sheet_url': user_model_version.google_sheet_url,
            'levered_irr': user_model_version.levered_irr,
            'levered_moic': user_model_version.levered_moic,
            'table_mapping_output': user_model_version.table_mapping_output,
            'sensitivity_tables': user_model_version.sensitivity_tables,
            'units': units_data,
            'market_rent_assumptions': market_rent_assumptions_data,
            'growth_rates': growth_rates_data,
            'amenity_income': amenity_income_data,
            'operating_expenses': operating_expenses_data,
            'expenses': expenses_data,
            'retail_income': retail_income_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()



@model_bp.route('/user_models', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def get_all_user_models():
    session = get_session()
    try:
        # --- Debug context ---
        import time, traceback as _tb
        started_at = time.monotonic()
        trace_hdr = request.headers.get('X-Cloud-Trace-Context')
        args_snapshot = dict(request.args) if request.args else {}
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        print(f"🔎 [GET /user_models] trace={trace_hdr} args={args_snapshot} auth0_sub={auth0_user_id}")

        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # Try to validate UUID shape (do not fail hard; just log)
        try:
            _ = uuid.UUID(str(user_id))
            print(f"🆔 [GET /user_models] user_id looks like UUID")
        except Exception:
            print(f"⚠️ [GET /user_models] user_id is not a full UUID: '{user_id}' (will still query as string match)")

        # Resolve internal user for auth visibility (not enforcing ownership here, only logging)
        internal_user = None
        try:
            if auth0_user_id:
                internal_user = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        except Exception as _e:
            print(f"⚠️ [GET /user_models] failed resolving internal user for auth0_sub={auth0_user_id}: {_e}")

        if internal_user:
            print(f"👤 [GET /user_models] caller internal_user_id={internal_user.id} email={internal_user.email}")
        else:
            print(f"👤 [GET /user_models] caller internal_user not resolved")

        q_started = time.monotonic()
        # Query all user models for the user and join with ModelType
        user_models = session.query(UserModel, ModelType.name).join(ModelType, UserModel.model_type_id == ModelType.id).filter(UserModel.user_id == user_id).all()
        q_ms = int((time.monotonic() - q_started) * 1000)
        # print(f"🗃️ [GET /user_models] fetched {len(user_models)} rows in {q_ms} ms for user_id={user_id}")
        
        user_models_data = []
        for user_model, model_type_name in user_models:
            # Reference @model.py: get all versions for this user model
            v_started = time.monotonic()
            versions = session.query(UserModelVersion).filter_by(user_model_id=user_model.id).all()
            v_ms = int((time.monotonic() - v_started) * 1000)
            version_count = len(versions)
            # print(f"   • user_model_id={user_model.id} versions={version_count} (loaded in {v_ms} ms)")
            # Get the most recent version (by created_at or version_number, fallback to first if none)
            most_recent_version = None
            if version_count > 0:
                most_recent_version = max(
                    versions,
                    key=lambda v: (
                        getattr(v, 'created_at', None) or getattr(v, 'updated_at', None) or 0,
                        getattr(v, 'version_number', 0)
                    )
                )
            # Load active model tags
            tags = session.query(ModelTag).filter(
                ModelTag.user_model_id == user_model.id,
                ModelTag.status == 'active'
            ).all()
            tags_data = [{
                'id': str(t.id),
                'tag_name': t.tag_name,
                'tag_color': t.tag_color,
                'status': t.status,
                'created_at': t.created_at.isoformat() if getattr(t, 'created_at', None) else None,
                'updated_at': t.updated_at.isoformat() if getattr(t, 'updated_at', None) else None,
            } for t in tags]
            # Prepare the data
            user_models_data.append({
                'id': str(user_model.id),
                'name': user_model.name,
                'street_address': user_model.street_address,
                'city': user_model.city,
                'state': user_model.state,
                'zip_code': user_model.zip_code,
                'created_at': user_model.created_at.isoformat() if user_model.created_at else None,
                'levered_irr': most_recent_version.levered_irr if most_recent_version else None,
                'levered_moic': most_recent_version.levered_moic if most_recent_version else None,
                'version_count': version_count,
                'model_type': model_type_name,  # Add the model type name here
                'active': user_model.active,
                'model_tags': tags_data
            })
        total_ms = int((time.monotonic() - started_at) * 1000)
        print(f"✅ [GET /user_models] returning {len(user_models_data)} items in {total_ms} ms")
        return jsonify(user_models_data), 200
    except Exception as e:
        print(f"❌ [GET /user_models] error: {e}")
        _tb.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()




@model_bp.route('/user_models/<uuid:user_model_id>/tags', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_model_tag(user_model_id):
    session = get_session()
    try:
        data = request.get_json() or {}
        tag_name = (data.get('tag_name') or '').strip()
        tag_color = (data.get('tag_color') or '').strip() or None
        status = (data.get('status') or 'active').strip() or 'active'
        if not tag_name:
            return jsonify({'error': 'tag_name is required'}), 400
        # Validate the user model exists
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model:
            return jsonify({'error': 'User model not found'}), 404

        # If no color provided, inherit from existing tags with same name for this user
        if not tag_color:
            existing = session.query(ModelTag.tag_color).join(
                UserModel, ModelTag.user_model_id == UserModel.id
            ).filter(
                UserModel.user_id == user_model.user_id,
                ModelTag.tag_name == tag_name,
                ModelTag.tag_color.isnot(None),
                ModelTag.status != 'removed'
            ).first()
            if existing and existing.tag_color:
                tag_color = existing.tag_color

        tag = ModelTag(user_model_id=user_model.id, tag_name=tag_name, tag_color=tag_color, status=status)
        session.add(tag)

        # Propagate this color to all tags with the same name for this user
        if tag_color:
            session.query(ModelTag).filter(
                ModelTag.user_model_id.in_(
                    session.query(UserModel.id).filter(UserModel.user_id == user_model.user_id)
                ),
                ModelTag.tag_name == tag_name,
                ModelTag.status != 'removed'
            ).update({ModelTag.tag_color: tag_color}, synchronize_session='fetch')

        session.commit()
        return jsonify({
            'id': str(tag.id),
            'user_model_id': str(tag.user_model_id),
            'tag_name': tag.tag_name,
            'tag_color': tag.tag_color,
            'status': tag.status,
            'created_at': tag.created_at.isoformat() if getattr(tag, 'created_at', None) else None,
            'updated_at': tag.updated_at.isoformat() if getattr(tag, 'updated_at', None) else None
        }), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/tags/<uuid:tag_id>', methods=['PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_tag(tag_id):
    session = get_session()
    try:
        tag = session.query(ModelTag).get(tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        data = request.get_json() or {}
        if 'tag_name' in data:
            tn = (data.get('tag_name') or '').strip()
            if not tn:
                return jsonify({'error': 'tag_name cannot be empty'}), 400
            tag.tag_name = tn
        if 'tag_color' in data:
            tc = (data.get('tag_color') or '').strip() or None
            tag.tag_color = tc
            # Propagate color to all tags with the same name for this user
            if tc:
                user_model = session.query(UserModel).get(tag.user_model_id)
                if user_model:
                    session.query(ModelTag).filter(
                        ModelTag.user_model_id.in_(
                            session.query(UserModel.id).filter(UserModel.user_id == user_model.user_id)
                        ),
                        ModelTag.tag_name == tag.tag_name,
                        ModelTag.status != 'removed'
                    ).update({ModelTag.tag_color: tc}, synchronize_session='fetch')
        if 'status' in data:
            st = (data.get('status') or '').strip()
            if st:
                tag.status = st
        session.commit()
        return jsonify({
            'id': str(tag.id),
            'user_model_id': str(tag.user_model_id),
            'tag_name': tag.tag_name,
            'tag_color': tag.tag_color,
            'status': tag.status,
            'created_at': tag.created_at.isoformat() if getattr(tag, 'created_at', None) else None,
            'updated_at': tag.updated_at.isoformat() if getattr(tag, 'updated_at', None) else None
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/tags/<uuid:tag_id>/remove', methods=['PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def remove_model_tag(tag_id):
    session = get_session()
    try:
        tag = session.query(ModelTag).get(tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404
        tag.status = 'removed'
        session.commit()
        return jsonify({'message': 'Tag removed'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

        
@model_bp.route('/model_types/<uuid:model_type_id>/google_sheet', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_type_google_sheet(model_type_id):
    session = get_session()
    try:
        
        model_type = session.query(ModelType).get(model_type_id)
        if model_type is None:
            return jsonify({'error': 'Model type not found'}), 404

        data = request.get_json()
        google_sheet_url = data.get('google_sheet_url')

        if not google_sheet_url:
            return jsonify({'error': 'Google Sheet URL is required'}), 400

        # Extract spreadsheet ID from URL
        match = re.search(r'/d/([a-zA-Z0-9-_]+)', google_sheet_url)
        if not match:
            return jsonify({'error': 'Invalid Google Sheet URL'}), 400

        spreadsheet_id = match.group(1)

        # Load credentials and authorize
        SCOPES = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]


        if SERVICE_ACCOUNT_FILE and os.path.exists("./" + SERVICE_ACCOUNT_FILE):
            print("🔑 Using local service account credentials. (model.py)")
            creds = Credentials.from_service_account_file("./" + SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        else:
            print("🔐 Using default GCP credentials (Cloud Run). (model.py)")
            creds, _ = default(scopes=SCOPES)
        client = gspread.authorize(creds)

        try:
            # Open the spreadsheet
            spreadsheet = client.open_by_key(spreadsheet_id)
            
            # Check if required sheets exist
            required_sheets = ['Model Variable Mapping', 'Variable Mapping', 'Table Mapping']
            existing_sheets = [ws.title for ws in spreadsheet.worksheets()]
            
            found_sheets = [sheet for sheet in required_sheets if sheet in existing_sheets]
            missing_sheets = [sheet for sheet in required_sheets if sheet not in existing_sheets]

            if missing_sheets:
                return jsonify({
                    'error': f'Missing required sheets: {", ".join(missing_sheets)}',
                    'missing_sheets': missing_sheets
                }), 400

            # Update model type with Google Sheet URL
            model_type.google_sheet_url = google_sheet_url
            session.commit()

            return jsonify({
                'message': 'Google Sheet URL updated successfully',
                'google_sheet_url': google_sheet_url,
                'found_sheets': found_sheets,
                'missing_sheets': missing_sheets
            }), 200

        except gspread.exceptions.SpreadsheetNotFound:
            return jsonify({'error': 'Spreadsheet not found or access denied'}), 404
        except Exception as e:
            return jsonify({'error': f'Error accessing Google Sheet: {str(e)}'}), 500

    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_types/<uuid:model_type_id>/generate_sheet', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def generate_sheet(model_type_id):
    session = get_session()
    try:
        print(f"🔧 [DEBUG] Starting generate_sheet for model_type_id: {model_type_id}")
        
        # Retrieve the template file ID from the model type
        model_type = session.query(ModelType).get(model_type_id)
        if not model_type:
            print(f"❌ [DEBUG] Model type not found: {model_type_id}")
            return jsonify({'error': 'Model type not found'}), 404
            
        if not model_type.google_sheet_url:
            print(f"❌ [DEBUG] Google Sheet URL not found for model type: {model_type_id}")
            return jsonify({'error': 'Google Sheet URL not found for this model type'}), 404

        print(f"✅ [DEBUG] Found model type: {model_type.name}")
        print(f"🔗 [DEBUG] Google Sheet URL: {model_type.google_sheet_url}")

        # Extract template file ID from the Google Sheet URL
        match = re.search(r'/d/([a-zA-Z0-9-_]+)', model_type.google_sheet_url)
        if not match:
            print(f"❌ [DEBUG] Invalid Google Sheet URL format: {model_type.google_sheet_url}")
            return jsonify({'error': 'Invalid Google Sheet URL format'}), 400

        template_file_id = match.group(1)
        print(f"🆔 [DEBUG] Extracted template file ID: {template_file_id}")

        # Retrieve user_model data from the request
        data = request.get_json()
        print(f"📄 [DEBUG] Request data: {data}")
        
        user_id = data.get('user_id')
        user_model_field_values = data.get('user_model_field_values', [])

        if not user_id:
            print(f"❌ [DEBUG] User ID not provided in request")
            return jsonify({'error': 'User ID is required'}), 400

        print(f"👤 [DEBUG] User ID: {user_id}")

        # Query the user's email using the user_id
        user = session.query(User).get(user_id)
        if not user:
            print(f"❌ [DEBUG] User not found: {user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        if not user.email:
            print(f"❌ [DEBUG] User email not available: {user_id}")
            return jsonify({'error': 'User email not available'}), 404

        user_email = user.email
        print(f"📧 [DEBUG] User email: {user_email}")

        # Generate the Google Sheet using the user's email and other data
        print(f"🚀 [DEBUG] Calling generate_google_sheet_for_user_model...")
        try:
            sheet_url = generate_google_sheet_for_user_model(
                user_email=user_email,
                template_file_id=template_file_id
            )
            print(f"✅ [DEBUG] Successfully generated sheet URL: {sheet_url}")
            return jsonify({"sheet_url": sheet_url}), 200
        except Exception as google_error:
            print(f"❌ [DEBUG] Error in generate_google_sheet_for_user_model: {str(google_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Google Sheet generation failed: {str(google_error)}"}), 500
            
    except Exception as e:
        print(f"❌ [DEBUG] Exception in generate_sheet: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@model_bp.route('/sensitivity-analysis', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def generate_sensitivity_analysis():
    session = get_session()
    try:
        print("🔧 [DEBUG] Starting sensitivity analysis generation...")
        data = request.get_json()
        print(f"📄 [DEBUG] Request data: {data}")

        google_sheet_url = data.get('google_sheet_url')
        max_price = data.get('max_price')
        min_cap_rate = data.get('min_cap_rate')
        version_id = data.get('version_id')

        if not google_sheet_url:
            return jsonify({'error': 'Google Sheet URL is required'}), 400
        if max_price is None:
            return jsonify({'error': 'Max price is required'}), 400
        if min_cap_rate is None:
            return jsonify({'error': 'Min cap rate is required'}), 400

        # Resolve user_model_version (optional but preferred)
        user_model_version = None
        if version_id:
            try:
                user_model_version = session.query(UserModelVersion).get(uuid.UUID(version_id))
            except Exception:
                user_model_version = session.query(UserModelVersion).get(version_id)
        if not user_model_version:
            user_model_version = session.query(UserModelVersion).filter_by(google_sheet_url=google_sheet_url).order_by(UserModelVersion.version_number.desc()).first()

        if user_model_version:
            current_state = user_model_version.sensitivity_tables
            # If a generation is already in progress, don't start a duplicate
            if isinstance(current_state, dict) and current_state.get('status') == 'generating':
                return jsonify({'status': 'generating'}), 202
            # Always regenerate on request; mark as generating and proceed
            user_model_version.sensitivity_tables = {'status': 'generating'}
            session.commit()

        # Extract sheet ID from URL
        match = re.search(r'/d/([a-zA-Z0-9-_]+)', google_sheet_url)
        if not match:
            return jsonify({'error': 'Invalid Google Sheet URL format'}), 400
        sheet_id = match.group(1)
        print(f"🆔 [DEBUG] Extracted sheet ID: {sheet_id}")

        # Run analysis
        try:
            result = generate_sensitivity_analysis_tables(
                sheet_id=sheet_id,
                max_price=float(max_price),
                min_cap_rate=float(min_cap_rate)
            )
            print(f"✅ [DEBUG] Successfully generated sensitivity analysis")
            # Save results
            if user_model_version:
                user_model_version.sensitivity_tables = result
                session.commit()
            return jsonify(result), 200
        except Exception as analysis_error:
            print(f"❌ [DEBUG] Error in sensitivity analysis: {str(analysis_error)}")
            import traceback
            traceback.print_exc()
            # Reset generating flag to allow retries
            if user_model_version:
                user_model_version.sensitivity_tables = None
                session.commit()
            return jsonify({"error": f"Sensitivity analysis failed: {str(analysis_error)}"}), 500

    except Exception as e:
        print(f"❌ [DEBUG] Exception in sensitivity analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@model_bp.route('/download_worksheet/<uuid:version_id>', methods=['GET', 'POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def download_worksheet(version_id):
    
    session = get_session()
    try:
        # --- User ID check ---
        # Assumes requires_auth sets g.current_user or similar
        # If not, adapt to your auth system


        # --- User ID check ---
        # Assumes requires_auth sets g.current_user or similar
        # If not, adapt to your auth system
        current_user = getattr(g, "current_user", None)
        # Get the Auth0 user id from the JWT (current_user.sub)
        # and look up the internal user id from the User table
        auth0_user_id = None
        if current_user and "sub" in current_user:
            auth0_user_id = current_user.get("sub")
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401

        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        current_user_id = user_obj.id

        # Fetch the user_model_version and its user_model to check ownership
        user_model_version = session.query(UserModelVersion).get(version_id)
        if user_model_version is None:
            print(f"❌ [DEBUG] UserModelVersion not found for id: {version_id}")
            return jsonify({'error': 'User model version not found'}), 404

        user_model = session.query(UserModel).get(user_model_version.user_model_id)
        if user_model is None:
            print(f"❌ [DEBUG] UserModel not found for id: {user_model_version.user_model_id}")
            return jsonify({'error': 'User model not found'}), 404

        # user_model.user_id is UUID, current_user_id may be str or UUID
        if str(user_model.user_id) != str(current_user_id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        print(f"🔽 [DEBUG] Download worksheet endpoint called for version_id: {version_id}")
        # Optional: accept notes from POST body
        payload = None
        try:
            payload = request.get_json(silent=True) or {}
        except Exception:
            payload = {}
        notes_payload = None
        try:
            notes_payload = payload.get('notes')
        except Exception:
            notes_payload = None
        if notes_payload is not None:
            try:
                # Keep a brief log for debugging; extend to persist/use as needed
                print(f"📝 [DEBUG] Received {len(notes_payload) if hasattr(notes_payload,'__len__') else 'some'} notes with download request")
            except Exception:
                print("📝 [DEBUG] Received notes payload with download request")
        
        user_model_version = session.query(UserModelVersion).get(version_id)
        if user_model_version is None:
            print(f"❌ [DEBUG] UserModelVersion not found for id: {version_id}")
            return jsonify({'error': 'User model version not found'}), 404

        print(f"✅ [DEBUG] Found UserModelVersion: {user_model_version}")
        print(f"🔗 [DEBUG] Google Sheet URL: {user_model_version.google_sheet_url}")

        try:
            sheet_id = user_model_version.google_sheet_url.split('/d/')[1].split('/')[0]
            print(f"🆔 [DEBUG] Extracted Google Sheet ID: {sheet_id}")
        except Exception as e:
            print(f"❌ [DEBUG] Failed to extract sheet_id from URL: {user_model_version.google_sheet_url}")
            traceback.print_exc()
            return jsonify({'error': 'Invalid Google Sheet URL format'}), 400

        # If notes provided, write them into "Diligence and Notes" before export
        try:
            if notes_payload is not None:
                ss = gs_client.open_by_key(sheet_id)
                try:
                    ws = ss.worksheet("Diligence and Notes")
                except Exception:
                    # Create if not exists
                    ws = ss.add_worksheet(title="Diligence and Notes", rows=200, cols=10)
                # Clear sheet
                try:
                    ws.clear()
                except Exception:
                    pass
                # Write "Notes" bold at B3
                ws.update("B3", [["Notes"]])
                try:
                    ws.format("B3", {"textFormat": {"bold": True}})
                except Exception:
                    print("ℹ️ Unable to apply bold format to B3 (non-fatal).")
                # Build notes lines: in B4..B(3+len)
                lines = []
                if isinstance(notes_payload, list):
                    for n in notes_payload:
                        try:
                            note_text = str((n or {}).get("note_value", "")).strip()
                        except Exception:
                            note_text = ""
                        # Only include the note text (no timestamps/metadata)
                        lines.append([f"{note_text}"])
                # Write only if there is at least one note; else, leave header only
                if lines:
                    start_row = 4
                    end_row = 3 + len(lines)
                    rng = f"B{start_row}:B{end_row}"
                    ws.update(rng, lines)
                    # Ensure notes themselves are not bold
                    try:
                        ws.format(rng, {"textFormat": {"bold": False}})
                    except Exception:
                        print("ℹ️ Unable to remove bold format from notes range (non-fatal).")
        except Exception as e:
            print(f"⚠️ [DEBUG] Failed to write notes to sheet: {e}")
            # Continue anyway; export will still proceed

        try:
            output_path = export_google_sheet(sheet_id)
            print(f"📄 [DEBUG] ODS export path/response ready: {output_path}")
        except Exception as e:
            print(f"❌ [DEBUG] Failed to export Google Sheet as ODS for sheet_id: {sheet_id}")
            traceback.print_exc()
            return jsonify({'error': f'Failed to export Google Sheet: {str(e)}'}), 500

        print(f"⬇️ [DEBUG] Sending file to client.")
        return export_google_sheet(sheet_id, filename="worksheet_export.xlsx")
    except Exception as e:
        print(f"❌ [DEBUG] Exception in download_worksheet: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@model_bp.route('/model_type_section_fields/<uuid:field_id>', methods=['PUT', 'PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_type_section_field(field_id):
    session = get_session()
    try:
        
        field = session.query(ModelTypeSectionField).get(field_id)
        if field is None:
            return jsonify({'error': 'ModelTypeSectionField not found'}), 404

        data = request.get_json()

        if 'description' in data:
            field.description = data['description']
        if 'field_key' in data:
            field.field_key = data['field_key']
        if 'field_title' in data:
            field.field_title = data['field_title']
        if 'field_type' in data:
            field.field_type = data['field_type']
        if 'default_value' in data:
            field.default_value = data['default_value']
        if 'required' in data:
            field.required = data['required']
        if 'time_phased' in data:
            field.time_phased = data['time_phased']
        if 'order' in data:
            field.order = data['order']
        if 'section_id' in data:
            field.section_id = data['section_id']

        session.commit()
        return jsonify({'message': 'ModelTypeSectionField updated successfully'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_type_section_fields', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_model_type_section_field():
    session = get_session()
    try:
        
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ('section_id', 'field_key', 'field_type', 'field_title')):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create a new ModelTypeSectionField
        new_field = ModelTypeSectionField(
            section_id=data['section_id'],
            field_title=data['field_title'],
            field_key=data['field_key'],
            field_type=data['field_type'],
            description=data.get('description'),
            default_value=data.get('default_value'),
            required=data.get('required', False),
            time_phased=data.get('time_phased', False),
            order=data.get('order', 0)
        )
        session.add(new_field)
        session.commit()

        return jsonify({'message': 'ModelTypeSectionField created successfully', 'id': str(new_field.id)}), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_type_section_fields/<uuid:field_id>', methods=['DELETE'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def delete_model_type_section_field(field_id):
    session = get_session()
    try:
        field = session.query(ModelTypeSectionField).get(field_id)
        if field is None:
            return jsonify({'error': 'ModelTypeSectionField not found'}), 404

        # Only set 'active' to False instead of deleting
        field.active = False
        session.commit()

        return jsonify({'message': 'ModelTypeSectionField set to inactive'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_type_sections/<uuid:section_id>', methods=['DELETE'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def delete_model_type_section(section_id):
    session = get_session()
    try:
        section = session.query(ModelTypeSection).get(section_id)
        if section is None:
            return jsonify({'error': 'ModelTypeSection not found'}), 404

        # Check if section has any fields
        field_count = session.query(ModelTypeSectionField).filter_by(section_id=section_id).count()
        if field_count > 0:
            return jsonify({'error': 'Cannot delete section that contains fields. Please delete all fields first.'}), 400

        # Instead of deleting, set 'active' to False
        section.active = False
        session.commit()

        return jsonify({'message': 'ModelTypeSection set to inactive'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_type_sections', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_model_type_section():
    session = get_session()
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ('model_type_id', 'name')):
            return jsonify({'error': 'Missing required fields'}), 400

        # Create a new ModelTypeSection
        new_section = ModelTypeSection(
            model_type_id=data['model_type_id'],
            name=data['name'],
            order=data.get('order', 0)
        )
        session.add(new_section)
        session.commit()

        return jsonify({
            'message': 'ModelTypeSection created successfully', 
            'id': str(new_section.id)
        }), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@model_bp.route('/model_type_sections/<uuid:section_id>', methods=['PUT', 'PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_type_section(section_id):
    session = get_session()
    try:
        section = session.query(ModelTypeSection).get(section_id)
        if section is None:
            return jsonify({'error': 'ModelTypeSection not found'}), 404

        data = request.get_json()

        if 'name' in data:
            section.name = data['name']
        if 'order' in data:
            section.order = data['order']

        session.commit()
        return jsonify({'message': 'ModelTypeSection updated successfully'}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/user_models/<uuid:user_model_id>/active', methods=['PATCH', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def set_user_model_active(user_model_id):
    session = get_session()
    try:
        payload = request.get_json(silent=True) or {}
        if 'active' not in payload:
            return jsonify({'error': 'Field "active" is required'}), 400

        user_model = session.query(UserModel).filter_by(id=user_model_id).first()
        if not user_model:
            return jsonify({'error': 'UserModel not found'}), 404

        desired = bool(payload['active'])
        user_model.active = desired
        session.commit()
        return jsonify({'id': str(user_model.id), 'active': user_model.active}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


# --- Admin: Users listing and updates ---
@model_bp.route('/admin/users', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def admin_list_users():
    session = get_session()
    try:
        users = session.query(User).all()
        data = []
        for u in users:
            # Number of models the user has created
            model_count = session.query(UserModel).filter_by(user_id=u.id).count()
            # Number of versions across all those models
            version_count = (
                session.query(UserModelVersion)
                .join(UserModel, UserModelVersion.user_model_id == UserModel.id)
                .filter(UserModel.user_id == u.id)
                .count()
            )
            # Most recent model version creation date
            latest_version = (
                session.query(UserModelVersion)
                .join(UserModel, UserModelVersion.user_model_id == UserModel.id)
                .filter(UserModel.user_id == u.id)
                .order_by(UserModelVersion.created_at.desc())
                .first()
            )
            latest_dt = latest_version.created_at.isoformat() if getattr(latest_version, 'created_at', None) else None

            created_dt = u.created_at.isoformat() if getattr(u, 'created_at', None) else None

            data.append({
                'id': str(u.id),
                'email': u.email,
                'is_active': getattr(u, 'is_active', True),
                'created_at': created_dt,
                'model_count': model_count,
                'version_count': version_count,
                'last_version_created_at': latest_dt,
                'subscription_status': getattr(u, 'subscription_status', None),
                'current_period_end': getattr(u, 'current_period_end', None),
                'cancel_at_period_end': getattr(u, 'cancel_at_period_end', None)
            })
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/admin/users/<uuid:user_id>', methods=['PATCH', 'OPTIONS'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def admin_update_user(user_id):
    session = get_session()
    try:
        payload = request.get_json(silent=True) or {}
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        if 'is_active' in payload:
            user.is_active = bool(payload['is_active'])
        session.commit()
        return jsonify({'id': str(user.id), 'is_active': user.is_active}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


# ---------- Model Notes ----------
@model_bp.route('/user_models/<uuid:user_model_id>/notes', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_model_note(user_model_id):
    session = get_session()
    try:
        payload = request.get_json(silent=True) or {}
        note_value = payload.get('note_value', '')
        status = payload.get('status', 'active')

        # Resolve caller → internal user
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401

        # Ownership check
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model:
            return jsonify({'error': 'User model not found'}), 404
        if str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        entry = ModelNote(
            user_model_id=user_model.id,
            note_value=str(note_value),
            status=str(status or 'active')
        )
        session.add(entry)
        session.commit()
        return jsonify({
            'id': str(entry.id),
            'user_model_id': str(entry.user_model_id),
            'note_value': entry.note_value,
            'status': entry.status,
            'created_at': entry.created_at.isoformat() if entry.created_at else None,
            'updated_at': entry.updated_at.isoformat() if entry.updated_at else None,
        }), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/user_models/<uuid:user_model_id>/notes', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def list_model_notes(user_model_id):
    session = get_session()
    try:
        # Resolve caller → internal user
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401

        # Ownership check
        user_model = session.query(UserModel).get(user_model_id)
        if not user_model:
            return jsonify({'error': 'User model not found'}), 404
        if str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        rows = (
            session.query(ModelNote)
            .filter(ModelNote.user_model_id == user_model.id, ModelNote.status == 'active')
            .order_by(ModelNote.created_at.desc())
            .all()
        )
        data = [{
            'id': str(n.id),
            'user_model_id': str(n.user_model_id),
            'note_value': n.note_value,
            'status': n.status,
            'created_at': n.created_at.isoformat() if n.created_at else None,
            'updated_at': n.updated_at.isoformat() if n.updated_at else None,
        } for n in rows]
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/notes/<uuid:note_id>', methods=['PATCH', 'PUT'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def update_model_note(note_id):
    session = get_session()
    try:
        payload = request.get_json(silent=True) or {}
        new_value = payload.get('note_value', None)

        # Resolve note and ownership
        note = session.query(ModelNote).get(note_id)
        if not note:
            return jsonify({'error': 'Note not found'}), 404

        user_model = session.query(UserModel).get(note.user_model_id)
        if not user_model:
            return jsonify({'error': 'User model not found'}), 404

        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        if str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        if new_value is not None:
            note.note_value = str(new_value)
        session.commit()
        return jsonify({
            'id': str(note.id),
            'user_model_id': str(note.user_model_id),
            'note_value': note.note_value,
            'status': note.status,
            'created_at': note.created_at.isoformat() if note.created_at else None,
            'updated_at': note.updated_at.isoformat() if note.updated_at else None,
        }), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/notes/<uuid:note_id>/remove', methods=['PATCH'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def remove_model_note(note_id):
    session = get_session()
    try:
        note = session.query(ModelNote).get(note_id)
        if not note:
            return jsonify({'error': 'Note not found'}), 404

        # Ownership check
        user_model = session.query(UserModel).get(note.user_model_id)
        if not user_model:
            return jsonify({'error': 'User model not found'}), 404

        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401
        if str(user_model.user_id) != str(user_obj.id):
            return jsonify({'error': 'Forbidden: user does not own this model'}), 403

        note.status = 'removed'
        session.commit()
        return jsonify({'id': str(note.id), 'status': note.status}), 200
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

# ---------- Issues (Feedback) ----------
@model_bp.route('/issues', methods=['POST'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def create_issue():
    session = get_session()
    try:
        payload = request.get_json() or {}
        page = payload.get('page')
        subsection = payload.get('subsection', '')
        issue_text = payload.get('issue')

        if not page or not issue_text:
            return jsonify({'error': 'Fields "page" and "issue" are required'}), 400

        # Resolve current user from JWT → internal User record
        current_user = getattr(g, "current_user", None)
        auth0_user_id = current_user.get("sub") if current_user and "sub" in current_user else None
        if not auth0_user_id:
            return jsonify({'error': 'User not authenticated'}), 401
        user_obj = session.query(User).filter_by(auth0_user_id=auth0_user_id).first()
        if not user_obj:
            return jsonify({'error': 'User not found'}), 401

        entry = Issue(
            user_id=user_obj.id,
            page=str(page)[:1024],
            subsection=str(subsection or '')[:1024],
            issue=str(issue_text)
        )
        session.add(entry)
        session.commit()
        return jsonify({'id': str(entry.id)}), 201
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()


@model_bp.route('/issues', methods=['GET'])
@cross_origin(origins=origins, supports_credentials=True)
@requires_auth
def list_issues():
    session = get_session()
    try:
        q = session.query(Issue, User).join(User, Issue.user_id == User.id).order_by(Issue.created_at.desc())
        rows = q.all()
        data = [{
            'id': str(i.id),
            'user_id': str(i.user_id),
            'user_email': getattr(u, 'email', None),
            'page': i.page,
            'subsection': i.subsection,
            'issue': i.issue,
            'created_at': i.created_at.isoformat() if i.created_at else None
        } for i, u in rows]
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()




