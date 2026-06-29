"""YOLOv8 detector (Ultralytics).

Maps raw model class names to unified Spandan defect classes and computes a
per-detection area fraction that the SHI engine consumes as defect extent.
Ultralytics/torch are imported lazily so the module is safe to import without
the ML extra installed.
"""
from __future__ import annotations

from ..config import get_settings
from ..logging import get_logger
from .base import Detection

log = get_logger("yolo")

# Maps raw model labels (e.g. RDD2022 codes) -> unified Spandan defect classes.
LABEL_MAP: dict[str, str] = {
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole",
    "pothole": "pothole",
    "crack": "longitudinal_crack",
    "spallation": "spallation",
    "exposed_rebar": "exposed_rebar",
    "efflorescence": "efflorescence",
    "corrosion": "corrosion_stain",
}


class YOLOv8Detector:
    name = "yolov8"

    def __init__(
        self,
        weights: str | None = None,
        device: str | None = None,
        conf: float = 0.25,
    ) -> None:
        from ultralytics import YOLO

        settings = get_settings()
        self.weights = weights or settings.model_weights
        self.device = device or settings.inference_device
        self.conf = conf
        self._model = YOLO(self.weights)

    def predict(self, image_path: str) -> list[Detection]:
        results = self._model.predict(
            image_path, conf=self.conf, device=self.device, verbose=False
        )
        detections: list[Detection] = []
        for r in results:
            h, w = r.orig_shape
            image_area = float(h * w) or 1.0
            names = r.names
            for box in r.boxes:
                cls_id = int(box.cls.item())
                raw = names.get(cls_id, str(cls_id))
                label = LABEL_MAP.get(raw, raw)
                x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
                detections.append(
                    Detection(
                        label=label,
                        confidence=float(box.conf.item()),
                        bbox=(x1, y1, x2, y2),
                        area_fraction=area / image_area,
                    )
                )
        return detections
