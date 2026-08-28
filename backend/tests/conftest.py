import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

import os

os.environ["DATABASE_URL"] = (
    "postgresql://postgres:1658@127.0.0.1:5434/find_my_ride_test"
)

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import engine
from app.db.base import Base