const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

app.whenReady().then(() => {

  // Jalankan server express
  serverProcess = spawn('node', ['index.js'], { shell: true });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Buka window aplikasi
    mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true
    });


  mainWindow.loadURL('http://localhost:3000');
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});
