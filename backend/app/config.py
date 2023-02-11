from pydantic import BaseSettings
from dotenv import load_dotenv
import os, ast

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)


class Settings(BaseSettings):
    secret_key: str = os.environ.get("SECRET_KEY")
    ws_secret_key: str = os.environ.get("WS_SECRET_KEY")
    algorithm: str = os.environ.get("ALGORITHM")
    db_connection: dict = ast.literal_eval(os.environ.get("DATABASE_CONNECTION"))
    mail_settings: dict = ast.literal_eval(os.environ.get("EMAIL"))
    api_address: str = os.environ.get("API_ADDRESS")
    aws_access_key: str = os.environ.get("AWS_ACCESS_KEY")
    aws_secret_key: str = os.environ.get("AWS_SECRET_KEY")
