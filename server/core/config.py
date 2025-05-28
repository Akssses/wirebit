from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field
import json


class Settings(BaseSettings):
    wirebit_api_key: str = Field(default="55zoAaEefLMtro18SqGEW6Vmx7x0kwtc")
    wirebit_api_login: str = Field(default="FUq0VDBtUVw9t7osngo6ownacyEabfAY")
    wirebit_base_url: str = Field(default="https://wirebit.net/api/userapi/v1/")
    cors_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"])
    log_level: str = Field(default="INFO")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == "cors_origins":
                return json.loads(raw_val)
            return raw_val


settings = Settings()
