from dataclasses import dataclass
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

@dataclass
class DatabaseConfig:
    type: str
    name: str
    host: Optional[str] = None
    port: Optional[int] = None
    user: Optional[str] = None
    password: Optional[str] = None

    @property
    def connection_string(self) -> str:
        if self.type.lower() == "sqlite":
            return f"sqlite:///{self.name}"
        elif self.type.lower() == "postgresql":
            return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
        raise ValueError(f"Unsupported database type: {self.type}")

@dataclass
class APIConfig:
    host: str
    port: int
    openai_api_key: str
    secret_key: str
    access_token_expire_minutes: int

@dataclass
class LoggingConfig:
    level: str

@dataclass
class FeatureFlags:
    enable_analytics: bool
    enable_team_updates: bool
    enable_ai_copilot: bool

@dataclass
class AppConfig:
    database: DatabaseConfig
    api: APIConfig
    logging: LoggingConfig
    features: FeatureFlags
    base_dir: Path = Path(__file__).parent.parent

    @classmethod
    def from_env(cls) -> 'AppConfig':
        """Create configuration from environment variables."""
        database = DatabaseConfig(
            type=os.getenv("DB_TYPE", "sqlite"),
            name=os.getenv("DB_NAME", "epragati.db"),
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", "5432")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
        )

        api = APIConfig(
            host=os.getenv("API_HOST", "0.0.0.0"),
            port=int(os.getenv("API_PORT", "8001")),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            secret_key=os.getenv("SECRET_KEY", ""),
            access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        )

        logging = LoggingConfig(
            level=os.getenv("LOG_LEVEL", "INFO"),
        )

        features = FeatureFlags(
            enable_analytics=os.getenv("ENABLE_ANALYTICS", "true").lower() == "true",
            enable_team_updates=os.getenv("ENABLE_TEAM_UPDATES", "true").lower() == "true",
            enable_ai_copilot=os.getenv("ENABLE_AI_COPILOT", "true").lower() == "true",
        )

        return cls(
            database=database,
            api=api,
            logging=logging,
            features=features,
        )

# Create a global config instance
config = AppConfig.from_env() 