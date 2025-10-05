
from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd

from .config import load_config
from .data import load_table, basic_clean, train_test_split_df
from .preprocess import build_preprocessor
from .models import build_pipeline
from .datafix import coerce_numeric
from .feature_select import drop_bad_columns
from sklearn.model_selection import GridSearchCV
from .utils import timestamp_dir, save_pipeline, save_feature_columns, save_metadata, evaluate_and_save

def main():
    ap = argparse.ArgumentParser(description="Train Exoplanet TFOPWG disposition classifier")
    ap.add_argument("--input", required=True, help="Path to training CSV/TSV")
    ap.add_argument("--config", default=None, help="Path to JSON config (optional)")
    ap.add_argument("--outdir", default="artifacts", help="Artifacts root directory")
    args = ap.parse_args()

    cfg = load_config(args.config)
    target = cfg["target"]
    drop_cols = cfg["drop_cols"]

    # Load & clean
    df = load_table(args.input)
    df = basic_clean(df)
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found in input.")

    # Drop columns, keep only rows with target
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    df = df[~df[target].isna()].copy()
    df = drop_bad_columns(df, max_missing_pct=0.80, min_unique_ratio=0.0005)
    df = coerce_numeric(df)
    # Split
    X_train, X_test, y_train, y_test = train_test_split_df(
        df, target, cfg["test_size"], cfg["random_state"], stratify=True
    )

    # Preprocess & model
    # pre = build_preprocessor(X_train)
    # pipe = build_pipeline(pre, cfg["model"]["name"], cfg["model"]["params"])

    # # Fit
    # pipe.fit(X_train, y_train)
    pre = build_preprocessor(X_train)

    # Stacking or single model?
    stack_cfg = cfg.get("stacking", {"enabled": False})
    if stack_cfg.get("enabled", False):
        from .models import build_stacking_pipeline
        pipe = build_stacking_pipeline(
            pre,
            base_models=stack_cfg.get("base_models", [
                ("xgb", {"n_estimators": 600, "learning_rate": 0.05, "max_depth": 6}),
                ("rf",  {"n_estimators": 500, "class_weight": "balanced_subsample"})
            ]),
            final_model=tuple(stack_cfg.get("final_model", ("logreg", {"C": 1.0}))),
            stacker_params=stack_cfg.get("stacker_params", {"cv": 5})
        )
    else:
        pipe = build_pipeline(pre, cfg["model"]["name"], cfg["model"]["params"])

    # Optional GridSearchCV over the *pipeline* hyperparams (use pre__* or clf__*)
    gs_cfg = cfg.get("grid_search", {})
    if gs_cfg.get("enabled", False) and gs_cfg.get("param_grid"):
        pipe = GridSearchCV(
            pipe,
            param_grid=gs_cfg["param_grid"],
            scoring=cfg.get("scoring", "balanced_accuracy"),
            cv=gs_cfg.get("cv", 5),
            n_jobs=gs_cfg.get("n_jobs", None),
            refit=True,
            verbose=1,
        )

    # Fit
    pipe.fit(X_train, y_train)
    # Evaluate
    y_pred = pipe.predict(X_test)
    labels = sorted(list(pd.unique(y_train)))

    # Save artifacts
    outdir = timestamp_dir(args.outdir)
    save_pipeline(pipe, outdir)
    save_feature_columns(X_train.columns.tolist(), outdir)
    save_metadata(target, drop_cols, labels, outdir, notes="RF pipeline with scaling+OHE")
    evaluate_and_save(y_test, y_pred, labels, outdir, prefix="test")

    print(f"Training complete. Artifacts saved to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
