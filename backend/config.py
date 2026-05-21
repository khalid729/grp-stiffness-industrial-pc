from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # PLC Configuration
    PLC_IP: str = "192.168.0.100"
    PLC_RACK: int = 0
    PLC_SLOT: int = 1

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./grp_test.db"
    DATABASE_SYNC_URL: str = "sqlite:///./grp_test.db"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # WebSocket
    WS_UPDATE_INTERVAL: float = 0.02  # 20ms (50Hz)

    # Safety Limits
    MAX_FORCE: float = 200.0  # kN
    MAX_STROKE: float = 500.0  # mm
    MIN_SPEED: float = 1.0  # mm/min
    MAX_SPEED: float = 100.0  # mm/min

    # Load-cell span correction (workaround for SIWAREX gain drift).
    # Applied to force readings: scaled = raw_actual × FORCE_SCALE_FACTOR.
    # Multiplicative so zero stays zero. Set to 1.0 to disable.
    # Default 1.0658 ≈ 10050 / 9430 from external-vs-machine stiffness comparison.
    FORCE_SCALE_FACTOR: float = 1.0658

    class Config:
        env_file = ".env"


settings = Settings()
