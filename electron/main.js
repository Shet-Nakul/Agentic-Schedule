const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from React dev server
  // In production, load from built files
  const devUrl = 'http://localhost:3000';
  const prodUrl = `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
  const isDev = !app.isPackaged;

  if (isDev) {
    const loadUrlWithRetry = (url) => {
      win.loadURL(url).catch((e) => {
        console.log('Error loading URL, retrying in 1s...', e);
        setTimeout(() => loadUrlWithRetry(url), 1000);
      });
    };
    loadUrlWithRetry(devUrl);
  } else {
    win.loadURL(prodUrl);
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
