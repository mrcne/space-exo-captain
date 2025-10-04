from fastapi import FastAPI, HTTPException

app = FastAPI(title="Captain Exoplanet")

@app.get("/health")
def health():
    return {"status": "ok"}
