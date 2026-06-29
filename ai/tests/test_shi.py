from spandan_ai.health.shi import (
    Defect,
    HealthBand,
    Severity,
    classify_band,
    compute_shi,
    deduction_value,
)


def test_no_defects_is_perfect_health():
    r = compute_shi([])
    assert r.shi == 100.0
    assert r.band == HealthBand.HEALTHY
    assert not r.is_critical


def test_deduction_uses_weight_severity_extent():
    # 0.55 * 1.0 (pothole) * 3 (high) * 10 (extent%) = 16.5
    d = Defect("pothole", Severity.HIGH, extent_pct=10.0)
    assert round(deduction_value(d), 2) == 16.5


def test_weights_rank_pothole_above_efflorescence():
    p = deduction_value(Defect("pothole", Severity.MEDIUM, 10))
    e = deduction_value(Defect("efflorescence", Severity.MEDIUM, 10))
    assert p > e


def test_unknown_defect_uses_default_weight():
    # 0.55 * 0.5 (default) * 1 (low) * 10 = 2.75
    d = Defect("unknown_thing", Severity.LOW, 10.0)
    assert round(deduction_value(d), 2) == 2.75


def test_band_thresholds():
    assert classify_band(90) == HealthBand.HEALTHY
    assert classify_band(85) == HealthBand.HEALTHY
    assert classify_band(84.9) == HealthBand.DEGRADING
    assert classify_band(55) == HealthBand.DEGRADING
    assert classify_band(54.9) == HealthBand.CRITICAL
    assert classify_band(25) == HealthBand.CRITICAL
    assert classify_band(24.9) == HealthBand.FAILURE_RISK


def test_shi_clamped_and_contributions_sorted():
    defects = [
        Defect("pothole", Severity.HIGH, 100.0),
        Defect("efflorescence", Severity.LOW, 100.0),
    ]
    r = compute_shi(defects)
    assert r.shi == 0.0  # huge deduction clamps to zero
    assert r.contributions[0][0] == "pothole"  # largest contributor first
    assert r.is_critical
