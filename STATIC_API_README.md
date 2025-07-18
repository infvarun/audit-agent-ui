# Static API Setup

This project now uses static JSON files to simulate API endpoints, making it easy to run the frontend without any server dependencies.

## Architecture

- **Frontend**: React application with Vite dev server
- **API**: Static JSON files served from `client/public/api/`
- **No Backend**: All server-side logic has been removed

## API Endpoints

All API endpoints are served as static JSON files:

### Applications
- `GET /api/applications.json` - List all applications
- `GET /api/applications/1.json` - Get specific application

### Questions Analysis
- `POST /api/questions/analyze` → `GET /api/questions/analyze.json`
- `GET /api/questions/analyses/1.json` - Get saved analyses for application

### Data Collection
- `POST /api/data-collection/start` → `GET /api/data-collection/start.json`
- `GET /api/data-collection/session/1.json` - Get collection session details

### Health Check
- `GET /api/health.json` - System health status

## How It Works

The frontend query client (`client/src/lib/queryClient.ts`) has been modified to:

1. **GET requests**: Fetch static JSON files from `/api/` paths
2. **POST/PUT/DELETE requests**: Return mock success responses with random IDs
3. **URL mapping**: Convert API endpoints to static file paths automatically

## Development

To run the application:

```bash
npm run dev
```

This starts only the Vite development server on port 5000.

## Adding New Endpoints

To add a new API endpoint:

1. Create the JSON file in `client/public/api/` with appropriate structure
2. Update the URL mapping logic in `queryClient.ts` if needed
3. The frontend will automatically fetch from the static file

## Migration to Flask

When ready to add Flask backend:

1. Update the `API_BASE_URL` in `queryClient.ts` to point to Flask server
2. Remove the mock response logic for write operations
3. Replace static JSON files with actual Flask API endpoints

## File Structure

```
client/public/api/
├── applications.json
├── applications/
│   └── 1.json
├── questions/
│   ├── analyze.json
│   └── analyses/
│       └── 1.json
├── data-collection/
│   ├── start.json
│   └── session/
│       └── 1.json
└── health.json
```

Each JSON file contains realistic mock data that matches the expected API response structure.