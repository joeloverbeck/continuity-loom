import {
  parseRecordPayload,
  projectRecordSalience,
  projectRecordStatus,
  projectRecordUrgency
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

const removedPlanProseFlagKey = "can_drive" + "_prose";

const cleanupRules: ReadonlyArray<{ recordType: string; removedKeys: readonly string[] }> = [
  { recordType: "FACT", removedKeys: ["status"] },
  { recordType: "PLAN", removedKeys: [removedPlanProseFlagKey] }
];

interface RecordPayloadRow {
  id: string;
  type: string;
  payload_json: string;
}

interface RecordPayloadRewrite {
  id: string;
  payloadJson: string;
  status: string | null;
  salience: string | null;
  urgency: string | null;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function normalizeProjection(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function selectRows(database: DatabaseSync): RecordPayloadRow[] {
  const recordTypes = cleanupRules.map((rule) => `'${rule.recordType.replaceAll("'", "''")}'`).join(", ");
  const rows = database
    .prepare(`SELECT id, type, payload_json FROM records WHERE type IN (${recordTypes}) ORDER BY id`)
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    type: String(row.type),
    payload_json: String(row.payload_json)
  }));
}

function stripRemovedKeys(
  payload: unknown,
  removedKeys: readonly string[]
): { payload: unknown; changed: boolean } {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { payload, changed: false };
  }

  const stripped = { ...(payload as Record<string, unknown>) };
  let changed = false;

  for (const key of removedKeys) {
    if (key in stripped) {
      delete stripped[key];
      changed = true;
    }
  }

  return { payload: stripped, changed };
}

function rewriteFor(row: RecordPayloadRow): RecordPayloadRewrite | null {
  const rule = cleanupRules.find((candidate) => candidate.recordType === row.type);
  if (!rule) {
    return null;
  }

  const payload = JSON.parse(row.payload_json) as unknown;
  const stripped = stripRemovedKeys(payload, rule.removedKeys);
  if (!stripped.changed) {
    return null;
  }

  const parsedPayload = parseRecordPayload(row.type, stripped.payload);

  return {
    id: row.id,
    payloadJson: canonicalJson(parsedPayload),
    status: projectRecordStatus(row.type, parsedPayload),
    salience: normalizeProjection(projectRecordSalience(row.type, parsedPayload)),
    urgency: normalizeProjection(projectRecordUrgency(row.type, parsedPayload))
  };
}

export function migrateRecordPayloads(database: DatabaseSync): void {
  const rewrites = selectRows(database).flatMap((row) => {
    const rewrite = rewriteFor(row);
    return rewrite ? [rewrite] : [];
  });

  if (rewrites.length === 0) {
    return;
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    const updateRecord = database.prepare(
      `UPDATE records
          SET status = ?, salience = ?, urgency = ?, payload_json = ?
        WHERE id = ?`
    );

    for (const rewrite of rewrites) {
      updateRecord.run(rewrite.status, rewrite.salience, rewrite.urgency, rewrite.payloadJson, rewrite.id);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
