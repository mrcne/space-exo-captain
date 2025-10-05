from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt

import tensorflow as tf
from tensorflow import keras

from ..config import load_config
from ..data import load_table
from ..preprocess import build_preprocessor
from ..utils import timestamp_dir
from ..feature_select import drop_bad_columns
from ..datafix import coerce_numeric
from .models_keras import build_mlp, build_mlp_bn, build_cnn1d, build_feature_transformer

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_recall_fscore_support,
    classification_report, confusion_matrix
)

def _save_feature_columns(cols, outdir: Path):
    (outdir / "feature_columns.json").write_text(json.dumps(list(cols), indent=2))

def _save_metadata(target, drop_cols, classes, outdir: Path, *, arch: str, input_dim: int):
    meta = {
        "pipeline_type": "DL",
        "model_name": arch,
        "target": target,
        "drop_cols": drop_cols,
        "classes": list(classes),
        "input_dim": int(input_dim)
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

def compute_class_weights(y: np.ndarray) -> dict:
    from sklearn.utils.class_weight import compute_class_weight
    classes = np.unique(y)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y)
    return {int(c): float(w) for c, w in zip(classes, weights)}

def pick_model(arch: str, input_dim: int, n_classes: int):
    arch = arch.lower()
    if arch == "mlp":
        return build_mlp(input_dim, n_classes)
    if arch == "mlp_bn":
        return build_mlp_bn(input_dim, n_classes)
    if arch == "cnn1d":
        return build_cnn1d(input_dim, n_classes)
    if arch in ["transformer", "ft", "ft_transformer"]:
        return build_feature_transformer(input_dim, n_classes)
    raise ValueError(f"Unknown arch: {arch}")

def main():
    ap = argparse.ArgumentParser(description="DL for TFOPWG (tabular) — standardized artifacts")
    ap.add_argument("--input", required=True, help="Path to CSV/TSV")
    ap.add_argument("--outdir", default="artifacts", help="Artifacts root directory")
    ap.add_argument("--arch", default="mlp_bn", choices=["mlp_bn","mlp","transformer","cnn1d"], help="DL architecture")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--batch-size", type=int, default=256)
    ap.add_argument("--val-size", type=float, default=0.2, help="Validation fraction for holdout")
    args = ap.parse_args()

    cfg = load_config(None)
    target = cfg["target"]
    drop_cols = cfg["drop_cols"]

    # Load
    df = load_table(args.input)
    df = df.dropna(axis="columns", how="all")
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not in input.")
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    df = df[~df[target].isna()].copy()

    # Optional pruning + dtype fixes (keep your curated subset if you want—removed here for generality)
    df = drop_bad_columns(df, max_missing_pct=0.80, min_unique_ratio=0.0005)
    df = coerce_numeric(df)

    # Labels
    y_cat = df[target].astype("category")
    classes = list(y_cat.cat.categories)
    y = y_cat.cat.codes.values.astype("int64")

    # Split
    X_all = df.drop(columns=[target])
    X_train, X_val, y_train, y_val = train_test_split(
        X_all, y, test_size=args.val_size, stratify=y, random_state=42
    )

    # Preprocess
    pre = build_preprocessor(X_train)
    X_train_t = pre.fit_transform(X_train)
    X_val_t   = pre.transform(X_val)
    if hasattr(X_train_t, "toarray"):
        X_train_t = X_train_t.toarray()
        X_val_t   = X_val_t.toarray()

    input_dim = X_train_t.shape[1]
    n_classes = len(classes)

    # Model
    model = pick_model(args.arch, input_dim, n_classes)
    optimizer = keras.optimizers.AdamW(learning_rate=3e-4, weight_decay=1e-4)
    model.compile(optimizer=optimizer, loss=keras.losses.SparseCategoricalCrossentropy(), metrics=["accuracy"])

    cw = compute_class_weights(y_train)
    outdir = timestamp_dir(args.outdir)
    es = keras.callbacks.EarlyStopping(patience=12, restore_best_weights=True, monitor="val_accuracy")
    rlrop = keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=4, min_lr=1e-6)
    ckpt = keras.callbacks.ModelCheckpoint(str(outdir / "best.keras"), save_best_only=True, monitor="val_accuracy")

    if args.arch == "cnn1d":
        X_train_t = X_train_t.reshape((-1, input_dim, 1))
        X_val_t   = X_val_t.reshape((-1, input_dim, 1))

    hist = model.fit(
        X_train_t, y_train,
        validation_data=(X_val_t, y_val),
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=cw,
        callbacks=[es, rlrop, ckpt],
        verbose=2
    )

    # Save DL core artifacts (model + preprocessor)
    joblib.dump(pre, outdir / "preprocessor.joblib")
    model.save(outdir / "dl_model.keras")

    # Standardized eval bundle (on validation split)
    y_val_pred_idx = np.argmax(model.predict(X_val_t, verbose=0), axis=1)
    _save_feature_columns(X_all.columns.tolist(), outdir)
    _save_metadata(target, drop_cols, classes, outdir, arch=args.arch, input_dim=input_dim)
    _evaluate_and_save(y_val, y_val_pred_idx, [str(c) for c in classes], outdir, prefix="test")

    # predictions.csv (val set) with probabilities
    proba = model.predict(X_val_t, verbose=0)
    pred_label = [classes[i] for i in y_val_pred_idx]
    pred_df = X_val.copy()
    pred_df["true_label"] = y_val
    pred_df["pred_label"] = pred_label
    for i, c in enumerate(classes):
        pred_df[f"proba_{c}"] = proba[:, i]
    pred_df.to_csv(outdir / "predictions.csv", index=False)

    # (Optional) training curves — names unchanged
    try:
        acc = hist.history.get("accuracy", [])
        val_acc_hist = hist.history.get("val_accuracy", [])
        loss = hist.history.get("loss", [])
        val_loss_hist = hist.history.get("val_loss", [])
        plt.figure(); plt.plot(acc, label="acc"); plt.plot(val_acc_hist, label="val_acc"); plt.legend(); plt.xlabel("epoch"); plt.ylabel("acc"); plt.tight_layout(); plt.savefig(outdir / "dl_accuracy.png", dpi=150); plt.close()
        plt.figure(); plt.plot(loss, label="loss"); plt.plot(val_loss_hist, label="val_loss"); plt.legend(); plt.xlabel("epoch"); plt.ylabel("loss"); plt.tight_layout(); plt.savefig(outdir / "dl_loss.png", dpi=150); plt.close()
    except Exception as e:
        (outdir / "plot_warn.txt").write_text(str(e))

    print(f"Saved DL run to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
