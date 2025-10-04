
from __future__ import annotations
from typing import Dict, Any
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer

def build_model(name: str, params: Dict[str, Any]):
    name = (name or "random_forest").lower()
    if name in ["rf", "random_forest", "random-forest"]:
        return RandomForestClassifier(**params)
    raise ValueError(f"Unsupported model name: {name}")

def build_pipeline(pre: ColumnTransformer, model_name: str, model_params: Dict[str, Any]) -> Pipeline:
    clf = build_model(model_name, model_params or {})
    pipe = Pipeline(steps=[("preprocessor", pre), ("clf", clf)])
    return pipe
