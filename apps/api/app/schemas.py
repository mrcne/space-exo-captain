from pydantic import BaseModel
from typing import List, Optional
from typing import Dict

class PredictRequest(BaseModel):
    # keys must match FEATURES
    features: Dict[str, float]

class PredictResponse(BaseModel):
    prediction: List
    model_version: Optional[str] = None
