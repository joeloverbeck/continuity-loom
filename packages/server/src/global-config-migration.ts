import {
  proseModeSchema,
  storyContractSchema,
  universalContentPolicySchema
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";
import type { ZodType } from "zod";

import type { StoryConfigKind } from "./record-repository.js";

const GLOBAL_CONFIG_KINDS = [
  "STORY CONTRACT",
  "UNIVERSAL CONTENT POLICY",
  "PROSE MODE"
] as const satisfies StoryConfigKind[];

const storyConfigSchemas: Record<StoryConfigKind, ZodType> = {
  "STORY CONTRACT": storyContractSchema,
  "UNIVERSAL CONTENT POLICY": universalContentPolicySchema,
  "PROSE MODE": proseModeSchema
};

interface OrphanGlobalConfigRow {
  id: string;
  type: StoryConfigKind;
  payload_json: string;
  updated_at: string;
}

export interface GlobalConfigMigrationSummary {
  movedKinds: StoryConfigKind[];
  deletedRecordIds: string[];
  preservedExistingKinds: StoryConfigKind[];
  malformedRecordIds: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function rowKind(value: string): StoryConfigKind {
  if (GLOBAL_CONFIG_KINDS.includes(value as StoryConfigKind)) {
    return value as StoryConfigKind;
  }

  throw new Error(`Unsupported global config kind: ${value}`);
}

function selectOrphanRows(database: DatabaseSync): OrphanGlobalConfigRow[] {
  const rows = database
    .prepare(
      `SELECT id, type, payload_json, updated_at
         FROM records
        WHERE type IN ('STORY CONTRACT', 'UNIVERSAL CONTENT POLICY', 'PROSE MODE')`
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    type: rowKind(String(row.type)),
    payload_json: String(row.payload_json),
    updated_at: String(row.updated_at)
  }));
}

function mostRecentFirst(left: OrphanGlobalConfigRow, right: OrphanGlobalConfigRow): number {
  if (left.updated_at > right.updated_at) {
    return -1;
  }

  if (left.updated_at < right.updated_at) {
    return 1;
  }

  return right.id.localeCompare(left.id);
}

function groupByKind(rows: OrphanGlobalConfigRow[]): Map<StoryConfigKind, OrphanGlobalConfigRow[]> {
  const grouped = new Map<StoryConfigKind, OrphanGlobalConfigRow[]>();

  for (const row of rows) {
    const rowsForKind = grouped.get(row.type) ?? [];
    rowsForKind.push(row);
    grouped.set(row.type, rowsForKind);
  }

  for (const rowsForKind of grouped.values()) {
    rowsForKind.sort(mostRecentFirst);
  }

  return grouped;
}

function hasStoryConfig(database: DatabaseSync, kind: StoryConfigKind): boolean {
  const row = database.prepare("SELECT 1 AS found FROM story_config WHERE kind = ?").get(kind) as
    | { found: number }
    | undefined;

  return row !== undefined;
}

const REMOVED_STORY_CONTRACT_KEYS = [
  "prose" + "_preferences",
  "continuity" + "_philosophy"
] as const;

function legacyStoryContractPayload(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripLegacyStoryContractKeys(payload: unknown): { payload: unknown; changed: boolean } {
  if (!legacyStoryContractPayload(payload)) {
    return { payload, changed: false };
  }

  const stripped = { ...payload };
  let changed = false;

  for (const key of REMOVED_STORY_CONTRACT_KEYS) {
    if (key in stripped) {
      delete stripped[key];
      changed = true;
    }
  }

  return { payload: stripped, changed };
}

function liveStoryContractRowsWithLegacyKeys(
  database: DatabaseSync
): Array<{ kind: StoryConfigKind; payloadJson: string }> {
  const rows = database
    .prepare("SELECT kind, payload_json FROM story_config WHERE kind = 'STORY CONTRACT'")
    .all() as Array<Record<string, unknown>>;
  const rewrites: Array<{ kind: StoryConfigKind; payloadJson: string }> = [];

  for (const row of rows) {
    const kind = rowKind(String(row.kind));
    const payload = JSON.parse(String(row.payload_json)) as unknown;
    const stripped = stripLegacyStoryContractKeys(payload);

    if (stripped.changed) {
      rewrites.push({ kind, payloadJson: canonicalJson(stripped.payload) });
    }
  }

  return rewrites;
}

export function migrateGlobalConfigRecords(database: DatabaseSync): GlobalConfigMigrationSummary {
  const summary: GlobalConfigMigrationSummary = {
    movedKinds: [],
    deletedRecordIds: [],
    preservedExistingKinds: [],
    malformedRecordIds: []
  };
  const groupedRows = groupByKind(selectOrphanRows(database));
  const liveStoryConfigRewrites = liveStoryContractRowsWithLegacyKeys(database);
  const handledRows: OrphanGlobalConfigRow[] = [];
  const inserts: Array<{ kind: StoryConfigKind; payloadJson: string }> = [];

  for (const kind of GLOBAL_CONFIG_KINDS) {
    const rowsForKind = groupedRows.get(kind) ?? [];
    const chosen = rowsForKind[0];

    if (!chosen) {
      continue;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(chosen.payload_json) as unknown;
      if (kind === "STORY CONTRACT") {
        payload = stripLegacyStoryContractKeys(payload).payload;
      }
      const parsedPayload = storyConfigSchemas[kind].parse(payload);
      payload = parsedPayload;
    } catch {
      summary.malformedRecordIds.push(chosen.id);
      continue;
    }

    if (hasStoryConfig(database, kind)) {
      summary.preservedExistingKinds.push(kind);
    } else {
      inserts.push({ kind, payloadJson: canonicalJson(payload) });
      summary.movedKinds.push(kind);
    }

    handledRows.push(...rowsForKind);
  }

  if (handledRows.length === 0 && liveStoryConfigRewrites.length === 0) {
    return summary;
  }

  database.exec("BEGIN IMMEDIATE");
  try {
    const timestamp = nowIso();
    const insertConfig = database.prepare(
      `INSERT INTO story_config (kind, payload_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(kind) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
    );
    const updateConfig = database.prepare("UPDATE story_config SET payload_json = ?, updated_at = ? WHERE kind = ?");
    const deleteRecord = database.prepare("DELETE FROM records WHERE id = ?");

    for (const rewrite of liveStoryConfigRewrites) {
      updateConfig.run(rewrite.payloadJson, timestamp, rewrite.kind);
    }

    for (const insert of inserts) {
      insertConfig.run(insert.kind, insert.payloadJson, timestamp);
    }

    for (const row of handledRows) {
      deleteRecord.run(row.id);
      summary.deletedRecordIds.push(row.id);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return summary;
}
