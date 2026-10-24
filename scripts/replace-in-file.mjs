// Usage: node scripts/replace-in-file.mjs <file> <search> <replacement>
// Replaces every occurrence of a literal string (no regex, no $ patterns).
import { readFileSync, writeFileSync } from "node:fs";

const [file, search, replacement] = process.argv.slice(2);
if (!file || !search || replacement === undefined) {
  console.error("usage: node scripts/replace-in-file.mjs <file> <search> <replacement>");
  process.exit(2);
}
const text = readFileSync(file, "utf8");
const count = text.split(search).length - 1;
if (count === 0) {
  console.error("search text not found");
  process.exit(1);
}
writeFileSync(file, text.split(search).join(replacement));
console.log(`replaced ${count} occurrence(s) in ${file}`);
