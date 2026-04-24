from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    bot_token: str = Field(alias="BOT_TOKEN")
    api_url: str = Field(default="http://localhost:8000", alias="API_URL")
    app_url: str = Field(default="http://localhost:3000", alias="APP_URL")


@lru_cache
def get_settings() -> Settings:
    return Settings()
