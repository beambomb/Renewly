// Usage: node scripts/probe-page.mjs <url> <needle> [<needle> ...]
// Fetches a page and reports whether each needle appears in the HTML.
const [url, ...needles] = process.argv.slice(2);
if (!url) {
  console.error("usage: node scripts/probe-page.mjs <url> <needle>...");
  process.exit(2);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 100_000);
try {
  const response = await fetch(url, { signal: controller.signal });
  const html = await response.text();
  console.log(`status ${response.status}, ${html.length} bytes`);
  let missing = 0;
  for (const needle of needles) {
    const found = html.includes(needle);
    if (!found) missing++;
    console.log(`${found ? "found  " : "MISSING"} ${needle}`);
  }
  console.log(`role="img" count: ${(html.match(/role="img"/g) ?? []).length}`);
  process.exitCode = missing > 0 || response.status !== 200 ? 1 : 0;
} catch (error) {
  console.error(`request failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
