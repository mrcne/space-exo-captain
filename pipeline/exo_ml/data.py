
from __future__ import annotations
import pandas as pd
from pathlib import Path

def load_table(path_or_url: str | Path) -> pd.DataFrame:
    return pd.read_csv(path_or_url, comment='#')

def basic_clean(df: pd.DataFrame) -> pd.DataFrame:
    """Drop all-null columns, then rows with any NaN."""
    df = df.dropna(axis='columns', how='all')
    df = df.dropna(axis='rows', how='any')
    return df

def train_test_split_df(df: pd.DataFrame, target: str, test_size: float, random_state: int, stratify: bool = True):
    from sklearn.model_selection import train_test_split
    X = df.drop(columns=[target])
    y = df[target].astype(str)
    return train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y if stratify else None
    )
