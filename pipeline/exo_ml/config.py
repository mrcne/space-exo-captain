from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict

# -------------------------------
# Default (baseline) configuration
# -------------------------------
DEFAULT_CONFIG: Dict[str, Any] = {
    "target": "tfopwg_disp",
    "drop_cols": ["rowid","toi","tid","ctoi_alias","rastr","decstr","toi_created","rowupdate"],
    "test_size": 0.2,
    "random_state": 42,
    "use_smote": False,          # requires imblearn if set True

    # Single-model (used when stacking.enabled == False)
    "model": {
        "name": "random_forest",  # ["random_forest","extra_trees","histgb","xgboost","svc","logreg"]
        "params": {
            "random_state": 42,
            "class_weight": "balanced",
            "n_estimators": 300,
            "max_features": "sqrt"
        }
    },

    # Stacking (ignored unless enabled=True)
    "stacking": {
        "enabled": False,
        "base_models": [
            # ["xgboost", {"n_estimators": 600, "learning_rate": 0.05, "max_depth": 6,
            #              "subsample": 0.8, "colsample_bytree": 0.8, "tree_method": "hist"}],
            # ["random_forest", {"n_estimators": 500, "class_weight": "balanced_subsample", "max_features": "sqrt"}],
            # ["histgb", {"max_depth": None}]
        ],
        "final_model": ["logreg", {"C": 1.0, "max_iter": 1000}],
        "stacker_params": {"cv": 5}
    },

    "scoring": "balanced_accuracy",   # used for GridSearchCV refit if grid provided

    # Pipeline-level grid search (keys use step prefix: clf__..., preprocessor__...)
    "grid_search": {
        "enabled": False,
        "cv": 3,
        "n_jobs": None,
        "param_grid": {
            # Example RF grid (set enabled=True to use):
            # "clf__n_estimators": [300, 600],
            # "clf__max_depth": [None, 10, 20],
            # "clf__min_samples_split": [2, 5],
            # "clf__min_samples_leaf": [1, 2]
        }
    }
}

