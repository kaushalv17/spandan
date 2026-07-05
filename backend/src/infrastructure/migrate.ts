import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { logger } from "./logger.js";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../migrations",
);

async function ensureTable(): Promise<void> {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );
}

async function appliedSet(): Promise<Set<string>> {
  const res = await pool.query<{ name: string }>(
    "SELECT name FROM schema_migrations",
  );
  return new Set(res.rows.map((r) => r.name));
}

export async function migrate(): Promise<void> {
  await ensureTable();
  const applied = await appliedSet();
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      logger.info(`applied migration ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      logger.error({ err, file }, "migration failed");
      throw err;
    } finally {
      client.release();
    }
  }
  logger.info("migrations up to date");
}

// Allow running directly: `npm run migrate`
if (/migrate\.(ts|js)$/.test(process.argv[1] ?? "")) {
  migrate()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, "migration run failed");
      process.exit(1);
    });
}
