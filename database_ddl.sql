-- =====================================================
-- Audit Data Collection Application - DDL Script
-- Database: PostgreSQL
-- Version: 1.0
-- Created: July 17, 2025
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS question_analyses CASCADE;
DROP TABLE IF EXISTS data_collection_sessions CASCADE;
DROP TABLE IF EXISTS tool_connectors CASCADE;
DROP TABLE IF EXISTS data_requests CASCADE;
DROP TABLE IF EXISTS audit_results CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- =====================================================
-- 1. APPLICATIONS TABLE
-- =====================================================
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ci_id TEXT NOT NULL UNIQUE,
    audit_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    settings JSON DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT applications_ci_id_format CHECK (ci_id ~ '^CI[0-9]+$'),
    CONSTRAINT applications_dates_check CHECK (start_date <= end_date)
);

-- Create indexes for better performance
CREATE INDEX idx_applications_ci_id ON applications(ci_id);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_name ON applications(name);

-- =====================================================
-- 2. DATA REQUESTS TABLE
-- =====================================================
CREATE TABLE data_requests (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'primary',
    questions JSON NOT NULL DEFAULT '[]',
    total_questions INTEGER NOT NULL DEFAULT 0,
    categories JSON NOT NULL DEFAULT '[]',
    subcategories JSON NOT NULL DEFAULT '[]',
    column_mappings JSON NOT NULL DEFAULT '{}',
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_data_requests_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT data_requests_file_size_positive CHECK (file_size > 0),
    CONSTRAINT data_requests_total_questions_positive CHECK (total_questions >= 0),
    CONSTRAINT data_requests_file_type_valid CHECK (file_type IN ('primary', 'followup'))
);

-- Create indexes
CREATE INDEX idx_data_requests_application_id ON data_requests(application_id);
CREATE INDEX idx_data_requests_file_type ON data_requests(file_type);
CREATE INDEX idx_data_requests_uploaded_at ON data_requests(uploaded_at);

-- =====================================================
-- 3. QUESTION ANALYSES TABLE
-- =====================================================
CREATE TABLE question_analyses (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    original_question TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    ai_prompt TEXT NOT NULL,
    tool_suggestion TEXT NOT NULL,
    connector_reason TEXT NOT NULL,
    connector_to_use TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_question_analyses_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT question_analyses_tool_suggestion_valid 
        CHECK (tool_suggestion IN ('sql_server', 'gnosis_path', 'servicenow', 'nas_path')),
    CONSTRAINT question_analyses_connector_to_use_valid 
        CHECK (connector_to_use IN ('sql_server', 'gnosis_path', 'servicenow', 'nas_path')),
    
    -- Unique constraint for question per application
    UNIQUE(application_id, question_id)
);

-- Create indexes
CREATE INDEX idx_question_analyses_application_id ON question_analyses(application_id);
CREATE INDEX idx_question_analyses_tool_suggestion ON question_analyses(tool_suggestion);
CREATE INDEX idx_question_analyses_category ON question_analyses(category);
CREATE INDEX idx_question_analyses_created_at ON question_analyses(created_at);

