from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
from .services.analytics_engine import AnalyticsEngine
from .config import settings

app = FastAPI(
    title="PopForms Analytics Engine",
    description="Stateless Python Analytics Engine processing JSON data from Node.js Backend",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "PopForms Stateless Python Analytics Engine"}

@app.post("/api/analytics/overview")
def post_overview(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_overview(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/forms/overview")
def post_form_overview(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_form_overview(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/forms/year-comparison")
def post_year_comparison(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_year_comparison(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/forms/question-comparison")
def post_question_comparison(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_question_comparison(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/forms/submission-comparison")
def post_submission_comparison(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_submission_comparison(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/forms/growth")
def post_growth_reporting(payload: Dict[str, Any] = Body(...)):
    try:
        return AnalyticsEngine.compute_growth_reporting(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
