"""API request/response models for the inference service."""
from __future__ import annotations

from pydantic import BaseModel, Field

from ..health.shi import HealthBand, Severity


class DefectIn(BaseModel):
    type: str
    severity: Severity
    extent_pct: float = Field(ge=0, le=100)
    confidence: float = Field(default=1.0, ge=0, le=1)


class SHIRequest(BaseModel):
    defects: list[DefectIn] = Field(default_factory=list)


class ContributionOut(BaseModel):
    type: str
    deduction: float


class SHIResponse(BaseModel):
    shi: float
    band: HealthBand
    emoji: str
    total_deduction: float
    contributions: list[ContributionOut]


class DetectionOut(BaseModel):
    label: str
    confidence: float
    bbox: tuple[float, float, float, float]
    area_fraction: float


class InferResponse(BaseModel):
    detections: list[DetectionOut]
    health: SHIResponse
