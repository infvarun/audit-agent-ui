#!/usr/bin/env python3
"""
Standalone Python FastAPI server with LangChain integration
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from dotenv import load_dotenv
import time
from typing import List, Optional, Dict, Any
import json
from contextlib import asynccontextmanager
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.sql import func
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import openpyxl
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    auditName = Column(String, nullable=False)
    name = Column(String, nullable=False)
    ciId = Column(String, nullable=False)
    startDate = Column(String, nullable=False)
    endDate = Column(String, nullable=False)
    settings = Column(JSON, default={})
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class DataRequest(Base):
    __tablename__ = "dataRequests"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    fileName = Column(String, nullable=False)
    filePath = Column(String, nullable=False)
    fileSize = Column(Integer, nullable=False)
    fileType = Column(String, nullable=False)
    categories = Column(JSON, default=[])
    subcategories = Column(JSON, default=[])
    columnMappings = Column(JSON, default={})
    questions = Column(JSON, default=[])
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class QuestionAnalysis(Base):
    __tablename__ = "questionAnalyses"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    questionId = Column(String, nullable=False)
    originalQuestion = Column(Text, nullable=False)
    category = Column(String)
    subcategory = Column(String)
    aiPrompt = Column(Text, nullable=False)
    toolSuggestion = Column(String, nullable=False)
    connectorReason = Column(Text)
    connectorToUse = Column(String)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class DataCollectionSession(Base):
    __tablename__ = "dataCollectionSessions"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    logs = Column(JSON, default=[])
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

# Create tables
Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# LangChain service
class QuestionAnalysisService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            temperature=0.3,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert AI assistant that specializes in analyzing audit questions and generating optimized data collection prompts. Your task is to analyze audit questions and provide:

1. **Efficient AI Prompt**: Create a concise, effective prompt that would help an AI system answer the original question using available data sources.

2. **Tool Suggestion**: Recommend the most appropriate data collection tool from these options:
   - "sql_server": For database queries, data extraction, system configurations
   - "gnosis_path": For knowledge management, documentation, procedures
   - "servicenow": For IT service management, incidents, change requests
   - "nas_path": For file systems, document storage, network shares

3. **Reasoning**: Explain why the suggested tool is most appropriate for this question.

Respond with valid JSON in this exact format:
{{
  "aiPrompt": "your generated prompt here",
  "toolSuggestion": "tool_name",
  "connectorReason": "explanation of why this tool is appropriate"
}}

Make the AI prompt efficient and focused on data collection rather than general analysis."""),
            ("human", """Question: {question}
Category: {category}
Subcategory: {subcategory}

Analyze this audit question and provide the JSON response.""")
        ])

    async def analyze_question(self, question: str, category: str = "", subcategory: str = "") -> Dict[str, Any]:
        """Analyze a single audit question and return AI prompt and tool suggestion"""
        try:
            # Create the prompt
            prompt = self.analysis_prompt.format_messages(
                question=question,
                category=category,
                subcategory=subcategory
            )
            
            # Get response from LLM
            response = await self.llm.ainvoke(prompt)
            
            # Parse JSON response
            try:
                result = json.loads(response.content)
                
                # Validate required fields
                if not all(key in result for key in ["aiPrompt", "toolSuggestion", "connectorReason"]):
                    raise ValueError("Missing required fields in response")
                
                # Validate tool suggestion
                valid_tools = ["sql_server", "gnosis_path", "servicenow", "nas_path"]
                if result["toolSuggestion"] not in valid_tools:
                    result["toolSuggestion"] = "sql_server"  # Default fallback
                
                return result
                
            except json.JSONDecodeError:
                # Fallback response if JSON parsing fails
                return {
                    "aiPrompt": f"Analyze and provide data to answer: {question}",
                    "toolSuggestion": "sql_server",
                    "connectorReason": "Default selection - SQL Server is commonly used for audit data extraction"
                }
            
        except Exception as e:
            print(f"Error analyzing question: {str(e)}")
            # Fallback response for any other errors
            return {
                "aiPrompt": f"Analyze and provide data to answer: {question}",
                "toolSuggestion": "sql_server",
                "connectorReason": "Error occurred during analysis, using default tool selection"
            }

    async def analyze_questions_batch(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze multiple questions in batch"""
        results = []
        
        for question_data in questions:
            question = question_data.get("question", "")
            category = question_data.get("category", "")
            subcategory = question_data.get("subcategory", "")
            
            analysis = await self.analyze_question(question, category, subcategory)
            
            # Add original question data
            result = {
                "id": question_data.get("id", ""),
                "originalQuestion": question,
                "category": category,
                "subcategory": subcategory,
                "prompt": analysis["aiPrompt"],
                "toolSuggestion": analysis["toolSuggestion"],
                "connectorReason": analysis["connectorReason"],
                "connectorToUse": analysis["toolSuggestion"]
            }
            
            results.append(result)
        
        return results

# Global service instance
question_analysis_service = QuestionAnalysisService()

# Pydantic models
class ApplicationCreate(BaseModel):
    auditName: str
    name: str
    ciId: str
    startDate: str
    endDate: str
    settings: Dict[str, Any] = {}

class QuestionAnalysisCreate(BaseModel):
    applicationId: int
    analyses: List[Dict[str, Any]]

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Audit Data Collection API",
    description="Python FastAPI server with LangChain integration",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        log_line = f"{request.method} {request.url.path} {response.status_code} in {int(process_time * 1000)}ms"
        if len(log_line) > 80:
            log_line = log_line[:79] + "…"
        print(log_line)
    
    return response

# Routes
@app.get("/api/applications")
async def get_applications(db: Session = Depends(get_db)):
    """Get all applications"""
    try:
        applications = db.query(Application).all()
        return applications
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch applications")

@app.post("/api/applications")
async def create_application(
    application: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Create new application"""
    try:
        app = Application(**application.dict())
        db.add(app)
        db.commit()
        db.refresh(app)
        return app
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/applications/{application_id}")
async def get_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Get specific application"""
    try:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch application")

@app.get("/api/data-requests/application/{application_id}")
async def get_data_requests_by_application(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Get data requests for an application"""
    try:
        requests = db.query(DataRequest).filter(DataRequest.applicationId == application_id).all()
        return requests
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch data requests")

@app.post("/api/questions/analyze")
async def analyze_questions(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Analyze questions using LangChain and OpenAI"""
    try:
        application_id = request.get("applicationId")
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")
        
        # Get questions from data requests
        data_requests = db.query(DataRequest).filter(DataRequest.applicationId == application_id).all()
        if not data_requests:
            raise HTTPException(status_code=404, detail="No data requests found for this application")
        
        all_questions = []
        for req in data_requests:
            if req.questions:
                all_questions.extend(req.questions)
        
        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found to analyze")
        
        # Analyze questions using LangChain
        analyzed_questions = await question_analysis_service.analyze_questions_batch(all_questions)
        
        return {
            "success": True,
            "questions": analyzed_questions,
            "totalQuestions": len(analyzed_questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze questions: {str(e)}")

@app.post("/api/questions/analyses/save")
async def save_question_analyses(
    request: QuestionAnalysisCreate,
    db: Session = Depends(get_db)
):
    """Save question analyses to database"""
    try:
        # Delete existing analyses for this application
        db.query(QuestionAnalysis).filter(QuestionAnalysis.applicationId == request.applicationId).delete()
        
        # Save new analyses
        saved_analyses = []
        for analysis in request.analyses:
            analysis_data = QuestionAnalysis(
                applicationId=request.applicationId,
                questionId=analysis.get("id", ""),
                originalQuestion=analysis.get("originalQuestion", ""),
                category=analysis.get("category", ""),
                subcategory=analysis.get("subcategory", ""),
                aiPrompt=analysis.get("prompt", ""),
                toolSuggestion=analysis.get("toolSuggestion", ""),
                connectorReason=analysis.get("connectorReason", ""),
                connectorToUse=analysis.get("connectorToUse", "")
            )
            
            db.add(analysis_data)
            saved_analyses.append(analysis_data)
        
        db.commit()
        
        return {
            "success": True,
            "analyses": saved_analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save analyses: {str(e)}")

@app.get("/api/questions/analyses/{application_id}")
async def get_question_analyses(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Get saved question analyses"""
    try:
        analyses = db.query(QuestionAnalysis).filter(QuestionAnalysis.applicationId == application_id).all()
        return {"analyses": analyses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analyses: {str(e)}")

@app.post("/api/data-collection/start")
async def start_data_collection(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Start data collection session"""
    try:
        application_id = request.get("applicationId")
        if not application_id:
            raise HTTPException(status_code=400, detail="Application ID is required")
        
        # Create data collection session
        session = DataCollectionSession(
            applicationId=application_id,
            status="running",
            progress=0,
            logs=[]
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start data collection: {str(e)}")

@app.get("/api/data-collection/session/{application_id}")
async def get_data_collection_session(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Get data collection session"""
    try:
        session = db.query(DataCollectionSession).filter(DataCollectionSession.applicationId == application_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch session")

# Serve static files
if os.getenv("NODE_ENV") != "development":
    app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "python-fastapi-langchain", "timestamp": time.time()}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))  # Use different port for testing
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )