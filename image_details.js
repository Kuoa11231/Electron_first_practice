const { ipcRenderer } = require("electron");
const { remote } = require("electron");

const editableFields = [
  "posPrompts",
  "negPrompts",
  "checkpointModelName",
  "samplerName",
  "samplingSteps",
  "CFGScale",
  "seed",
  "upscalerName",
  "hiresStep",
  "denoisingStrength",
  "upscaleBy",
  "loraModelName",
  "weight",
  "opPrompts",
  "preprocessorName",
  "controlNetWeight",
];

const editButton = document.getElementById("editButton");
const completeEditButton = document.getElementById("completeEditButton");

editButton.addEventListener("click", function () {
  // Switch all spans in editable fields to input fields with the span's text
  document.querySelectorAll(".editable-field span").forEach((span) => {
    const inputValue = span.innerText;
    const inputField = document.createElement("input");
    inputField.value = inputValue;
    inputField.id = span.id; // Transfer the ID from span to input
    span.parentElement.replaceChild(inputField, span);
  });

  // Hide the edit button and show the complete edit button
  editButton.style.display = "none";
  completeEditButton.style.display = "block";
});

completeEditButton.addEventListener("click", function () {
  // Switch all inputs in editable fields back to spans
  document.querySelectorAll(".editable-field input").forEach((input) => {
    const spanValue = input.value;
    const spanElement = document.createElement("span");
    spanElement.innerText = spanValue;
    spanElement.id = input.id; // Transfer the ID from input back to span
    input.parentElement.replaceChild(spanElement, input);
  });

  // Reverse the button display settings
  editButton.style.display = "block";
  completeEditButton.style.display = "none";

  const dataToUpdate = {
    sid: document.getElementById("sid").textContent,
  };

  // Add this logging for debugging
  console.log("DEBUG: Checking field values:");
  editableFields.forEach((field) => {
    const fieldElement = document.getElementById(field);

    // Check if the element exists
    if (fieldElement) {
      const fieldValue = fieldElement.textContent; // Use textContent for span

      // Only add properties if they have value and are not 'sid', 'JSONFileForPose', or 'timestamp'
      if (
        fieldValue &&
        !["sid", "JSONFileForPose", "timestamp"].includes(field)
      ) {
        dataToUpdate[field] = fieldValue;
      }

      // Log the field value
      console.log(field, fieldValue);
    } else {
      console.warn(`Element with ID ${field} not found.`);
    }
  });

  // Sending data to main process
  console.log(dataToUpdate);
  ipcRenderer.send("update-data", dataToUpdate);
});

//回應修改資料結果
ipcRenderer.on("update-data-response", (event, message) => {
  alert(message);
});

document.getElementById("goToPreview").addEventListener("click", () => {
  ipcRenderer.send("navigate", "preview.html");
});

document.addEventListener("DOMContentLoaded", () => {
  const storedSid = window.electron.getGlobal("currentSid");
  if (storedSid) {
    ipcRenderer.send("re-fetch-details", storedSid);
    console.log("Requesting re-fetch of details for sid:", storedSid);
  }
});

//左鍵點擊span時，拷貝其內容到剪貼版
document.querySelectorAll("span").forEach((span) => {
  span.addEventListener("click", function () {
    copyToClipboard(this.textContent);
  });
});

//拷貝內容
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text copied to clipboard successfully!");
    })
    .catch((err) => {
      console.error("Failed to copy text to clipboard: ", err);
    });
}

// Listen for the image details from the main process
ipcRenderer.on("send-image-details", (event, imageDetails) => {
  ipcRenderer.send("set-current-sid", imageDetails.sid);

  if (!imageDetails || !imageDetails.txt2img) {
    console.error("Invalid imageDetails received in renderer:", imageDetails);
    return;
  }
  // Populate images
  console.log(imageDetails.txt2img);
  let txt2imgData = imageDetails.txt2img.buffer;
  if (txt2imgData instanceof Uint8Array) {
    txt2imgData = Buffer.from(txt2imgData);
  }
  document.getElementById(
    "text2img"
  ).src = `data:image/jpeg;base64,${txt2imgData.toString("base64")}`;

  if (imageDetails.preprocessorPreview) {
    let preprocessorPreviewData = imageDetails.preprocessorPreview.buffer;
    if (preprocessorPreviewData instanceof Uint8Array) {
      preprocessorPreviewData = Buffer.from(preprocessorPreviewData);
    }
    document.getElementById(
      "preprocessorPreview"
    ).src = `data:image/jpeg;base64,${preprocessorPreviewData.toString(
      "base64"
    )}`;
  } else {
    // hide the image if there's no data
    document.getElementById("preprocessorPreview").style.display = "none";
  }

  // General
  document.getElementById("sid").textContent = imageDetails.sid;
  document.getElementById("posPrompts").textContent =
    imageDetails.posPrompts.join(", ");
  document.getElementById("negPrompts").textContent =
    imageDetails.negPrompts.join(", ");
  document.getElementById("checkpointModelName").textContent =
    imageDetails.checkpointModelName;
  document.getElementById("samplerName").textContent = imageDetails.samplerName;
  document.getElementById("samplingSteps").textContent =
    imageDetails.samplingSteps;
  document.getElementById("CFGScale").textContent = imageDetails.CFGScale;
  document.getElementById("seed").textContent = imageDetails.seed;

  //第二組 - Hires.fix
  document.getElementById("upscalerName").textContent =
    imageDetails.upscalerName;
  document.getElementById("hiresStep").textContent = imageDetails.hiresStep;
  document.getElementById("denoisingStrength").textContent =
    imageDetails.denoisingStrength;
  document.getElementById("upscaleBy").textContent = imageDetails.upscaleBy;

  //第三組 - Lora
  document.getElementById("loraModelName").textContent =
    imageDetails.loraModelName;
  document.getElementById("weight").textContent = imageDetails.weight;
  document.getElementById("opPrompts").textContent = imageDetails.opPrompts;

  //第四組 - ControlNet
  document.getElementById("preprocessorName").textContent =
    imageDetails.preprocessorName;
  document.getElementById("controlNetWeight").textContent =
    imageDetails.controlNetWeight;

  document.getElementById("timestamp").textContent = new Date(
    imageDetails.timestamp
  ).toLocaleString();

  // Set up JSON download
  const downloadLink = document.createElement("a");
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);

  document.getElementById("downloadJSON").addEventListener("click", () => {
    const blob = new Blob(
      [JSON.stringify(imageDetails.JSONFileForPose, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = "file.json";
    downloadLink.click();
    URL.revokeObjectURL(url);
  });
});
