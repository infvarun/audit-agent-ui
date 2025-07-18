# Separate Server Architecture

This setup runs the Python FastAPI backend and React frontend as separate processes.

## Quick Start

### Option 1: Use the convenience script
```bash
./start_dev_servers.sh
```

### Option 2: Start servers manually

**Terminal 1 - Python Backend:**
```bash
python3 start_python_backend.py
```

**Terminal 2 - React Frontend:**
```bash
npm run dev
```

## Architecture

- **Python Backend**: FastAPI server running on `http://localhost:8000`
- **React Frontend**: Vite dev server running on `http://localhost:5173`
- **CORS**: Configured in Python backend to allow frontend requests
- **Direct Communication**: Frontend makes API calls directly to Python backend

## API Endpoints

All API endpoints are available at `http://localhost:8000/api/`:

- `GET /api/health` - Health check
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create new application
- `GET /api/applications/{id}` - Get specific application
- `POST /api/questions/analyze` - Analyze questions with AI
- `POST /api/data-collection/start` - Start data collection
- `GET /api/data-collection/session/{id}` - Get collection session

## Environment Variables

Create a `.env.local` file in the root directory:
```
VITE_API_URL=http://localhost:8000
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
```

## Development Features

- Hot reload for both frontend and backend
- Direct API communication without proxy
- CORS properly configured
- Full TypeScript support
- PostgreSQL database integration
- OpenAI/LangChain integration

## Deployment

For production, build the frontend and serve both applications:

```bash
npm run build
python3 start_python_backend.py
```

The Python backend will serve the built React app from `/dist/public`.