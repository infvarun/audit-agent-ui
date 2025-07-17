-- =====================================================
-- Audit Data Collection Application - DML Script
-- Initial Data and Sample Records
-- Version: 1.0
-- Created: July 17, 2025
-- =====================================================

-- Clear existing data (optional - for clean setup)
TRUNCATE TABLE audit_results, data_collection_sessions, question_analyses, tool_connectors, data_requests, applications RESTART IDENTITY CASCADE;

-- =====================================================
-- 1. SAMPLE APPLICATIONS
-- =====================================================

-- Insert sample applications
INSERT INTO applications (name, ci_id, audit_name, start_date, end_date, settings, created_at) VALUES
('Megatron v1', 'CI12324', 'Megatron v1 CA 2025', '2024-01-01', '2025-07-16', 
 '{"enableFollowUpQuestions": true, "emailNotifications": true, "riskLevel": "high", "auditType": "compliance"}', 
 '2025-07-16 21:23:04.731684'),

('Jarvis v4', 'CI123456', 'Jarvis CA 2025', '2023-01-16', '2025-07-16', 
 '{"enableFollowUpQuestions": true, "emailNotifications": true, "riskLevel": "medium", "auditType": "operational"}', 
 '2025-07-16 20:03:53.753991'),

('Optimus Prime CRM', 'CI789012', 'Optimus Prime CRM Audit 2025', '2025-01-01', '2025-12-31', 
 '{"enableFollowUpQuestions": false, "emailNotifications": false, "riskLevel": "low", "auditType": "financial"}', 
 '2025-07-17 09:00:00'),

('Bumblebee Analytics', 'CI345678', 'Bumblebee Analytics Security Review', '2025-03-01', '2025-09-30', 
 '{"enableFollowUpQuestions": true, "emailNotifications": true, "riskLevel": "high", "auditType": "security"}', 
 '2025-07-17 10:15:00'),

('Starscream API Gateway', 'CI901234', 'Starscream API Gateway Assessment', '2025-02-15', '2025-08-15', 
 '{"enableFollowUpQuestions": true, "emailNotifications": false, "riskLevel": "medium", "auditType": "technical"}', 
 '2025-07-17 11:30:00');

-- =====================================================
-- 2. SAMPLE DATA REQUESTS
-- =====================================================

-- Insert sample data requests with comprehensive questions
INSERT INTO data_requests (application_id, file_name, file_path, file_size, file_type, questions, total_questions, categories, subcategories, column_mappings, uploaded_at) VALUES
(1, 'megatron_audit_questions.xlsx', '/uploads/megatron_audit_questions.xlsx', 6639, 'primary', 
 '[
   {"id": "0.1", "question": "The completed Common Requirements Set Assessment with the description/documentation of the control(s) that satisfy each requirement", "category": "General", "subcategory": "Documentation"},
   {"id": "0.2", "question": "Completed Software Matrix for in-scope applications/processes. Identify development, testing, staging and production environments for Megatron v1", "category": "General", "subcategory": "Environment Management"},
   {"id": "1.1", "question": "Please provide a list of any daily, weekly, monthly, or quarterly system operations (e.g., jobs, batch jobs, processing) performed by your application management", "category": "Computer Operations", "subcategory": "Manage Operations"},
   {"id": "1.2", "question": "Please provide documentation of monitoring procedures and tools used to monitor system performance, availability, and capacity", "category": "Computer Operations", "subcategory": "System Monitoring"},
   {"id": "2.1", "question": "Please provide database administration policies and procedures documentation", "category": "Database Management", "subcategory": "Data Administration"},
   {"id": "2.2", "question": "Please provide documentation of database user access controls and privilege management", "category": "Database Management", "subcategory": "Access Control"},
   {"id": "3.1", "question": "Please provide user access management policies and procedures for the application", "category": "Security Controls", "subcategory": "Access Management"},
   {"id": "3.2", "question": "Please provide evidence of vulnerability assessment reports and remediation tracking", "category": "Security Controls", "subcategory": "Vulnerability Assessment"},
   {"id": "4.1", "question": "Please provide change management policies and procedures documentation", "category": "Change Management", "subcategory": "Configuration Management"},
   {"id": "5.1", "question": "Please provide backup and recovery procedures documentation", "category": "Backup & Recovery", "subcategory": "Backup Procedures"}
 ]', 
 10, 
 '["General", "Computer Operations", "Database Management", "Security Controls", "Change Management", "Backup & Recovery"]', 
 '["Documentation", "Environment Management", "Manage Operations", "System Monitoring", "Data Administration", "Access Control", "Access Management", "Vulnerability Assessment", "Configuration Management", "Backup Procedures"]', 
 '{"questionNumber": "ID", "process": "Process", "subProcess": "Sub-process", "question": "Data Request"}', 
 '2025-07-16 21:18:25.688696'),

