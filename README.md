# Captain Exoplanet

Link: https://space-exo-captain.vercel.app/

Hunt for exoplanets with AI.

This web application is the browser-based interface for Space Exo Captain. It is built with Next.js (React) and connects to a FastAPI service to obtain predictions from the latest trained model. The objective is to allow anyone to open a browser, provide feature values (via form entry or file upload), and receive a classification—without installing local tooling. The application resides in apps/web and uses a single configurable endpoint to reach the API.

When the stack is running, the flow is:

```
[User] → Next.js (apps/web) → FastAPI (apps/api) → Trained Model (pipeline/artifacts)
```

The web application is a thin client. It does not load or execute the model locally. It sends a request to POST /predict and renders the response. The API retrieves the latest exported artifact from the training pipeline (mirrored under apps/api/artifacts in containers), performs inference, and returns a prediction together with the model version to document provenance.

In the interface, users enter or upload feature values, select Classify, and the application displays the prediction and supporting metadata. The design is intentionally minimal so judges and collaborators can focus on the result. To change the API target, set the MODEL_API_CLASSIFY environment variable in apps/web/.env.local to the full /predict URL (for local development, typically http://localhost:8000/predict).

The API contract is intentionally small. The classify endpoint accepts a JSON body with a map of features and returns a prediction and model_version:

POST /predict Request body (JSON): { "features": { "<feature_name>": 0.0, "<feature_name_2>": 1.23 } }

Response body (JSON): { "prediction": ["<class_or_value>"], "model_version": "<version-or-null>" }

A health check is available at GET /health and returns {"status":"ok"}.

