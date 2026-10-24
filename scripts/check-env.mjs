// Checks .env.local WITHOUT printing any value. Reports only variable names,
// whether they are set, and pass/fail reasons. Run: npm run check:env
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const file = ".env.local";
if (!existsSync(file)) {
  console.error(`${file} not found. Copy .env.example to ${file} and fill it in.`);
  process.exit(1);
}
// Read the FILE's values directly. process.loadEnvFile would silently keep any
// value already set in the terminal, hiding what is actually in the file.
const WATCHED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "REMINDER_TRIGGER_SECRET",
  "SUPABASE_DB_URL",
];
const shellOverrides = WATCHED.filter((name) => process.env[name]);
for (const name of WATCHED) delete process.env[name];
Object.assign(process.env, parseEnv(readFileSync(file, "utf8"))); // this process only

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
} else {
  // Structure only, never the value itself.
  const classes = {
    lower: (key.match(/[a-z]/g) ?? []).length,
    upper: (key.match(/[A-Z]/g) ?? []).length,
    digits: (key.match(/\d/g) ?? []).length,
    symbols: (key.match(/[^A-Za-z0-9]/g) ?? []).length,
  };
  const sameAsDbPassword = (() => {
    try {
      const pw = decodeURIComponent(new URL(process.env.SUPABASE_DB_URL ?? "").password);
      return pw.length > 0 && pw === key;
    } catch {
      return false;
    }
  })();
  const hints = [
    `length ${key.length}`,
    `lowercase ${classes.lower}, uppercase ${classes.upper}, digits ${classes.digits}, symbols ${classes.symbols}`,
    sameAsDbPassword ? "IDENTICAL to the database password in SUPABASE_DB_URL" : null,
    `dot-separated parts ${key.split(".").length}`,
    /^\s|\s$/.test(key) ? "has leading/trailing whitespace" : null,
    /["']/.test(key) ? "contains quote characters" : null,
    /\s/.test(key) ? "contains whitespace inside" : null,
    key.startsWith("eyJ") ? "starts like a JWT" : key.startsWith("sb_") ? "starts with sb_" : "starts with something else",
    /[<>\[\]]/.test(key) ? "contains placeholder-like brackets" : null,
  ].filter(Boolean);
  report(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    false,
    `unrecognised format (${hints.join("; ")}). Expected a JWT (3 parts split by dots, starts with eyJ) or sb_publishable_...`,
  );
}

// Live check: ask your own Supabase project whether it accepts the key. Prints the HTTP status only.
if (url && key) {
  try {
    const origin = new URL(url).origin;
    const response = await fetch(`${origin}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const previous = results.find((r) => r.name === "NEXT_PUBLIC_SUPABASE_ANON_KEY");
      if (previous && !previous.ok && !previous.note.startsWith("DANGER")) {
        previous.ok = true;
        previous.note = "format is unfamiliar but Supabase accepts it";
      }
      report("Supabase API reachable with this key", true, `HTTP ${response.status}`);
    } else {
      report("Supabase API reachable with this key", false, `HTTP ${response.status}: ${response.status === 401 || response.status === 403 ? "the key is not accepted by this project" : "unexpected response"}`);
    }
  } catch (error) {
    // Separate "bad key characters" from "host unreachable".
    const badChars = /[^\x21-\x7e]/.test(key);
    let hostNote;
    try {
      const probe = await fetch(`${new URL(url).origin}/auth/v1/health`, { signal: AbortSignal.timeout(10_000) });
      hostNote = `the project host answered (HTTP ${probe.status}), so the URL is fine`;
    } catch (probeError) {
      const cause = probeError.cause?.code ?? probeError.name;
      hostNote = `the project host did not answer (${cause}); the URL may have a typo in the project ref, or this machine is offline`;
    }
    report(
      "Supabase API reachable with this key",
      false,
      `request failed (${error.name}); ${badChars ? "the key contains characters that are not allowed in a header (spaces, newlines or non-ASCII); " : ""}${hostNote}`,
    );
  }
}

// Server-only values must never be in NEXT_PUBLIC_ variables.
for (const name of Object.keys(process.env)) {
  if (name.startsWith("NEXT_PUBLIC_") && /SERVICE|SECRET|PRIVATE/i.test(name)) {
    report(name, false, "DANGER: secret-looking name with NEXT_PUBLIC_ prefix (would reach the browser)");
  }
}

// Database URL (used only by npm run test:rls): validate the shape, print no parts of it.
const dbUrl = process.env.SUPABASE_DB_URL;
if (dbUrl) {
  if (/\[YOUR-PASSWORD\]|<password>|\[PASSWORD\]/i.test(dbUrl)) {
    report("SUPABASE_DB_URL", false, "still contains the password placeholder; replace it with your database password");
  } else {
    try {
      const parsed = new URL(dbUrl);
      const problems = [];
      if (!["postgres:", "postgresql:"].includes(parsed.protocol)) problems.push("must start with postgresql://");
      if (!parsed.username) problems.push("missing user");
      if (!parsed.password) problems.push("missing password");
      if (!parsed.hostname.endsWith(".supabase.co") && !parsed.hostname.endsWith(".supabase.com") && !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
        problems.push("host does not look like Supabase");
      }
      const kind = parsed.hostname.includes("pooler.supabase.com") ? "session/transaction pooler" : parsed.hostname.startsWith("db.") ? "direct connection (IPv6 only on free plan)" : "other host";
      if (parsed.port === "6543") problems.push("port 6543 is the transaction pooler; use 5432 (session) for these tests");
      report("SUPABASE_DB_URL", problems.length === 0, problems.length === 0 ? `valid shape, ${kind}, port ${parsed.port || "default"}` : problems.join("; "));
    } catch {
      report("SUPABASE_DB_URL", false, "cannot be parsed. If the password has special characters (@ : / # ?), URL-encode them (for example @ becomes %40)");
    }
  }
}

// Cross-check: do the API URL and the database URL point at the same project? (match/mismatch only)
if (url && dbUrl) {
  try {
    const apiRef = new URL(url).hostname.split(".")[0];
    const db = new URL(dbUrl);
    const dbRef = db.hostname.startsWith("db.") ? db.hostname.split(".")[1] : db.username.startsWith("postgres.") ? db.username.slice("postgres.".length) : null;
    if (!dbRef) report("Project ref match", true, "could not read a project ref from the database URL, skipped");
    else report("Project ref match", apiRef === dbRef, apiRef === dbRef ? "API URL and database URL are the same project" : "API URL and database URL point at DIFFERENT projects (one has a typo or is from another project)");
  } catch {
    report("Project ref match", true, "skipped");
  }
}

// Is this machine online at all? (distinguishes a typo from no internet)
try {
  const { lookup } = await import("node:dns/promises");
  await lookup("supabase.com");
  report("Internet/DNS on this machine", true, "supabase.com resolves");
} catch {
  report("Internet/DNS on this machine", false, "cannot resolve supabase.com; this machine seems offline or DNS is blocked");
}

// Optional values: presence only.
for (const name of ["REMINDER_TRIGGER_SECRET", "NEXT_PUBLIC_VAPID_PUBLIC_KEY"]) {
  report(`${name} (optional)`, true, process.env[name] ? "set" : "not set");
}

if (shellOverrides.length > 0) {
  report(
    "Terminal overrides .env.local",
    false,
    `these are also set in your terminal and WIN over the file when running next dev: ${shellOverrides.join(", ")}. Clear them with: ${shellOverrides.map((n) => `Remove-Item Env:${n}`).join("; ")}`,
  );
}

let failed = 0;
for (const { name, ok, note } of results) {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${note}`);
}
console.log(failed ? `\n${failed} problem(s) found` : "\n.env.local looks good");
process.exitCode = failed ? 1 : 0;
