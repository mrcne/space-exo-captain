import os
import joblib

MODEL_PATH = os.getenv("MODEL_PATH", "./artifacts/20251005_021226/pipeline.joblib")

def load_model(path: str = MODEL_PATH):
    model = joblib.load(path)
    return model
