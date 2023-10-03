// preview.js
const { ipcRenderer } = require("electron");

document.getElementById("goToIndex").addEventListener("click", () => {
  ipcRenderer.send("navigate", "submit.html");
});

ipcRenderer.on("send-images", (event, imagesDocuments) => {
  const imageGrid = document.getElementById("imageGrid");
  imageGrid.innerHTML = ""; // Clear previous images

  imagesDocuments.forEach((imageDoc) => {
    if (imageDoc.txt2img && imageDoc.txt2img.buffer) {
      try {
        const buf = Buffer.from(imageDoc.txt2img.buffer);
        const img = new Image();
        img.src = `data:image/jpeg;base64,${buf.toString("base64")}`;
        imageGrid.appendChild(img);
      } catch (error) {
        console.error("Error while creating the image:", error);
      }
    }
  });
});

ipcRenderer.send("fetch-images");
