from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    api_prefix: str = "/api/v1"

    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"

    stt_provider: str = "groq"
    vision_provider: str = "groq"

    groq_stt_model: str = "whisper-large-v3-turbo"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"

    screenshot_storage_path: str = "./screenshots"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
