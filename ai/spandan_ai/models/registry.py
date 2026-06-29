"""Pluggable model registry.

YOLOv8 is the default detector. New detectors register under a name and become
available to the service and training code without changing call sites. The
default factory imports the heavy YOLO implementation lazily, so importing this
module never pulls in torch/ultralytics.
"""
from __future__ import annotations

from collections.abc import Callable

from .base import Detector

DetectorFactory = Callable[..., Detector]

_REGISTRY: dict[str, DetectorFactory] = {}
DEFAULT_MODEL = "yolov8"


def register_model(name: str) -> Callable[[DetectorFactory], DetectorFactory]:
    def deco(factory: DetectorFactory) -> DetectorFactory:
        _REGISTRY[name] = factory
        return factory

    return deco


def available_models() -> list[str]:
    return sorted(_REGISTRY)


def get_detector(name: str = DEFAULT_MODEL, **kwargs: object) -> Detector:
    if name not in _REGISTRY:
        raise KeyError(f"unknown model '{name}'; available: {available_models()}")
    return _REGISTRY[name](**kwargs)


def _yolo_factory(
    weights: str | None = None,
    device: str | None = None,
    conf: float = 0.25,
) -> Detector:
    from .yolo import YOLOv8Detector

    return YOLOv8Detector(weights=weights, device=device, conf=conf)


_REGISTRY[DEFAULT_MODEL] = _yolo_factory
