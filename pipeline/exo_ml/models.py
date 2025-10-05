from __future__ import annotations
from typing import Dict, Any, List, Tuple
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    RandomForestClassifier,
    ExtraTreesClassifier,
    HistGradientBoostingClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

def build_model(name: str, params: Dict[str, Any]):
    name = (name or "random_forest").lower()

    if name in ["rf", "random_forest", "random-forest"]:
        return RandomForestClassifier(**(params or {}))

    if name in ["et", "extra_trees", "extra-trees"]:
        return ExtraTreesClassifier(**(params or {}))

    if name in ["histgb", "hist_gradient_boosting", "hgb"]:
        return HistGradientBoostingClassifier(**(params or {}))

    if name in ["logreg", "logistic_regression", "lr"]:
        # good final estimator for stacking
        defaults = {"max_iter": 1000, "n_jobs": None}
        cfg = {**defaults, **(params or {})}
        return LogisticRegression(**cfg)

    if name in ["svc", "svm"]:
        # enable probabilities for soft-voting
        defaults = {"probability": True}
        cfg = {**defaults, **(params or {})}
        return SVC(**cfg)

    if name in ["xgb", "xgboost"]:
        try:
            from xgboost import XGBClassifier
        except Exception as e:
            raise ImportError(
                "xgboost is not installed. `pip install xgboost`"
            ) from e
        defaults = {"tree_method": "hist", "eval_metric": "mlogloss", "n_estimators": 400}
        cfg = {**defaults, **(params or {})}
        return XGBClassifier(**cfg)

    raise ValueError(f"Unsupported model name: {name}")

def build_pipeline(pre: ColumnTransformer, model_name: str, model_params: Dict[str, Any]) -> Pipeline:
    clf = build_model(model_name, model_params or {})
    return Pipeline(steps=[("preprocessor", pre), ("clf", clf)])

def build_stacking_pipeline(
    pre: ColumnTransformer,
    base_models: List[Tuple[str, Dict[str, Any]]],
    final_model: Tuple[str, Dict[str, Any]] = ("logreg", {"C": 1.0}),
    stacker_params: Dict[str, Any] | None = None,
) -> Pipeline:
    # Base estimators
    estimators = []
    for name, prm in (base_models or []):
        estimators.append((name, build_model(name, prm or {})))
    final_est = build_model(final_model[0], final_model[1] or {})
    stk = StackingClassifier(
        estimators=estimators,
        final_estimator=final_est,
        stack_method="predict_proba",
        passthrough=False,
        n_jobs=None,
        **(stacker_params or {}),
    )
    return Pipeline(steps=[("preprocessor", pre), ("clf", stk)])