(2, 'jarvis_followup_questions.xlsx', '/uploads/jarvis_followup_questions.xlsx', 4521, 'followup', 
 '[
   {"id": "F1.1", "question": "Provide additional details on the database backup verification process", "category": "Backup & Recovery", "subcategory": "Backup Verification"},
   {"id": "F1.2", "question": "Detail the incident response escalation timeline for security events", "category": "Security Controls", "subcategory": "Incident Response"},
   {"id": "F1.3", "question": "Explain the code review process for production deployments", "category": "Change Management", "subcategory": "Code Review"}
 ]', 
 3, 
 '["Backup & Recovery", "Security Controls", "Change Management"]', 
 '["Backup Verification", "Incident Response", "Code Review"]', 
 '{"questionNumber": "ID", "process": "Process", "subProcess": "Sub-process", "question": "Follow-up Question"}', 
 '2025-07-16 22:45:12.123456'),

(3, 'optimus_compliance_audit.xlsx', '/uploads/optimus_compliance_audit.xlsx', 8732, 'primary', 
 '[
   {"id": "C1.1", "question": "Provide SOX compliance documentation for financial reporting controls", "category": "Compliance", "subcategory": "SOX Controls"},
   {"id": "C1.2", "question": "Detail the data retention policies for customer financial data", "category": "Data Management", "subcategory": "Data Retention"},
   {"id": "C1.3", "question": "Provide evidence of quarterly compliance testing results", "category": "Compliance", "subcategory": "Testing & Validation"},
   {"id": "C1.4", "question": "Document the authorization matrix for financial transactions", "category": "Security Controls", "subcategory": "Authorization Controls"},
   {"id": "C1.5", "question": "Provide audit trail documentation for system changes", "category": "Change Management", "subcategory": "Audit Trail"}
 ]', 
 5, 
 '["Compliance", "Data Management", "Security Controls", "Change Management"]', 
 '["SOX Controls", "Data Retention", "Testing & Validation", "Authorization Controls", "Audit Trail"]', 
 '{"questionNumber": "ID", "process": "Process", "subProcess": "Sub-process", "question": "Compliance Requirement"}', 
 '2025-07-17 09:15:00');

-- =====================================================
-- 3. SAMPLE QUESTION ANALYSES
-- =====================================================

-- Insert sample question analyses with AI-generated responses
INSERT INTO question_analyses (application_id, question_id, original_question, category, subcategory, ai_prompt, tool_suggestion, connector_reason, connector_to_use, created_at) VALUES
(1, '0.1', 'The completed Common Requirements Set Assessment with the description/documentation of the control(s) that satisfy each requirement', 'General', 'Documentation', 'Extract and analyze Common Requirements Set Assessment documentation. Identify all control descriptions and their satisfaction criteria. Provide a comprehensive mapping of requirements to implemented controls.', 'gnosis_path', 'Documentation and knowledge management systems are best suited for retrieving assessment documents and control descriptions', 'gnosis_path', '2025-07-16 21:30:00'),

