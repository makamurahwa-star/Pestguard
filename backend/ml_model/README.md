# PestGuard model folder

Drop your trained YOLO `.pt` file here as **`pestguard_model.pt`**, or set the
`MODEL_PATH` environment variable to point at it.

```
backend/ml_model/pestguard_model.pt   ← your YOLOv8 detection model
```

## What's expected

- A YOLO **detection** model trained with `yolo detect train ...`
  (e.g. your `yolo_ip102.pt`)
- Class names embedded in the model (Ultralytics saves them automatically)
- Any number of classes (we'll use what the model tells us)

No conversion needed. PestGuard loads the `.pt` directly via Ultralytics.

## Steps

1. Copy your model:
   ```powershell
   copy C:\Users\tadim\Downloads\PESTSS\yolo_ip102.pt backend\ml_model\pestguard_model.pt
   ```

2. From `backend/` with the venv activated, install Ultralytics if you haven't:
   ```powershell
   pip install -r requirements-ml.txt
   ```

3. Restart the backend. Check the startup log — you should see:
   ```
   [ML] Loaded YOLO model from .../pestguard_model.pt
   [ML] Task: detect, Classes: 102
   ```

The Check Crops page badge will flip from "Demo predictor" to "Powered by your
YOLO model".

## How it differs from the old Keras path

- **Direct use of your `.pt`** — no ONNX, no Keras, no conversion bugs
- **Detection, not classification** — finds the pest *anywhere* in the photo
  instead of assuming the photo is a clean close-up
- **Bounding box returned** — the frontend draws a box around the detected pest
- **Multi-pest support** — if multiple pests are visible, we show the top one
  but record all detections in scan history
- **Cleaner "not a pest" detection** — when zero boxes pass the confidence
  threshold (0.25), we tell the user no pest was found instead of guessing
