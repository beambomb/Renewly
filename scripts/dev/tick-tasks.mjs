// Usage: node scripts/dev/tick-tasks.mjs 4.1 4.2
// Ticks the given task ids in docs/specs/renewly/tasks.md. With no ids it prints usage and changes nothing.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error("usage: node scripts/dev/tick-tasks.mjs <id> [<id> ...]");
  process.exit(2);
}

// scripts/dev/ -> repo root is two levels up, so this works from any working directory.
const file = fileURLToPath(new URL("../../docs/specs/renewly/tasks.md", import.meta.url));
let text = readFileSync(file, "utf8");
for (const id of ids) {
  const before = text;
  text = text.replace(`- [ ] **${id} `, `- [x] **${id} `);
  console.log(before === text ? `not found or already ticked: ${id}` : `ticked ${id}`);
}
writeFileSync(file, text);
