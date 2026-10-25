// Multi-shot capture of the landing page in one headless Chrome session (local helper, not product code).
// Usage: node scripts/dev/screenshot-landing.mjs <prefix> <width> <height> [reduce] <shot>...
//   shot "t:2"   seek every time-based animation to 2s (paused) and capture the viewport
//   shot "y:900" scroll to 900px (animations seeked to their end) and capture the viewport
// Output: <repo>/.screens/landing/<prefix>-<shot>.png (git-ignored, viewport-sized, <= 2000px per side).
// Needs `npm run dev` on port 3000 and Chrome or Edge.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// scripts/dev/ -> repo root is two levels up, so output lands in the repo whatever the working directory.
const outDir = fileURLToPath(new URL("../../.screens/landing", import.meta.url));

const [prefix, width, height, ...rest] = process.argv.slice(2);
if (!prefix || !width || !height || rest.length === 0) {
  console.error("usage: node scripts/dev/screenshot-landing.mjs <prefix> <width> <height> [reduce] <shot>...");
  process.exit(2);
}
const reduce = rest[0] === "reduce";
const shots = reduce ? rest.slice(1) : rest;
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
const profile = mkdtempSync(join(tmpdir(), "renewly-land-"));
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let socket;
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    } catch {}
    if (!target) await sleep(250);
  }
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, fail) => ((socket.onopen = ok), (socket.onerror = fail)));
  let id = 0;
  const pending = new Map();
  socket.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((ok) => {
      const n = ++id;
      pending.set(n, ok);
      socket.send(JSON.stringify({ id: n, method, params }));
    });
  const w = Number(width);
  const h = Number(height);
  const scale = w < 700 ? 2 : 1;
  if (w * scale > 2000 || h * scale > 2000) throw new Error("too large");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: scale, mobile: w < 700 });
  if (reduce) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(6000);
  const out = outDir;
  mkdirSync(out, { recursive: true });
  for (const shot of shots) {
    const [kind, value] = shot.split(":");
    if (kind === "t") {
      await send("Runtime.evaluate", {
        expression: `window.scrollTo(0,0);document.getAnimations().filter(a=>a.timeline instanceof DocumentTimeline).forEach(a=>{a.pause();a.currentTime=${Number(value) * 1000}});`,
      });
    } else {
      await send("Runtime.evaluate", {
        expression: `document.getAnimations().filter(a=>a.timeline instanceof DocumentTimeline).forEach(a=>{a.pause();a.currentTime=99999});window.scrollTo(0,${Number(value)});`,
      });
    }
    await sleep(700);
    const img = await send("Page.captureScreenshot", { format: "png" });
    const file = join(out, `${prefix}-${kind}${value}.png`);
    writeFileSync(file, Buffer.from(img.result.data, "base64"));
    console.log("saved", file);
  }
  const o = await send("Runtime.evaluate", {
    expression: "({doc:document.documentElement.scrollWidth,view:innerWidth,height:document.documentElement.scrollHeight})",
    returnByValue: true,
  });
  console.log(JSON.stringify(o.result.result.value));
} catch (error) {
  console.error("failed:", error.message);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome.kill();
  await sleep(500);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
