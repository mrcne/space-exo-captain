from fastapi import FastAPI, HTTPException
from .schemas import PredictRequest, PredictResponse
from .validate import validate_and_vectorize
from .utils import load_model
from .features import FEATURES
import pandas as pd
import logging

app = FastAPI(title="RF Inference")

try:
    model = load_model()
except Exception as e:
    logging.exception("Model load failed")
    raise RuntimeError(f"Failed to load model: {e}")

MODEL_VERSION = getattr(model, "version", None)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        vec = validate_and_vectorize(req.features)
        df = pd.DataFrame([vec], columns=FEATURES)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid features: {e}")

    try:
        pred = model.predict(df).tolist()
    except Exception:
        logging.exception("inference failed")
        raise HTTPException(status_code=500, detail="inference failed")

    return {"prediction": pred, "model_version": getattr(model, "version", None)}
