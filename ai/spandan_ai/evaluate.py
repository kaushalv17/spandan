"""Evaluate a trained detector and dump metrics (mAP50, mAP50-95, P, R).

    python -m spandan_ai.evaluate --weights runs/spandan_yolov8/weights/best.pt
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .config import get_settings
from .logging import configure_logging, get_logger

log = get_logger("evaluate")


def evaluate(weights: str, data_yaml: str, out: str = "eval_metrics.json") -> dict[str, Any]:
    from ultralytics import YOLO

    model = YOLO(weights)
    metrics = model.val(data=data_yaml)
    payload: dict[str, Any] = {
        "map50": float(metrics.box.map50),
        "map": float(metrics.box.map),
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
    }
    Path(out).write_text(json.dumps(payload, indent=2))
    log.info("eval_metrics", **payload)
    return payload


def main() -> None:
    configure_logging()
    settings = get_settings()
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", default=settings.model_weights)
    parser.add_argument("--data", default="data/processed/spandan.yaml")
    parser.add_argument("--out", default="eval_metrics.json")
    args = parser.parse_args()
    evaluate(args.weights, args.data, args.out)


if __name__ == "__main__":
    main()
