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

### July 16, 2025 - Python Flask API Integration for Step 2
- **✓ Created Python Flask API server** for Excel file processing on port 5001
- **✓ Added comprehensive Excel column mapping** with Question Number, Process, Sub-Process, and Question fields
- **✓ Implemented dual file upload system** - Primary Data Request Files and Follow-up Question Files
- **✓ Updated database schema** with fileType, categories, subcategories, and columnMappings JSON fields
- **✓ Enhanced Step 2 UI** with dynamic column selection, sample data preview, and validation
- **✓ Added real-time file processing** with pandas and openpyxl for Excel parsing
- **✓ Removed estimated time display** as requested
- **✓ Created comprehensive error handling** and progress tracking for file uploads
- **✓ Added support for multiple follow-up files** with add/remove functionality
- **✓ Integrated Flask API endpoints** for column detection and file processing
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