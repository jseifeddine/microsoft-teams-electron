const { app, shell, BrowserWindow, Menu, nativeTheme, session, ipcMain, Notification } = require('electron')
const path = require('path')

const config = {
  useContentSize: true,
  width: 1281,
  height: 800,
  center: true,
  backgroundColor: '#121212',
  title: 'Microsoft Teams',
  icon: path.resolve(__dirname, process.platform === 'darwin' 
    ? 'assets/icons/mac/icon.icns' 
    : 'assets/icons/png/256x256.png'),
  show: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    partition: 'persist:teams',
    preload: path.resolve(__dirname, 'src/preload.js'),
  },
}

// Global reference to the main window
let mainWindow = null;

// Force dark mode
nativeTheme.themeSource = 'dark'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

app.on('window-all-closed', function () {
  process.platform !== 'darwin' && app.quit()
})

// Handle IPC messages from renderer process
ipcMain.on('set-badge-count', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count ? count.toString() : '');
  }
});

ipcMain.on('notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

ipcMain.on('teams-deep-link', (event, link) => {
  if (mainWindow) {
    mainWindow.loadURL(link);
  }
});

// Disable security warnings
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

app.on('ready', function () {
  // Set up the application menu
  Menu.setApplicationMenu(Menu.buildFromTemplate(require('./src/menu')))

  // Configure session for better authentication
  const ses = session.fromPartition('persist:teams');
  
  // Allow credentials for cross-origin requests
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: { ...details.requestHeaders, credentials: 'include' } });
  });

  // Set custom user agent
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
  
  ses.setUserAgent(userAgent);

  mainWindow = new BrowserWindow(config)
  
  // Navigate to Teams with dark mode and desktop client flag
  mainWindow.loadURL('https://teams.microsoft.com/?clientType=desktop', {
    userAgent: userAgent
  })

  // Handle new windows properly
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // For login/auth URLs, open in the same window
    if (url.includes('login.microsoftonline.com') || 
        url.includes('login.windows.net') || 
        url.includes('login.microsoft.com') || 
        url.includes('auth.teams.microsoft.com')) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // For other URLs, open in browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.show()
})
