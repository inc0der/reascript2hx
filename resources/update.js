import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repository = "AntoineBalaine/vscode-reascript-extension";
const sourceRef = "main";
const resourcesDir = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(resourcesDir, "manifest.json");

const files = [
  "reaper-types.lua",
  "Sexan_reaper_defs.lua",
  "imgui_defs_0.9.lua",
  "reawwise_defs.lua"
];

function request(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        request(response.headers.location, headers).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Request failed for ${url} (${response.statusCode})`));
        return;
      }

      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function getSourceMetadata(file) {
  const apiUrl = `https://api.github.com/repos/${repository}/commits?path=resources/${encodeURIComponent(file)}&sha=${sourceRef}&per_page=1`;
  const response = await request(apiUrl, { "User-Agent": "reascript2hx" });
  const commits = JSON.parse(response.toString("utf8"));
  const commit = commits[0];
  if (!commit) {
    throw new Error(`No source commit found for ${file}`);
  }

  return {
    revision: commit.sha,
    commitDate: commit.commit.committer?.date || commit.commit.author?.date || null,
    sourceUrl: `https://raw.githubusercontent.com/${repository}/${commit.sha}/resources/${file}`
  };
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function embeddedVersion(content) {
  const match = content.match(/Generated for version ([^\n]+?)\s+-\s+API version ([^\s]+)/i);
  return match ? { generatedFor: match[1], api: match[2] } : null;
}

async function update() {
  const updatedAt = new Date().toISOString();
  const snapshotFiles = {};

  for (const file of files) {
    const metadata = await getSourceMetadata(file);
    const content = await request(metadata.sourceUrl);
    const outputPath = path.join(resourcesDir, file);
    fs.writeFileSync(outputPath, content);

    snapshotFiles[file] = {
      sourceUrl: metadata.sourceUrl,
      revision: metadata.revision,
      commitDate: metadata.commitDate,
      fetchedAt: updatedAt,
      sha256: crypto.createHash("sha256").update(content).digest("hex"),
      embeddedVersion: embeddedVersion(content.toString("utf8"))
    };
    console.log(`Updated ${file} from ${metadata.revision.slice(0, 12)}`);
  }

  const previous = readManifest();
  const history = [...(previous?.history || [])];
  if (previous?.current) history.push(previous.current);

  const manifest = {
    schemaVersion: 1,
    current: {
      repository: `https://github.com/${repository}`,
      ref: sourceRef,
      fetchedAt: updatedAt,
      files: snapshotFiles
    },
    history: history.slice(-20)
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${path.basename(manifestPath)}`);
}

update().catch((error) => {
  console.error(`Update failed: ${error.message}`);
  process.exitCode = 1;
});