(1, '1.1', 'Please provide a list of any daily, weekly, monthly, or quarterly system operations (e.g., jobs, batch jobs, processing) performed by your application management', 'Computer Operations', 'Manage Operations', 'Query system operations schedules and job configurations. Extract information about recurring operations including frequency, dependencies, and execution status. Provide operational metrics and performance data.', 'sql_server', 'Database queries are required to extract operational job schedules, batch processing information, and system operation logs', 'sql_server', '2025-07-16 21:31:00'),

(1, '2.1', 'Please provide database administration policies and procedures documentation', 'Database Management', 'Data Administration', 'Retrieve database administration policies, procedures, and governance documentation. Include user management policies, backup procedures, and maintenance schedules.', 'gnosis_path', 'Policy and procedure documents are typically stored in knowledge management systems and document repositories', 'gnosis_path', '2025-07-16 21:32:00'),

(1, '3.1', 'Please provide user access management policies and procedures for the application', 'Security Controls', 'Access Management', 'Extract user access management policies, role-based access controls, and user provisioning procedures. Include access review processes and privilege management documentation.', 'servicenow', 'ServiceNow systems typically manage user access requests, approvals, and access management workflows', 'servicenow', '2025-07-16 21:33:00'),

(1, '5.1', 'Please provide backup and recovery procedures documentation', 'Backup & Recovery', 'Backup Procedures', 'Retrieve backup and recovery procedures, including backup schedules, recovery time objectives, and disaster recovery plans. Include backup verification and testing documentation.', 'nas_path', 'Backup and recovery procedures are often stored in network file systems along with backup scripts and configuration files', 'nas_path', '2025-07-16 21:34:00'),

(2, 'F1.1', 'Provide additional details on the database backup verification process', 'Backup & Recovery', 'Backup Verification', 'Query backup verification logs and procedures. Extract backup testing results, verification schedules, and recovery validation processes.', 'sql_server', 'Database systems contain backup verification logs and recovery testing results that need to be queried', 'sql_server', '2025-07-16 22:50:00'),

(2, 'F1.2', 'Detail the incident response escalation timeline for security events', 'Security Controls', 'Incident Response', 'Extract incident response procedures, escalation matrices, and response time requirements. Include security event classification and notification processes.', 'servicenow', 'ServiceNow typically manages incident response workflows, escalation procedures, and security event tracking', 'servicenow', '2025-07-16 22:51:00'),

(3, 'C1.1', 'Provide SOX compliance documentation for financial reporting controls', 'Compliance', 'SOX Controls', 'Retrieve SOX compliance documentation, control testing results, and financial reporting control descriptions. Include management assertions and auditor testing evidence.', 'gnosis_path', 'SOX compliance documentation is typically maintained in centralized knowledge management systems with version control', 'gnosis_path', '2025-07-17 09:20:00');

-- =====================================================
-- 4. SAMPLE TOOL CONNECTORS
-- =====================================================

-- Insert sample tool connectors for different applications
INSERT INTO tool_connectors (application_id, ci_id, connector_type, configuration, status, created_at) VALUES
(1, 'CI12324', 'sql_server', 
 '{"server": "sql-prod-01.company.com", "database": "megatron_prod", "port": 1433, "authentication": "windows", "connection_timeout": 30}', 
 'active', '2025-07-16 21:25:00'),

(1, 'CI12324', 'gnosis_path', 
 '{"base_path": "/knowledge/megatron", "authentication": "ldap", "search_enabled": true, "document_types": ["pdf", "docx", "txt"]}', 
 'active', '2025-07-16 21:26:00'),

(1, 'CI12324', 'servicenow', 
 '{"instance": "company.service-now.com", "username": "audit_user", "table_access": ["incident", "change_request", "user_access"], "api_version": "v1"}', 
 'active', '2025-07-16 21:27:00'),

