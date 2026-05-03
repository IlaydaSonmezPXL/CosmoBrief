from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    openai_api_key: str
    snapi_cache_ttl_minutes: int = 15

    model_config = {"env_file": ".env"}


settings = Settings()  # type: ignore[call-arg]
