
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

import tensorflow as tf
from tensorflow import keras

from ..config import load_config
from ..data import load_table, basic_clean
from ..preprocess import build_preprocessor
from ..utils import timestamp_dir

from .models_keras import build_mlp, build_cnn1d, build_feature_transformer

def compute_class_weights(y: np.ndarray) -> dict:
    from sklearn.utils.class_weight import compute_class_weight
    classes = np.unique(y)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y)
    return {int(c): float(w) for c, w in zip(classes, weights)}

def build_model(kind: str, input_dim: int, n_classes: int):
    kind = (kind or "mlp").lower()
    if kind == "mlp":
        return build_mlp(input_dim, n_classes)
    elif kind == "cnn1d":
        return build_cnn1d(input_dim, n_classes)
    elif kind in ["transformer", "ft", "ft_transformer"]:
        return build_feature_transformer(input_dim, n_classes)
    else:
        raise ValueError(f"Unknown model kind: {kind}")

def main():
    ap = argparse.ArgumentParser(description="Train Keras DL model for TFOPWG disposition (tabular)")
    ap.add_argument("--input", required=True, help="Path to CSV/TSV")
    ap.add_argument("--outdir", default="artifacts", help="Artifacts root directory")
    ap.add_argument("--model", default="mlp", choices=["mlp","cnn1d","transformer"], help="Model architecture")
    ap.add_argument("--epochs", type=int, default=60)
    ap.add_argument("--batch-size", type=int, default=128)
    ap.add_argument("--val-split", type=float, default=0.2)
    args = ap.parse_args()

    cfg = load_config(None)
    target = cfg["target"]
    drop_cols = cfg["drop_cols"]

    # Load & clean
    df = load_table(args.input)
    df = basic_clean(df)
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found in input.")

    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    df = df[~df[target].isna()].copy()

    # Labels
    y_cat = df[target].astype("category")
    classes = list(y_cat.cat.categories)
    y = y_cat.cat.codes.values.astype("int64")

    # Split
    from sklearn.model_selection import train_test_split
    X = df.drop(columns=[target])
    X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=42, test_size=0.2)

    # Preprocessor
    pre = build_preprocessor(X_train)
    X_train_t = pre.fit_transform(X_train)
    X_test_t = pre.transform(X_test)
    if hasattr(X_train_t, "toarray"):
        X_train_t = X_train_t.toarray()
        X_test_t = X_test_t.toarray()

    input_dim = X_train_t.shape[1]
    n_classes = len(classes)

    model = build_model(args.model, input_dim, n_classes)
    if args.model == "cnn1d":
        X_train_t = X_train_t.reshape((-1, input_dim, 1))
        X_test_t  = X_test_t.reshape((-1, input_dim, 1))

    cw = compute_class_weights(y_train)

    es = keras.callbacks.EarlyStopping(patience=8, restore_best_weights=True, monitor="val_accuracy")
    outdir = timestamp_dir(args.outdir)
    ckpt = keras.callbacks.ModelCheckpoint(str(outdir / "best.keras"), save_best_only=True, monitor="val_accuracy")

    history = model.fit(
        X_train_t, y_train,
        validation_split=args.val_split,
        epochs=args.epochs,
        batch_size=args.batch_size,
        class_weight=cw,
        callbacks=[es, ckpt],
        verbose=2
    )

    test_loss, test_acc = model.evaluate(X_test_t, y_test, verbose=0)
    print({"test_loss": float(test_loss), "test_acc": float(test_acc)})

    # Save artifacts
    joblib.dump(pre, outdir / "preprocessor.joblib")
    model.save(outdir / "dl_model.keras")
    meta = {
        "target": target,
        "drop_cols": drop_cols,
        "classes": classes,
        "model_kind": args.model,
        "input_dim": int(input_dim),
    }
    (outdir / "dl_metadata.json").write_text(json.dumps(meta, indent=2))

    # Plots
    try:
        import matplotlib.pyplot as plt
        acc = history.history.get("accuracy", [])
        val_acc = history.history.get("val_accuracy", [])
        loss = history.history.get("loss", [])
        val_loss = history.history.get("val_loss", [])
        plt.figure(); plt.plot(acc); plt.plot(val_acc); plt.xlabel("epoch"); plt.ylabel("accuracy"); plt.tight_layout(); plt.savefig(outdir / "dl_accuracy.png", dpi=150); plt.close()
        plt.figure(); plt.plot(loss); plt.plot(val_loss); plt.xlabel("epoch"); plt.ylabel("loss"); plt.tight_layout(); plt.savefig(outdir / "dl_loss.png", dpi=150); plt.close()
    except Exception as e:
        (outdir / "plot_warn.txt").write_text(str(e))

    print(f"Saved DL artifacts to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
