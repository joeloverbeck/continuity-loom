import { deriveDisplayLabel } from "@loom/core";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { backfillDisplayLabels } from "./display-label-backfill.js";
import { ensureRecordTables } from "./record-tables.js";

let databases: DatabaseSync[] = [];

const castPayload = {
  entity_id: "entity-ane",
  identity: {
    one_line: "Ane Arrieta, 18, a self-employed sex worker."
  }
};

const factPayload = {
  statement: "The west gate oath still binds the watch.",
  status: "active",
  salience: "supporting"
};

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function insertRecord(
  db: DatabaseSync,
  input: {
    id: string;
    type: string;
    displayLabel: string;
    payload: unknown;
    updatedAt?: string;
  }
): string {
  const payloadJson = JSON.stringify(input.payload);
  const timestamp = input.updatedAt ?? "2026-06-07T00:00:00.000Z";

  db.prepare(
    `INSERT INTO records (
      id, type, display_label, archived, created_at, updated_at, payload_json
    ) VALUES (?, ?, ?, 0, ?, ?, ?)`
  ).run(input.id, input.type, input.displayLabel, timestamp, timestamp, payloadJson);

  return payloadJson;
}

function recordRow(db: DatabaseSync, id: string): {
  displayLabel: string;
  payloadJson: string;
  updatedAt: string;
} {
  const row = db
    .prepare("SELECT display_label, payload_json, updated_at FROM records WHERE id = ?")
    .get(id) as { display_label: string; payload_json: string; updated_at: string } | undefined;

  if (!row) {
    throw new Error(`Missing record ${id}.`);
  }

  return {
    displayLabel: row.display_label,
    payloadJson: row.payload_json,
    updatedAt: row.updated_at
  };
}

afterEach(() => {
  for (const db of databases) {
    if (db.isOpen) {
      db.close();
    }
  }
  databases = [];
});

describe("backfillDisplayLabels", () => {
  it("repairs stale display labels without mutating record payloads", () => {
    const db = database();
    const castPayloadJson = insertRecord(db, {
      id: "cast-ane",
      type: "CAST MEMBER",
      displayLabel: "Cast Member",
      payload: castPayload
    });
    const factPayloadJson = insertRecord(db, {
      id: "fact-west-gate",
      type: "FACT",
      displayLabel: "Fact",
      payload: factPayload
    });

    const summary = backfillDisplayLabels(db);

    expect(summary.updatedIds).toEqual(["cast-ane", "fact-west-gate"]);
    expect(recordRow(db, "cast-ane")).toMatchObject({
      displayLabel: deriveDisplayLabel("CAST MEMBER", castPayload),
      payloadJson: castPayloadJson
    });
    expect(recordRow(db, "fact-west-gate")).toMatchObject({
      displayLabel: deriveDisplayLabel("FACT", factPayload),
      payloadJson: factPayloadJson
    });
  });

  it("is idempotent and does not write records whose labels are already derived", () => {
    const db = database();
    insertRecord(db, {
      id: "cast-ane",
      type: "CAST MEMBER",
      displayLabel: deriveDisplayLabel("CAST MEMBER", castPayload),
      payload: castPayload,
      updatedAt: "2026-06-07T01:00:00.000Z"
    });

    const before = recordRow(db, "cast-ane");
    const summary = backfillDisplayLabels(db);

    expect(summary.updatedIds).toEqual([]);
    expect(recordRow(db, "cast-ane")).toEqual(before);
  });

  it("reports zero updates on a second pass", () => {
    const db = database();
    insertRecord(db, {
      id: "cast-ane",
      type: "CAST MEMBER",
      displayLabel: "Cast Member",
      payload: castPayload
    });

    const first = backfillDisplayLabels(db);
    const afterFirst = recordRow(db, "cast-ane");
    const second = backfillDisplayLabels(db);

    expect(first.updatedIds).toEqual(["cast-ane"]);
    expect(second.updatedIds).toEqual([]);
    expect(recordRow(db, "cast-ane")).toEqual(afterFirst);
  });
});
