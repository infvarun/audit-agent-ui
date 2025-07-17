from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

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

class ToolConnector(Base):
    __tablename__ = "toolConnectors"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    ciId = Column(String, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    config = Column(JSON, default={})
    status = Column(String, default="pending")
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

class DataCollectionSession(Base):
    __tablename__ = "dataCollectionSessions"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    logs = Column(JSON, default=[])
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

class AuditResult(Base):
    __tablename__ = "auditResults"
    
    id = Column(Integer, primary_key=True, index=True)
    applicationId = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")
    documentPath = Column(String)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()