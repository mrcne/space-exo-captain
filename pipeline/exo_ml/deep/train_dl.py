from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

import tensorflow as tf
from tensorflow import keras

from ..config import load_config
from ..data import load_table
from ..preprocess import build_preprocessor
from ..utils import timestamp_dir

from .models_keras import build_mlp, build_mlp_bn, build_cnn1d, build_feature_transformer
def make_optimizer():
    # Try Keras AdamW (TF >= 2.11), else TFA AdamW, else plain Adam
    try:
        return keras.optimizers.AdamW(learning_rate=3e-4, weight_decay=1e-4)
    except Exception:
        try:
            from tensorflow_addons.optimizers import AdamW
            return AdamW(learning_rate=3e-4, weight_decay=1e-4)
        except Exception:
            return keras.optimizers.Adam(learning_rate=3e-4)

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

def penultimate_extractor(model: keras.Model) -> keras.Model:
    # returns a model that outputs the second-to-last layer activations
    return keras.Model(inputs=model.input, outputs=model.layers[-2].output)

def main():
    ap = argparse.ArgumentParser(description="DL for TFOPWG (tabular) with stacking & voting")
    ap.add_argument("--input", required=True, help="Path to CSV/TSV")
    ap.add_argument("--outdir", default="artifacts", help="Artifacts root directory")
    ap.add_argument("--arch", default="mlp_bn", choices=["mlp_bn","mlp","transformer","cnn1d"], help="DL architecture")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--batch-size", type=int, default=256)
    ap.add_argument("--val-size", type=float, default=0.2, help="Validation fraction for holdout")
    ap.add_argument("--stack-model", default="none", choices=["none","rf","xgb"], help="Train RF/XGB on DL embeddings")
    ap.add_argument("--vote", action="store_true", help="Enable soft voting (DL + stack)")
    ap.add_argument("--vote-weights", default="0.7,0.3", help="Weights for voting: DL,stack")
    args = ap.parse_args()

    cfg = load_config(None)
    target = cfg["target"]
    drop_cols = cfg["drop_cols"]

    # 1) Load without dropping rows (imputer handles NaNs)
    df = load_table(args.input)
    df = df.dropna(axis="columns", how="all")
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not in input.")
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")
    df = df[~df[target].isna()].copy()
    # df = df[['pl_rade', 'pl_trandep', 'pl_insol', 'st_pmra', 'st_logg',
    #          'st_dist', 'pl_orbper', 'pl_tranmid', 'pl_radeerr1', 'pl_eqt', target]]

    # Labels
    y_cat = df[target].astype("category")
    classes = list(y_cat.cat.categories)
    y = y_cat.cat.codes.values.astype("int64")

    # 2) Stratified train/val split
    from sklearn.model_selection import train_test_split
    X_all = df.drop(columns=[target])
    X_train, X_val, y_train, y_val = train_test_split(
        X_all, y, test_size=args.val_size, stratify=y, random_state=42
    )

    # 3) Preprocessor
    pre = build_preprocessor(X_train)
    X_train_t = pre.fit_transform(X_train)
    X_val_t   = pre.transform(X_val)
    if hasattr(X_train_t, "toarray"):
        X_train_t = X_train_t.toarray()
        X_val_t   = X_val_t.toarray()

    input_dim = X_train_t.shape[1]
    n_classes = len(classes)

    # 4) Build DL model
    model = pick_model(args.arch, input_dim, n_classes)

    # 5) Compile with AdamW + ReduceLROnPlateau + EarlyStopping
    optimizer = keras.optimizers.AdamW(learning_rate=3e-4, weight_decay=1e-4)
    model.compile(
        optimizer=optimizer,
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"]
    )

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

    # 6) Evaluate DL on val
    val_loss, val_acc = model.evaluate(X_val_t, y_val, verbose=0)
    print({"val_loss": float(val_loss), "val_acc": float(val_acc)})

    # 7) Save DL artifacts
    joblib.dump(pre, outdir / "preprocessor.joblib")
    model.save(outdir / "dl_model.keras")
    meta = {
        "target": target,
        "drop_cols": drop_cols,
        "classes": classes,
        "model_kind": args.arch,
        "input_dim": int(input_dim),
    }
    (outdir / "dl_metadata.json").write_text(json.dumps(meta, indent=2))

    # 8) Optional: DL → RF/XGB (stacking on embeddings)
    stacked = None
    if args.stack_model != "none":
        # build extractor and get embeddings
        extractor = penultimate_extractor(model)
        Z_train = extractor.predict(X_train_t, batch_size=512, verbose=0)
        Z_val   = extractor.predict(X_val_t,   batch_size=512, verbose=0)

        if args.stack_model == "rf":
            from sklearn.ensemble import RandomForestClassifier
            stacked = RandomForestClassifier(
                n_estimators=500, max_depth=None, min_samples_leaf=1,
                class_weight="balanced_subsample", random_state=42, n_jobs=-1
            )
        else:  # xgb
            try:
                from xgboost import XGBClassifier
                stacked = XGBClassifier(
                    n_estimators=600, max_depth=6, learning_rate=0.07,
                    subsample=0.9, colsample_bytree=0.9, objective="multi:softprob",
                    eval_metric="mlogloss", random_state=42, tree_method="hist"
                )
            except Exception as e:
                raise RuntimeError("Install xgboost to use --stack-model xgb") from e

        stacked.fit(Z_train, y_train)
        # save the stacker and extractor
        joblib.dump(stacked, outdir / f"stack_{args.stack_model}.joblib")
        extractor.save(outdir / "dl_extractor.keras")

        # 9) Soft voting if requested
        if args.vote:
            # DL probs
            p_dl = model.predict(X_val_t, verbose=0)
            # Stacker probs
            p_st = stacked.predict_proba(Z_val)
            w_dl, w_st = [float(x) for x in args.vote_weights.split(",")]
            p_vote = w_dl * p_dl + w_st * p_st
            y_pred = p_vote.argmax(1)

            # Save ensemble probs
            np.save(outdir / "val_probs_dl.npy", p_dl)
            np.save(outdir / "val_probs_stack.npy", p_st)
            np.save(outdir / "val_probs_vote.npy", p_vote)

            from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report
            print("Voting val acc:", accuracy_score(y_val, y_pred))
            print("Voting val bal-acc:", balanced_accuracy_score(y_val, y_pred))
            (outdir / "voting_report.txt").write_text(
                classification_report(y_val, y_pred, digits=4, target_names=classes)
            )

    # 10) Plots
    try:
        import matplotlib.pyplot as plt
        acc = hist.history.get("accuracy", [])
        val_acc_hist = hist.history.get("val_accuracy", [])
        loss = hist.history.get("loss", [])
        val_loss_hist = hist.history.get("val_loss", [])
        plt.figure(); plt.plot(acc, label="acc"); plt.plot(val_acc_hist, label="val_acc"); plt.legend(); plt.xlabel("epoch"); plt.ylabel("acc"); plt.tight_layout(); plt.savefig(outdir / "dl_accuracy.png", dpi=150); plt.close()
        plt.figure(); plt.plot(loss, label="loss"); plt.plot(val_loss_hist, label="val_loss"); plt.legend(); plt.xlabel("epoch"); plt.ylabel("loss"); plt.tight_layout(); plt.savefig(outdir / "dl_loss.png", dpi=150); plt.close()
    except Exception as e:
        (outdir / "plot_warn.txt").write_text(str(e))

    print(f"Saved DL (and stackers if any) to: {outdir.resolve()}")

if __name__ == "__main__":
    main()
