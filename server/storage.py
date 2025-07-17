from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional, Dict, Any
from .database import (
    Application, DataRequest, ToolConnector, DataCollectionSession, 
    QuestionAnalysis, AuditResult, get_db
)
import json

class DatabaseStorage:
    def __init__(self):
        pass
    
    # Applications
    def create_application(self, db: Session, data: dict) -> Application:
        app = Application(**data)
        db.add(app)
        db.commit()
        db.refresh(app)
        return app
    
    def get_application(self, db: Session, app_id: int) -> Optional[Application]:
        return db.query(Application).filter(Application.id == app_id).first()
    
    def get_all_applications(self, db: Session) -> List[Application]:
        return db.query(Application).all()
    
    def update_application(self, db: Session, app_id: int, data: dict) -> Optional[Application]:
        app = db.query(Application).filter(Application.id == app_id).first()
        if app:
            for key, value in data.items():
                setattr(app, key, value)
            db.commit()
            db.refresh(app)
        return app
    
    # Data Requests
    def create_data_request(self, db: Session, data: dict) -> DataRequest:
        request = DataRequest(**data)
        db.add(request)
        db.commit()
        db.refresh(request)
        return request
    
    def get_data_request_by_application_id(self, db: Session, app_id: int) -> Optional[DataRequest]:
        return db.query(DataRequest).filter(DataRequest.applicationId == app_id).first()
    
    def get_data_requests_by_application_id(self, db: Session, app_id: int) -> List[DataRequest]:
        return db.query(DataRequest).filter(DataRequest.applicationId == app_id).all()
    
    # Tool Connectors
    def create_tool_connector(self, db: Session, data: dict) -> ToolConnector:
        connector = ToolConnector(**data)
        db.add(connector)
        db.commit()
        db.refresh(connector)
        return connector
    
    def get_tool_connectors_by_application_id(self, db: Session, app_id: int) -> List[ToolConnector]:
        return db.query(ToolConnector).filter(ToolConnector.applicationId == app_id).all()
    
    def get_tool_connectors_by_ci_id(self, db: Session, ci_id: str) -> List[ToolConnector]:
        return db.query(ToolConnector).filter(ToolConnector.ciId == ci_id).all()
    
    def update_tool_connector_status(self, db: Session, connector_id: int, status: str) -> None:
        connector = db.query(ToolConnector).filter(ToolConnector.id == connector_id).first()
        if connector:
            connector.status = status
            db.commit()
    
    def update_tool_connector(self, db: Session, connector_id: int, data: dict) -> Optional[ToolConnector]:
        connector = db.query(ToolConnector).filter(ToolConnector.id == connector_id).first()
        if connector:
            for key, value in data.items():
                setattr(connector, key, value)
            db.commit()
            db.refresh(connector)
        return connector
    
    def delete_tool_connector(self, db: Session, connector_id: int) -> None:
        connector = db.query(ToolConnector).filter(ToolConnector.id == connector_id).first()
        if connector:
            db.delete(connector)
            db.commit()
    
    # Data Collection Sessions
    def create_data_collection_session(self, db: Session, data: dict) -> DataCollectionSession:
        session = DataCollectionSession(**data)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    def get_data_collection_session_by_application_id(self, db: Session, app_id: int) -> Optional[DataCollectionSession]:
        return db.query(DataCollectionSession).filter(DataCollectionSession.applicationId == app_id).first()
    
    def update_session_progress(self, db: Session, session_id: int, progress: int, logs: List[Dict]) -> None:
        session = db.query(DataCollectionSession).filter(DataCollectionSession.id == session_id).first()
        if session:
            session.progress = progress
            session.logs = logs
            db.commit()
    
    def update_session_status(self, db: Session, session_id: int, status: str) -> None:
        session = db.query(DataCollectionSession).filter(DataCollectionSession.id == session_id).first()
        if session:
            session.status = status
            db.commit()
    
    # Question Analyses
    def create_question_analysis(self, db: Session, data: dict) -> QuestionAnalysis:
        analysis = QuestionAnalysis(**data)
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis
    
    def get_question_analyses_by_application_id(self, db: Session, app_id: int) -> List[QuestionAnalysis]:
        return db.query(QuestionAnalysis).filter(QuestionAnalysis.applicationId == app_id).all()
    
    def update_question_analysis(self, db: Session, analysis_id: int, data: dict) -> Optional[QuestionAnalysis]:
        analysis = db.query(QuestionAnalysis).filter(QuestionAnalysis.id == analysis_id).first()
        if analysis:
            for key, value in data.items():
                setattr(analysis, key, value)
            db.commit()
            db.refresh(analysis)
        return analysis
    
    def delete_question_analyses_by_application_id(self, db: Session, app_id: int) -> None:
        db.query(QuestionAnalysis).filter(QuestionAnalysis.applicationId == app_id).delete()
        db.commit()
    
    # Audit Results
    def create_audit_result(self, db: Session, data: dict) -> AuditResult:
        result = AuditResult(**data)
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
    
    def get_audit_results_by_application_id(self, db: Session, app_id: int) -> List[AuditResult]:
        return db.query(AuditResult).filter(AuditResult.applicationId == app_id).all()
    
    def update_audit_result_status(self, db: Session, result_id: int, status: str, document_path: Optional[str] = None) -> None:
        result = db.query(AuditResult).filter(AuditResult.id == result_id).first()
        if result:
            result.status = status
            if document_path:
                result.documentPath = document_path
            db.commit()

# Global storage instance
storage = DatabaseStorage()

def get_storage():
    return storage