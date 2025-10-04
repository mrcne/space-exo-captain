
from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd

from .config import load_config
from .data import load_table, basic_clean, train_test_split_df
from .preprocess import build_preprocessor
from .models import build_pipeline
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

    # Split
    X_train, X_test, y_train, y_test = train_test_split_df(
        df, target, cfg["test_size"], cfg["random_state"], stratify=True
    )

    # Preprocess & model
    pre = build_preprocessor(X_train)
    pipe = build_pipeline(pre, cfg["model"]["name"], cfg["model"]["params"])

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
