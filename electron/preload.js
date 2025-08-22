const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC functionality to renderer
contextBridge.exposeInMainWorld('electron', {
  // Add your IPC methods here
});
