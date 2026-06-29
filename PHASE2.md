# Spandan - Phase 2 (ML & Health Intelligence)

This phase adds the perception + degradation-intelligence core on top of the
Phase 1 foundation.

## New in this phase
- `ai/spandan_ai/health/shi.py` - Structural Health Index engine (SHI = 100 - sum of DV).
- `ai/spandan_ai/health/forecast.py` - least-squares SHI trend -> proxy Remaining Useful Life.
- `ai/spandan_ai/models/` - pluggable detector registry (`base.py`, `registry.py`, `yolo.py`).
- `ai/spandan_ai/service/` - FastAPI model service (`/health`, `/shi`, `/infer`).
- `ai/spandan_ai/train.py`, `evaluate.py`, `export.py` - YOLOv8 training (Hydra + MLflow), eval, ONNX export.
- `ai/spandan_ai/data/datasets.py` - real RDD2022 / CODEBRIM / SDNET2018 / DeepCrack adapters.
- `ai/configs/` - Hydra config tree.
- Tests: `test_shi.py`, `test_forecast.py`, `test_registry.py`, `test_service.py`.
- Phase-1 mypy fixes (logging `cast` + pydantic mypy plugin).

## Install
The SHI engine, forecasting, and registry are pure-Python and run on the Phase-1
slim install. To run training / inference / export you need the ML extras:

    cd ai
    # enable Windows long paths first (admin PowerShell), then:
    pip install -e ".[dev,ml,service]"

## Run

    # unit tests (engine + forecast + registry run WITHOUT the ML stack)
    python -m pytest -q
    python -m ruff check .
    python -m mypy spandan_ai

    # dataset pipeline
    python -m spandan_ai.data.prepare

    # train / evaluate / export
    python -m spandan_ai.train model.epochs=100
    python -m spandan_ai.evaluate --weights runs/spandan_yolov8/weights/best.pt
    python -m spandan_ai.export --weights runs/spandan_yolov8/weights/best.pt

    # model service
    uvicorn spandan_ai.service.app:app --port 8001

## SHI formula
SHI = 100 - sum(DV),  DV = k * w(type) * s(severity) * e(extent%),  k = 0.55

Bands: >=85 Healthy | >=55 Degrading | >=25 Critical | <25 Failure-risk
(CRITICAL_THRESHOLD = 55). Forecast fits the SHI history and projects the day it
crosses 55 -> proxy Remaining Useful Life.