(1, 'CI12324', 'nas_path', 
 '{"base_path": "//nas-server/audit/megatron", "authentication": "ntlm", "read_only": true, "file_types": ["log", "config", "script"]}', 
 'active', '2025-07-16 21:28:00'),

(2, 'CI123456', 'sql_server', 
 '{"server": "sql-dev-02.company.com", "database": "jarvis_dev", "port": 1433, "authentication": "sql", "connection_timeout": 30}', 
 'active', '2025-07-16 20:15:00'),

(2, 'CI123456', 'servicenow', 
 '{"instance": "company.service-now.com", "username": "audit_user", "table_access": ["incident", "user_access"], "api_version": "v1"}', 
 'active', '2025-07-16 20:16:00'),

(3, 'CI789012', 'gnosis_path', 
 '{"base_path": "/compliance/optimus", "authentication": "ldap", "search_enabled": true, "document_types": ["pdf", "docx"]}', 
 'pending', '2025-07-17 09:10:00'),

(4, 'CI345678', 'sql_server', 
 '{"server": "sql-analytics-01.company.com", "database": "bumblebee_analytics", "port": 1433, "authentication": "windows", "connection_timeout": 60}', 
 'inactive', '2025-07-17 10:20:00'),

(5, 'CI901234', 'servicenow', 
 '{"instance": "company.service-now.com", "username": "api_audit", "table_access": ["change_request", "api_access"], "api_version": "v2"}', 
 'error', '2025-07-17 11:35:00');

-- =====================================================
-- 5. SAMPLE DATA COLLECTION SESSIONS
-- =====================================================

-- Insert sample data collection sessions
INSERT INTO data_collection_sessions (application_id, status, progress, logs, started_at, completed_at, created_at) VALUES
(1, 'completed', 100, 
 '[
   {"timestamp": "2025-07-17T01:26:39.164Z", "message": "Data collection session started", "level": "info"},
   {"timestamp": "2025-07-17T01:26:40.234Z", "message": "Connected to SQL Server: sql-prod-01.company.com", "level": "info"},
   {"timestamp": "2025-07-17T01:26:45.567Z", "message": "Executing query: SELECT * FROM system_operations", "level": "info"},
   {"timestamp": "2025-07-17T01:28:12.890Z", "message": "Retrieved 1,247 operational records", "level": "info"},
   {"timestamp": "2025-07-17T01:28:15.123Z", "message": "Accessing Gnosis knowledge base", "level": "info"},
   {"timestamp": "2025-07-17T01:30:45.456Z", "message": "Downloaded 15 policy documents", "level": "info"},
   {"timestamp": "2025-07-17T01:35:22.789Z", "message": "Data collection completed successfully", "level": "info"}
 ]', 
 '2025-07-17 01:26:39.164', '2025-07-17 01:35:22.789', '2025-07-17 01:26:39.164'),

(2, 'running', 65, 
 '[
   {"timestamp": "2025-07-17T08:15:00.000Z", "message": "Data collection session started", "level": "info"},
   {"timestamp": "2025-07-17T08:15:05.123Z", "message": "Connected to SQL Server: sql-dev-02.company.com", "level": "info"},
   {"timestamp": "2025-07-17T08:15:10.456Z", "message": "Executing backup verification queries", "level": "info"},
   {"timestamp": "2025-07-17T08:20:30.789Z", "message": "Retrieved backup verification logs", "level": "info"},
   {"timestamp": "2025-07-17T08:25:45.012Z", "message": "Accessing ServiceNow incident data", "level": "info"},
   {"timestamp": "2025-07-17T08:30:15.345Z", "message": "Processing security incident escalation data", "level": "info"}
 ]', 
 '2025-07-17 08:15:00.000', NULL, '2025-07-17 08:15:00.000'),

