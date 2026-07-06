"""Classical-CV fallback detector.

Used until trained YOLOv8 weights (weights/yolov8_spandan.pt) are dropped in.
Estimates crack / defect coverage from the image with Canny edge density so the
SHI pipeline produces realistic, image-driven health scores fully offline.
Deterministic: the same image always yields the same defects.
"""
from __future__ import annotations

import cv2
import numpy as np

from .base import Detection


class DemoDetector:
    name = "demo-cv"

    def predict(self, image_path: str) -> list[Detection]:
        img = cv2.imread(image_path)
        if img is None:
            return []
        h, w = img.shape[:2]
        image_area = float(h * w) or 1.0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 60, 160)
        edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)
        edge_ratio = float(cv2.countNonZero(edges)) / image_area

        contours, _ = cv2.findContours(
            edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]

        dets: list[Detection] = []

        # Largest edge blob -> a pothole (blocky) or alligator crack (spread).
        if contours:
            x, y, cw, ch = cv2.boundingRect(contours[0])
            bbox_area = float(cw * ch)
            aspect = cw / float(ch + 1)
            is_blocky = 0.6 < aspect < 1.7 and bbox_area > image_area * 0.03
            label = "pothole" if is_blocky else "alligator_crack"
            dets.append(
                Detection(
                    label=label,
                    confidence=0.62,
                    bbox=(float(x), float(y), float(x + cw), float(y + ch)),
                    area_fraction=min(0.5, max(0.03, bbox_area / image_area)),
                )
            )

        # A linear crack whose extent scales with overall edge density.
        primary_extent = max(0.02, min(0.45, edge_ratio * 2.5))
        dets.append(
            Detection(
                label="longitudinal_crack",
                confidence=0.55,
                bbox=(0.0, 0.0, float(w), float(h) * 0.12),
                area_fraction=primary_extent,
            )
        )
        return dets
