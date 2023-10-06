// preview.js
const { ipcRenderer } = require("electron");

document.getElementById("goToIndex").addEventListener("click", () => {
  ipcRenderer.send("navigate", "submit.html");
});

ipcRenderer.on("send-images", (event, imagesDocuments) => {
  console.log(`Received ${imagesDocuments.length} images from main process.`);
  const imageGrid = document.getElementById("imageGrid");
  imagesDocuments.forEach((imageDocument) => {
    console.log(imageDocument);
    if (imageDocument.txt2img) {
      const img = new Image();
      console.log("Buffer data:", imageDocument.txt2img.buffer);
      const buf = Buffer.from(imageDocument.txt2img.buffer);
      if (buf && buf.length) {
        img.src = `data:image/jpeg;base64,${buf.toString("base64")}`;
        console.log("Image created with src: ", img.src);
      } else {
        console.warn(
          "No buffer data found for image with SID:",
          imageDocument.sid
        );
      }

      img.setAttribute("data-sid", imageDocument.sid);
      console.log("Image created with src: ", img.src);

      img.addEventListener("click", function () {
        const sid = this.getAttribute("data-sid");
        console.log("Image with SID clicked:", sid);
        ipcRenderer.send("load-image-details", sid);
      });

      img.width = 200;
      img.height = 200;
      imageGrid.appendChild(img);
      console.log("Image appended to grid.");
    }
  });
});

ipcRenderer.send("fetch-images");
