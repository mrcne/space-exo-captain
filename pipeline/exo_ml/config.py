
import json
from pathlib import Path
from typing import Any, Dict

DEFAULT_CONFIG: Dict[str, Any] = {
    "target": "tfopwg_disp",
    "drop_cols": ["rowid","toi","tid","ctoi_alias","rastr","decstr","toi_created","rowupdate"],
    "test_size": 0.2,
    "random_state": 42,
    "use_smote": False,          # requires imblearn if set True
    "model": {
        "name": "random_forest",
        "params": {
            "random_state": 42,
            "class_weight": "balanced",
            "n_estimators": 200
        }
    },
    "scoring": "balanced_accuracy",   # used for GridSearchCV refit if grid provided
    "grid_search": {                  # optional hyper-params; empty => skip GridSearch
        "enabled": False,
        "param_grid": {
            "clf__n_estimators": [200, 400],
            "clf__max_depth": [None, 10, 20],
            "clf__min_samples_split": [2, 5],
            "clf__min_samples_leaf": [1, 2],
            "clf__max_features": ["sqrt", "log2"]
        }
    }
}

def load_config(path: str | Path | None) -> Dict[str, Any]:
    if path is None:
        return DEFAULT_CONFIG.copy()
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Config file not found: {p}")
    with open(p, "r") as f:
        cfg = json.load(f)
    # merge shallowly with defaults
    merged = DEFAULT_CONFIG.copy()
    for k, v in cfg.items():
        if isinstance(v, dict) and k in merged and isinstance(merged[k], dict):
            tmp = merged[k].copy()
            tmp.update(v)
            merged[k] = tmp
        else:
            merged[k] = v
    return merged
