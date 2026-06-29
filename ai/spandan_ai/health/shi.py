"""Structural Health Index (SHI) engine.

    SHI = 100 - sum( DV(type, severity, extent) ), clamped to [0, 100]
    DV  = k * w(type) * s(severity) * e(extent_pct)

Adapted from the PCI / ASTM D6433 pavement deduct-value methodology and
generalised into a sensor-agnostic, multi-asset degradation score. Pure Python:
no third-party dependencies, so it is fully unit-testable in the slim install.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

# Base coefficient (locked). Calibrated so realistic small-extent defects
# accumulate gradually while catastrophic full-extent defects drive SHI to 0.
K: float = 0.55


class Severity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


SEVERITY_SCORE: dict[Severity, int] = {
    Severity.LOW: 1,
    Severity.MEDIUM: 2,
    Severity.HIGH: 3,
}

# Relative structural impact per unified defect class (0..1).
DEFECT_WEIGHTS: dict[str, float] = {
    "pothole": 1.0,
    "exposed_rebar": 1.0,
    "alligator_crack": 0.9,
    "spallation": 0.9,
    "transverse_crack": 0.6,
    "longitudinal_crack": 0.5,
    "corrosion_stain": 0.5,
    "efflorescence": 0.4,
}
DEFAULT_WEIGHT: float = 0.5

# Band thresholds (inclusive lower bound).
HEALTHY_THRESHOLD: float = 85.0
CRITICAL_THRESHOLD: float = 55.0
FAILURE_THRESHOLD: float = 25.0


class HealthBand(StrEnum):
    HEALTHY = "Healthy"
    DEGRADING = "Degrading"
    CRITICAL = "Critical"
    FAILURE_RISK = "Failure-risk"


BAND_EMOJI: dict[HealthBand, str] = {
    HealthBand.HEALTHY: "\U0001F7E2",
    HealthBand.DEGRADING: "\U0001F7E1",
    HealthBand.CRITICAL: "\U0001F7E0",
    HealthBand.FAILURE_RISK: "\U0001F534",
}


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(value, high))


@dataclass(frozen=True)
class Defect:
    """A single detected defect contributing to degradation.

    extent_pct is the share of the inspected asset surface affected (0..100).
    """

    type: str
    severity: Severity
    extent_pct: float
    confidence: float = 1.0

    def weight(self) -> float:
        return DEFECT_WEIGHTS.get(self.type, DEFAULT_WEIGHT)


def deduction_value(defect: Defect, k: float = K) -> float:
    """Compute the deduction value (DV) of a single defect."""
    w = defect.weight()
    s = SEVERITY_SCORE[defect.severity]
    e = _clamp(defect.extent_pct, 0.0, 100.0)
    return k * w * s * e


def classify_band(shi: float) -> HealthBand:
    if shi >= HEALTHY_THRESHOLD:
        return HealthBand.HEALTHY
    if shi >= CRITICAL_THRESHOLD:
        return HealthBand.DEGRADING
    if shi >= FAILURE_THRESHOLD:
        return HealthBand.CRITICAL
    return HealthBand.FAILURE_RISK


@dataclass(frozen=True)
class SHIResult:
    shi: float
    band: HealthBand
    emoji: str
    total_deduction: float
    contributions: list[tuple[str, float]] = field(default_factory=list)

    @property
    def is_critical(self) -> bool:
        return self.shi < CRITICAL_THRESHOLD


def compute_shi(defects: list[Defect], k: float = K) -> SHIResult:
    """Aggregate per-defect deductions into a single 0..100 health index."""
    contributions: list[tuple[str, float]] = []
    total = 0.0
    for d in defects:
        dv = deduction_value(d, k)
        total += dv
        contributions.append((d.type, round(dv, 2)))
    shi = _clamp(100.0 - total, 0.0, 100.0)
    band = classify_band(shi)
    contributions.sort(key=lambda c: c[1], reverse=True)
    return SHIResult(
        shi=round(shi, 2),
        band=band,
        emoji=BAND_EMOJI[band],
        total_deduction=round(total, 2),
        contributions=contributions,
    )
