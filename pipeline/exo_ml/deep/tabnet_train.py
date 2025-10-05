# tabnet_train.py
from __future__ import annotations
import argparse, json
import numpy as np
import pandas as pd
from pathlib import Path
import joblib

from ..config import load_config
from ..data import load_table
from ..preprocess import build_preprocessor
from ..utils import timestamp_dir

def main():
    ap = argparse.ArgumentParser(description="TabNet training for TFOPWG (tabular)")
    ap.add_argument("--input", required=True)
    ap.add_argument("--outdir", default="artifacts")
    # Common TabNet knobs with good defaults
    ap.add_argument("--n-d", type=int, default=64)
    ap.add_argument("--n-a", type=int, default=64)
    ap.add_argument("--n-steps", type=int, default=5)
    ap.add_argument("--gamma", type=float, default=1.5)
    ap.add_argument("--lambda-sparse", type=float, default=1e-4)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--max-epochs", type=int, default=200)
    ap.add_argument("--patience", type=int, default=20)
    args = ap.parse_args()

    try:
        from pytorch_tabnet.tab_model import TabNetClassifier
        import torch
    except Exception as e:
        raise RuntimeError("pip install pytorch-tabnet torch torchvision torchaudio") from e

    cfg = load_config(None)
    target = cfg["target"]
    drop_cols = cfg["drop_cols"]

    df = load_table(args.input)
    df = df.dropna(axis="columns", how="all")
    if target not in df.columns:
        raise ValueError(f"{target} not found.")
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    df = df[~df[target].isna()].copy()

    y_cat = df[target].astype("category")
    classes = list(y_cat.cat.categories)
    y = y_cat.cat.codes.values.astype("int64")

    from sklearn.model_selection import train_test_split
    X = df.drop(columns=[target])
    pre = build_preprocessor(X)  # same impute+OHE+scale for consistency
    X_t = pre.fit_transform(X)
    if hasattr(X_t, "toarray"):
        X_t = X_t.toarray()

    X_tr, X_val, y_tr, y_val = train_test_split(X_t, y, test_size=0.2, stratify=y, random_state=42)

    clf = TabNetClassifier(
        n_d=args.n_d, n_a=args.n_a, n_steps=args.n_steps,
        gamma=args.gamma, lambda_sparse=args.lambda_sparse,
        optimizer_fn=torch.optim.Adam, optimizer_params=dict(lr=args.lr),
        scheduler_params={"step_size":50, "gamma":0.9},
        scheduler_fn=torch.optim.lr_scheduler.StepLR,
        verbose=1, seed=42
    )

    clf.fit(
        X_tr, y_tr,
        eval_set=[(X_val, y_val)],
        eval_name=["val"],
        eval_metric=["accuracy"],
        max_epochs=args.max_epochs,
        patience=args.patience,
        batch_size=1024,
        virtual_batch_size=128
    )

    outdir = timestamp_dir(args.outdir)
    joblib.dump(pre, outdir / "preprocessor.joblib")
    clf.save_model(str(outdir / "tabnet.zip"))
    meta = {"target": target, "drop_cols": drop_cols, "classes": classes, "model": "tabnet"}
    (outdir / "tabnet_metadata.json").write_text(json.dumps(meta, indent=2))
    print(f"Saved TabNet to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
