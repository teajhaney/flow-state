import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For easier prototyping; secure apps should use preload scripts
    },
    title: 'Flow State',
  });

  // Load the frontend (dev mode for now)
  mainWindow.loadURL('http://localhost:5173');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Spawn NestJS Backend
//   const backend = spawn('npm', ['run', 'start:dev'], {
//     cwd: path.join(__dirname, '../../flow-state-backend'),
//     shell: true,
//     stdio: 'inherit',
//   });

//   backend.on('close', code => {
//     console.log(`Backend process exited with code ${code}`);
//   });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
