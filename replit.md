# replit.md

## Overview

This is a full-stack audit data collection application built with React + TypeScript frontend and Express.js backend. The application provides a wizard-based interface for setting up audit data collection processes, managing tool connectors, and generating audit reports. It uses a PostgreSQL database with Drizzle ORM for data management and includes a comprehensive UI component system built with shadcn/ui.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite for development and production builds
- **Form Management**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Upload**: Multer for handling multipart/form-data
- **API**: RESTful API with JSON responses
- **Development**: Hot reload with Vite middleware integration

## Key Components

### Database Schema
- **Applications**: Core application records with CI IDs and date ranges
- **Data Requests**: File uploads and question parsing results
- **Tool Connectors**: External system integrations (SQL Server, Outlook, etc.)
- **Data Collection Sessions**: Progress tracking for data gathering
- **Audit Results**: Final audit outcomes and document generation

### Wizard Flow
1. **Application Setup**: Basic application information and settings
2. **Data Request**: File upload and question parsing
3. **Tool Connectors**: Configure external system connections
4. **Data Collection**: Execute data gathering with progress tracking
5. **Results**: View audit results and download reports

### External Integrations
- SQL Server database connections
- Outlook Exchange email systems
- ServiceNow (SNow) integration
- NAS file systems
- Gnosis knowledge management
- ADC (Application Dependency Checking)

## Data Flow

1. **Application Creation**: User creates application with basic metadata
2. **File Processing**: Data request files are uploaded and parsed for questions
3. **Connector Configuration**: External systems are configured with credentials
4. **Data Collection**: Automated data gathering from configured sources
5. **Result Generation**: Audit results are compiled and made available for download

## External Dependencies

### Frontend Dependencies
- **UI Components**: Extensive Radix UI component library
- **Styling**: Tailwind CSS with PostCSS processing
- **State Management**: TanStack Query for API state
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion for UI animations
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL dialect
- **File Upload**: Multer for multipart form handling
- **Session Management**: connect-pg-simple for PostgreSQL sessions
- **Database Connection**: @neondatabase/serverless for Neon integration

## Deployment Strategy

### Development
- **Server**: Express.js with Vite middleware for HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Build**: Vite dev server for frontend, tsx for backend execution

### Production
- **Frontend**: Static files built with Vite and served by Express
- **Backend**: Bundled with esbuild for optimized Node.js execution
- **Database**: Drizzle migrations applied via `db:push` command
- **Environment**: DATABASE_URL required for PostgreSQL connection

### Build Process
- Frontend assets built to `dist/public`
- Backend bundled to `dist/index.js`
- Database schema pushed via Drizzle Kit
- Static file serving integrated with Express

The application follows a monorepo structure with shared TypeScript types and schemas, enabling type safety across the full stack while maintaining clear separation between frontend and backend concerns.

## Recent Changes: Latest modifications with dates

### July 16, 2025 - Node.js Excel Processing & Follow-up Questions Integration
- **✓ Migrated from Python Flask to Node.js Excel processing** using xlsx library for better integration
- **✓ Fixed XLSX library import and usage** for proper ES module compatibility
- **✓ Added comprehensive Excel column mapping** with Question Number, Process, Sub-Process, and Question fields
- **✓ Implemented dual file upload system** - Primary Data Request Files and Follow-up Question Files
- **✓ Updated database schema** with fileType, categories, subcategories, and columnMappings JSON fields
- **✓ Enhanced Step 2 UI** with dynamic column selection, sample data preview, and validation
- **✓ Added real-time file processing** with buffer-based Excel parsing
- **✓ Removed estimated time display** as requested
- **✓ Created comprehensive error handling** and progress tracking for file uploads
- **✓ Added conditional follow-up files support** - only shows when "Enable follow-up questions" is checked in Step 1
- **✓ Integrated Node.js API endpoints** for column detection and file processing
- **✓ Updated database storage** to handle complex JSON structures for questions and categories

### July 16, 2025 - Dashboard and Navigation System
- **Added comprehensive dashboard landing page** with search functionality for existing applications
- **Implemented navigation between dashboard and wizard** with URL-based routing
- **Added "Recent Audits" section** with card-based display of recent applications
- **Created unified navigation header** with back button, logo, settings, and user avatar
- **Added application search feature** with real-time filtering by name or CI ID
- **Implemented "Initiate new audit" button** for starting fresh audit processes
- **Added URL parameter support** for editing existing applications (`/wizard/:applicationId`)
- **Enhanced wizard with context awareness** - shows existing application name in header
- **Added API routes for fetching all applications** and individual application details
- **Removed form validation from all wizard steps** to allow free navigation for testing

