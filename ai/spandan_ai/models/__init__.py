"""Perception models: detector interface and pluggable registry."""
from .base import Detection, Detector
from .registry import available_models, get_detector, register_model

__all__ = [
    "Detection",
    "Detector",
    "available_models",
    "get_detector",
    "register_model",
]
