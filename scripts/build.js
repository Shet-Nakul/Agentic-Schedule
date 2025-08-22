const { exec } = require('child_process');
const builder = require('electron-builder');

// Build frontend
exec('cd frontend && npm run build', (err) => {
  if (err) {
    console.error('Error building frontend:', err);
    process.exit(1);
  }

  // Build Electron app
  builder.build({
    config: {
      appId: 'com.agentic.schedule',
      productName: 'Agentic Schedule',
      directories: {
        output: 'dist'
      }
    }
  }).then(() => {
    console.log('Build completed successfully');
  }).catch(err => {
    console.error('Error building Electron app:', err);
    process.exit(1);
  });
});
