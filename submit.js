const { ipcRenderer } = require("electron");

//切換至Preview頁面
document.getElementById("goToPreview").addEventListener("click", () => {
  ipcRenderer.send("navigate", "preview.html");
});

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
      preprocessorName: form["preprocessor-name"].value,
      controlNetWeight: parseFloat(form["ControlNet-weight"].value),
      preprocessorPreview: getPathIfExists("preprocessor-preview"),
      JSONFileForPose: getPathIfExists("JSON-file-for-pose"),

      //Others
      timestamp: currentTimestamp,
    };

    // 發送數據到主進程
    ipcRenderer.send("data-from-renderer", data);
  });
