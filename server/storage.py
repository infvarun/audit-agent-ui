"""
Database storage layer for the audit data collection application
Handles all database operations using SQLAlchemy
"""

import asyncio
from typing import Dict, List, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload
from database import get_db, Applications, DataRequests, ToolConnectors, QuestionAnalyses, DataCollectionSessions

class DatabaseStorage:
    """Database storage implementation using SQLAlchemy"""
    
    async def get_db_session(self) -> AsyncSession:
        """Get database session"""
        async for session in get_db():
            return session
    
    # Application operations
    async def create_application(self, app_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new application"""
        session = await self.get_db_session()
        
        try:
            application = Applications(
                audit_name=app_data["auditName"],
                ci_id=app_data["ciId"],
                audit_date_from=app_data["auditDateFrom"],
                audit_date_to=app_data["auditDateTo"],
                enable_followup_questions=app_data.get("enableFollowupQuestions", False)
            )
            
            session.add(application)
            await session.commit()
            await session.refresh(application)
            
            return {
                "id": application.id,
                "auditName": application.audit_name,
                "ciId": application.ci_id,
                "auditDateFrom": application.audit_date_from,
                "auditDateTo": application.audit_date_to,
                "enableFollowupQuestions": application.enable_followup_questions,
                "createdAt": application.created_at.isoformat() if application.created_at else None
            }
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    async def get_application_by_id(self, application_id: int) -> Optional[Dict[str, Any]]:
        """Get application by ID"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(
                select(Applications).where(Applications.id == application_id)
            )
            application = result.scalar_one_or_none()
            
            if not application:
                return None
            
            return {
                "id": application.id,
                "auditName": application.audit_name,
                "ciId": application.ci_id,
                "auditDateFrom": application.audit_date_from,
                "auditDateTo": application.audit_date_to,
                "enableFollowupQuestions": application.enable_followup_questions,
                "createdAt": application.created_at.isoformat() if application.created_at else None
            }
        except Exception as e:
            raise e
        finally:
            await session.close()
    
    async def get_all_applications(self) -> List[Dict[str, Any]]:
        """Get all applications"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(
                select(Applications).order_by(Applications.created_at.desc())
            )
            applications = result.scalars().all()
            
            return [
                {
                    "id": app.id,
                    "auditName": app.audit_name,
                    "ciId": app.ci_id,
                    "auditDateFrom": app.audit_date_from,
                    "auditDateTo": app.audit_date_to,
                    "enableFollowupQuestions": app.enable_followup_questions,
                    "createdAt": app.created_at.isoformat() if app.created_at else None
                }
                for app in applications
            ]
        except Exception as e:
            raise e
        finally:
            await session.close()
    
    async def update_application(self, application_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing application"""
        session = await self.get_db_session()
        
        try:
            # Map frontend fields to database fields
            db_update_data = {}
            if "auditName" in update_data:
                db_update_data["audit_name"] = update_data["auditName"]
            if "ciId" in update_data:
                db_update_data["ci_id"] = update_data["ciId"]
            if "auditDateFrom" in update_data:
                db_update_data["audit_date_from"] = update_data["auditDateFrom"]
            if "auditDateTo" in update_data:
                db_update_data["audit_date_to"] = update_data["auditDateTo"]
            if "enableFollowupQuestions" in update_data:
                db_update_data["enable_followup_questions"] = update_data["enableFollowupQuestions"]
            
            await session.execute(
                update(Applications)
                .where(Applications.id == application_id)
                .values(**db_update_data)
            )
            await session.commit()
            
            # Return updated application
            return await self.get_application_by_id(application_id)
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    # Data request operations
    async def create_data_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new data request"""
        session = await self.get_db_session()
        
        try:
            data_request = DataRequests(
                application_id=request_data["applicationId"],
                file_name=request_data["fileName"],
                file_type=request_data["fileType"],
                column_mappings=request_data["columnMappings"],
                questions=request_data["questions"]
            )
            
            session.add(data_request)
            await session.commit()
            await session.refresh(data_request)
            
            return {
                "id": data_request.id,
                "applicationId": data_request.application_id,
                "fileName": data_request.file_name,
                "fileType": data_request.file_type,
                "columnMappings": data_request.column_mappings,
                "questions": data_request.questions,
                "createdAt": data_request.created_at.isoformat() if data_request.created_at else None
            }
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    async def get_data_requests_by_application_id(self, application_id: int) -> List[Dict[str, Any]]:
        """Get all data requests for an application"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(
                select(DataRequests).where(DataRequests.application_id == application_id)
            )
            requests = result.scalars().all()
            
            return [
                {
                    "id": req.id,
                    "applicationId": req.application_id,
                    "fileName": req.file_name,
                    "fileType": req.file_type,
                    "columnMappings": req.column_mappings,
                    "questions": req.questions,
                    "createdAt": req.created_at.isoformat() if req.created_at else None
                }
                for req in requests
            ]
        except Exception as e:
            raise e
        finally:
            await session.close()
    
    # Tool connector operations
    async def create_tool_connector(self, connector_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new tool connector"""
        session = await self.get_db_session()
        
        try:
            connector = ToolConnectors(
                ci_id=connector_data["ciId"],
                connector_type=connector_data["connectorType"],
                config=connector_data["config"]
            )
            
            session.add(connector)
            await session.commit()
            await session.refresh(connector)
            
            return {
                "id": connector.id,
                "ciId": connector.ci_id,
                "connectorType": connector.connector_type,
                "config": connector.config,
                "createdAt": connector.created_at.isoformat() if connector.created_at else None
            }
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    async def get_tool_connectors_by_ci_id(self, ci_id: str) -> List[Dict[str, Any]]:
        """Get all tool connectors for a CI ID"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(
                select(ToolConnectors).where(ToolConnectors.ci_id == ci_id)
            )
            connectors = result.scalars().all()
            
            return [
                {
                    "id": conn.id,
                    "ciId": conn.ci_id,
                    "connectorType": conn.connector_type,
                    "config": conn.config,
                    "createdAt": conn.created_at.isoformat() if conn.created_at else None
                }
                for conn in connectors
            ]
        except Exception as e:
            raise e
        finally:
            await session.close()
    
    async def get_all_tool_connectors(self) -> List[Dict[str, Any]]:
        """Get all tool connectors"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(select(ToolConnectors))
            connectors = result.scalars().all()
            
            return [
                {
                    "id": conn.id,
                    "ciId": conn.ci_id,
                    "connectorType": conn.connector_type,
                    "config": conn.config,
                    "createdAt": conn.created_at.isoformat() if conn.created_at else None
                }
                for conn in connectors
            ]
        except Exception as e:
            raise e
        finally:
            await session.close()
    
    async def delete_tool_connector(self, connector_id: int) -> None:
        """Delete a tool connector"""
        session = await self.get_db_session()
        
        try:
            await session.execute(
                delete(ToolConnectors).where(ToolConnectors.id == connector_id)
            )
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    # Question analysis operations
    async def create_question_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new question analysis"""
        session = await self.get_db_session()
        
        try:
            analysis = QuestionAnalyses(
                application_id=analysis_data["applicationId"],
                question_id=analysis_data["questionId"],
                original_question=analysis_data["originalQuestion"],
                category=analysis_data["category"],
                subcategory=analysis_data["subcategory"],
                generated_prompt=analysis_data["generatedPrompt"],
                tool_suggestion=analysis_data["toolSuggestion"],
                connector_reason=analysis_data["connectorReason"],
                connector_to_use=analysis_data["connectorToUse"]
            )
            
            session.add(analysis)
            await session.commit()
            await session.refresh(analysis)
            
            return {
                "id": analysis.id,
                "applicationId": analysis.application_id,
                "questionId": analysis.question_id,
                "originalQuestion": analysis.original_question,
                "category": analysis.category,
                "subcategory": analysis.subcategory,
                "generatedPrompt": analysis.generated_prompt,
                "toolSuggestion": analysis.tool_suggestion,
                "connectorReason": analysis.connector_reason,
                "connectorToUse": analysis.connector_to_use,
                "createdAt": analysis.created_at.isoformat() if analysis.created_at else None
            }
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()
    
    async def get_question_analyses_by_application_id(self, application_id: int) -> List[Dict[str, Any]]:
        """Get all question analyses for an application"""
        session = await self.get_db_session()
        
        try:
            result = await session.execute(
                select(QuestionAnalyses).where(QuestionAnalyses.application_id == application_id)
            )
            analyses = result.scalars().all()
            
            return [
                {
                    "id": analysis.id,
                    "applicationId": analysis.application_id,
                    "questionId": analysis.question_id,
                    "originalQuestion": analysis.original_question,
                    "category": analysis.category,
                    "subcategory": analysis.subcategory,
                    "generatedPrompt": analysis.generated_prompt,
                    "toolSuggestion": analysis.tool_suggestion,
                    "connectorReason": analysis.connector_reason,
                    "connectorToUse": analysis.connector_to_use,
                    "createdAt": analysis.created_at.isoformat() if analysis.created_at else None
                }
                for analysis in analyses
            ]
        except Exception as e:
            raise e
        finally:
            await session.close()