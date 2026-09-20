import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
_root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./find_my_ride.db"
    SECRET_KEY: str = "my-super-secret-key-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    model_config = SettingsConfigDict(
        env_file=(_backend_env, _root_env, ".env"),
        extra="ignore"
    )

settings = Settings()