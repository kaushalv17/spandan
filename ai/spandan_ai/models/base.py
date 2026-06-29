"""Detector interface shared by all perception models."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True)
class Detection:
    """A single detection in an image."""

    label: str                                # unified defect class
    confidence: float
    bbox: tuple[float, float, float, float]   # x1, y1, x2, y2 in pixels
    area_fraction: float                      # bbox area / image area (0..1)


@runtime_checkable
class Detector(Protocol):
    """Any perception model that maps an image to defect detections."""

    name: str

    def predict(self, image_path: str) -> list[Detection]:
        ...
