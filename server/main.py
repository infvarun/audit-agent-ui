#!/usr/bin/env python3
"""
Main FastAPI server for the audit data collection application
Replaces the Node.js Express server with comprehensive Python backend
"""

import os
import json
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import pandas as pd
from datetime import datetime
import logging

# Import our modules
from database import get_db, init_db
from storage import DatabaseStorage
from langchain_service import QuestionAnalysisService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Audit Data Collection API",
    description="Python FastAPI backend for audit data collection wizard",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
storage = DatabaseStorage()
question_analysis_service = QuestionAnalysisService()

# Pydantic models for request/response
class ApplicationCreate(BaseModel):
    auditName: str
    ciId: str
    auditDateFrom: str
    auditDateTo: str
    enableFollowupQuestions: bool = False

class ApplicationUpdate(BaseModel):
    auditName: Optional[str] = None
    ciId: Optional[str] = None
    auditDateFrom: Optional[str] = None
    auditDateTo: Optional[str] = None
    enableFollowupQuestions: Optional[bool] = None

class ConnectorCreate(BaseModel):
    ciId: str
    connectorType: str
    config: Dict[str, Any]

class QuestionAnalysisRequest(BaseModel):
    applicationId: int

class QuestionAnalysisSave(BaseModel):
    applicationId: int
    analyses: List[Dict[str, Any]]

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-fastapi-server"}

# Application endpoints
@app.get("/api/applications")
async def get_applications():
    """Get all applications"""
    try:
        applications = await storage.get_all_applications()
        return applications
    except Exception as e:
        logger.error(f"Error getting applications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve applications")

@app.post("/api/applications")
async def create_application(application: ApplicationCreate):
    """Create a new application"""
    try:
        app_data = {
            "auditName": application.auditName,
            "ciId": application.ciId,
            "auditDateFrom": application.auditDateFrom,
            "auditDateTo": application.auditDateTo,
            "enableFollowupQuestions": application.enableFollowupQuestions
        }
        
        new_application = await storage.create_application(app_data)
        return new_application
    except Exception as e:
        logger.error(f"Error creating application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create application")

