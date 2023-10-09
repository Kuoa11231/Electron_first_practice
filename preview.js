// preview.js
const { ipcRenderer } = require("electron");

document.getElementById("goToIndex").addEventListener("click", () => {
  ipcRenderer.send("navigate", "submit.html");
});

ipcRenderer.on("send-images", (event, imagesDocuments) => {
  console.log(`Received ${imagesDocuments.length} images from main process.`);
  const imageGrid = document.getElementById("imageGrid");
  imagesDocuments.forEach((imageDocument) => {
    if (imageDocument.txt2img) {
      const img = new Image();
      const buf = Buffer.from(imageDocument.txt2img.buffer);
      if (buf && buf.length) {
        img.src = `data:image/jpeg;base64,${buf.toString("base64")}`;
      } else {
        console.warn(
          "No buffer data found for image with SID:",
          imageDocument.sid
        );
      }

      img.setAttribute("data-sid", imageDocument.sid);

      img.addEventListener("click", function () {
        const sid = this.getAttribute("data-sid");
        ipcRenderer.send("load-image-details", sid);
      });

      const div = document.createElement("div");
      div.classList.add("image-container");
      div.appendChild(img);
      imageGrid.appendChild(div);
    }
  });
});

ipcRenderer.send("fetch-images");