# -------------------------------
# Named PRESETS (no external files)
# -------------------------------
PRESETS: Dict[str, Dict[str, Any]] = {
    # 1) Random Forest
    "rf": {
        "model": {
            "name": "random_forest",
            "params": {
                "n_estimators": 20,
                "max_features": "sqrt",
                "class_weight": "balanced_subsample",
                "random_state": 42
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__n_estimators": [10, 20],
                "clf__max_depth": [None, 10],
                "clf__min_samples_split": [2, 5],
                "clf__min_samples_leaf": [1, 2]
            }
        }
    },

    # 2) Extra Trees
    "extra_trees": {
        "model": {
            "name": "extra_trees",
            "params": {
                "n_estimators": 50,
                "max_features": "sqrt",
                "class_weight": "balanced_subsample",
                "random_state": 42
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__n_estimators": [10, 20, 30],
                "clf__max_depth": [None, 4, 8]
            }
        }
    },

    # 3) HistGradientBoosting (sklearn)
    "histgb": {
        "model": {
            "name": "histgb",
            "params": {
                "max_depth": None,
                "learning_rate": 0.1,
                "l2_regularization": 0.0
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__learning_rate": [0.05, 0.1, 0.2],
                "clf__max_depth": [None, 8, 12]
            }
        }
    },

    # 4) XGBoost (pip install xgboost)
    "xgb": {
        "model": {
            "name": "xgboost",
            "params": {
                "n_estimators": 20,
                "learning_rate": 0.05,
                "max_depth": 6,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "tree_method": "hist",
                "eval_metric": "mlogloss",
                "random_state": 42
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": False,
            "cv": 5,
            "param_grid": {
                "clf__n_estimators": [10, 20],
                "clf__max_depth": [4, 6],
                "clf__learning_rate": [0.03, 0.05]
            }
        }
    },

    # 5) SVC (probabilities enabled in models.py)
    "svc": {
        "model": {
            "name": "svc",
            "params": {
                "kernel": "rbf",
                "C": 2.0,
                "gamma": "scale",
                "probability": True
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__C": [0.5, 1.0, 2.0],
                "clf__gamma": ["scale", 0.1, 0.01]
            }
        }
    },

    # 6) Logistic Regression
    "logreg": {
        "model": {
            "name": "logreg",
            "params": {
                "C": 1.0,
                "max_iter": 100
            }
        },
        "stacking": {"enabled": False},
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__C": [0.5, 1.0, 2.0]
            }
        }
    },

    # 7) Stacking (XGB + RF + HistGB → LogReg)
    "stack_basic": {
        "model": { "name": "random_forest", "params": { "n_estimators": 10 } },  # ignored when stacking.enabled=True
        "stacking": {
            "enabled": True,
            "base_models": [
                ["xgboost", {"n_estimators": 10, "learning_rate": 0.05, "max_depth": 6,
                             "subsample": 0.8, "colsample_bytree": 0.8, "tree_method": "hist", "eval_metric": "mlogloss"}],
                ["random_forest", {"n_estimators": 10, "class_weight": "balanced_subsample", "max_features": "sqrt"}],
                ["histgb", {"max_depth": None}]
            ],
            "final_model": ["logreg", {"C": 1.0, "max_iter": 50}],
            "stacker_params": {"cv": 5}
        },
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__final_estimator__C": [0.5, 1.0]
            }
        }
    },

    # 8) Stacking (RF + ET + HistGB → SVC meta)
    "stack_svc_meta": {
        "model": { "name": "random_forest", "params": { "n_estimators": 10 } },
        "stacking": {
            "enabled": True,
            "base_models": [
                ["random_forest", {"n_estimators": 5, "class_weight": "balanced_subsample", "max_features": "sqrt"}],
                ["extra_trees",  {"n_estimators": 5, "class_weight": "balanced_subsample"}],
                ["histgb", {"max_depth": None}]
            ],
            "final_model": ["svc", {"C": 1.0, "kernel": "rbf", "probability": True}],
            "stacker_params": {"cv": 5}
        },
        "grid_search": {
            "enabled": True,
            "cv": 5,
            "param_grid": {
                "clf__final_estimator__C": [0.5, 1.0],
                "clf__final_estimator__kernel": ["rbf", "linear"]
            }
        }
    },
}

# -------------------------------
# Helpers
# -------------------------------
def _merge_shallow(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    out = base.copy()
    for k, v in (override or {}).items():
        if isinstance(v, dict) and k in out and isinstance(out[k], dict):
            tmp = out[k].copy()
            tmp.update(v)
            out[k] = tmp
        else:
            out[k] = v
    return out

def list_presets() -> list[str]:
    return sorted(PRESETS.keys())

# Backward-compatible loader:
# - None                 -> DEFAULT_CONFIG
# - existing file path   -> JSON merged into DEFAULT_CONFIG
# - preset name          -> PRESETS[name] merged into DEFAULT_CONFIG
# - "preset:<name>"      -> same as above
def load_config(path: str | Path | None) -> Dict[str, Any]:
    if path is None:
        return DEFAULT_CONFIG.copy()

    # Handle string presets
    if isinstance(path, str):
        key = path.strip()
        if key.startswith("preset:"):
            key = key.split(":", 1)[1].strip()
        # If not a file and matches a preset, return it
        if not Path(path).exists() and key in PRESETS:
            return _merge_shallow(DEFAULT_CONFIG, PRESETS[key])

    p = Path(path)
    if p.exists():
        with open(p, "r") as f:
            cfg = json.load(f)
        return _merge_shallow(DEFAULT_CONFIG, cfg)

    # If we reach here: not a file; try plain preset name (for convenience)
    if isinstance(path, str) and path in PRESETS:
        return _merge_shallow(DEFAULT_CONFIG, PRESETS[path])

    raise FileNotFoundError(
        f"Config not found: {path}. If you intended a preset, use one of: {', '.join(list_presets())} "
        f"or prefix with 'preset:'."
    )
