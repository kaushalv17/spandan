"""FastAPI inference service: image -> detections -> defects -> SHI."""
from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile

from ..config import get_settings
from ..health.shi import Defect, Severity, compute_shi
from ..logging import configure_logging, get_logger
from ..models.base import Detector
from ..models.registry import DEFAULT_MODEL, get_detector
from .schemas import (
    ContributionOut,
    DetectionOut,
    InferResponse,
    SHIRequest,
    SHIResponse,
)

configure_logging()
log = get_logger("service")
app = FastAPI(title="Spandan Model Service", version="0.1.0")

_detector: Detector | None = None


def _detector_instance() -> Detector:
    global _detector
    if _detector is None:
        _detector = get_detector(get_settings().model_name or DEFAULT_MODEL)
    return _detector


def _severity_from_area(area_fraction: float) -> Severity:
    if area_fraction >= 0.20:
        return Severity.HIGH
    if area_fraction >= 0.05:
        return Severity.MEDIUM
    return Severity.LOW


def _shi_response(defects: list[Defect]) -> SHIResponse:
    result = compute_shi(defects)
    return SHIResponse(
        shi=result.shi,
        band=result.band,
        emoji=result.emoji,
        total_deduction=result.total_deduction,
        contributions=[
            ContributionOut(type=t, deduction=d) for t, d in result.contributions
        ],
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "spandan-ai"}


@app.post("/shi", response_model=SHIResponse)
def shi_endpoint(req: SHIRequest) -> SHIResponse:
    defects = [
        Defect(
            type=d.type,
            severity=d.severity,
            extent_pct=d.extent_pct,
            confidence=d.confidence,
        )
        for d in req.defects
    ]
    return _shi_response(defects)


@app.post("/infer", response_model=InferResponse)
async def infer(file: UploadFile = File(...)) -> InferResponse:
    suffix = Path(file.filename or "upload.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    detections = _detector_instance().predict(tmp_path)
    defects = [
        Defect(
            type=d.label,
            severity=_severity_from_area(d.area_fraction),
            extent_pct=d.area_fraction * 100.0,
            confidence=d.confidence,
        )
        for d in detections
    ]
    return InferResponse(
        detections=[
            DetectionOut(
                label=d.label,
                confidence=d.confidence,
                bbox=d.bbox,
                area_fraction=d.area_fraction,
            )
            for d in detections
        ],
        health=_shi_response(defects),
    )
