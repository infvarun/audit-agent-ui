import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Start Vite dev server for React frontend
console.log('🚀 Starting React development server...');
const viteProcess = exec('npx vite --host 0.0.0.0 --port 5000', (error, stdout, stderr) => {
  if (error) {
    console.error('Vite error:', error);
  }
  console.log('Vite output:', stdout);
  if (stderr) {
    console.error('Vite stderr:', stderr);
  }
});

// Start Python backend
console.log('🐍 Starting Python FastAPI backend...');
const pythonProcess = exec('cd server && python main.py', (error, stdout, stderr) => {
  if (error) {
    console.error('Python error:', error);
  }
  console.log('Python output:', stdout);
  if (stderr) {
    console.error('Python stderr:', stderr);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Shutting down servers...');
  viteProcess.kill();
  pythonProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down servers...');
  viteProcess.kill();
  pythonProcess.kill();
  process.exit(0);
});

console.log('✅ Both servers starting...');
console.log('📦 React frontend: http://localhost:5000');
console.log('🔗 Python backend: http://localhost:8000');