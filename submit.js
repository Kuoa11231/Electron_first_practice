const { ipcRenderer } = require("electron");

const modal = document.getElementById("presetModal");
const btn = document.getElementById("storePreset");
const span = document.getElementsByClassName("close-button")[0];
const confirmButton = document.getElementById("confirmPresetName");
const presetInput = document.getElementById("presetInput");

function getValueOrDefault(elementId) {
  const elem = document.getElementById(elementId);
  return elem && elem.value ? elem.value : "";
}

function showImagePreview(inputElement, targetDivId) {
  const targetDiv = document.getElementById(targetDivId);
  // Remove any previous image previews
  while (targetDiv.firstChild) {
    targetDiv.removeChild(targetDiv.firstChild);
  }

  const files = inputElement.files;
  if (files && files[0]) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.style.width = "100%"; // or adjust as needed
      targetDiv.appendChild(img);
    };
    reader.readAsDataURL(files[0]);
  }
}

btn.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

//切換至Preview頁面
document.getElementById("goToPreview").addEventListener("click", () => {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Disable the button to prevent multiple submissions
  this.disabled = true;
  ipcRenderer.send("navigate", "preview.html");
});

//儲存Preset
confirmButton.addEventListener("click", function () {
  const presetName = presetInput.value;

  if (!presetName) {
    alert("Please enter a name for the preset.");
    return;
  }

  const data = {
    name: presetName,
    checkpointModelName: getValueOrDefault("checkpoint-model-name"),
    vaeModelName: getValueOrDefault("vae-model-name"),
    samplerName: getValueOrDefault("sampler-name"),
    samplingSteps: getValueOrDefault("sampling-steps"),
    CFGScale: getValueOrDefault("CFG-scale"),
    upscalerName: getValueOrDefault("upscaler-name"),
    hiresStep: getValueOrDefault("hires-step"),
    denoisingStrength: getValueOrDefault("denoising-strength"),
    upscaleBy: getValueOrDefault("upscale-by"),
  };

  ipcRenderer.send("store-preset", data);

  modal.style.display = "none";
  // stopPropagation();
  // preventDefault();
});

//使用Preset
document.getElementById("usePreset").addEventListener("change", function () {
  const presetName = this.value;
  if (!presetName) return;

  ipcRenderer.send("load-preset", presetName);
});

//載入Preset
ipcRenderer.on("load-preset-data", (event, presetData) => {
  // Populate the form fields with the returned preset data
  document.getElementById("checkpoint-model-name").value =
    presetData.checkpointModelName || "";
  document.getElementById("vae-model-name").value =
    presetData.vaeModelName || "";
  document.getElementById("sampler-name").value = presetData.samplerName || "";
  document.getElementById("sampling-steps").value =
    presetData.samplingSteps || "";
  document.getElementById("CFG-scale").value = presetData.CFGScale || "";
  document.getElementById("upscaler-name").value =
    presetData.upscalerName || "";
  document.getElementById("hires-step").value = presetData.hiresStep || "";
  document.getElementById("denoising-strength").value =
    presetData.denoisingStrength || "";
  document.getElementById("upscale-by").value = presetData.upscaleBy || "";

  // ...continue populating other fields similarly
});

// 頁面重整後，再次請求Preset資料
document.addEventListener("DOMContentLoaded", function () {
  ipcRenderer.send("fetch-presets");
});

// 取得並顯示Preset名稱
ipcRenderer.on("send-preset-names", (event, presetNames) => {
  const selectElement = document.getElementById("usePreset");
  // Remove existing options
  for (let i = selectElement.options.length - 1; i >= 1; i--) {
    selectElement.remove(i);
  }
  // Add new options
  presetNames.forEach((name) => {
    const option = document.createElement("option");
    option.text = name;
    option.value = name;
    selectElement.add(option);
  });
});

// 儲存Preset成功後，再次請求Preset資料
ipcRenderer.once("preset-stored-successfully", (event, status) => {
  if (status) {
    // Fetch updated presets to populate the dropdown
    ipcRenderer.send("fetch-presets");
  }
});

document.getElementById("txt2img").addEventListener("change", function () {
  showImagePreview(this, "txt2img-preview");
});

document
  .getElementById("preprocessor-preview")
  .addEventListener("change", function () {
    showImagePreview(this, "preprocessor-preview-container");
  });

//傳遞資料至主進程
document
  .getElementById("combined-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // 阻止表單的預設提交行為

    const form = document.getElementById("combined-form");

    // Capture the timestamp
    const currentTimestamp = new Date().toISOString();
    document.getElementById("submit-timestamp").value = currentTimestamp;

    const getPathIfExists = (fileInputName) => {
      const input = form[fileInputName];
      if (input.files && input.files.length > 0) {
        return input.files[0].path;
      }
      return undefined; // 沒有文件時返回undefined
    };

    const data = {
      //第一組 - General
      txt2img: getPathIfExists("txt2img"),
      posPrompts: form["pos-prompts"].value
        .split(",")
        .map((item) => item.trim()),
      negPrompts: form["neg-prompts"].value
        .split(",")
        .map((item) => item.trim()),
      checkpointModelName: form["checkpoint-model-name"].value,
      vaeModelName: form["vae-model-name"].value,
      samplerName: form["sampler-name"].value,
      samplingSteps: parseInt(form["sampling-steps"].value),
      CFGScale: parseFloat(form["CFG-scale"].value),
      seed: parseInt(form["seed"].value),

      // 第二組 - Hires.fix
      upscalerName: form["upscaler-name"].value,
      hiresStep: parseInt(form["hires-step"].value),
      denoisingStrength: parseFloat(form["denoising-strength"].value),
      upscaleBy: parseFloat(form["upscale-by"].value),

      // 第三組 - Lora
      loraModelName: form["lora-model-name"].value,
      weight: parseFloat(form["weight"].value),
      opPrompts: form["op-prompts"].value.split(",").map((item) => item.trim()),

      // 第四組 - ControlNet
      preprocessorName: document.getElementById("preprocessor-name").value,
      controlNetWeight: parseFloat(form["ControlNet-weight"].value),
      preprocessorPreview: getPathIfExists("preprocessor-preview"),
      JSONFileForPose: getPathIfExists("JSON-file-for-pose"),

      //Others
      timestamp: currentTimestamp,
    };

    // 發送數據到主進程
    ipcRenderer.send("data-from-renderer", data);
    ipcRenderer.once("data-insertion-success", (event, status) => {
      if (status === "true") {
        alert(
          "Submission Successful: Your data has been submitted successfully."
        );
      } else {
        ipcRenderer.once("data-insertion-fail", (event, status) => {
          if (status === "true") {
            alert(
              "Submission Failed: An error occurred while submitting your data."
            );
          }
        });
      }
    });
  });
