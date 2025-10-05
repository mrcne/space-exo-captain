# Space-Exo Captain — Unified ML & DL Pipelines

This repo standardizes **evaluation artifacts** across **ML** and **DL** runs so that every training (and inference) produces the same file names in its artifact folder:

```
feature_columns.json
metadata.json
test_metrics.json
test_classification_report.txt
predictions.csv
test_cm.png
```

Model binaries differ by pipeline (as intended):
- **ML**: serialized sklearn pipeline (e.g., `model.joblib` inside the artifacts folder).
- **DL (Keras)**: `dl_model.keras` (+ `preprocessor.joblib`).
- **TabNet**: `tabnet.zip` (+ `preprocessor.joblib`).

> All commands below assume your package layout `exo_ml/` and a Python environment already activated. Replace file paths as needed.

---

## 0) Environment & Installation (once)

```bash
# Core
pip install -r requirements.txt

# If using DL (Keras / TensorFlow)
pip install tensorflow==2.15.* tensorflow-io-gcs-filesystem

# If using TabNet
pip install pytorch-tabnet torch torchvision torchaudio
```
On Windows (PowerShell), the commands are identical; ensure your virtualenv is active:
```powershell
.\.venv\Scripts\Activate.ps1
```

---

## 1) Inputs & Configuration

- **Input CSV**: TFOPWG/TOI/cumulative datasets with the target column defined in config.
- **Config**: Pass either a JSON path or a `preset:<name>` from the list below.

### Supported ML presets (from `config.py`)
| Preset | Base model | Grid Search | Stacking |
|---|---|---|---|
| `preset:rf` | `random_forest` | on | off |
| `preset:extra_trees` | `extra_trees` | on | off |
| `preset:histgb` | `histgb` | on | off |
| `preset:xgb` | `xgboost` | off | off |
| `preset:svc` | `svc` | on | off |
| `preset:logreg` | `logreg` | on | off |
| `preset:stack_basic` | `random_forest` | on | on |
| `preset:stack_svc_meta` | `random_forest` | on | on |

---

## 2) Train — **ML** (scikit-learn pipeline)

### Quick examples (one-liners)
```bash
# Random Forest (with GridSearch enabled in preset)
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_rf --config preset:rf

# Extra Trees
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_et --config preset:extra_trees

# Histogram Gradient Boosting
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_histgb --config preset:histgb

# XGBoost
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_xgb --config preset:xgb

# SVC
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_svc --config preset:svc

# Logistic Regression
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_logreg --config preset:logreg

# Stacking (basic)
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_stack_basic --config preset:stack_basic

# Stacking (SVC as meta-learner)
python -m exo_ml.train --input data/TOI_2025.10.03_10.51.46.csv --outdir artifacts/ml_stack_svc --config preset:stack_svc_meta
```

**Flags**
- `--input`: path to CSV/TSV.
- `--config`: JSON path or one of the `preset:*` above.
- `--outdir`: root for timestamped artifact folder.

**Outputs**: standardized files + model binary for the chosen method.

---

## 3) Infer — **ML**

```bash
python -m exo_ml.infer   --input data/new_candidates.csv   --artifacts artifacts/ml_xgb/2025-10-05_23-59-59   --with-proba
# Default output: <artifacts>/predictions.csv  (use --output to override)
```

---

## 4) Train — **DL (Keras)**

Supported `--arch` values:
- `mlp_bn` (default)
- `mlp`
- `transformer` (FT-style tabular transformer)
- `cnn1d`

```bash
python -m exo_ml.deep.train_dl   --input data/TOI_2025.10.03_10.51.46.csv   --outdir artifacts/dl_mlpbn   --arch mlp_bn   --epochs 120   --batch-size 256   --val-size 0.2
```

**Outputs**: standardized files + `dl_model.keras` + `preprocessor.joblib` (+ training curves).

---

## 5) Infer — **DL (Keras)**

```bash
python -m exo_ml.deep.infer_dl   --input data/new_candidates.csv   --artifacts artifacts/dl_mlpbn/2025-10-05_23-59-59
# Default output: <artifacts>/predictions.csv
```

---

## 6) Train — **TabNet**

```bash
python -m exo_ml.deep.tabnet_train   --input data/TOI_2025.10.03_10.51.46.csv   --outdir artifacts/tabnet   --n-d 64 --n-a 64 --n-steps 5 --gamma 1.5   --lambda-sparse 1e-4 --lr 0.002   --max-epochs 200 --patience 20
```

**Outputs**: standardized files + `tabnet.zip` + `preprocessor.joblib`.

---

## 7) Standard Files — Ground Truth

- **`feature_columns.json`**: training features (ordered).
- **`metadata.json`**: pipeline type, model/arch, target, dropped columns, classes, (DL) input_dim.
- **`test_metrics.json`**: accuracy, balanced_accuracy, macro/weighted precision/recall/f1.
- **`test_classification_report.txt`**: sklearn report (digits=4).
- **`test_cm.png`**: confusion matrix for the held-out split.
- **`predictions.csv`**:
  - Train time: held-out split with `true_label`, `pred_label`, and `proba_*`.
  - Inference: full input with `pred_label` and `proba_*`.

---

## 8) Windows PowerShell Examples

```powershell
python -m exo_ml.train --input data\TOI_2025.10.03_10.51.46.csv --outdir artifacts\ml_xgb --config preset:xgb
python -m exo_ml.infer --input data
ew_candidates.csv --artifacts artifacts\ml_xgb5-10-05_23-59-59 --with-proba

python -m exo_ml.deep.train_dl --input data\TOI_2025.10.03_10.51.46.csv --outdir artifacts\dl_mlpbn --arch mlp_bn --epochs 120 --batch-size 256
python -m exo_ml.deep.infer_dl --input data
ew_candidates.csv --artifacts artifacts\dl_mlpbn5-10-05_23-59-59

python -m exo_ml.deep.tabnet_train --input data\TOI_2025.10.03_10.51.46.csv --outdir artifacts	abnet --max-epochs 200 --patience 20
```

---

## 9) Notes & Troubleshooting

- **TensorFlow**: compiled with `SparseCategoricalCrossentropy()` **without** `label_smoothing` for compatibility.
- **Imbalance**: DL uses `class_weight`; ML can use class-weighted models (see presets) or sampling strategies.
- **Reproducibility**: Seeds set where possible; small variations may occur on GPU.
- **Schema**: Keep train/infer columns aligned. The inference scripts reindex to `feature_columns.json`.

Happy hunting for exoplanets 🚀
