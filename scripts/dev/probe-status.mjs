// Usage: node scripts/dev/probe-status.mjs <url> [expectedStatus] [expectedLocationPrefix]
// Fetches without following redirects and prints status and Location.
const [url, expectedStatus, expectedLocation] = process.argv.slice(2);
if (!url) {
  console.error("usage: node scripts/dev/probe-status.mjs <url> [status] [locationPrefix]");
  process.exit(2);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 100_000);
try {
  const response = await fetch(url, { redirect: "manual", signal: controller.signal });
  const location = response.headers.get("location");
  console.log(`${url} -> ${response.status}${location ? ` location=${location}` : ""}`);
  let ok = true;
  if (expectedStatus && String(response.status) !== expectedStatus) ok = false;
  if (expectedLocation && !(location ?? "").includes(expectedLocation)) ok = false;
  console.log(ok ? "as expected" : "UNEXPECTED");
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error(`request failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
