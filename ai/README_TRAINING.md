# Spandan — Training real YOLOv8 weights

The service uses a classical-CV fallback until a real model exists at
`ai/weights/yolov8_spandan.pt`. Once that file is present, restart the AI
service and it loads the trained model automatically (no code change).

## Recommended: Google Colab (free T4 GPU)

Full RDD2022 training needs a GPU + several GB of downloads + time — not
practical on a CPU laptop. Use the notebook:

1. Open `notebooks/spandan_train_colab.ipynb` in Google Colab.
2. Runtime → Change runtime type → **T4 GPU**.
3. Run all cells. It clones the repo, installs, prepares datasets, trains
   YOLOv8, and downloads `yolov8_spandan.pt`.
4. Put the downloaded file in `C:\dev2\spandan\ai\weights\yolov8_spandan.pt`.
5. Restart the AI service.

## Local (only if you have an NVIDIA GPU)

```powershell
cd C:\dev2\spandan\ai
pip install -e ".[dev,ml,service]"

# download + convert RDD2022 + CODEBRIM into data/processed/spandan.yaml
python -m spandan_ai.data.prepare

# train (Hydra overrides). 50 epochs = solid demo model; raise for quality.
python -m spandan_ai.train model.epochs=50 model.imgsz=640

# publish the best checkpoint where the service looks for it
Copy-Item (Get-ChildItem runs -Recurse -Filter best.pt | Select-Object -Last 1).FullName weights\yolov8_spandan.pt

# restart the service -> logs "detector_loaded" instead of "detector_fallback_demo"
uvicorn spandan_ai.service.app:app --port 8001
```

## Dataset notes
- **RDD2022** (road cracks/potholes, incl. India) and **CODEBRIM** (bridge
  multi-defect) auto-download in `spandan_ai.data.prepare`.
- **SDNET2018** and **DeepCrack** are license-gated — place them manually under
  `data/raw/<name>/` (see the `PLACE_FILES_HERE.txt` created by prepare).
- The pipeline maps every source into the 8 unified Spandan classes.

## Honest framing for judges
The prototype ships a classical-CV baseline detector so the full pipeline runs
offline; dropping trained YOLOv8 weights upgrades detection quality with no
other change to the API, worker, SHI engine, or UI.
