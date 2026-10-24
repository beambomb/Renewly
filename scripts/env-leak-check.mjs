// Prints only whether these variables are ALREADY set in the shell environment
// (before any .env file is loaded). Never prints values.
for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_DB_URL",
]) {
  console.log(`${name}: ${process.env[name] ? "SET in shell environment" : "not set in shell"}`);
}
