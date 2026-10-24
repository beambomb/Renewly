// Usage: node scripts/add-npm-script.mjs <name> "<command>"
// Adds or replaces an entry in package.json "scripts" without hand-editing JSON.
import { readFileSync, writeFileSync } from "node:fs";

const [name, command] = process.argv.slice(2);
if (!name || !command) {
  console.error('usage: node scripts/add-npm-script.mjs <name> "<command>"');
  process.exit(2);
}
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.scripts[name] = command;
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`scripts.${name} = ${command}`);
