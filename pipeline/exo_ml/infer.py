
from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd
import numpy as np

from .data import load_table
from .utils import load_artifacts

def main():
    ap = argparse.ArgumentParser(description="Run inference with saved pipeline")
    ap.add_argument("--input", required=True, help="Path to new CSV/TSV to predict on")
    ap.add_argument("--artifacts", required=True, help="Path to artifact folder (timestamped)")
    ap.add_argument("--output", default=None, help="Path to save predictions CSV")
    ap.add_argument("--with-proba", action="store_true", help="Also output per-class probabilities")
    args = ap.parse_args()

    pipe, feat_cols, meta = load_artifacts(args.artifacts)
    drop_cols = meta.get("drop_cols", [])
    classes = meta.get("classes", None)

    df_new = load_table(args.input)
    df_new = df_new.drop(columns=drop_cols, errors="ignore")

    # Align columns
    X_new = df_new.reindex(columns=feat_cols, fill_value=np.nan)

    y_pred = pipe.predict(X_new)
    out = df_new.copy()
    out["pred_label"] = y_pred

    if args.with_proba and hasattr(pipe, "predict_proba"):
        proba = pipe.predict_proba(X_new)
        if classes is None:
            classes = getattr(pipe, "classes_", None)
        if classes is None:
            classes = [f"class_{i}" for i in range(proba.shape[1])]
        for i, c in enumerate(classes):
            out[f"proba_{c}"] = proba[:, i]

    out_path = Path(args.output) if args.output else (Path(args.artifacts) / "predictions.csv")
    out.to_csv(out_path, index=False)
    print(f"Predictions written to: {out_path.resolve()}")

if __name__ == "__main__":
    main()
