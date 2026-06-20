import {
  generationSessionDraftSchema,
  pruneWorkingSetReferences
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

import { stripLegacyGenerationSessionKeys } from "./generation-session-legacy-keys.js";

export interface WorkingSetIntegrityRepairSummary {
  removedReferenceIds: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function liveRecordIds(database: DatabaseSync): Set<string> {
  const rows = database.prepare("SELECT id FROM records").all() as Array<{ id: unknown }>;
  return new Set(rows.map((row) => String(row.id)));
}

export function repairWorkingSetReferences(database: DatabaseSync): WorkingSetIntegrityRepairSummary {
  const row = database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as
    | { payload_json: string }
    | undefined;

  if (!row) {
    return { removedReferenceIds: [] };
  }

  const liveIds = liveRecordIds(database);
  // Strip schema-removed legacy keys before the strict parse: a project authored
  // before a field removal still carries those keys, and the draft migration that
  // persists the cleaned payload runs only after this repair. Without this, an
  // otherwise-valid store fails to open. See generation-session-legacy-keys.ts.
  const session = generationSessionDraftSchema.parse(
    stripLegacyGenerationSessionKeys(JSON.parse(row.payload_json) as unknown)
  );
  const result = pruneWorkingSetReferences(session, (id) => liveIds.has(id));

  if (result.removed.length === 0) {
    return { removedReferenceIds: [] };
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(canonicalJson(result.session), nowIso());
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return { removedReferenceIds: result.removed };
}
