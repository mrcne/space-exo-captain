
from __future__ import annotations
import time, json
from pathlib import Path
from typing import List
import numpy as np
import pandas as pd
import joblib

from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, classification_report, confusion_matrix

def timestamp_dir(root: str | Path) -> Path:
    ts = time.strftime("%Y%m%d_%H%M%S")
    root = Path(root)
    (root / ts).mkdir(parents=True, exist_ok=True)
    return root / ts

def save_pipeline(pipe, outdir: Path):
    joblib.dump(pipe, outdir / "pipeline.joblib")

def save_feature_columns(cols: List[str], outdir: Path):
    with open(outdir / "feature_columns.json", "w") as f:
        json.dump(cols, f, indent=2)

def save_metadata(target: str, drop_cols: list, classes: list, outdir: Path, notes: str = ""):
    meta = {
        "target": target,
        "drop_cols": drop_cols,
        "classes": classes,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "sklearn_version": __import__("sklearn").__version__,
        "notes": notes,
    }
    with open(outdir / "metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

def evaluate_and_save(y_true, y_pred, labels: List[str], outdir: Path, prefix: str = "test"):
    out = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, y_pred)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro")),
        "labels": labels,
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
        "classification_report": classification_report(y_true, y_pred, digits=4),
    }
    with open(outdir / f"{prefix}_metrics.json", "w") as f:
        json.dump(out, f, indent=2)
    with open(outdir / f"{prefix}_classification_report.txt", "w") as f:
        f.write(out["classification_report"])
    try:
        import matplotlib.pyplot as plt
        cm = np.array(out["confusion_matrix"])
        plt.figure(figsize=(6,5))
        plt.imshow(cm, interpolation="nearest")
        plt.title(f"Confusion Matrix ({prefix})")
        plt.colorbar()
        tick_marks = range(len(labels))
        plt.xticks(tick_marks, labels, rotation=45, ha="right")
        plt.yticks(tick_marks, labels)
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                plt.text(j, i, f"{cm[i, j]}", ha="center", va="center")
        plt.xlabel("Predicted")
        plt.ylabel("True")
        plt.tight_layout()
        plt.savefig(outdir / f"{prefix}_cm.png", dpi=150)
        plt.close()
    except Exception as e:
        with open(outdir / f"{prefix}_plot_warning.txt", "w") as f:
            f.write(str(e))

def load_artifacts(art_dir: str | Path):
    art = Path(art_dir)
    pipe = joblib.load(art / "pipeline.joblib")
    feature_columns = json.load(open(art / "feature_columns.json"))
    meta = json.load(open(art / "metadata.json"))
    return pipe, feature_columns, meta
