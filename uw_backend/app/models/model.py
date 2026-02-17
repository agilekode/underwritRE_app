from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.db import Base


class ModelType(Base):
    __tablename__ = 'model_types'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    google_sheet_url = Column(String)
    show_retail = Column(Boolean, default=True)
    show_rental_units = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ModelTypeSection(Base):
    __tablename__ = 'model_type_sections'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_type_id = Column(UUID(as_uuid=True), ForeignKey('model_types.id'), nullable=False)
    name = Column(String, nullable=False)
    order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    active = Column(Boolean, default=True)

class ModelTypeSectionField(Base):
    __tablename__ = 'model_type_section_fields'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_id = Column(UUID(as_uuid=True), ForeignKey('model_type_sections.id'), nullable=False)
    description = Column(String)
    field_title = Column(String, nullable=False)
    field_key = Column(String, nullable=False)
    field_type = Column(String, nullable=False)
    default_value = Column(String)
    required = Column(Boolean, default=False)
    time_phased = Column(Boolean, default=False)
    order = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    active = Column(Boolean, default=True)

class UserModel(Base):
    __tablename__ = 'user_models'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    model_type_id = Column(UUID(as_uuid=True), ForeignKey('model_types.id'), nullable=False)
    active = Column(Boolean, default=True)
    name = Column(String, nullable=False)
    street_address = Column(String)
    city = Column(String)
    state = Column(String)
    zip_code = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class UserModelVersion(Base):
    __tablename__ = 'user_model_versions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_id = Column(UUID(as_uuid=True), ForeignKey('user_models.id'), nullable=False)
    version_number = Column(Integer, nullable=False)
    google_sheet_url = Column(String)        # URL to the linked Google Sheet
    levered_irr = Column(String)             # e.g. "33.9%"
    levered_moic = Column(String)            # e.g. "2.78x"
    table_mapping_output = Column(JSONB)     # styled table content for frontend rendering
    variables = Column(JSONB)                # e.g. { "Going-in Cap Rate": "5.25%" }
    sensitivity_tables = Column(JSONB)       # e.g. { status: 'generating' } or { irr_table: {...}, moic_table: {...} }
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class UserModelFieldValue(Base):
    __tablename__ = 'user_model_field_values'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    field_id = Column(UUID(as_uuid=True), ForeignKey('model_type_section_fields.id'), nullable=False)
    value = Column(Text)
    start_month = Column(Integer)
    end_month = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class Unit(Base):
    __tablename__ = 'units'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    rent_type = Column(String)
    vacate_flag = Column(Integer)
    layout = Column(String)
    square_feet = Column(Integer)
    vacate_month = Column(Integer)
    current_rent = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class MarketRentAssumption(Base):
    __tablename__ = 'market_rent_assumptions'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    layout = Column(String)
    pf_rent = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now()) 

class GrowthRates(Base):
    __tablename__ = 'growth_rates'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    name = Column(String)
    value = Column(Float)
    type = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now()) 

class AmenityIncome(Base):
    __tablename__ = 'amenity_income'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    name = Column(String)
    start_month = Column(Integer)
    utilization = Column(Float)
    unit_count = Column(Integer)
    monthly_fee = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now()) 

class OperatingExpenses(Base):
    __tablename__ = 'operating_expenses'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    name = Column(String)
    factor = Column(Float)
    broker = Column(Float)
    cost_per = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Expenses(Base):
    __tablename__ = 'expenses'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    name = Column(String)
    factor = Column(String)
    cost_per = Column(Float)
    statistic = Column(Float)
    start_month = Column(Integer)
    end_month = Column(Integer)
    type = Column(String)
    rent_type_included = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class RetailIncome(Base):
    __tablename__ = 'retail_income'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_version_id = Column(UUID(as_uuid=True), ForeignKey('user_model_versions.id'), nullable=False)
    suite = Column(String)
    tenant_name = Column(String)
    square_feet = Column(Float)
    rent_start_month = Column(Integer)
    annual_bumps = Column(Float) 
    rent_per_square_foot_per_year = Column(Float)
    rent_type = Column(String)
    lease_start_month = Column(Integer)
    lease_end_month = Column(Integer)
    recovery_start_month = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# Notes attached to a specific user_model (not versioned)
class ModelNote(Base):
    __tablename__ = 'model_notes'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_id = Column(UUID(as_uuid=True), ForeignKey('user_models.id'), nullable=False)
    note_value = Column(Text)
    status = Column(String, default='active')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ModelPicture(Base):
    __tablename__ = 'model_pictures'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_id = Column(UUID(as_uuid=True), ForeignKey('user_models.id'), nullable=False)
    picture_url = Column(String, nullable=False)
    description = Column(Text)
    picture_order = Column(Integer)
    status = Column(String, default='active')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

class ModelTag(Base):
    __tablename__ = 'model_tags'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_model_id = Column(UUID(as_uuid=True), ForeignKey('user_models.id'), nullable=False)
    tag_name = Column(String, nullable=False)
    tag_color = Column(String, nullable=True)
    status = Column(String, default='active')
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

# --- User-submitted Issues / Feedback ---
class Issue(Base):
    __tablename__ = 'issues'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    page = Column(String, nullable=False)           # e.g., '/create-model/123', '/home'
    subsection = Column(String)                     # e.g., step title; optional
    issue = Column(Text, nullable=False)            # user-submitted description
    created_at = Column(DateTime, server_default=func.now())


