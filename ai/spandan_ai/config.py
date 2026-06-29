"""Centralised, validated configuration (12-factor, env-driven)."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    model_name: str = Field("yolov8", alias="MODEL_NAME")
    model_weights: str = Field("weights/yolov8_spandan.pt", alias="MODEL_WEIGHTS")
    inference_device: str = Field("cpu", alias="INFERENCE_DEVICE")
    data_root: str = Field("data", alias="DATA_ROOT")
    log_level: str = Field("INFO", alias="LOG_LEVEL")


@lru_cache
def get_settings() -> Settings:
    return Settings()
