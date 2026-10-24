// Checks .env.local WITHOUT printing any value. Reports only variable names,
// whether they are set, and pass/fail reasons. Run: npm run check:env
import { existsSync } from "node:fs";

const file = ".env.local";
if (!existsSync(file)) {
  console.error(`${file} not found. Copy .env.example to ${file} and fill it in.`);
  process.exit(1);
}
process.loadEnvFile(file); // loads into this process only

const results = [];
const report = (name, ok, note) => results.push({ name, ok, note });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) report("NEXT_PUBLIC_SUPABASE_URL", false, "not set");
else {
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    const hosted = parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
    if (hosted || local) report("NEXT_PUBLIC_SUPABASE_URL", true, hosted ? "https supabase.co project URL" : "local URL");
    else report("NEXT_PUBLIC_SUPABASE_URL", false, "should look like https://<project-ref>.supabase.co");
    if (parsed.pathname !== "/" && parsed.pathname !== "") report("NEXT_PUBLIC_SUPABASE_URL (path)", false, "remove the path; use just the origin");
  } catch {
    report("NEXT_PUBLIC_SUPABASE_URL", false, "is not a valid URL");
  }
}

const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!key) report("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, "not set");
else if (key.startsWith("sb_secret_")) report("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, "DANGER: this is a secret key. Use the publishable/anon key. Rotate the secret key.");
else if (key.startsWith("sb_publishable_")) report("NEXT_PUBLIC_SUPABASE_ANON_KEY", true, "publishable key format");
else if (key.split(".").length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
    if (payload.role === "anon") report("NEXT_PUBLIC_SUPABASE_ANON_KEY", true, "JWT with role anon");
    else report("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, `DANGER: JWT role is "${payload.role}", not anon. Never put this in a NEXT_PUBLIC variable. Rotate it.`);
  } catch {
    report("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, "looks like a JWT but cannot be decoded");
  }
} else report("NEXT_PUBLIC_SUPABASE_ANON_KEY", false, "unrecognised format");

const site = process.env.NEXT_PUBLIC_SITE_URL;
if (!site) report("NEXT_PUBLIC_SITE_URL", false, "not set (use http://localhost:3000 for local development)");
else {
  try {
    new URL(site);
    report("NEXT_PUBLIC_SITE_URL", true, site.startsWith("http://localhost") ? "localhost" : "valid URL");
  } catch {
    report("NEXT_PUBLIC_SITE_URL", false, "is not a valid URL");
  }
}

// Server-only values must never be in NEXT_PUBLIC_ variables.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && /SERVICE|SECRET|PRIVATE/i.test(name)) {
    report(name, false, "DANGER: secret-looking name with NEXT_PUBLIC_ prefix (would reach the browser)");
  }
}

// Optional values: presence only.
for (const name of ["SUPABASE_DB_URL", "REMINDER_TRIGGER_SECRET", "NEXT_PUBLIC_VAPID_PUBLIC_KEY"]) {
  report(`${name} (optional)`, true, process.env[name] ? "set" : "not set");
}

let failed = 0;
for (const { name, ok, note } of results) {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${note}`);
}
console.log(failed ? `\n${failed} problem(s) found` : "\n.env.local looks good");
process.exitCode = failed ? 1 : 0;
