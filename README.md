# Audit Data Collection Application

A comprehensive wizard-based audit data collection application built with React frontend and Python FastAPI backend, designed to streamline complex audit processes through intelligent workflow management.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Environment Setup](#environment-setup)
3. [Data Flow](#data-flow)
4. [Code Documentation](#code-documentation)
5. [Wizard Step Customization](#wizard-step-customization)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Development Guidelines](#development-guidelines)
9. [Troubleshooting](#troubleshooting)

## System Architecture

### Overview
The application uses a hybrid architecture with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │───▶│  Node.js Proxy  │───▶│ Python Backend  │
│    (Port 5000)  │    │    (Port 5000)  │    │   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ PostgreSQL DB   │
                                                │   (Neon/Local)  │
                                                └─────────────────┘
```

### Component Responsibilities

**React Frontend** (`client/src/`)
- User interface and user experience
- Form handling and validation
- State management with TanStack Query
- Routing with Wouter
- UI components built with shadcn/ui

**Node.js Proxy Server** (`server/index.ts`)
- Serves React application in development
- Proxies API requests to Python backend
- Handles static file serving
- Manages CORS and request forwarding

**Python FastAPI Backend** (`server/main.py`)
- REST API endpoints
- Database operations with SQLAlchemy
- AI integration with LangChain and OpenAI
- File processing and data analysis
- Business logic and data validation

**PostgreSQL Database**
- Application data storage
- User session management
- Audit results and progress tracking
- Question analysis persistence

## Environment Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL database (local or Neon)
- OpenAI API key

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd audit-data-collection

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install fastapi>=0.116.1 uvicorn>=0.35.0 python-multipart>=0.0.20 sqlalchemy>=2.0.41 asyncpg>=0.30.0 psycopg2-binary>=2.9.10 pydantic>=2.11.7 langchain>=0.3.26 langchain-core>=0.3.69 langchain-openai>=0.3.28 pandas>=2.3.1 openpyxl>=3.1.5 python-dotenv>=1.1.1 flask>=3.1.1 flask-cors>=6.0.1 werkzeug>=3.1.3

# Alternative: Install using uv (recommended for this project)
uv sync

# Or install individually (see python-dependencies.txt for details)
pip install fastapi uvicorn sqlalchemy asyncpg psycopg2-binary pydantic langchain langchain-core langchain-openai pandas openpyxl python-dotenv
```

### Step 2: Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/audit_db
# For Neon: postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Development Configuration
NODE_ENV=development
PORT=5000
PYTHON_PORT=8000
```

### Step 3: Database Setup

```bash
# Create database tables using the Python backend
python3 -c "
from server.database import init_db
import asyncio
asyncio.run(init_db())
"
```

### Step 4: Build Frontend

```bash
# Build React application
npm run build
```

### Step 5: Start Application

```bash
# Start the application (runs both Node.js proxy and Python backend)
npm run dev
```

The application will be available at `http://localhost:5000`

## Data Flow

### 1. Application Creation Flow

```mermaid
graph TD
    A[User visits Dashboard] --> B[Click 'Create First Audit']
    B --> C[Step 1: Application Setup]
    C --> D[Fill basic information]
    D --> E[Save to database]
    E --> F[Navigate to Step 2]
```

### 2. File Processing Flow

```mermaid
graph TD
    A[Step 2: Data Request] --> B[Upload Excel files]
    B --> C[Node.js proxy forwards to Python]
    C --> D[Python processes with openpyxl]
    D --> E[Extract columns and sample data]
    E --> F[Return structured data]
    F --> G[React displays preview]
    G --> H[User maps columns]
    H --> I[Save mapping to database]
```

### 3. AI Question Analysis Flow

```mermaid
graph TD
    A[Step 3: Question Analysis] --> B[Load questions from database]
    B --> C[Send to LangChain service]
    C --> D[OpenAI GPT-4o processes questions]
    D --> E[Generate tool suggestions]
    E --> F[Return analysis results]
    F --> G[Display in data table]
    G --> H[User can modify suggestions]
    H --> I[Save final analysis]
```

### 4. Data Collection Flow

```mermaid
graph TD
    A[Step 4: Data Collection] --> B[Start collection process]
    B --> C[Create session record]
    C --> D[Execute data gathering]
    D --> E[Update progress in real-time]
    E --> F[Log collection events]
    F --> G[Complete or handle errors]
    G --> H[Update session status]
```

## Code Documentation

### Frontend Architecture

#### Main Application (`client/src/App.tsx`)
```typescript
// Core application with routing setup
// Routes: /, /wizard, /wizard/:id, /settings, /404
// Uses Wouter for client-side routing
// Integrates TanStack Query for state management
```

#### Wizard Component (`client/src/pages/wizard.tsx`)
```typescript
// Multi-step wizard with 5 steps
// State management for current step and application data
// Form validation with React Hook Form and Zod
// Progress tracking and navigation controls
```

#### Dashboard Component (`client/src/pages/dashboard.tsx`)
```typescript
// Landing page with application search
// Recent audits display
// Navigation to wizard and settings
// Real-time data fetching with React Query
```

#### Step Components (`client/src/components/wizard/`)
- `step-one.tsx`: Application basic information
- `step-two.tsx`: File upload and column mapping
- `step-three.tsx`: AI question analysis
- `step-four.tsx`: Data collection progress
- `step-five.tsx`: Results and report generation

### Backend Architecture

#### Main Server (`server/main.py`)
```python
# FastAPI application with async endpoints
# CORS configuration for frontend communication
# Error handling and logging
# Database connection management
```

#### Database Models (`server/database.py`)
```python
# SQLAlchemy models for all entities
# Relationship definitions
# Database initialization and connection
```

#### API Endpoints (`server/main.py`)
```python
# RESTful API with proper HTTP methods
# Input validation with Pydantic
# Error handling and status codes
# JSON responses with proper serialization
```

#### LangChain Service (`server/langchain_service.py`)
```python
# OpenAI integration for question analysis
# Prompt engineering for tool suggestions
# Batch processing for multiple questions
# Error handling for API failures
```

### Proxy Server (`server/index.ts`)

```typescript
// Express.js server for development
// API request proxying to Python backend
// Static file serving for React app
// JSON body parsing and error handling
```

## Wizard Step Customization

### Adding a New Step

1. **Create Step Component**
```typescript
// client/src/components/wizard/step-six.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepSixProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function StepSix({ onNext, onPrevious }: StepSixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 6: Custom Step</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your custom content here */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button onClick={onNext}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

2. **Update Wizard Component**
```typescript
// client/src/pages/wizard.tsx
import { StepSix } from "@/components/wizard/step-six";

// Add to totalSteps
const totalSteps = 6; // Update from 5 to 6

// Add to step rendering
{currentStep === 6 && (
  <StepSix
    onNext={() => setCurrentStep(7)}
    onPrevious={() => setCurrentStep(5)}
  />
)}
```

3. **Update Navigation**
```typescript
// client/src/components/wizard/navigation.tsx
// Add step 6 to the navigation items
const steps = [
  { number: 1, title: "Application Setup" },
  { number: 2, title: "Data Request" },
  { number: 3, title: "Question Analysis" },
  { number: 4, title: "Data Collection" },
  { number: 5, title: "Results" },
  { number: 6, title: "Custom Step" }, // Add this
];
```

### Modifying Existing Steps

#### Step 1: Application Setup
**File:** `client/src/components/wizard/step-one.tsx`

**Key sections to modify:**
- Form fields: Add/remove form inputs
- Validation schema: Update Zod schema
- API integration: Modify save/load logic

**Example - Adding a new field:**
```typescript
// Add to form schema
const formSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  ciId: z.string().min(1, "CI ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  department: z.string().min(1, "Department is required"), // New field
  // ... other fields
});

// Add to form JSX
<FormField
  control={form.control}
  name="department"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Department</FormLabel>
      <FormControl>
        <Input placeholder="Enter department" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Step 2: Data Request
**File:** `client/src/components/wizard/step-two.tsx`

**Key sections to modify:**
- File upload handling
- Column mapping logic
- Excel processing integration

**Example - Adding file type validation:**
```typescript
const handleFileUpload = (file: File, type: 'primary' | 'followup') => {
  // Add validation
  const allowedTypes = ['.xlsx', '.xls', '.csv'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  if (!allowedTypes.includes(fileExtension)) {
    toast({
      title: "Invalid file type",
      description: "Please upload Excel or CSV files only",
      variant: "destructive",
    });
    return;
  }
  
  // Existing upload logic...
};
```

#### Step 3: Question Analysis
**File:** `client/src/components/wizard/step-three.tsx`

**Key sections to modify:**
- AI analysis configuration
- Data table columns
- Tool suggestion options

**Example - Adding custom analysis parameters:**
```typescript
const analyzeQuestions = async () => {
  const response = await apiRequest(`/api/questions/analyze`, {
    method: 'POST',
    body: JSON.stringify({
      questions: questions,
      applicationId: applicationId,
      analysisType: 'detailed', // Custom parameter
      includeRiskAssessment: true, // Custom parameter
    }),
  });
  // Handle response...
};
```

### Database Schema Changes

When adding new fields or steps, update the database schema:

1. **Update SQLAlchemy Models** (`server/database.py`)
```python
# Add new fields to existing models
class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ci_id = Column(String, nullable=False)
    department = Column(String, nullable=True)  # New field
    # ... other fields
```

2. **Create Migration Script**
```sql
-- Add new column to applications table
ALTER TABLE applications ADD COLUMN department VARCHAR(255);
```

3. **Update API Endpoints**
```python
# server/main.py
class ApplicationCreate(BaseModel):
    name: str
    ci_id: str
    department: str = None  # New field
    # ... other fields
```

## API Endpoints

### Application Management

#### GET /api/applications
```python
# Fetch all applications
# Response: List[Application]
# Used by: Dashboard, Step 1
```

#### GET /api/applications/{id}
```python
# Fetch specific application
# Response: Application
# Used by: Wizard navigation, Step 1
```

#### POST /api/applications
```python
# Create new application
# Body: ApplicationCreate
# Response: Application
# Used by: Step 1
```

#### PUT /api/applications/{id}
```python
# Update application
# Body: ApplicationCreate
# Response: Application
# Used by: Step 1
```

### Data Request Management

#### POST /api/data-requests
```python
# Create data request with file upload
# Body: DataRequestCreate
# Response: DataRequest
# Used by: Step 2
```

#### GET /api/data-requests/{application_id}
```python
# Fetch data requests for application
# Response: List[DataRequest]
# Used by: Step 2, Step 3
```

### Excel Processing

#### POST /api/excel/get-columns
```python
# Extract columns from Excel file
# Body: { buffer: str, fileName: str }
# Response: { columns: List[str], sampleData: List[List[str]] }
# Used by: Step 2
```

### Question Analysis

#### POST /api/questions/analyze
```python
# Analyze questions with AI
# Body: { questions: List[str], applicationId: int }
# Response: List[QuestionAnalysis]
# Used by: Step 3
```

#### GET /api/questions/analyses/{application_id}
```python
# Fetch saved question analyses
# Response: List[QuestionAnalysis]
# Used by: Step 3
```

#### POST /api/questions/analyses
```python
# Save question analyses
# Body: List[QuestionAnalysis]
# Response: { success: bool }
# Used by: Step 3
```

### Data Collection

#### POST /api/data-collection/start
```python
# Start data collection process
# Body: { applicationId: int }
# Response: DataCollectionSession
# Used by: Step 4
```

#### GET /api/data-collection/session/{application_id}
```python
# Fetch collection session status
# Response: DataCollectionSession
# Used by: Step 4
```

## Database Schema

### Core Tables

#### applications
```sql
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ci_id VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### data_requests
```sql
CREATE TABLE data_requests (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    questions JSON,
    categories JSON,
    subcategories JSON,
    column_mappings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### question_analyses
```sql
CREATE TABLE question_analyses (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    question TEXT NOT NULL,
    ai_prompt TEXT,
    tool_suggestion VARCHAR(100),
    connector_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### data_collection_sessions
```sql
CREATE TABLE data_collection_sessions (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    logs JSON,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development Guidelines

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Python**: Follow PEP 8, use type hints
- **Components**: Use functional components with hooks
- **API**: RESTful design with proper HTTP methods
- **Database**: Use migrations for schema changes

### Testing

```bash
# Frontend tests
npm run test

# Backend tests
python -m pytest

# End-to-end tests
npm run test:e2e
```

### Build Process

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Start production server
npm start
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: SSL connection has been closed unexpectedly
```
**Solution:** Check DATABASE_URL and ensure PostgreSQL is running

#### 2. API Request Fails
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```
**Solution:** Ensure Python backend is running on port 8000

#### 3. File Upload Error
```
Error: Request body length does not match content-length header
```
**Solution:** Verify JSON body parsing middleware is properly configured

#### 4. AI Analysis Fails
```
Error: OpenAI API key not found
```
**Solution:** Set OPENAI_API_KEY environment variable

#### 5. Build Fails
```
Error: Frontend not built. Please run 'npm run build' first.
```
**Solution:** Run `npm run build` before starting the application

### Debugging Steps

1. **Check Server Logs**
```bash
# View Node.js proxy logs
tail -f server_output.log

# View Python backend logs
tail -f python_server.log
```

2. **Database Queries**
```sql
-- Check application data
SELECT * FROM applications;

-- Check data requests
SELECT * FROM data_requests WHERE application_id = 1;

-- Check question analyses
SELECT * FROM question_analyses WHERE application_id = 1;
```

3. **API Testing**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test applications endpoint
curl http://localhost:5000/api/applications

# Test data collection
curl -X POST http://localhost:5000/api/data-collection/start \
  -H "Content-Type: application/json" \
  -d '{"applicationId": 1}'
```

### Performance Optimization

1. **Database Indexing**
```sql
CREATE INDEX idx_applications_ci_id ON applications(ci_id);
CREATE INDEX idx_data_requests_app_id ON data_requests(application_id);
CREATE INDEX idx_question_analyses_app_id ON question_analyses(application_id);
```

2. **Frontend Optimization**
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

3. **Backend Optimization**
- Use connection pooling for database
- Implement caching for frequently accessed data
- Use async/await for concurrent operations

## Deployment

### Production Environment

1. **Environment Variables**
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:password@prod-host:5432/audit_db
OPENAI_API_KEY=sk-prod-key
```

2. **Build Commands**
```bash
# Build frontend
npm run build

# Start production server
npm start
```

3. **Database Migration**
```bash
# Run migrations
python -c "from server.database import init_db; import asyncio; asyncio.run(init_db())"
```

### Health Checks

- **Frontend**: `http://localhost:5000/`
- **Proxy**: `http://localhost:5000/health`
- **Backend**: `http://localhost:8000/health`
- **Database**: Connection test in Python backend

---

This documentation provides a comprehensive guide for understanding, developing, and maintaining the audit data collection application. For specific implementation details, refer to the individual source files and their inline comments.