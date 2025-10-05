from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    google_api_key: str
    model_name: str = "models/gemini-2.5-flash"
    app_name: str = "Exoplanet Chatbot"
    debug: bool = False
    active_prompt: str = "exoplanet_expert"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        protected_namespaces = ('settings_',)


@lru_cache()
def get_settings() -> Settings:
    return Settings()