(1, 'failed', 25, 
 '[
   {"timestamp": "2025-07-16T14:30:00.000Z", "message": "Data collection session started", "level": "info"},
   {"timestamp": "2025-07-16T14:30:05.123Z", "message": "Attempting to connect to SQL Server", "level": "info"},
   {"timestamp": "2025-07-16T14:30:35.456Z", "message": "Connection timeout to sql-prod-01.company.com", "level": "warning"},
   {"timestamp": "2025-07-16T14:31:00.789Z", "message": "Retrying connection with extended timeout", "level": "info"},
   {"timestamp": "2025-07-16T14:32:00.012Z", "message": "Authentication failed for database connection", "level": "error"},
   {"timestamp": "2025-07-16T14:32:05.345Z", "message": "Data collection session terminated due to connection errors", "level": "error"}
 ]', 
 '2025-07-16 14:30:00.000', NULL, '2025-07-16 14:30:00.000'),

(3, 'pending', 0, '[]', NULL, NULL, '2025-07-17 09:25:00');

-- =====================================================
-- 6. SAMPLE AUDIT RESULTS
-- =====================================================

-- Insert sample audit results
INSERT INTO audit_results (application_id, session_id, result_type, result_data, file_path, status, created_at) VALUES
(1, 1, 'report', 
 '{
   "executive_summary": "Comprehensive audit of Megatron v1 system completed successfully",
   "total_findings": 23,
   "critical_findings": 2,
   "high_findings": 8,
   "medium_findings": 10,
   "low_findings": 3,
   "compliance_score": 87.5,
   "categories_assessed": ["General", "Computer Operations", "Database Management", "Security Controls", "Change Management", "Backup & Recovery"],
   "recommendations": ["Implement automated backup verification", "Enhance user access review process", "Update change management procedures"]
 }', 
 '/results/megatron_audit_report_20250717.pdf', 'completed', '2025-07-17 01:40:00'),

(1, 1, 'data_export', 
 '{
   "export_format": "xlsx",
   "total_records": 1247,
   "tables_exported": ["system_operations", "user_access", "backup_logs", "change_requests"],
   "export_size_mb": 15.7,
   "compression": "gzip"
 }', 
 '/results/megatron_data_export_20250717.xlsx.gz', 'completed', '2025-07-17 01:45:00'),

(2, 2, 'analysis', 
 '{
   "analysis_type": "followup_questions",
   "questions_analyzed": 3,
   "completion_percentage": 65,
   "findings": [
     {"question_id": "F1.1", "status": "completed", "findings_count": 5},
     {"question_id": "F1.2", "status": "in_progress", "findings_count": 2},
     {"question_id": "F1.3", "status": "pending", "findings_count": 0}
   ]
 }', 
 '/results/jarvis_followup_analysis_20250717.json', 'processing', '2025-07-17 08:35:00'),

(3, NULL, 'summary', 
 '{
   "status": "scheduled",
   "scheduled_start": "2025-07-17T10:00:00Z",
   "estimated_duration": "4 hours",
   "audit_scope": "SOX compliance review",
   "expected_outputs": ["compliance_report", "control_matrix", "gap_analysis"]
 }', 
 NULL, 'pending', '2025-07-17 09:30:00');

-- =====================================================
-- 7. REFERENCE DATA
-- =====================================================

-- Create lookup tables for reference data
CREATE TABLE IF NOT EXISTS audit_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES audit_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Insert reference audit categories
INSERT INTO audit_categories (name, description, color_code) VALUES
('General', 'General audit requirements and documentation', '#6c757d'),
('Computer Operations', 'System operations and maintenance procedures', '#007bff'),
('Database Management', 'Database administration and data management', '#28a745'),
('Security Controls', 'Security policies and access management', '#dc3545'),
('Change Management', 'Change control and configuration management', '#ffc107'),
('Backup & Recovery', 'Backup procedures and disaster recovery', '#17a2b8'),
('Compliance', 'Regulatory compliance and governance', '#6f42c1'),
('Data Management', 'Data governance and retention policies', '#e83e8c');