### July 16, 2025 - CI-Based Connector Configuration & Settings System
- **✓ Redesigned Step 3 to blank placeholder** directing users to Settings page for connector configuration
- **✓ Created comprehensive Settings page** with CI search, connector management, and configuration interface
- **✓ Updated database schema** to support CI-based connector configurations with unique constraints
- **✓ Added ciId field to tool connectors** linking connectors to applications by CI ID
- **✓ Implemented 4 core connector types** - SQL Server, Gnosis Path, ServiceNow, and NAS Path
- **✓ Added Settings navigation button** in wizard header for easy access to connector management
- **✓ Created CI-based connector API routes** for create, read, update, and delete operations
- **✓ Enhanced storage interface** with CI-specific connector querying and management methods
- **✓ Updated routing system** to include Settings page at `/settings` path
- **✓ Applied database migration** to reflect new schema with ciId and unique constraint support

### July 16, 2025 - AI-Powered Question Analysis System
- **✓ Redesigned Step 3 with AI-powered question analysis** replacing static connector configuration
- **✓ Moved connector configuration to dashboard** with "Add Connector" button beside "Create First Audit"
- **✓ Integrated OpenAI GPT-4o for intelligent question analysis** with efficient prompt generation
- **✓ Created comprehensive data table** with 4 columns: original question, AI prompt, tool suggestion, connector
- **✓ Added editable tool suggestions** allowing users to modify AI recommendations
- **✓ Implemented expandable row details** for full prompt viewing and question categorization
- **✓ Added real-time question analysis** with loading states and error handling
- **✓ Created backend API endpoint** `/api/questions/analyze` for AI-powered question processing
- **✓ Enhanced UI with badges and visual indicators** for analysis status and tool assignments
- **✓ Added re-analysis functionality** for iterative question optimization

### July 17, 2025 - Enhanced Progress Tracking & Persistence
- **✓ Added live progress bar** showing real-time completion percentage during AI analysis
- **✓ Integrated Lottie animation** for engaging loading states with Assistant Bot animation
- **✓ Created question analysis database table** for persistent storage of AI-generated results
- **✓ Added save/load functionality** to prevent re-analysis on page refreshes
- **✓ Implemented progress calculation** showing X of Y questions complete with percentage
- **✓ Added save button with visual feedback** and green checkmark when analyses are saved
- **✓ Enhanced storage interface** with question analysis CRUD operations
- **✓ Updated database schema** with questionAnalyses table and unique constraints
- **✓ Added API endpoints** for saving, loading, and managing question analyses
- **✓ Applied database migration** to support new question analysis persistence
- **✓ Enabled persistent Save button** allowing users to save tool suggestion changes at any time
- **✓ Added state reset functionality** to mark changes as unsaved when users modify tool suggestions
- **✓ Replaced Lottie animation with animated GIF** using user-provided Assistant Bot GIF file
- **✓ Moved GIF to public/assets folder** for proper web accessibility

### July 17, 2025 - Python Backend Migration with LangChain Integration
- **✓ Successfully migrated from Node.js Express backend to Python FastAPI** with LangChain for OpenAI orchestration
- **✓ Created comprehensive Python server structure** with main.py, database.py, storage.py, langchain_service.py, and routes.py
- **✓ Integrated LangChain with GPT-4o model** for intelligent question analysis and prompt generation
- **✓ Added SQLAlchemy ORM** for PostgreSQL database operations with proper models and relationships
- **✓ Implemented FastAPI with async/await patterns** for high-performance API endpoints
- **✓ Added CORS middleware and request logging** for proper frontend-backend communication
- **✓ Created QuestionAnalysisService class** using LangChain for structured AI prompt generation
- **✓ Added comprehensive error handling** with fallback responses for AI analysis failures
- **✓ Implemented batch question analysis** for processing multiple questions efficiently
- **✓ Added health check endpoint** for monitoring Python server status
- **✓ Created database models** for applications, data requests, question analyses, and data collection sessions
- **✓ Configured proper Python server startup** with uvicorn and hot reload support
- **✓ Added environment variable support** for OpenAI API key and database configuration