from pydantic import BaseModel, Field
from typing import Optional


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "What are exoplanets?"
            }
        }


class ChatResponse(BaseModel):
    response: str
    status: str = "success"
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Exoplanets are planets that orbit stars outside our solar system.",
                "status": "success"
            }
        }


class ErrorResponse(BaseModel):
    error: str
    status: str = "error"