# tabnet_train.py
from __future__ import annotations
import argparse, json
import numpy as np
import pandas as pd
from pathlib import Path
import joblib
import matplotlib.pyplot as plt

from ..config import load_config
from ..data import load_table
from ..preprocess import build_preprocessor
from ..utils import timestamp_dir

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_recall_fscore_support,
    classification_report, confusion_matrix
)

def _save_feature_columns(cols, outdir: Path):
    (outdir / "feature_columns.json").write_text(json.dumps(list(cols), indent=2))

def _save_metadata(target, drop_cols, classes, outdir: Path, *, model_name: str = "tabnet"):
    meta = {
        "pipeline_type": "DL",                 # TabNet is NN-based; use "ML" if you prefer
        "model_name": model_name,
        "target": target,
        "drop_cols": drop_cols,
        "classes": list(classes),
    }
    (outdir / "metadata.json").write_text(json.dumps(meta, indent=2))

def _evaluate_and_save(y_true, y_pred, class_names, outdir: Path, prefix="test"):
    acc  = accuracy_score(y_true, y_pred)
    bacc = balanced_accuracy_score(y_true, y_pred)
    prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
    prec_m, rec_m, f1_m, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)

    metrics = {
        "accuracy": acc,
        "balanced_accuracy": bacc,
        "precision_weighted": prec_w,
        "recall_weighted": rec_w,
        "f1_weighted": f1_w,
        "precision_macro": prec_m,
        "recall_macro": rec_m,
        "f1_macro": f1_m
    }
    (outdir / f"{prefix}_metrics.json").write_text(json.dumps(metrics, indent=2))

    report = classification_report(y_true, y_pred, digits=4, target_names=class_names)
    (outdir / f"{prefix}_classification_report.txt").write_text(report)

    cm = confusion_matrix(y_true, y_pred, labels=range(len(class_names)))
    fig = plt.figure(figsize=(5.2, 4.6), dpi=140)
    ax = plt.gca()
    im = ax.imshow(cm, interpolation="nearest")
    ax.set_title("Confusion Matrix")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_xticks(range(len(class_names))); ax.set_xticklabels(class_names, rotation=45, ha="right")
    ax.set_yticks(range(len(class_names))); ax.set_yticklabels(class_names)
    for (i, j), v in np.ndenumerate(cm):
        ax.text(j, i, str(v), ha="center", va="center")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    fig.tight_layout()
    fig.savefig(outdir / f"{prefix}_cm.png")
    plt.close(fig)

def main():
    ap = argparse.ArgumentParser(description="TabNet training for TFOPWG (tabular) — standardized artifacts")
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

    # Labels / classes
    y_cat = df[target].astype("category")
    classes = list(y_cat.cat.categories)
    y = y_cat.cat.codes.values.astype("int64")

    # Preprocess
    X = df.drop(columns=[target])
    feature_cols = X.columns.tolist()
    pre = build_preprocessor(X)  # same impute+OHE+scale
    X_t = pre.fit_transform(X)
    if hasattr(X_t, "toarray"):
        X_t = X_t.toarray()

    # Split
    X_tr, X_val, y_tr, y_val = train_test_split(X_t, y, test_size=0.2, stratify=y, random_state=42)

    # Model
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

    # Artifacts dir
    outdir = timestamp_dir(args.outdir)

    # Save model + preprocessor (unchanged filenames for the model itself)
    joblib.dump(pre, outdir / "preprocessor.joblib")
    clf.save_model(str(outdir / "tabnet.zip"))

    # Standardized eval bundle on validation split
    y_val_proba = clf.predict_proba(X_val)
    y_val_pred = np.argmax(y_val_proba, axis=1)

    _save_feature_columns(feature_cols, outdir)
    _save_metadata(target, drop_cols, classes, outdir, model_name="tabnet")
    _evaluate_and_save(y_val, y_val_pred, [str(c) for c in classes], outdir, prefix="test")

    # predictions.csv with probabilities
    pred_df = pd.DataFrame({"true_label": y_val, "pred_label": [classes[i] for i in y_val_pred]})
    for i, c in enumerate(classes):
        pred_df[f"proba_{c}"] = y_val_proba[:, i]
    pred_df.to_csv(outdir / "predictions.csv", index=False)

    print(f"Saved TabNet run to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
