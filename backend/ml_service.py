"""
PestGuard ML service — Ultralytics YOLO detection backend.

This module loads a YOLO **detection** model (the same `.pt` file you trained,
e.g. yolo_ip102.pt) and uses it directly via the Ultralytics library — no ONNX
or Keras conversion needed.

How it works:
  1. The user uploads a photo of their crop (which may contain a pest *anywhere*
     in the frame, not just a clean close-up).
  2. The YOLO detector finds bounding boxes around any pests it sees, scoring
     each with a confidence and a class.
  3. We pick the highest-confidence detection as the primary result.
  4. If NO detection passes the minimum confidence, we return "not_a_pest".

Expected `.pt` model contract:
  - Trained with `yolo detect train ...` (task='detect')
  - Class names embedded in the model (we use model.names)
  - Input is RGB image, any size (Ultralytics handles preprocessing internally)
"""
import os
import io
import hashlib
import numpy as np
from PIL import Image

_model = None
_load_error = None
_model_class_names = None  # what the .pt model itself says its classes are

# Minimum detection confidence — boxes below this are dropped entirely
DETECTION_CONF_THRESHOLD = 0.25
# Maximum boxes to consider per image (after NMS)
MAX_DETECTIONS = 10


def load_model(model_path):
    """
    Load a YOLO .pt model. Returns the model on success, None on failure.
    Subsequent calls to predict() will use the mock predictor when the model
    can't be loaded.
    """
    global _model, _load_error, _model_class_names
    if not os.path.exists(model_path):
        _load_error = f"Model file not found at {model_path} — using mock predictor."
        print(f"[ML] {_load_error}")
        return None
    try:
        from ultralytics import YOLO  # lazy heavy import
        _model = YOLO(model_path)
        # Read the class names that are baked into the trained model
        if hasattr(_model, 'names') and _model.names:
            _model_class_names = [_model.names[i] for i in sorted(_model.names.keys())]
            print(f"[ML] Loaded YOLO model from {model_path}")
            print(f"[ML] Task: {_model.task}, Classes: {len(_model_class_names)}")
        else:
            _model_class_names = []
            print(f"[ML] Loaded YOLO model but no class names found")
        _load_error = None
        return _model
    except ImportError:
        _load_error = "Ultralytics not installed — using mock predictor. (pip install ultralytics)"
        print(f"[ML] {_load_error}")
        return None
    except Exception as e:
        _load_error = f"Failed to load model: {e}"
        print(f"[ML] {_load_error}")
        return None


def is_loaded():
    return _model is not None


def status():
    return {
        'loaded': _model is not None,
        'error': _load_error,
        'task': getattr(_model, 'task', None) if _model else None,
        'classes': len(_model_class_names) if _model_class_names else 0,
    }


def model_class_names():
    """Return the class names baked into the loaded model (if any)."""
    return _model_class_names or []


def _mock(image_bytes, class_names):
    """
    Hash-based mock predictor for when no real model is loaded.
    Same image → same result. Returns a single 'detection' covering most of
    the image so the UI still works end-to-end.
    """
    if not class_names:
        return None
    h = int(hashlib.md5(image_bytes).hexdigest(), 16)
    primary = h % len(class_names)
    rng = np.random.default_rng(h % (2**32))
    probs = rng.dirichlet(np.ones(len(class_names)) * 0.3)
    probs[primary] += 1.5
    probs = probs / probs.sum()

    # Open image to get dimensions for a plausible fake box
    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h_img = img.size
    except Exception:
        w, h_img = 640, 480

    # Box covering the centre 60% of the image
    box = {
        'x1': w * 0.2,
        'y1': h_img * 0.2,
        'x2': w * 0.8,
        'y2': h_img * 0.8,
    }

    return {
        'predicted_class': class_names[primary],
        'confidence': float(probs[primary]),
        'all_predictions': {name: float(p) for name, p in zip(class_names, probs)},
        'used_real_model': False,
        'not_a_pest': False,
        'detections': [{
            'class_name': class_names[primary],
            'confidence': float(probs[primary]),
            'box': box,
        }],
        'image_width': w,
        'image_height': h_img,
    }


