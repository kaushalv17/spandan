import pytest

from spandan_ai.health.forecast import forecast_rul, linear_fit


def test_linear_fit_perfect_line():
    slope, intercept = linear_fit([0, 1, 2, 3], [10, 8, 6, 4])
    assert round(slope, 6) == -2.0
    assert round(intercept, 6) == 10.0


def test_forecast_declining_crosses_threshold():
    history = [(0, 100), (30, 90), (60, 80), (90, 70)]
    r = forecast_rul(history, threshold=55)
    assert r.will_fail
    # slope = -1/3 per day; current at t=90 is 70; (55-70)/(-1/3) = 45 days
    assert round(r.rul_days, 0) == 45


def test_forecast_stable_asset_never_fails():
    history = [(0, 95), (30, 96), (60, 95)]
    r = forecast_rul(history, threshold=55)
    assert not r.will_fail
    assert r.rul_days is None


def test_already_critical_has_zero_rul():
    history = [(0, 70), (30, 60), (60, 50)]
    r = forecast_rul(history, threshold=55)
    assert r.will_fail
    assert r.rul_days == 0.0


def test_forecast_requires_two_points():
    with pytest.raises(ValueError):
        forecast_rul([(0, 100)])
