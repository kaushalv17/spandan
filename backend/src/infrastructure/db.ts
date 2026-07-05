import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => logger.error({ err }, "unexpected pg pool error"));

export type SqlParam = string | number | boolean | null | Date | object;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: readonly SqlParam[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as unknown[]);
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function healthcheck(): Promise<boolean> {
  const res = await pool.query<{ ok: number }>("SELECT 1 AS ok");
  return res.rows[0]?.ok === 1;
}
