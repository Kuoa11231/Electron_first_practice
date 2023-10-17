// preview.js
const { ipcRenderer } = require("electron");

function clearImageGrid() {
  const imageGrid = document.getElementById("imageGrid");
  while (imageGrid.firstChild) {
    imageGrid.removeChild(imageGrid.lastChild);
  }
}

function fetchImagesByOrder(sortOrder) {
  clearImageGrid();
  ipcRenderer.send("fetch-images", sortOrder);
  console.log("Fetching images by order:", sortOrder);
}

document.getElementById("goToIndex").addEventListener("click", () => {
  ipcRenderer.send("navigate", "submit.html");
});

document.getElementById("sortByNewest").addEventListener("click", function () {
  fetchImagesByOrder("newest");
});

document.getElementById("sortByOldest").addEventListener("click", function () {
  fetchImagesByOrder("oldest");
});

//進入或重整頁面時請求載入圖片
// ipcRenderer.send("fetch-images");
document.addEventListener("DOMContentLoaded", () => {
  fetchImagesByOrder("newest");
});

//於Image Grid載入圖片預覽
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

//提示刪除結果
ipcRenderer.on("image-deletion-result", (event, status) => {
  if (status === "success") {
    alert("Successfully deleted the image and its data.");
    location.reload();
  } else if (status === "fail") {
    alert("Failed to delete the image and its data. Please try again.");
  }
});
