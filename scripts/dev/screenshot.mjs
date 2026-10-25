// Takes a screenshot of a dev page with headless Chrome so layout can be reviewed.
// Usage: node scripts/dev/screenshot.mjs <path> <name> [width] [height] [full]
//   node scripts/dev/screenshot.mjs /dev/preview dash-desktop 1280 900
//   node scripts/dev/screenshot.mjs /dev/preview dash-mobile 390 844 full
// Output: <repo>/.screens/<name>.png (git-ignored). Needs `npm run dev` on port 3000.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// scripts/dev/ -> repo root is two levels up, so output lands in the repo whatever the working directory.
const screensDir = fileURLToPath(new URL("../../.screens", import.meta.url));

const [pagePath, name, width = "1280", height = "900", full] = process.argv.slice(2);
if (!pagePath || !name) {
  console.error("usage: node scripts/dev/screenshot.mjs <path> <name> [width] [height] [full]");
  process.exit(2);
}

const candidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("Chrome or Edge not found");
  process.exit(1);
}

mkdirSync(screensDir, { recursive: true });
const out = join(screensDir, `${name}.png`);
const tallHeight = full ? "3200" : height;

spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${tallHeight}`,
    "--virtual-time-budget=9000",
    `--screenshot=${out}`,
    `http://localhost:3000${pagePath}`,
  ],
  { encoding: "utf8", timeout: 90_000 },
);
console.log(existsSync(out) ? `saved ${out}` : "screenshot failed");
process.exitCode = existsSync(out) ? 0 : 1;
