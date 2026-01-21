from flask_sqlalchemy import SQLAlchemy
import os
from sqlalchemy.ext.declarative import declarative_base

db = SQLAlchemy()

Base = declarative_base() 