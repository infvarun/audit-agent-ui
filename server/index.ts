import { exec } from 'child_process';

// Start only Vite dev server for React frontend
console.log('🚀 Starting React frontend with static API...');
const viteProcess = exec('npx vite --config ./vite.dev.config.js --host 0.0.0.0 --port 5000', {
  env: {
    ...process.env,
    VITE_HMR_HOST: '0.0.0.0',
    VITE_HMR_PORT: '5000',
    VITE_ALLOWED_HOSTS: 'all'
  }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Vite error:', error);
  }
  console.log('Vite output:', stdout);
  if (stderr) {
    console.error('Vite stderr:', stderr);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Shutting down frontend server...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down frontend server...');
  viteProcess.kill();
  process.exit(0);
});

console.log('✅ Frontend server starting...');
console.log('📦 React frontend: http://localhost:5000');
console.log('📂 Static API files served from: /public/api/');