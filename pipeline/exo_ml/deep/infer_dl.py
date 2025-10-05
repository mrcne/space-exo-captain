
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from tensorflow import keras

from ..data import load_table

def main():
    ap = argparse.ArgumentParser(description="Keras DL inference for TFOPWG disposition (tabular)")
    ap.add_argument("--input", required=True, help="CSV/TSV to predict on")
    ap.add_argument("--artifacts", required=True, help="DL artifact folder (contains dl_model.keras & preprocessor.joblib)")
    ap.add_argument("--output", default=None, help="Output CSV path (defaults: artifacts/pred_dl.csv)")
    args = ap.parse_args()

    art = Path(args.artifacts)
    pre = joblib.load(art / "preprocessor.joblib")
    model = keras.models.load_model(art / "dl_model.keras")
    meta = json.load(open(art / "dl_metadata.json"))

    drop_cols = meta["drop_cols"]
    classes = meta["classes"]
    model_kind = meta.get("model_kind", "mlp")
    input_dim = meta["input_dim"]

    df = load_table(args.input)
    df = df.drop(columns=drop_cols, errors="ignore")
    if meta["target"] in df.columns:
        df = df.drop(columns=[meta["target"]], errors="ignore")

    X = pre.transform(df)
    if hasattr(X, "toarray"):
        X = X.toarray()
    if model_kind == "cnn1d":
        X = X.reshape((-1, input_dim, 1))

    proba = model.predict(X, verbose=0)
    pred_idx = np.argmax(proba, axis=1)
    pred_label = [classes[i] for i in pred_idx]

    out = df.copy()
    out["pred_label"] = pred_label
    for i, c in enumerate(classes):
        out[f"proba_{c}"] = proba[:, i]

    out_path = Path(args.output) if args.output else (art / "pred_dl.csv")
    out.to_csv(out_path, index=False)
    print(f"Wrote: {out_path.resolve()}")

if __name__ == "__main__":
    main()
