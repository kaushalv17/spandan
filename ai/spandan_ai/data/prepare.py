"""One-command dataset pipeline:
    download -> verify -> convert -> merge -> split -> cache -> stats.
Run:  python -m spandan_ai.data.prepare
"""
from __future__ import annotations

import hashlib
import json
import random
import shutil
from dataclasses import dataclass
from pathlib import Path

from ..config import get_settings
from ..logging import configure_logging, get_logger

log = get_logger("dataset")

UNIFIED_CLASSES = [
    "longitudinal_crack", "transverse_crack", "alligator_crack", "pothole",
    "spallation", "exposed_rebar", "efflorescence", "corrosion_stain",
]


@dataclass(frozen=True)
class DatasetSpec:
    name: str
    url: str | None            # None => license-gated, manual download
    sha256: str | None
    license_note: str
    converter: str             # adapter function name in datasets.py
    auto_download: bool = True


DATASETS: list[DatasetSpec] = [
    DatasetSpec("rdd2022", "https://figshare.com/ndownloader/files/38030910",
                None, "CC-BY 4.0 - cite Arya et al. 2022", "rdd_yolo"),
    DatasetSpec("codebrim",
                "https://zenodo.org/records/2620293/files/"
                "CODEBRIM_classification_dataset.zip",
                None, "CC-BY 4.0 - cite Mundt et al. CVPR19", "codebrim_yolo"),
    DatasetSpec("sdnet2018", None, None,
                "Manual: digitalcommons.usu.edu/all_datasets/48",
                "sdnet_yolo", auto_download=False),
    DatasetSpec("deepcrack", None, None,
                "Non-commercial: github.com/yhlleo/DeepCrack",
                "seg_mask", auto_download=False),
]


def _root() -> Path:
    return Path(get_settings().data_root)


def _raw() -> Path:
    return _root() / "raw"


def _processed() -> Path:
    return _root() / "processed"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(spec: DatasetSpec) -> Path:
    dest = _raw() / spec.name
    dest.mkdir(parents=True, exist_ok=True)
    if not spec.auto_download or spec.url is None:
        (dest / "PLACE_FILES_HERE.txt").write_text(
            f"{spec.name}: {spec.license_note}\n")
        log.warning("manual_dataset", name=spec.name, note=spec.license_note)
        return dest
    archive = dest / Path(spec.url).name
    if not archive.exists():
        import urllib.request
        log.info("downloading", name=spec.name, url=spec.url)
        urllib.request.urlretrieve(spec.url, archive)  # noqa: S310
    if spec.sha256 and sha256(archive) != spec.sha256:
        raise ValueError(f"checksum mismatch for {spec.name}")
    if archive.suffix in {".zip", ".gz", ".tar"}:
        shutil.unpack_archive(str(archive), str(dest))
    return dest


def convert_to_yolo(spec: DatasetSpec, src: Path) -> Path:
    """Dispatch to the per-dataset adapter; each emits YOLO labels mapped into
    UNIFIED_CLASSES. Adapters live in datasets.py (Phase 2 fills them in)."""
    from . import datasets as adapters

    converter = getattr(adapters, spec.converter, None)
    out = _processed() / spec.name
    out.mkdir(parents=True, exist_ok=True)
    if converter is None:
        log.warning("converter_pending", name=spec.name, converter=spec.converter)
        return out
    converter(src, out, UNIFIED_CLASSES)
    return out


def split(images: list[Path], ratios: tuple[float, float, float] = (0.8, 0.1, 0.1),
          seed: int = 42) -> dict[str, list[Path]]:
    # Non-cryptographic: a deterministic, seeded shuffle for reproducible splits.
    rng = random.Random(seed)  # noqa: S311
    shuffled = images[:]
    rng.shuffle(shuffled)
    n = len(shuffled)
    n_train = int(n * ratios[0])
    n_val = int(n * ratios[1])
    return {
        "train": shuffled[:n_train],
        "val": shuffled[n_train:n_train + n_val],
        "test": shuffled[n_train + n_val:],
    }


def write_data_yaml(splits: dict[str, list[Path]]) -> Path:
    yaml_path = _processed() / "spandan.yaml"
    lines = [
        f"path: {_processed().resolve()}",
        "train: images/train",
        "val: images/val",
        "test: images/test",
        f"nc: {len(UNIFIED_CLASSES)}",
        "names: [" + ", ".join(UNIFIED_CLASSES) + "]",
    ]
    yaml_path.write_text("\n".join(lines))
    return yaml_path


def write_stats(splits: dict[str, list[Path]]) -> dict[str, object]:
    report: dict[str, object] = {k: len(v) for k, v in splits.items()}
    report["total"] = sum(len(v) for v in splits.values())
    report["classes"] = UNIFIED_CLASSES
    (_processed() / "stats.json").write_text(json.dumps(report, indent=2))
    log.info("dataset_stats", **{k: v for k, v in report.items() if k != "classes"})
    return report


def main() -> None:
    configure_logging()
    _processed().mkdir(parents=True, exist_ok=True)
    all_images: list[Path] = []
    for spec in DATASETS:
        src = download(spec)
        out = convert_to_yolo(spec, src)
        all_images += sorted((out / "images").glob("*.jpg"))
    splits = split(all_images)
    write_data_yaml(splits)
    write_stats(splits)
    log.info("dataset_ready", processed=str(_processed()))


if __name__ == "__main__":
    main()
