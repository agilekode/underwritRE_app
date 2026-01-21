from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth0_user_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Billing
    stripe_customer_id = Column(String, unique=True, nullable=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    subscription_status = Column(String, nullable=True, index=True)
    current_period_end = Column(Integer, nullable=True)   # or DateTime if you prefer
    cancel_at_period_end = Column(Boolean, default=False)
    plan_price_id = Column(String, nullable=True)


class UserInfo(Base):
    __tablename__ = "user_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    job_role = Column(String)
    company = Column(String)
    experience_level = Column(String)
    asset_type_focus = Column(JSONB)
    typical_deal_size = Column(String)
    geographic_focus = Column(String)
    hear_about_us = Column(String)
    keep_updated = Column(Boolean)
    time_created = Column(DateTime, server_default=func.now())
    accepted_terms_and_conditions = Column(Boolean)
    accepted_terms_and_conditions_date = Column(DateTime)


class CompanyInfo(Base):
    __tablename__ = "company_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # 1:1 with users
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)

    company_name = Column(String)
    company_email = Column(String)
    company_phone_number = Column(String)
    company_logo_url = Column(String)  # URL string

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

