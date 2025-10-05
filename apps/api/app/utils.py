import os
import joblib

MODEL_PATH = os.getenv("MODEL_PATH", "./artifacts/rf/20251006_005702/pipeline.joblib")

def load_model(path: str = MODEL_PATH):
    model = joblib.load(path)
    return model
