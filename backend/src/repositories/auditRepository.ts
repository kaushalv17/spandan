import type { PoolClient } from "pg";
import { query, type SqlParam } from "../infrastructure/db.js";
import type { UUID } from "../domain/user.js";

export interface AuditEntry {
  actorId?: UUID | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// Writes an audit row. Pass a transaction client to keep it atomic with a
// larger unit of work; otherwise it runs on the shared pool.
export async function writeAudit(
  entry: AuditEntry,
  client?: PoolClient,
): Promise<void> {
  const sql = `INSERT INTO audit_log
                 (actor_id, action, entity_type, entity_id, metadata)
               VALUES ($1, $2, $3, $4, $5)`;
  const params: SqlParam[] = [
    entry.actorId ?? null,
    entry.action,
    entry.entityType,
    entry.entityId ?? null,
    entry.metadata ? JSON.stringify(entry.metadata) : null,
  ];
  if (client) {
    await client.query(sql, params);
  } else {
    await query(sql, params);
  }
}
