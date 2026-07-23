// Upscale all covers from ~200px to 428px width (2x retina) using PIL Lanczos
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const COVERS_DIR = "assets/covers";
const TARGET_WIDTH = 428;
const QUALITY = 82;

const files = fs.readdirSync(COVERS_DIR).filter(f => f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".png"));
console.log(`Found ${files.length} cover files`);

let totalBefore = 0, totalAfter = 0;
let skipped = 0, upscaled = 0;

for (const file of files.sort((a, b) => {
  const na = parseInt(a.match(/\d+/)[0]), nb = parseInt(b.match(/\d+/)[0]);
  return na - nb;
})) {
  const src = path.join(COVERS_DIR, file);
  const stat = fs.statSync(src);
  totalBefore += stat.size;

  // Get current dimensions
  const info = execSync(`sips -g pixelWidth -g pixelHeight -g format "${src}"`, { encoding: "utf8" });
  const wMatch = info.match(/pixelWidth:\s*(\d+)/);
  const hMatch = info.match(/pixelHeight:\s*(\d+)/);
  if (!wMatch || !hMatch) { console.log(`SKIP ${file} (no dims)`); skipped++; continue; }
  const curW = parseInt(wMatch[1]), curH = parseInt(hMatch[1]);

  if (curW >= TARGET_WIDTH) {
    console.log(`SKIP ${file} (${curW}x${curH} already >=${TARGET_WIDTH})`);
    skipped++;
    totalAfter += stat.size;
    continue;
  }

  // Calculate new height maintaining aspect ratio
  const scale = TARGET_WIDTH / curW;
  const newH = Math.round(curH * scale);

  // Use sips to resize (macOS built-in, good quality)
  try {
    execSync(`sips -z ${newH} ${TARGET_WIDTH} --setProperty formatOptions "${QUALITY}" "${src}"`, { encoding: "utf8" });
    const newStat = fs.statSync(src);
    totalAfter += newStat.size;
    upscaled++;
    console.log(`OK   ${file}: ${curW}x${curH} → ${TARGET_WIDTH}x${newH} (${(stat.size / 1024).toFixed(1)}KB → ${(newStat.size / 1024).toFixed(1)}KB)`);
  } catch (e) {
    console.log(`ERR  ${file}: ${e.message.slice(0, 80)}`);
    totalAfter += stat.size;
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total: ${files.length} | Upscaled: ${upscaled} | Skipped: ${skipped}`);
console.log(`Size: ${(totalBefore / 1024 / 1024).toFixed(2)}MB → ${(totalAfter / 1024 / 1024).toFixed(2)}MB`);
