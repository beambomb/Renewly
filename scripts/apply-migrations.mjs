// Applies supabase/migrations/*.sql to the database in .env.local (SUPABASE_DB_URL).
// - Only runs files not yet recorded in supabase_migrations.schema_migrations
//   (the same table the Supabase CLI uses, so `supabase db push` stays compatible).
// - Each file runs in its own transaction: a failure leaves nothing half-applied.
// - Never prints the connection string.
// Usage: npm run db:migrate            (apply pending)
//        npm run db:migrate -- --dry   (list what would be applied)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dry = process.argv.includes("--dry");

const envFile = join(root, ".env.local");
const fromFile = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")).SUPABASE_DB_URL : undefined;
const url = fromFile || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set (.env.local or terminal).");
  process.exit(2);
}

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
} catch (error) {
  console.error(`Could not connect to the database (${error.code ?? error.name}).`);
  process.exit(1);
}

try {
  await client.query(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `);

  const applied = new Set(
    (await client.query("select version from supabase_migrations.schema_migrations")).rows.map((r) => r.version),
  );

  const dir = join(root, "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f.split("_")[0]));

  // Safety: tables exist but nothing is recorded -> someone applied SQL by hand. Do not double-apply.
  const existing = await client.query("select to_regclass('public.items') as items");
  if (existing.rows[0].items && applied.size === 0) {
    console.error(
      "public.items already exists but no migrations are recorded. Refusing to apply on top of it. " +
        "Tell me how this database was set up (for example SQL pasted by hand) and I will record the versions instead.",
    );
    process.exit(1);
  }

  if (pending.length === 0) {
    console.log("Database is up to date. Nothing to apply.");
  } else {
    console.log(`${dry ? "Would apply" : "Applying"} ${pending.length} migration(s):`);
    for (const file of pending) {
      console.log(`  ${file}`);
      if (dry) continue;
      const sql = readFileSync(join(dir, file), "utf8");
      const [version, ...rest] = file.replace(/\.sql$/, "").split("_");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)",
          [version, rest.join("_"), [sql]],
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        console.error(`\n${file} failed and was rolled back: ${String(error.message).split("\n")[0]}`);
        if (error.position) console.error(`(at character ${error.position})`);
        process.exit(1);
      }
    }
    if (!dry) console.log("Done.");
  }
} finally {
  await client.end();
}
