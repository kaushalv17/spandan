from pathlib import Path

from spandan_ai.config import get_settings
from spandan_ai.data.prepare import UNIFIED_CLASSES, split


def test_settings_load_defaults():
    s = get_settings()
    assert s.model_name == "yolov8"
    assert s.data_root


def test_unified_classes_are_unique():
    assert len(UNIFIED_CLASSES) == len(set(UNIFIED_CLASSES))


def test_split_is_deterministic_and_partitions():
    imgs = [Path(f"{i}.jpg") for i in range(100)]
    a = split(imgs)
    b = split(imgs)
    assert a == b
    assert len(a["train"]) + len(a["val"]) + len(a["test"]) == 100
