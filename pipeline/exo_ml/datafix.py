import pandas as pd
import numpy as np

def coerce_numeric(df: pd.DataFrame, min_numeric_ratio: float = 0.95) -> pd.DataFrame:
    out = df.copy()
    for c in out.columns:
        if pd.api.types.is_object_dtype(out[c]):
            # try numeric conversion
            s_num = pd.to_numeric(out[c].astype(str).str.replace(",","").str.strip(),
                                  errors="coerce")
            ratio = s_num.notna().mean()
            if ratio >= min_numeric_ratio:
                out[c] = s_num  # convert this column to numeric
    return out