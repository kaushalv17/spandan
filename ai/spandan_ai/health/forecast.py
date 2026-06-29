"""Failure forecasting: least-squares SHI trend -> proxy Remaining Useful Life.

Given a history of (elapsed_days, shi) observations, fit a straight line and
project the day on which SHI crosses CRITICAL_THRESHOLD. The gap from the latest
observation to that crossing is a proxy Remaining Useful Life (RUL). Pure Python.
"""
from __future__ import annotations

from dataclasses import dataclass

from .shi import CRITICAL_THRESHOLD


def linear_fit(xs: list[float], ys: list[float]) -> tuple[float, float]:
    """Ordinary least-squares fit. Returns (slope, intercept)."""
    n = len(xs)
    if n != len(ys) or n < 2:
        raise ValueError("need at least two paired points")
    mean_x = sum(xs) / n
    mean_y = sum(ys) / n
    sxx = sum((x - mean_x) ** 2 for x in xs)
    if sxx == 0:
        raise ValueError("all x values are identical; cannot fit a trend")
    sxy = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    slope = sxy / sxx
    intercept = mean_y - slope * mean_x
    return slope, intercept


@dataclass(frozen=True)
class ForecastResult:
    slope_per_day: float
    intercept: float
    current_shi: float
    threshold: float
    rul_days: float | None  # None => not trending toward failure

    @property
    def will_fail(self) -> bool:
        return self.rul_days is not None


def forecast_rul(
    history: list[tuple[float, float]],
    threshold: float = CRITICAL_THRESHOLD,
) -> ForecastResult:
    """history: list of (elapsed_days, shi), chronologically ordered."""
    xs = [t for t, _ in history]
    ys = [s for _, s in history]
    slope, intercept = linear_fit(xs, ys)
    last_t = xs[-1]
    current = slope * last_t + intercept

    rul: float | None = None
    if current <= threshold:
        rul = 0.0  # already at or below critical
    elif slope < 0:
        t_cross = (threshold - intercept) / slope
        rul = max(0.0, t_cross - last_t)

    return ForecastResult(
        slope_per_day=slope,
        intercept=intercept,
        current_shi=current,
        threshold=threshold,
        rul_days=rul,
    )
