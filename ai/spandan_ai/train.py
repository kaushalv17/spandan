"""Train the Spandan detector with Ultralytics YOLOv8, Hydra config, and
optional MLflow tracking.

    python -m spandan_ai.train
    python -m spandan_ai.train model.epochs=100 model.imgsz=960
"""
from __future__ import annotations

from pathlib import Path

import hydra
from omegaconf import DictConfig, OmegaConf

from .logging import configure_logging, get_logger

log = get_logger("train")


@hydra.main(version_base=None, config_path="../configs", config_name="config")
def main(cfg: DictConfig) -> None:
    configure_logging()
    log.info("train_config", config=OmegaConf.to_container(cfg, resolve=True))

    from ultralytics import YOLO

    mlflow_enabled = bool(cfg.tracking.mlflow)
    if mlflow_enabled:
        import mlflow

        mlflow.set_experiment(cfg.tracking.experiment)
        mlflow.start_run()
        mlflow.log_params(
            {
                "model": cfg.model.arch,
                "epochs": cfg.model.epochs,
                "imgsz": cfg.model.imgsz,
                "batch": cfg.model.batch,
            }
        )

    model = YOLO(cfg.model.arch)
    results = model.train(
        data=cfg.data.yaml,
        epochs=cfg.model.epochs,
        imgsz=cfg.model.imgsz,
        batch=cfg.model.batch,
        device=cfg.model.device,
        project=cfg.output.dir,
        name=cfg.output.run_name,
        seed=cfg.seed,
    )

    if mlflow_enabled:
        import mlflow

        metrics = getattr(results, "results_dict", {}) or {}
        mlflow.log_metrics(
            {k: float(v) for k, v in metrics.items() if isinstance(v, (int, float))}
        )
        best = Path(model.trainer.save_dir) / "weights" / "best.pt"
        if best.exists():
            mlflow.log_artifact(str(best))
        mlflow.end_run()

    log.info("train_complete")


if __name__ == "__main__":
    main()
