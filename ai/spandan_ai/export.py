"""Export a trained YOLOv8 model to ONNX for portable, CPU-friendly inference.

    python -m spandan_ai.export --weights runs/spandan_yolov8/weights/best.pt
"""
from __future__ import annotations

import argparse

from .config import get_settings
from .logging import configure_logging, get_logger

log = get_logger("export")


def export_onnx(weights: str, opset: int = 12, imgsz: int = 640, dynamic: bool = True) -> str:
    from ultralytics import YOLO

    model = YOLO(weights)
    path = model.export(format="onnx", opset=opset, imgsz=imgsz, dynamic=dynamic)
    log.info("exported", path=str(path))
    return str(path)


def main() -> None:
    configure_logging()
    settings = get_settings()
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", default=settings.model_weights)
    parser.add_argument("--opset", type=int, default=12)
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()
    export_onnx(args.weights, args.opset, args.imgsz)


if __name__ == "__main__":
    main()
