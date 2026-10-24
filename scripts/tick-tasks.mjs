// Usage: node scripts/tick-tasks.mjs 4.1 4.2
// Ticks the given task ids in docs/specs/renewly/tasks.md.
import { readFileSync, writeFileSync } from "node:fs";

const file = "docs/specs/renewly/tasks.md";
let text = readFileSync(file, "utf8");
for (const id of process.argv.slice(2)) {
  const before = text;
  text = text.replace(`- [ ] **${id} `, `- [x] **${id} `);
  console.log(before === text ? `not found or already ticked: ${id}` : `ticked ${id}`);
}
writeFileSync(file, text);
