// Screenshots a dev page with real device emulation (true 390px layout viewport, mobile mode).
// Usage: node scripts/dev/screenshot-device.mjs <path> <name> [width] [height] [full] [scrollY]
//   node scripts/dev/screenshot-device.mjs /dev/preview dash-phone 390 844 full
// Output: <repo>/.screens/<name>.png (git-ignored). Needs `npm run dev` on port 3000.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// scripts/dev/ -> repo root is two levels up, so output lands in the repo whatever the working directory.
const screensDir = fileURLToPath(new URL("../../.screens", import.meta.url));

// Optional 6th arg: scrollY in CSS px, for viewport-sized shots of a long page (output stays <= 2000px per side).
const [pagePath, name, width = "390", height = "844", full, scrollY] = process.argv.slice(2);
if (!pagePath || !name) {
  console.error("usage: node scripts/dev/screenshot-device.mjs <path> <name> [width] [height] [full] [scrollY]");
  process.exit(2);
}

const chromePath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!chromePath) {
  console.error("Chrome or Edge not found");
  process.exit(1);
}

const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "renewly-shot-"));
const chrome = spawn(
  chromePath,
  ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let socket;
try {
  let target;
  for (let attempt = 0; attempt < 40 && !target; attempt++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      target = list.find((t) => t.type === "page");
    } catch {
      /* chrome still starting */
    }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error("Chrome did not start");

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    socket.onopen = ok;
    socket.onerror = fail;
  });

  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok) => {
      const myId = ++id;
      pending.set(myId, ok);
      socket.send(JSON.stringify({ id: myId, method, params }));
    });

  const w = Number(width);
  const h = Number(height);
  const scale = w < 700 ? 2 : 1;
  if (w * scale > 2000 || h * scale > 2000) throw new Error("output would exceed 2000px per side; use a smaller viewport");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: scale,
    mobile: w < 700,
  });
  await send("Page.navigate", { url: `http://localhost:3000${pagePath}` });
  await sleep(7000); // let the dev server compile and the page settle
  if (scrollY) {
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${Number(scrollY)})` });
    await sleep(500);
  }

  let clip;
  if (full === "full") {
    const metrics = await send("Page.getLayoutMetrics");
    const size = metrics.result.cssContentSize ?? metrics.result.contentSize;
    clip = { x: 0, y: 0, width: w, height: Math.min(Math.ceil(size.height), 6000), scale: 1 };
  }
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: full === "full",
    ...(clip ? { clip } : {}),
  });
  mkdirSync(screensDir, { recursive: true });
  const out = join(screensDir, `${name}.png`);
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));

  // Horizontal overflow check: anything wider than the viewport is a real bug.
  const overflow = await send("Runtime.evaluate", {
    expression: "({ doc: document.documentElement.scrollWidth, view: window.innerWidth, pageHeight: document.documentElement.scrollHeight })",
    returnByValue: true,
  });
  const { doc, view, pageHeight } = overflow.result.result.value;
  console.log(`page height ${pageHeight}px`);
  console.log(`saved ${out}`);
  console.log(doc > view ? `HORIZONTAL OVERFLOW: page is ${doc}px wide in a ${view}px viewport` : `no horizontal overflow (${doc}px in ${view}px)`);
} catch (error) {
  console.error(`failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* profile may still be locked; it is in the temp folder */
  }
}
