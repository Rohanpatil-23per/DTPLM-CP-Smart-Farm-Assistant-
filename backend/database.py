"""
Database configuration supporting PostgreSQL and SQLite.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Always resolve the environment file and SQLite database relative to this
# module, not to the directory from which the server was launched.
BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{(BACKEND_DIR / 'smart_farming.db').as_posix()}"
)

print(
    f"Using database: "
    f"{DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'SQLite'}"
)

# -------------------------
# Engine Creation
# -------------------------
if "postgresql" in DATABASE_URL.lower():

    engine = create_engine(
        DATABASE_URL,
        future=True,
        echo=False,
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True,
    )

    print("PostgreSQL engine created")

else:
    engine = create_engine(
        DATABASE_URL,
        future=True,
        echo=False,
        connect_args={"check_same_thread": False}
    )

    print("SQLite engine created")

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True
)

Base = declarative_base()


# -------------------------
# Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# IMPORT MODELS + CREATE TABLES
# -------------------------
import models   # ⭐ REQUIRED

Base.metadata.create_all(bind=engine)

# Add newer profile columns to databases created by older versions. SQLite
# does not support "ADD COLUMN IF NOT EXISTS", so inspect first instead.
profile_columns = [
    ("land_owned_acres", "FLOAT"),
    ("land_in_use_acres", "FLOAT"),
    ("revenue", "FLOAT"),
]
existing_columns = {column["name"] for column in inspect(engine).get_columns("users")}

with engine.begin() as conn:
    for column_name, column_type in profile_columns:
        if column_name not in existing_columns:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))

print("Database tables created / verified")
