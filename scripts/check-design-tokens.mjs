// Verifies docs/design-system.md: required tokens exist in light and dark
// themes and declared colour pairs meet WCAG AA. No dependencies.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const doc = readFileSync(join(root, "docs", "design-system.md"), "utf8");

const REQUIRED = [
  "background", "foreground", "card", "card-foreground", "muted",
  "muted-foreground", "border", "primary", "on-primary", "secondary",
  "on-secondary", "accent", "on-accent", "destructive", "on-destructive",
  "focus", "status-ok", "status-soon", "status-urgent", "status-overdue",
  "track",
];

// [foreground, background, minimum ratio, reason]
const PAIRS = [
  ["foreground", "background", 4.5, "body text"],
  ["card-foreground", "card", 4.5, "card text"],
  ["muted-foreground", "muted", 4.5, "secondary text on muted"],
  ["muted-foreground", "background", 4.5, "secondary text on page"],
  ["muted-foreground", "card", 4.5, "secondary text on card"],
  ["on-primary", "primary", 4.5, "primary button"],
  ["on-secondary", "secondary", 4.5, "secondary button"],
  ["on-accent", "accent", 4.5, "accent button"],
  ["on-destructive", "destructive", 4.5, "destructive button"],
  ["focus", "background", 3, "focus ring on page"],
  ["focus", "card", 3, "focus ring on card"],
  ["status-ok", "card", 4.5, "ok ring and text on card"],
  ["status-soon", "card", 4.5, "soon ring and text on card"],
  ["status-urgent", "card", 4.5, "urgent ring and text on card"],
  ["status-overdue", "card", 4.5, "overdue ring and text on card"],
];

function parseBlock(selector) {
  const re = new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`);
  const match = doc.match(re);
  if (!match) throw new Error(`Missing ${selector} block in design-system.md`);
  const tokens = {};
  for (const m of match[1].matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failures = 0;

// If the app stylesheet exists, its tokens must mirror the design doc.
let css = null;
try {
  css = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
} catch {
  console.log("skip  src/app/globals.css not found yet");
}

function parseCssBlock(source, opener) {
  const start = source.indexOf(opener);
  if (start === -1) return null;
  const end = source.indexOf("}", start);
  const tokens = {};
  for (const m of source.slice(start, end).matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

if (css) {
  const mirrors = [
    ["light", "@theme {", parseBlock(":root")],
    ["dark (.dark)", "\n.dark {", parseBlock(".dark")],
    ["dark (media)", ":root:not(.light) {", parseBlock(".dark")],
  ];
  for (const [label, opener, expected] of mirrors) {
    const actual = parseCssBlock(css, opener);
    if (!actual) {
      console.error(`FAIL globals.css is missing the ${label} token block`);
      failures++;
      continue;
    }
    for (const [name, value] of Object.entries(expected)) {
      if (actual[name] !== value) {
        console.error(`FAIL globals.css [${label}] --color-${name} is ${actual[name]}, doc says ${value}`);
        failures++;
      }
    }
  }
}

for (const [theme, selector] of [["light", ":root"], ["dark", ".dark"]]) {
  const tokens = parseBlock(selector);
  for (const name of REQUIRED) {
    if (!tokens[name]) {
      console.error(`FAIL [${theme}] missing token --color-${name}`);
      failures++;
    }
  }
  for (const [fg, bg, min, why] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) continue;
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`${ok ? "ok  " : "FAIL"} [${theme}] ${fg} on ${bg} ${r.toFixed(2)} (min ${min}) ${why}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} design token check(s) failed`);
  process.exit(1);
}
console.log("\nAll design token checks passed");
