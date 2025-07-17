#!/usr/bin/env python3
"""
Python LangChain service for OpenAI orchestration
This service runs separately and handles OpenAI calls for the Node.js backend
"""

import os
import sys
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Any
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Pydantic Models
class QuestionAnalysisRequest(BaseModel):
    question: str
    category: str = ""
    subcategory: str = ""

class BatchQuestionAnalysisRequest(BaseModel):
    questions: List[Dict[str, Any]]

# LangChain Service
class QuestionAnalysisService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            temperature=0.3,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.analysis_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert audit assistant. Your task is to analyze audit questions and generate:
1. An efficient prompt for an AI agent to collect the required data
2. A tool suggestion for data collection
3. A connector recommendation

Available tools: SQL Server, Gnosis Path, ServiceNow, NAS Path

For each question, provide a JSON response with:
- "prompt": A clear, actionable prompt for an AI agent
- "toolSuggestion": The best tool from the available options
- "connectorReason": Brief explanation why this tool is recommended

Focus on practical data collection methods and be specific about what data to gather."""),
            ("human", """Analyze this audit question: "{question}"
Category: {category}
Subcategory: {subcategory}""")
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
                if not all(key in result for key in ["prompt", "toolSuggestion", "connectorReason"]):
                    raise ValueError("Missing required fields in response")
                
                # Validate tool suggestion
                valid_tools = ["SQL Server", "Gnosis Path", "ServiceNow", "NAS Path"]
                if result["toolSuggestion"] not in valid_tools:
                    result["toolSuggestion"] = "SQL Server"  # Default fallback
                
                return result
                
            except json.JSONDecodeError:
                # Fallback response if JSON parsing fails
                return {
                    "prompt": f"Collect data to answer: {question}",
                    "toolSuggestion": "SQL Server",
                    "connectorReason": "Default selection - SQL Server is commonly used for audit data extraction"
                }
            
        except Exception as e:
            print(f"Error analyzing question: {str(e)}")
            # Fallback response for any other errors
            return {
                "prompt": f"Collect data to answer: {question}",
                "toolSuggestion": "SQL Server",
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
            
            # Add original question data and format for Node.js backend
            result = {
                "id": question_data.get("id", ""),
                "originalQuestion": question,
                "category": category,
                "subcategory": subcategory,
                "prompt": analysis["prompt"],
                "toolSuggestion": analysis["toolSuggestion"],
                "connectorReason": analysis["connectorReason"],
                "connectorToUse": analysis["toolSuggestion"].lower().replace(" ", "_")
            }
            
            results.append(result)
        
        return results

# Global service instance
question_analysis_service = QuestionAnalysisService()

# FastAPI app
app = FastAPI(
    title="Python LangChain Service",
    description="LangChain service for OpenAI orchestration, called by Node.js backend",
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-langchain-service"}

# Single question analysis endpoint
@app.post("/analyze-question")
async def analyze_question_endpoint(request: QuestionAnalysisRequest):
    """Analyze a single question using LangChain"""
    try:
        result = await question_analysis_service.analyze_question(
            request.question,
            request.category,
            request.subcategory
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Batch question analysis endpoint
@app.post("/analyze-questions-batch")
async def analyze_questions_batch_endpoint(request: BatchQuestionAnalysisRequest):
    """Analyze multiple questions using LangChain"""
    try:
        results = await question_analysis_service.analyze_questions_batch(request.questions)
        return {"questions": results, "totalQuestions": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("LANGCHAIN_PORT", 5001))
    print(f"Starting Python LangChain service on port {port}")
    
    uvicorn.run(
        "python_langchain_service:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )