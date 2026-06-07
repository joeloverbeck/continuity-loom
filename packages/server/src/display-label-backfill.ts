import { deriveDisplayLabel } from "@loom/core";
import type { DatabaseSync } from "node:sqlite";

export interface DisplayLabelBackfillSummary {
  updatedIds: string[];
}

interface RecordRow {
  id: unknown;
  type: unknown;
  display_label: unknown;
  payload_json: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function backfillDisplayLabels(database: DatabaseSync): DisplayLabelBackfillSummary {
  const rows = database
    .prepare("SELECT id, type, display_label, payload_json FROM records")
    .all() as unknown as RecordRow[];
  const updates = rows.flatMap((row) => {
    const id = String(row.id);
    const type = String(row.type);
    const displayLabel = String(row.display_label);
    const derivedLabel = deriveDisplayLabel(type, JSON.parse(row.payload_json) as unknown);

    return derivedLabel === displayLabel ? [] : [{ id, displayLabel: derivedLabel }];
  });

  if (updates.length === 0) {
    return { updatedIds: [] };
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    const updatedAt = nowIso();
    const update = database.prepare("UPDATE records SET display_label = ?, updated_at = ? WHERE id = ?");

    for (const row of updates) {
      update.run(row.displayLabel, updatedAt, row.id);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return { updatedIds: updates.map((row) => row.id) };
}
