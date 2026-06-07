import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { ensureRecordTables } from "./record-tables.js";
import { repairWorkingSetReferences } from "./working-set-integrity-migration.js";

const liveA = "019b0298-5c00-7000-8000-000000000001";
const liveB = "019b0298-5c00-7000-8000-000000000002";
const danglingA = "019b0298-5c00-7000-8000-000000000003";
const danglingB = "019b0298-5c00-7000-8000-000000000004";

let databases: DatabaseSync[] = [];

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function insertRecord(db: DatabaseSync, id: string): void {
  db.prepare(
    `INSERT INTO records (
      id, type, display_label, archived, created_at, updated_at, payload_json
    ) VALUES (?, 'FACT', ?, 0, ?, ?, ?)`
  ).run(
    id,
    `Record ${id}`,
    "2026-06-07T00:00:00.000Z",
    "2026-06-07T00:00:00.000Z",
    JSON.stringify({
      statement: `Fact for ${id}`,
      status: "active",
      salience: "supporting"
    })
  );
}

function setGenerationSession(db: DatabaseSync, session: unknown, updatedAt = "2026-06-07T00:00:00.000Z"): void {
  db.prepare("INSERT INTO generation_session (id, payload_json, updated_at) VALUES (1, ?, ?)").run(
    JSON.stringify(session),
    updatedAt
  );
}

function generationSessionRow(db: DatabaseSync): { payload: unknown; updatedAt: string } | null {
  const row = db.prepare("SELECT payload_json, updated_at FROM generation_session WHERE id = 1").get() as
    | { payload_json: string; updated_at: string }
    | undefined;

  return row ? { payload: JSON.parse(row.payload_json) as unknown, updatedAt: row.updated_at } : null;
}

afterEach(() => {
  for (const db of databases) {
    if (db.isOpen) {
      db.close();
    }
  }
  databases = [];
});

describe("repairWorkingSetReferences", () => {
  it("repairs a seeded dangling working-set reference", () => {
    const db = database();
    insertRecord(db, liveA);
    setGenerationSession(db, {
      active_working_set: {
        selected_records: [liveA, danglingA],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      }
    });

    const summary = repairWorkingSetReferences(db);

    expect(summary.removedReferenceIds).toEqual([danglingA]);
    expect(generationSessionRow(db)?.payload).toMatchObject({
      active_working_set: {
        selected_records: [liveA],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      }
    });
  });

  it("does not write a clean session", () => {
    const db = database();
    insertRecord(db, liveA);
    const session = {
      active_working_set: {
        selected_records: [liveA],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      }
    };
    setGenerationSession(db, session, "2026-06-07T01:00:00.000Z");

    const summary = repairWorkingSetReferences(db);

    expect(summary.removedReferenceIds).toEqual([]);
    expect(generationSessionRow(db)).toEqual({
      payload: session,
      updatedAt: "2026-06-07T01:00:00.000Z"
    });
  });

  it("is idempotent after a repair", () => {
    const db = database();
    insertRecord(db, liveA);
    insertRecord(db, liveB);
    setGenerationSession(db, {
      active_working_set: {
        selected_records: [liveA, danglingA],
        active_onstage_cast_full: [{ cast_member_id: danglingB, local_function: "active_speaker" }],
        present_minor_cast_compressed: [liveB],
        offstage_relevant_cast: []
      }
    });

    const first = repairWorkingSetReferences(db);
    const afterFirst = generationSessionRow(db);
    const second = repairWorkingSetReferences(db);

    expect(first.removedReferenceIds).toEqual([danglingA, danglingB]);
    expect(second.removedReferenceIds).toEqual([]);
    expect(generationSessionRow(db)).toEqual(afterFirst);
  });

  it("does nothing without a generation_session row", () => {
    const db = database();
    insertRecord(db, liveA);

    expect(repairWorkingSetReferences(db)).toEqual({ removedReferenceIds: [] });
    expect(generationSessionRow(db)).toBeNull();
  });
});