def predict(image_bytes, class_names=None, image_size=None):
    """
    Run pest detection on an image.

    Args:
        image_bytes: raw image bytes (jpg/png/etc.)
        class_names: optional list of class names — used by the mock only;
                     when a real model is loaded we use its embedded names.
        image_size: unused for YOLO (Ultralytics handles preprocessing) —
                    kept for API compatibility.

    Returns a dict with:
        predicted_class:  str — the top detected pest's class name
        confidence:       float — its detection confidence
        all_predictions:  dict[class_name → confidence] (only classes seen)
        used_real_model:  bool
        not_a_pest:       bool — true when no detection passes threshold
        detections:       list of all kept detections (with bounding boxes)
        image_width:      int — original image width in pixels
        image_height:     int — original image height in pixels
    """
    if _model is None:
        return _mock(image_bytes, class_names or [])

    # Use the model's embedded class names when available — they're authoritative
    effective_classes = _model_class_names or class_names or []

    try:
        # Open image to record original dimensions for the frontend overlay
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        orig_w, orig_h = img.size

        # Run inference. Ultralytics handles resizing & normalisation internally.
        results = _model.predict(
            source=img,
            conf=DETECTION_CONF_THRESHOLD,
            max_det=MAX_DETECTIONS,
            verbose=False,
        )

        if not results:
            return _no_pest_result(orig_w, orig_h)

        result = results[0]
        boxes = result.boxes  # ultralytics Boxes object, may be None

        if boxes is None or len(boxes) == 0:
            return _no_pest_result(orig_w, orig_h)

        # Extract detections. xyxy is in original image pixel coordinates.
        xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes.xyxy, 'cpu') else np.asarray(boxes.xyxy)
        confs = boxes.conf.cpu().numpy() if hasattr(boxes.conf, 'cpu') else np.asarray(boxes.conf)
        cls_ids = boxes.cls.cpu().numpy().astype(int) if hasattr(boxes.cls, 'cpu') else np.asarray(boxes.cls).astype(int)

        detections = []
        for box, conf, cid in zip(xyxy, confs, cls_ids):
            if cid < 0 or cid >= len(effective_classes):
                continue
            detections.append({
                'class_name': effective_classes[cid],
                'confidence': float(conf),
                'box': {
                    'x1': float(box[0]),
                    'y1': float(box[1]),
                    'x2': float(box[2]),
                    'y2': float(box[3]),
                },
            })

        if not detections:
            return _no_pest_result(orig_w, orig_h)

        # Sort by confidence, take the top one as the "primary" prediction
        detections.sort(key=lambda d: d['confidence'], reverse=True)
        top = detections[0]

        # Build a per-class confidence map (highest confidence per class seen)
        all_preds = {}
        for d in detections:
            cn = d['class_name']
            if cn not in all_preds or d['confidence'] > all_preds[cn]:
                all_preds[cn] = d['confidence']

        return {
            'predicted_class': top['class_name'],
            'confidence': top['confidence'],
            'all_predictions': all_preds,
            'used_real_model': True,
            'not_a_pest': False,
            'detections': detections,
            'image_width': orig_w,
            'image_height': orig_h,
        }

    except Exception as e:
        print(f"[ML] Inference failed, falling back to mock: {e}")
        import traceback
        traceback.print_exc()
        return _mock(image_bytes, class_names or [])


def _no_pest_result(width, height):
    """Build a 'no pest detected' result. The route handler turns this into a 422."""
    return {
        'predicted_class': 'none',
        'confidence': 0.0,
        'all_predictions': {},
        'used_real_model': True,
        'not_a_pest': True,
        'detections': [],
        'image_width': width,
        'image_height': height,
    }
