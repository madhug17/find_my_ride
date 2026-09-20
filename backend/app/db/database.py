from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    # Quick connectivity test
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Could not connect to {DATABASE_URL}: {e}")
    print("Falling back to local SQLite database (find_my_ride.db)")
    import os
    db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../find_my_ride.db"))
    DATABASE_URL = f"sqlite:///{db_file}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

print("=" * 50)
print("ACTIVE DATABASE URL:", DATABASE_URL)
print("=" * 50)

Base = declarative_base()