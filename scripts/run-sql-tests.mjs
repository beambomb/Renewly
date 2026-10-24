// Runs supabase/tests/*.sql.
//
//   node scripts/run-sql-tests.mjs --local   embedded Postgres (PGlite) + Supabase stubs,
//                                            applies supabase/migrations first. No account needed.
//   node scripts/run-sql-tests.mjs           uses SUPABASE_DB_URL (a throwaway dev project whose
//                                            migrations are already applied).
//
// Every test file runs inside a transaction that is always rolled back.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const testsDir = join(root, "supabase", "tests");
const migrationsDir = join(root, "supabase", "migrations");
const local = process.argv.includes("--local");

const read = (path) => readFileSync(path, "utf8");
const sqlFiles = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));

function asResultList(result) {
  return Array.isArray(result) ? result : [result];
}

async function connect() {
  if (local) {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite();
    return {
      run: async (sql) => asResultList(await db.exec(sql)),
      close: () => db.close(),
    };
  }
  // Prefer the value in .env.local (read directly, never printed), else the terminal's.
  const envFile = join(root, ".env.local");
  const fromFile = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")).SUPABASE_DB_URL : undefined;
  const url = fromFile || process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error("SUPABASE_DB_URL is not set. Use --local, or export it in your shell (see README).");
    process.exit(2);
  }
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
  } catch (error) {
    // Short, safe message: no stack trace and never the connection string.
    const hints = {
      "28P01": "Wrong database password. Reset it in Supabase: Project Settings > Database > Reset database password, then copy a fresh connection string (Connect > Direct).",
      "28000": "The database rejected the user name. For the pooler the user must look like postgres.<project-ref>.",
      ENOTFOUND: "Host not found. Check the host in the connection string; the direct host is IPv6-only on the free plan, so try the Session pooler.",
      ETIMEDOUT: "Connection timed out. Try the Session pooler connection string.",
      ECONNREFUSED: "Connection refused. Check host and port (use 5432).",
    };
    console.error(`Could not connect to the database (${error.code ?? error.name}).`);
    console.error(hints[error.code] ?? String(error.message ?? "").split("\n")[0]);
    process.exit(1);
  }
  return {
    run: async (sql) => asResultList(await client.query(sql)),
    close: () => client.end(),
  };
}

const db = await connect();
let failed = 0;
let passed = 0;

try {
  if (local) {
    await db.run(read(join(testsDir, "support", "local-stubs.sql")));
    for (const file of sqlFiles(migrationsDir)) {
      await db.run(read(file));
      console.log(`applied ${file.split(/[\\/]/).pop()}`);
    }
  }

  const helpers = read(join(testsDir, "support", "helpers.sql"));
  const seed = read(join(root, "supabase", "seed.sql"));
  for (const file of sqlFiles(testsDir)) {
    const name = file.split(/[\\/]/).pop();
    console.log(`\n${name}`);
    const body = read(file).replaceAll("-- __SEED__", () => seed);
    const script = `begin;\n${helpers}\n${body}\nselect label from rls_test.results order by at;`;
    try {
      const results = await db.run(script);
      const last = results[results.length - 1];
      for (const row of last?.rows ?? []) {
        console.log(`  ok  ${row.label}`);
        passed++;
      }
    } catch (error) {
      failed++;
      console.error(`  ${String(error.message ?? error).split("\n")[0]}`);
    } finally {
      await db.run("rollback;").catch(() => {});
    }
  }
} finally {
  await db.close();
}

console.log(`\n${passed} assertions passed, ${failed} test file(s) failed`);
process.exit(failed > 0 ? 1 : 0);
