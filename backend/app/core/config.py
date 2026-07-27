from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    DATABASE_URL: str
    SCRETE_KEY: str
    ALGORITHM: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    class config:
        env_file=".env"
settings = Settings()