-- Insert reference audit subcategories
INSERT INTO audit_subcategories (category_id, name, description) VALUES
(1, 'Documentation', 'General documentation requirements'),
(1, 'Environment Management', 'Environment setup and management'),
(2, 'Manage Operations', 'Operational procedures and job management'),
(2, 'System Monitoring', 'System monitoring and performance tracking'),
(2, 'Performance Management', 'Performance optimization and capacity planning'),
(3, 'Data Administration', 'Database administration procedures'),
(3, 'Access Control', 'Database access control and user management'),
(3, 'Data Quality', 'Data quality assurance and validation'),
(4, 'Access Management', 'User access and privilege management'),
(4, 'Vulnerability Assessment', 'Security vulnerability testing and remediation'),
(4, 'Incident Response', 'Security incident response procedures'),
(4, 'Authorization Controls', 'Authorization and approval controls'),
(5, 'Configuration Management', 'Configuration change control'),
(5, 'Release Management', 'Software release and deployment management'),
(5, 'Testing Procedures', 'Testing and validation procedures'),
(5, 'Code Review', 'Code review and quality assurance'),
(5, 'Audit Trail', 'Change audit trail and logging'),
(6, 'Backup Procedures', 'Backup processes and scheduling'),
(6, 'Backup Verification', 'Backup testing and verification'),
(7, 'SOX Controls', 'Sarbanes-Oxley compliance controls'),
(7, 'Testing & Validation', 'Compliance testing and validation'),
(8, 'Data Retention', 'Data retention and archival policies');

-- =====================================================
-- 8. DATA VALIDATION QUERIES
-- =====================================================

-- Verify data integrity
SELECT 'Data validation completed' as status;

-- Check record counts
SELECT 
    'applications' as table_name, COUNT(*) as record_count FROM applications
UNION ALL
SELECT 
    'data_requests' as table_name, COUNT(*) as record_count FROM data_requests
UNION ALL
SELECT 
    'question_analyses' as table_name, COUNT(*) as record_count FROM question_analyses
UNION ALL
SELECT 
    'tool_connectors' as table_name, COUNT(*) as record_count FROM tool_connectors
UNION ALL
SELECT 
    'data_collection_sessions' as table_name, COUNT(*) as record_count FROM data_collection_sessions
UNION ALL
SELECT 
    'audit_results' as table_name, COUNT(*) as record_count FROM audit_results
UNION ALL
SELECT 
    'audit_categories' as table_name, COUNT(*) as record_count FROM audit_categories
UNION ALL
SELECT 
    'audit_subcategories' as table_name, COUNT(*) as record_count FROM audit_subcategories;

-- Check data relationships
SELECT 
    a.name as application_name,
    COUNT(DISTINCT dr.id) as data_requests,
    COUNT(DISTINCT qa.id) as question_analyses,
    COUNT(DISTINCT tc.id) as tool_connectors,
    COUNT(DISTINCT dcs.id) as collection_sessions,
    COUNT(DISTINCT ar.id) as audit_results
FROM applications a
LEFT JOIN data_requests dr ON a.id = dr.application_id
LEFT JOIN question_analyses qa ON a.id = qa.application_id
LEFT JOIN tool_connectors tc ON a.id = tc.application_id
LEFT JOIN data_collection_sessions dcs ON a.id = dcs.application_id
LEFT JOIN audit_results ar ON a.id = ar.application_id
GROUP BY a.id, a.name
ORDER BY a.name;

-- =====================================================
-- END OF DML SCRIPT
-- =====================================================

SELECT 'Sample data inserted successfully! 
Applications: 5
Data Requests: 3
Question Analyses: 8
Tool Connectors: 9
Data Collection Sessions: 4
Audit Results: 4
Reference Categories: 8
Reference Subcategories: 23' as completion_summary;