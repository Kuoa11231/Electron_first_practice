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

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.classList.add("delete-image-button");

      deleteBtn.addEventListener("click", function () {
        const sid = img.getAttribute("data-sid");
        if (
          confirm("Are you sure you want to delete this image and its data?")
        ) {
          ipcRenderer.send("delete-image", sid);
        }
      });

      const div = document.createElement("div");
      div.classList.add("image-container");
      div.appendChild(img);
      div.appendChild(deleteBtn);
      imageGrid.appendChild(div);
    }
  });
});

ipcRenderer.on("image-deletion-result", (event, status) => {
  if (status === "success") {
    alert("Successfully deleted the image and its data.");
    location.reload();
  } else if (status === "fail") {
    alert("Failed to delete the image and its data. Please try again.");
  }
});

ipcRenderer.send("fetch-images");
