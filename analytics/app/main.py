from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from app.analyzer import analyze_student_performance

app = FastAPI(title="SmartHire Analytics Microservice")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResultItem(BaseModel):
    test_title: str
    percentage: float
    category_breakdown: Dict[str, Dict[str, int]]

class AnalysisRequest(BaseModel):
    results: List[ResultItem]

@app.get("/")
def read_root():
    return {"message": "SmartHire Python Analytics Service is online"}

@app.post("/analyze")
def analyze(data: AnalysisRequest):
    # Parse request results list into structure expected by analyzer
    results_list = []
    for item in data.results:
        results_list.append({
            "test_title": item.test_title,
            "percentage": item.percentage,
            "category_breakdown": item.category_breakdown
        })
    
    analysis = analyze_student_performance(results_list)
    return analysis
