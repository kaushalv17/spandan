import pytest

from spandan_ai.models import Detection
from spandan_ai.models.registry import (
    available_models,
    get_detector,
    register_model,
)


class _DummyDetector:
    name = "dummy"

    def predict(self, image_path: str) -> list[Detection]:
        return [
            Detection(label="pothole", confidence=0.9, bbox=(0, 0, 10, 10), area_fraction=0.1)
        ]


def test_default_model_registered():
    assert "yolov8" in available_models()


def test_register_and_get_custom_detector():
    register_model("dummy")(lambda **kw: _DummyDetector())
    det = get_detector("dummy")
    out = det.predict("x.jpg")
    assert det.name == "dummy"
    assert out[0].label == "pothole"


def test_unknown_model_raises():
    with pytest.raises(KeyError):
        get_detector("does-not-exist")
