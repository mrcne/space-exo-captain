import pandas as pd

def drop_bad_columns(df: pd.DataFrame,
                     max_missing_pct: float = 0.8,
                     min_unique_ratio: float = 0.0005) -> pd.DataFrame:
    out = df.copy()
    # 1) drop columns with too many NaNs
    keep = out.columns[out.isna().mean() <= max_missing_pct]
    out = out[keep]
    # 2) drop near-constant columns
    n = len(out)
    keep = [c for c in out.columns
            if out[c].nunique(dropna=False) / max(n,1) >= min_unique_ratio]
    return out[keep]