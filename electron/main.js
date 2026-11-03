const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// Load .env credentials
try {
  const dotenv = require("dotenv");
  const envPath = app.isPackaged
    ? path.join(process.resourcesPath, ".env")
    : path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config({ path: path.join(__dirname, "../.env") });
  }
} catch (e) {}

const { startServer } = require("./server");

let mainWindow = null;
let localServer = null;

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(initApp);
}

function createWindow(targetUrl) {
  const iconPath = path.join(__dirname, "../public/logo.jpeg");

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    title: "SwiftBite POS - Restaurant Management System",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  // Maximize for convenient full-screen POS operation
  mainWindow.maximize();
  mainWindow.show();

  mainWindow.loadURL(targetUrl);

  // Open external links in default browser instead of electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function initApp() {
  if (isDev) {
    const devUrl = process.env.DEV_URL || "http://localhost:3000";
    createWindow(devUrl);
  } else {
    // Determine path to static 'out' directory
    let outDir = path.join(__dirname, "../out");
    if (app.isPackaged) {
      const packagedOut = path.join(process.resourcesPath, "out");
      if (fs.existsSync(packagedOut)) {
        outDir = packagedOut;
      }
    }

    startServer(outDir, (err, { port, server }) => {
      if (err) {
        console.error("Failed to start embedded POS server:", err);
        app.quit();
        return;
      }
      localServer = server;
      createWindow(`http://127.0.0.1:${port}`);
    });
  }
}

app.on("window-all-closed", () => {
  if (localServer) {
    try {
      localServer.close();
    } catch (e) {}
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initApp();
  }
});
