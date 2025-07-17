"""
Database models and configuration using SQLAlchemy with async support
"""

import os
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Convert PostgreSQL URL to async format
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)

# Create async session maker
async_session_maker = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

Base = declarative_base()

# Database models
class Applications(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_name = Column(String, nullable=False)
    ci_id = Column(String, nullable=False)
    audit_date_from = Column(String, nullable=False)
    audit_date_to = Column(String, nullable=False)
    enable_followup_questions = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DataRequests(Base):
    __tablename__ = "data_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    column_mappings = Column(JSON, default={})
    questions = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ToolConnectors(Base):
    __tablename__ = "tool_connectors"
    
    id = Column(Integer, primary_key=True, index=True)
    ci_id = Column(String, nullable=False)
    connector_type = Column(String, nullable=False)
    config = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DataCollectionSessions(Base):
    __tablename__ = "data_collection_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, nullable=False)
    status = Column(String, default="pending")
    progress = Column(Integer, default=0)
    logs = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QuestionAnalyses(Base):
    __tablename__ = "question_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, nullable=False)
    question_id = Column(String, nullable=False)
    original_question = Column(Text, nullable=False)
    category = Column(String)
    subcategory = Column(String)
    generated_prompt = Column(Text, nullable=False)
    tool_suggestion = Column(String, nullable=False)
    connector_reason = Column(Text)
    connector_to_use = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Database session dependency
async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# Initialize database
async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Cleanup function
async def close_db():
    """Close database connections"""
    await engine.dispose()