"""Per-dataset converters: each maps a raw dataset into YOLO-format labels under
the unified Spandan defect taxonomy. Output layout per dataset:

    out/images/<id>.jpg
    out/labels/<id>.txt    # '<class> <cx> <cy> <w> <h>' normalised

Heavy imports (cv2, numpy) are deferred to the functions that need them so the
module imports cleanly without the ML extra.
"""
from __future__ import annotations

import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

Classes = list[str]

LabelRow = tuple[int, float, float, float, float]

# RDD2022 Pascal-VOC label names -> unified classes.
RDD_LABEL_MAP = {
    "D00": "longitudinal_crack",
    "D10": "transverse_crack",
    "D20": "alligator_crack",
    "D40": "pothole",
}


def _ensure_dirs(out: Path) -> tuple[Path, Path]:
    img_dir = out / "images"
    lbl_dir = out / "labels"
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)
    return img_dir, lbl_dir


def _write_label(lbl_dir: Path, stem: str, rows: list[LabelRow]) -> None:
    lines = [f"{c} {x:.6f} {y:.6f} {w:.6f} {h:.6f}" for c, x, y, w, h in rows]
    (lbl_dir / f"{stem}.txt").write_text("\n".join(lines))


def _find_image(xml: Path) -> Path | None:
    for ext in (".jpg", ".jpeg", ".png"):
        cand = xml.with_suffix(ext)
        if cand.exists():
            return cand
        alt = xml.parent.parent / "images" / (xml.stem + ext)
        if alt.exists():
            return alt
    return None


def rdd_yolo(src: Path, out: Path, classes: Classes) -> None:
    """RDD2022: Pascal-VOC XML annotations -> YOLO labels."""
    img_dir, lbl_dir = _ensure_dirs(out)
    index = {name: i for i, name in enumerate(classes)}
    for xml in src.rglob("*.xml"):
        root = ET.parse(xml).getroot()
        size = root.find("size")
        if size is None:
            continue
        iw = float(size.findtext("width") or 0) or 1.0
        ih = float(size.findtext("height") or 0) or 1.0
        rows: list[LabelRow] = []
        for obj in root.findall("object"):
            raw = (obj.findtext("name") or "").strip()
            unified = RDD_LABEL_MAP.get(raw)
            bnd = obj.find("bndbox")
            if unified is None or unified not in index or bnd is None:
                continue
            xmin = float(bnd.findtext("xmin") or 0)
            ymin = float(bnd.findtext("ymin") or 0)
            xmax = float(bnd.findtext("xmax") or 0)
            ymax = float(bnd.findtext("ymax") or 0)
            rows.append(
                (
                    index[unified],
                    ((xmin + xmax) / 2) / iw,
                    ((ymin + ymax) / 2) / ih,
                    (xmax - xmin) / iw,
                    (ymax - ymin) / ih,
                )
            )
        img = _find_image(xml)
        if not rows or img is None:
            continue
        shutil.copy(img, img_dir / img.name)
        _write_label(lbl_dir, img.stem, rows)


def _classification_adapter(
    src: Path,
    out: Path,
    classes: Classes,
    positive_class: str,
    positive_dirs: tuple[str, ...],
) -> None:
    img_dir, lbl_dir = _ensure_dirs(out)
    if positive_class not in classes:
        return
    idx = classes.index(positive_class)
    full_box: list[LabelRow] = [(idx, 0.5, 0.5, 1.0, 1.0)]
    for d in positive_dirs:
        folder = src / d
        if not folder.exists():
            continue
        for img in folder.rglob("*.*"):
            if img.suffix.lower() not in {".jpg", ".jpeg", ".png", ".bmp"}:
                continue
            shutil.copy(img, img_dir / img.name)
            _write_label(lbl_dir, img.stem, full_box)


def codebrim_yolo(src: Path, out: Path, classes: Classes) -> None:
    """CODEBRIM concrete-defect crops -> coarse image-level boxes."""
    _classification_adapter(
        src, out, classes, "spallation", ("Defects", "spallation", "Spallation")
    )


def sdnet_yolo(src: Path, out: Path, classes: Classes) -> None:
    """SDNET2018 cracked/uncracked patches -> full-image boxes for cracked."""
    _classification_adapter(
        src, out, classes, "longitudinal_crack", ("CD", "CW", "CP", "cracked")
    )


def _sibling_image(mask_path: Path) -> Path | None:
    stem = mask_path.stem.replace("_mask", "").replace("mask", "")
    candidates = [mask_path.with_name(stem + ext) for ext in (".jpg", ".jpeg", ".png")]
    candidates += [
        mask_path.parent.parent / "images" / (stem + ext)
        for ext in (".jpg", ".jpeg", ".png")
    ]
    for cand in candidates:
        if cand.exists():
            return cand
    return None


def seg_mask(src: Path, out: Path, classes: Classes) -> None:
    """DeepCrack-style binary masks -> boxes via connected components."""
    import cv2

    img_dir, lbl_dir = _ensure_dirs(out)
    if "longitudinal_crack" not in classes:
        return
    idx = classes.index("longitudinal_crack")
    masks = list(src.rglob("*mask*.png")) or list(src.rglob("*.png"))
    for mask_path in masks:
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if mask is None:
            continue
        ih, iw = mask.shape[:2]
        _, binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
        num, _, stats, _ = cv2.connectedComponentsWithStats(binary)
        rows: list[LabelRow] = []
        for i in range(1, num):
            x, y, w, h, area = stats[i]
            if area < 20:
                continue
            rows.append((idx, (x + w / 2) / iw, (y + h / 2) / ih, w / iw, h / ih))
        image = _sibling_image(mask_path)
        if not rows or image is None:
            continue
        shutil.copy(image, img_dir / image.name)
        _write_label(lbl_dir, image.stem, rows)
