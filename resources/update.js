import https from "https";
import fs from "fs";

const files = [
  "https://raw.githubusercontent.com/AntoineBalaine/vscode-reascript-extension/refs/heads/main/resources/reaper-types.lua",
  "https://raw.githubusercontent.com/AntoineBalaine/vscode-reascript-extension/refs/heads/main/resources/Sexan_reaper_defs.lua",
  "https://raw.githubusercontent.com/AntoineBalaine/vscode-reascript-extension/refs/heads/main/resources/imgui_defs_0.9.lua",
  "https://raw.githubusercontent.com/AntoineBalaine/vscode-reascript-extension/refs/heads/main/resources/reawwise_defs.lua",
];

for (const fileUrl of files) {
  const fileName = fileUrl.split("/").pop();
  const outputPath = `resources/${fileName}`;

  https.get(fileUrl, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to get '${fileUrl}' (${res.statusCode})`);
      res.resume();
      return;
    }
  
    const fileStream = fs.createWriteStream(outputPath);
    res.pipe(fileStream);
  
    fileStream.on("finish", () => {
      fileStream.close();
      console.log("Download complete:", outputPath);
    });
  }).on("error", (err) => {
    console.error("Error:", err.message);
  });
}
