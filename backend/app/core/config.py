from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "JobZen AI"
    GEMINI_API_KEY: str = ""
    
    @property
    def cleaned_gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY.strip()
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