@app.get("/api/applications/{application_id}")
async def get_application(application_id: int):
    """Get application by ID"""
    try:
        application = await storage.get_application_by_id(application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        return application
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting application {application_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve application")

@app.put("/api/applications/{application_id}")
async def update_application(application_id: int, application: ApplicationUpdate):
    """Update an existing application"""
    try:
        # Get current application
        current_app = await storage.get_application_by_id(application_id)
        if not current_app:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Update with new values
        update_data = {k: v for k, v in application.dict().items() if v is not None}
        updated_app = await storage.update_application(application_id, update_data)
        return updated_app
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application {application_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update application")

# Data request endpoints
@app.post("/api/applications/{application_id}/data-requests")
async def upload_data_request(
    application_id: int,
    file: UploadFile = File(...),
    fileType: str = Form(...),
    columnMappings: str = Form(...)
):
    """Upload and process data request files"""
    try:
        # Read file content
        file_content = await file.read()
        
        # Parse column mappings
        try:
            column_mappings = json.loads(columnMappings)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid column mappings JSON")
        
        # Process Excel file
        df = pd.read_excel(file_content)
        
        # Extract questions based on column mappings
        questions = []
        for _, row in df.iterrows():
            question_data = {
                "question": str(row.get(column_mappings.get("question", ""), "")),
                "category": str(row.get(column_mappings.get("category", ""), "")),
                "subcategory": str(row.get(column_mappings.get("subcategory", ""), "")),
                "questionNumber": str(row.get(column_mappings.get("questionNumber", ""), ""))
            }
            
            # Skip empty questions
            if question_data["question"].strip():
                questions.append(question_data)
        
        # Save data request
        data_request = await storage.create_data_request({
            "applicationId": application_id,
            "fileName": file.filename,
            "fileType": fileType,
            "columnMappings": column_mappings,
            "questions": questions
        })
        
        return data_request
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading data request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload data request")

@app.get("/api/applications/{application_id}/data-requests")
async def get_data_requests(application_id: int):
    """Get data requests for an application"""
    try:
        data_requests = await storage.get_data_requests_by_application_id(application_id)
        return data_requests
    except Exception as e:
        logger.error(f"Error getting data requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data requests")

# Question analysis endpoints
@app.post("/api/questions/analyze")
async def analyze_questions(request: QuestionAnalysisRequest):
    """Analyze questions with AI to generate prompts and tool suggestions"""
    try:
        # Get data requests for the application
        data_requests = await storage.get_data_requests_by_application_id(request.applicationId)
        
        if not data_requests:
            raise HTTPException(status_code=404, detail="No data requests found for this application")
        
        # Extract all questions
        all_questions = []
        for dr in data_requests:
            all_questions.extend(dr.get("questions", []))
        
        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found")
        
        # Analyze questions using LangChain service
        analyzed_questions = await question_analysis_service.analyze_questions_batch(all_questions)
        
        return {
            "questions": analyzed_questions,
            "totalQuestions": len(analyzed_questions),
            "analysisComplete": True
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing questions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze questions")

@app.post("/api/questions/save-analyses")
async def save_question_analyses(request: QuestionAnalysisSave):
    """Save question analyses to database"""
    try:
        saved_analyses = []
        
        for analysis in request.analyses:
            saved_analysis = await storage.create_question_analysis({
                "applicationId": request.applicationId,
                "questionId": analysis.get("id"),
                "originalQuestion": analysis.get("originalQuestion"),
                "category": analysis.get("category"),
                "subcategory": analysis.get("subcategory"),
                "generatedPrompt": analysis.get("prompt"),
                "toolSuggestion": analysis.get("toolSuggestion"),
                "connectorReason": analysis.get("connectorReason"),
                "connectorToUse": analysis.get("connectorToUse")
            })
            saved_analyses.append(saved_analysis)
        
        return {
            "success": True,
            "savedAnalyses": saved_analyses,
            "totalSaved": len(saved_analyses)
        }
    except Exception as e:
        logger.error(f"Error saving question analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save question analyses")

@app.get("/api/questions/analyses/{application_id}")
async def get_question_analyses(application_id: int):
    """Get saved question analyses for an application"""
    try:
        analyses = await storage.get_question_analyses_by_application_id(application_id)
        return analyses
    except Exception as e:
        logger.error(f"Error getting question analyses: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve question analyses")

# Tool connector endpoints
@app.post("/api/connectors")
async def create_connector(connector: ConnectorCreate):
    """Create a new tool connector"""
    try:
        new_connector = await storage.create_tool_connector({
            "ciId": connector.ciId,
            "connectorType": connector.connectorType,
            "config": connector.config
        })
        return new_connector
    except Exception as e:
        logger.error(f"Error creating connector: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create connector")

@app.get("/api/connectors")
async def get_connectors(ci_id: Optional[str] = None):
    """Get all connectors, optionally filtered by CI ID"""
    try:
        if ci_id:
            connectors = await storage.get_tool_connectors_by_ci_id(ci_id)
        else:
            connectors = await storage.get_all_tool_connectors()
        return connectors
    except Exception as e:
        logger.error(f"Error getting connectors: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve connectors")

@app.delete("/api/connectors/{connector_id}")
async def delete_connector(connector_id: int):
    """Delete a tool connector"""
    try:
        await storage.delete_tool_connector(connector_id)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting connector: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete connector")

# Column detection endpoint (for Excel file processing)
@app.post("/api/detect-columns")
async def detect_columns(file: UploadFile = File(...)):
    """Detect columns in uploaded Excel file"""
    try:
        file_content = await file.read()
        df = pd.read_excel(file_content)
        
        # Get column names and sample data
        columns = df.columns.tolist()
        sample_data = df.head(3).to_dict('records')
        
        return {
            "columns": columns,
            "sampleData": sample_data,
            "totalRows": len(df)
        }
    except Exception as e:
        logger.error(f"Error detecting columns: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to detect columns")

# Serve static files (React app)
import os
if os.path.exists("public/assets"):
    app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")
if os.path.exists("dist/public"):
    app.mount("/", StaticFiles(directory="dist/public", html=True), name="static")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

if __name__ == "__main__":
    # Use port 8000 for backend, Node.js proxy uses 5000
    port = 8000
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )