"""Classical-CV fallback detector (tuned).

Used until trained YOLOv8 weights (weights/yolov8_spandan.pt) are dropped in.
Estimates crack + pothole/spall coverage from the image (Canny edge density for
cracks, dark-region coverage for potholes) and scales it into defect extents so
the SHI pipeline produces a realistic, nuanced score fully offline.
Deterministic: the same image always yields the same defects.

Calibrated so graded demo images span all four SHI bands
(Healthy / Degrading / Critical / Failure-risk).
"""
from __future__ import annotations

import cv2
import numpy as np

from .base import Detection

# Tuning constants (verified against the SHI formula on the demo image set).
K_CRACK = 4.0
K_DARK = 1.6
CAP_CRACK = 0.45
CAP_DARK = 0.45
ALLIGATOR_THRESHOLD = 0.08  # edge density above which cracking is "networked"


def _largest_bbox(mask: np.ndarray, w: int, h: int) -> tuple[float, float, float, float]:
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return (0.0, 0.0, float(w), float(h))
    c = max(contours, key=cv2.contourArea)
    x, y, cw, ch = cv2.boundingRect(c)
    return (float(x), float(y), float(x + cw), float(y + ch))


class DemoDetector:
    name = "demo-cv"

    def predict(self, image_path: str) -> list[Detection]:
        img = cv2.imread(image_path)
        if img is None:
            return []
        h, w = img.shape[:2]
        area = float(h * w) or 1.0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.dilate(cv2.Canny(blur, 60, 160), np.ones((3, 3), np.uint8), 1)
        crack_ratio = float(cv2.countNonZero(edges)) / area

        _, dark = cv2.threshold(blur, 70, 255, cv2.THRESH_BINARY_INV)
        dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
        dark_ratio = float(cv2.countNonZero(dark)) / area

        dets: list[Detection] = []

        # Dark blobs -> pothole (road) / spalling (concrete).
        if dark_ratio > 0.004:
            af = min(CAP_DARK, dark_ratio * K_DARK)
            dets.append(
                Detection(
                    label="pothole",
                    confidence=0.66,
                    bbox=_largest_bbox(dark, w, h),
                    area_fraction=af,
                )
            )

        # Edge density -> crack severity; networked cracking -> alligator.
        if crack_ratio > 0.002:
            af = min(CAP_CRACK, crack_ratio * K_CRACK)
            label = (
                "alligator_crack" if crack_ratio > ALLIGATOR_THRESHOLD else "longitudinal_crack"
            )
            dets.append(
                Detection(
                    label=label,
                    confidence=0.6,
                    bbox=_largest_bbox(edges, w, h),
                    area_fraction=af,
                )
            )

        if not dets:
            dets.append(
                Detection(
                    label="longitudinal_crack",
                    confidence=0.4,
                    bbox=(0.0, 0.0, float(w), float(h) * 0.1),
                    area_fraction=0.02,
                )
            )
        return dets
