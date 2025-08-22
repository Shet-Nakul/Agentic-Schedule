const concurrently = require('concurrently');

// Run all development processes concurrently
concurrently([
  { 
    command: 'cd frontend && npm run dev',
    name: 'FRONTEND',
    prefixColor: 'blue'
  },
  {
    command: 'cd server && node index.js',
    name: 'SERVER',
    prefixColor: 'green'
  },
  {
    command: 'electron electron/main.js',
    name: 'ELECTRON',
    prefixColor: 'yellow'
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
  restartTries: 3
}).then(
  () => console.log('All processes exited successfully'),
  (err) => console.error('Error occurred:', err)
);
