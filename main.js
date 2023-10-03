const { app, BrowserWindow, ipcMain } = require("electron");
const { MongoClient } = require("mongodb");
require("electron-reload")(__dirname);
const fs = require("fs");

const url = "mongodb://127.0.0.1:27017";
const dbName = "local";

let db;
let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("submit.html");
  mainWindow.webContents.openDevTools();
};

//連接到MongoDB，並初始化程式
const initApp = async () => {
  try {
    const client = await MongoClient.connect(url, { useUnifiedTopology: true });
    console.log("Connected successfully to MongoDB server");
    db = client.db(dbName);
    createWindow();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    app.quit(); // 如果不能連接到MongoDB，終止應用程序
    console.log("Quit app");
  }
};

app.on("ready", initApp);

//切換頁面
ipcMain.on("navigate", (event, page) => {
  mainWindow.loadFile(page);
});

//將資料處理後寫入資料庫
ipcMain.on("data-from-renderer", async (event, data) => {
  console.log("Received data from renderer:", data);

  if (!data.txt2img) {
    console.error("txt2img file not provided!");
    event.reply("data-insertion-result", "fail");
    return;
  }

  try {
    // For txt2img
    const txt2imgBuffer = fs.readFileSync(data.txt2img);
    data.txt2img = txt2imgBuffer;

    // For preprocessorPreview
    if (data.preprocessorPreview) {
      const preprocessorPreviewBuffer = fs.readFileSync(
        data.preprocessorPreview
      );
      data.preprocessorPreview = preprocessorPreviewBuffer;
    }

    // For JSONFileForPose
    if (data.JSONFileForPose) {
      const jsonData = JSON.parse(
        fs.readFileSync(data.JSONFileForPose, "utf8")
      );
      data.JSONFileForPose = jsonData;
    }

    if (data.jsonPath) {
      const jsonData = JSON.parse(fs.readFileSync(data.jsonPath, "utf8"));
      data.json = jsonData;
      delete data.jsonPath;
    }

    if (data.preprocessorPreviewPath) {
      const preprocessorPreviewBuffer = fs.readFileSync(
        data.preprocessorPreviewPath
      );
      data.preprocessorPreview = preprocessorPreviewBuffer;
      delete data.preprocessorPreviewPath;
    }

    const collection = db.collection("text2img_generated_info");

    collection.insertOne(data, (err, result) => {
      if (err) {
        console.error("MongoDB insertion error:", err);
        event.reply("data-insertion-result", "fail");
        throw err;
      }
      console.log("Data inserted to MongoDB:", result);
      event.reply("data-insertion-result", "success");
    });
  } catch (error) {
    console.error("Error processing files or interacting with MongoDB:", error);
    event.reply("data-insertion-result", "fail");
  }
});

//抓取圖片二進制數據轉換成為圖片
ipcMain.on("fetch-images", async (event) => {
  console.log("fetch-images event received in main process");
  const collection = db.collection("text2img_generated_info");
  try {
    const images = await collection.find({}).toArray();
    console.log("Fetched images from MongoDB:", images);
  } catch (error) {
    console.error("Error fetching images from MongoDB:", error);
  }

  const images = await collection.find({}).toArray();
  event.reply("send-images", images);
});
