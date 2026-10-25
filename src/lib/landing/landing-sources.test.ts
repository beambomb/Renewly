import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src", "app", "(marketing)", "welcome");

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(css|tsx?)$/.test(entry.name) ? [path] : [];
  });
}

const BANNED = [
  /gradient/i,
  /blur/i,
  /backdrop/i,
  /box-shadow/i,
  /shadow-/i,
  /drop-shadow/i,
  /text-shadow/i,
  /infinite/i,
  /replay/i,
  /#[0-9a-f]{3,8}\b/i,
  /\p{Extended_Pictographic}/u,
];

describe("landing sources stay flat", () => {
  for (const file of sources(ROOT)) {
    it(file.slice(ROOT.length + 1), () => {
      const text = readFileSync(file, "utf8");
      for (const pattern of BANNED) expect(text, String(pattern)).not.toMatch(pattern);
    });
  }
});