-- =====================================================
-- 4. TOOL CONNECTORS TABLE
-- =====================================================
CREATE TABLE tool_connectors (
    id SERIAL PRIMARY KEY,
    application_id INTEGER,
    ci_id TEXT NOT NULL,
    connector_type TEXT NOT NULL,
    configuration JSON NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_tool_connectors_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    CONSTRAINT fk_tool_connectors_ci_id 
        FOREIGN KEY (ci_id) REFERENCES applications(ci_id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT tool_connectors_type_valid 
        CHECK (connector_type IN ('sql_server', 'gnosis_path', 'servicenow', 'nas_path')),
    CONSTRAINT tool_connectors_status_valid 
        CHECK (status IN ('pending', 'active', 'inactive', 'error')),
    
    -- Unique constraint for connector type per CI ID
    UNIQUE(ci_id, connector_type)
);

-- Create indexes
CREATE INDEX idx_tool_connectors_ci_id ON tool_connectors(ci_id);
CREATE INDEX idx_tool_connectors_type ON tool_connectors(connector_type);
CREATE INDEX idx_tool_connectors_status ON tool_connectors(status);
CREATE INDEX idx_tool_connectors_created_at ON tool_connectors(created_at);

-- =====================================================
-- 5. DATA COLLECTION SESSIONS TABLE
-- =====================================================
CREATE TABLE data_collection_sessions (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    logs JSON NOT NULL DEFAULT '[]',
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_data_collection_sessions_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Check constraints
    CONSTRAINT data_collection_sessions_status_valid 
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    CONSTRAINT data_collection_sessions_progress_range 
        CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT data_collection_sessions_dates_check 
        CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

-- Create indexes
CREATE INDEX idx_data_collection_sessions_application_id ON data_collection_sessions(application_id);
CREATE INDEX idx_data_collection_sessions_status ON data_collection_sessions(status);
CREATE INDEX idx_data_collection_sessions_created_at ON data_collection_sessions(created_at);

-- =====================================================
-- 6. AUDIT RESULTS TABLE
-- =====================================================
CREATE TABLE audit_results (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL,
    session_id INTEGER,
    result_type TEXT NOT NULL,
    result_data JSON NOT NULL DEFAULT '{}',
    file_path VARCHAR(500),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_audit_results_application 
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_results_session 
        FOREIGN KEY (session_id) REFERENCES data_collection_sessions(id) ON DELETE SET NULL,
    
    -- Check constraints
    CONSTRAINT audit_results_type_valid 
        CHECK (result_type IN ('report', 'data_export', 'analysis', 'summary')),
    CONSTRAINT audit_results_status_valid 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create indexes
CREATE INDEX idx_audit_results_application_id ON audit_results(application_id);
CREATE INDEX idx_audit_results_session_id ON audit_results(session_id);
CREATE INDEX idx_audit_results_status ON audit_results(status);
CREATE INDEX idx_audit_results_created_at ON audit_results(created_at);

-- =====================================================
-- 7. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for application summary with statistics
CREATE VIEW application_summary AS
SELECT 
    a.id,
    a.name,
    a.ci_id,
    a.audit_name,
    a.start_date,
    a.end_date,
    a.settings,
    a.created_at,
    COUNT(DISTINCT dr.id) as data_requests_count,
    COUNT(DISTINCT qa.id) as question_analyses_count,
    COUNT(DISTINCT dcs.id) as collection_sessions_count,
    COUNT(DISTINCT tc.id) as tool_connectors_count
FROM applications a
LEFT JOIN data_requests dr ON a.id = dr.application_id
LEFT JOIN question_analyses qa ON a.id = qa.application_id
LEFT JOIN data_collection_sessions dcs ON a.id = dcs.application_id
LEFT JOIN tool_connectors tc ON a.id = tc.application_id
GROUP BY a.id, a.name, a.ci_id, a.audit_name, a.start_date, a.end_date, a.settings, a.created_at;

-- View for latest collection session per application
CREATE VIEW latest_collection_sessions AS
SELECT DISTINCT ON (application_id)
    application_id,
    id,
    status,
    progress,
    started_at,
    completed_at,
    created_at
FROM data_collection_sessions
ORDER BY application_id, created_at DESC;

-- View for tool connector status by CI ID
CREATE VIEW connector_status_by_ci AS
SELECT 
    ci_id,
    connector_type,
    status,
    configuration,
    created_at,
    COUNT(*) as connector_count
FROM tool_connectors
GROUP BY ci_id, connector_type, status, configuration, created_at;

-- =====================================================
-- 8. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for audit_results table
CREATE TRIGGER update_audit_results_updated_at 
    BEFORE UPDATE ON audit_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total questions from JSON
CREATE OR REPLACE FUNCTION calculate_total_questions()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_questions = jsonb_array_length(NEW.questions::jsonb);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for data_requests table
CREATE TRIGGER update_total_questions 
    BEFORE INSERT OR UPDATE ON data_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_total_questions();

-- =====================================================
-- 9. PERMISSIONS AND SECURITY
-- =====================================================

-- Create application user role
CREATE ROLE audit_app_user;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO audit_app_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO audit_app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO audit_app_user;

-- Grant permissions on views
GRANT SELECT ON application_summary TO audit_app_user;
GRANT SELECT ON latest_collection_sessions TO audit_app_user;
GRANT SELECT ON connector_status_by_ci TO audit_app_user;

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE applications IS 'Main applications table storing audit application metadata';
COMMENT ON TABLE data_requests IS 'File upload requests with parsed questions and metadata';
COMMENT ON TABLE question_analyses IS 'AI-generated analysis results for audit questions';
COMMENT ON TABLE tool_connectors IS 'External system connector configurations';
COMMENT ON TABLE data_collection_sessions IS 'Data collection process tracking and logs';
COMMENT ON TABLE audit_results IS 'Final audit results and generated reports';

COMMENT ON COLUMN applications.ci_id IS 'Unique Configuration Item identifier';
COMMENT ON COLUMN applications.settings IS 'JSON configuration for application settings';
COMMENT ON COLUMN data_requests.questions IS 'Parsed questions from uploaded files';
COMMENT ON COLUMN data_requests.column_mappings IS 'Column mapping configuration for file processing';
COMMENT ON COLUMN question_analyses.ai_prompt IS 'AI-generated prompt for data collection';
COMMENT ON COLUMN question_analyses.tool_suggestion IS 'Recommended tool for data collection';
COMMENT ON COLUMN tool_connectors.configuration IS 'Connector-specific configuration parameters';
COMMENT ON COLUMN data_collection_sessions.logs IS 'Real-time collection process logs';
COMMENT ON COLUMN audit_results.result_data IS 'Generated audit results and findings';

-- =====================================================
-- END OF DDL SCRIPT
-- =====================================================

-- Display completion message
SELECT 'Database schema created successfully! Tables: applications, data_requests, question_analyses, tool_connectors, data_collection_sessions, audit_results' as status;