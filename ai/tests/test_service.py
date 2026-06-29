import pytest

pytest.importorskip("fastapi")

from fastapi.testclient import TestClient  # noqa: E402

from spandan_ai.service.app import app  # noqa: E402

client = TestClient(app)


def test_health_endpoint():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_shi_endpoint_computes_band():
    payload = {"defects": [{"type": "pothole", "severity": "high", "extent_pct": 10}]}
    r = client.post("/shi", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["shi"] == 83.5  # 100 - 16.5
    assert body["band"] == "Degrading"
