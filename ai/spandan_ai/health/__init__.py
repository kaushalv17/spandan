"""Asset health: SHI degradation engine and failure forecasting."""
from .forecast import ForecastResult, forecast_rul, linear_fit
from .shi import (
    CRITICAL_THRESHOLD,
    DEFECT_WEIGHTS,
    Defect,
    HealthBand,
    Severity,
    SHIResult,
    classify_band,
    compute_shi,
    deduction_value,
)

__all__ = [
    "CRITICAL_THRESHOLD",
    "DEFECT_WEIGHTS",
    "Defect",
    "HealthBand",
    "Severity",
    "SHIResult",
    "classify_band",
    "compute_shi",
    "deduction_value",
    "ForecastResult",
    "forecast_rul",
    "linear_fit",
]
