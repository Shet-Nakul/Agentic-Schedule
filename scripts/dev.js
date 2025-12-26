const concurrently = require('concurrently');

// Run all development processes concurrently
concurrently([
  { 
    command: 'cd frontend && npm run dev',
    name: 'FRONTEND',
    prefixColor: 'blue'
  },
  {
    command: 'cd server && node server.mjs',
    name: 'SERVER',
    prefixColor: 'green'
  },
  {
    command: 'cd Solver && uvicorn services.app:app --host 0.0.0.0 --port 8000',
    name: 'SOLVER',
    prefixColor: 'magenta'
  },
  {
    command: 'electron electron/main.js',
    name: 'ELECTRON',
    prefixColor: 'yellow'
  }
], {
  prefix: 'name',
  killOthersOn: ['failure', 'success'],
  restartTries: 3
}).result.then(
  () => console.log('All processes exited successfully'),
  (err) => console.error('Error occurred:', err)
);
