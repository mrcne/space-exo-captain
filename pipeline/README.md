
# Exoplanet TFOPWG Disposition — Modular Training & Inference

Minimal, modular Python package to train a classifier for **`tfopwg_disp`** (CP | FP | KP | PC) and run inference on unseen CSV/TSV files.

## Quick Start

```bash
# 1) Create & activate a venv (recommended)
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2) Install deps
pip install -U pandas numpy scikit-learn joblib matplotlib

# (optional for SMOTE)
pip install imbalanced-learn
```

### Train

```bash
# Use your NASA TOI CSV/TSV (clean or raw; loader auto-detects TSV and ignores '#' comments)
python -m exo_ml.train --input data/train_data.csv --outdir artifacts
# Optionally pass a config:
# python -m exo_ml.train --input data/train_data.csv --config configs/config.json --outdir artifacts
```

Outputs go to `artifacts/<timestamp>/`:
- `pipeline.joblib` — full Pipeline (preprocessor + model)
- `feature_columns.json` — exact feature order used
- `metadata.json` — target, dropped columns, classes, versions
- `test_metrics.json`, `test_classification_report.txt`, `test_cm.png`

### Inference

```bash
python -m exo_ml.infer --input data/testing.csv --artifacts artifacts/20250101_123456 --with-proba
# Writes predictions to artifacts/<timestamp>/predictions.csv by default; or use --output path.csv
```

The script aligns new data to the **exact** training feature set (missing columns become NaN and are imputed). Extra columns are ignored.

## Configuration

See `configs/config.json` for overridable options:
```json
{
  "target": "tfopwg_disp",
  "drop_cols": ["rowid","toi","tid","ctoi_alias","rastr","decstr","toi_created","rowupdate"],
  "test_size": 0.2,
  "random_state": 42,
  "use_smote": false,
  "model": {
    "name": "random_forest",
    "params": { "random_state": 42, "class_weight": "balanced", "n_estimators": 200 }
  },
  "scoring": "balanced_accuracy",
  "grid_search": { "enabled": false, "param_grid": {} }
}
```

> This base version trains a **RandomForest** pipeline. You can extend `exo_ml/models.py` to add SVM, LogReg, XGBoost, etc., and optionally wire up `GridSearchCV` if you want hyperparameter tuning.

## Notes

- The `preprocess` step includes **median imputation + scaling** (numeric) and **most-frequent imputation + OneHotEncoder** (categorical) with `handle_unknown="ignore"` so unseen categories won’t break inference.
- For severely imbalanced labels, consider enabling SMOTE (requires `imbalanced-learn`) or using class-weighted models. You can also change the primary metric in config.
- If you export from the NASA site with '#' metadata lines, the loader will handle it if it's TSV. For direct, clean CSV, consider NASA TAP: `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+toi&format=csv`.
```

