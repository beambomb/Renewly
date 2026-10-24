// Reads your Supabase project's PUBLIC auth settings and explains what they mean for
// magic-link sign-in. Sends no email, prints no keys. Run: npm run check:auth
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

if (!existsSync(".env.local")) {
  console.error(".env.local not found");
  process.exit(1);
}
const env = parseEnv(readFileSync(".env.local", "utf8"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  process.exit(1);
}

let settings;
try {
  const response = await fetch(`${new URL(url).origin}/auth/v1/settings`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    console.error(`Supabase answered HTTP ${response.status} for the auth settings.`);
    process.exit(1);
  }
  settings = await response.json();
} catch (error) {
  console.error(`Could not reach Supabase (${error.name}).`);
  process.exit(1);
}

const rows = [];
const add = (ok, label, note) => rows.push({ ok, label, note });

add(
  settings.external?.email === true,
  "Email sign-in provider enabled",
  settings.external?.email === true ? "yes" : "NO: enable Email under Authentication > Sign In / Providers",
);
add(
  settings.disable_signup !== true,
  "New users can sign up",
  settings.disable_signup !== true
    ? "yes (anyone with the link can create an account; turn this off after you have yours)"
    : "NO: sign-ups are off, so only existing users can sign in. Turn on 'Allow new users to sign up' for your first login.",
);
add(
  settings.mailer_autoconfirm !== true,
  "Email confirmation required",
  settings.mailer_autoconfirm === true ? "off (auto-confirm); fine for testing" : "on (normal)",
);

for (const { ok, label, note } of rows) console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${note}`);
console.log(
  "\nNot visible from here: the email sender. Supabase's built-in sender is limited to a few emails per hour and only " +
    "delivers to people in your Supabase organisation. If 'Send sign-in link' keeps failing, set up SMTP " +
    "(Authentication > SMTP Settings, for example Resend) and check Authentication > Logs.",
);
process.exitCode = rows.some((r) => !r.ok) ? 1 : 0;
