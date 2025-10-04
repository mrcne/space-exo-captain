from .features import FEATURES

def validate_and_vectorize(features_dict: dict):
    missing = [f for f in FEATURES if f not in features_dict]
    extra = [k for k in features_dict if k not in FEATURES]
    if missing or extra:
        raise ValueError(f"missing={missing} extra={extra}")

    # build ordered vector
    try:
        vec = [float(features_dict[f]) if features_dict[f] is not None else float("nan") for f in FEATURES]
    except Exception as e:
        raise ValueError(f"invalid feature value: {e}")
    return vec
