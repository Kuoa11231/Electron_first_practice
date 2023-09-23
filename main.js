const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
require("update-electron-app")();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: "#272727",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
};

app.whenReady().then(() => {
  ipcMain.handle("ping", () => "pong");
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
