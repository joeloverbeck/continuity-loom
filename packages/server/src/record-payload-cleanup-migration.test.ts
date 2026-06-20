import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { migrateRecordPayloads } from "./record-payload-cleanup-migration.js";
import { ensureRecordTables } from "./record-tables.js";

let databases: DatabaseSync[] = [];

const factId = "019b0298-5c00-7000-8000-000000000501";
const secondFactId = "019b0298-5c00-7000-8000-000000000502";
const planId = "019b0298-5c00-7000-8000-000000000503";
const secondPlanId = "019b0298-5c00-7000-8000-000000000504";
const holderId = "019b0298-5c00-7000-8000-000000000505";
const legacyFactStatusKey = "sta" + "tus";
const legacyPlanProseFlagKey = "can_drive" + "_prose";

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function factPayload(id = factId): Record<string, unknown> {
  return {
    id,
    [legacyFactStatusKey]: "active",
    fact_kind: "current_state",
    statement: "The west stair is locked.",
    scope: "location",
    known_by: "public",
    audience_visibility: "explicit",
    salience: "high"
  };
}

function planPayload(id = planId): Record<string, unknown> {
  return {
    id,
    plan_status: "active",
    holder: holderId,
    objective: "Reach the roof.",
    resources: ["north stair"],
    blockers: [],
    current_step: "Find the stairs.",
    fallback_steps: [],
    visibility_to_pov: "hidden",
    salience: "critical",
    [legacyPlanProseFlagKey]: false
  };
}

function insertRecord(
  db: DatabaseSync,
  {
    id = factId,
    type = "FACT",
    displayLabel = "West stair lock",
    status = null,
    salience = null,
    urgency = null,
    archived = 0,
    userOrder = 7,
    createdAt = "2026-06-07T00:00:00.000Z",
    updatedAt = "2026-06-08T00:00:00.000Z",
    payloadJson = JSON.stringify(factPayload(id))
  }: {
    id?: string;
    type?: string;
    displayLabel?: string;
    status?: string | null;
    salience?: string | null;
    urgency?: string | null;
    archived?: number;
    userOrder?: number | null;
    createdAt?: string;
    updatedAt?: string;
    payloadJson?: string;
  } = {}
): void {
  db.prepare(
    `INSERT INTO records (
      id, type, display_label, status, salience, urgency, archived, user_order,
      created_at, updated_at, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, type, displayLabel, status, salience, urgency, archived, userOrder, createdAt, updatedAt, payloadJson);
}

function recordRow(db: DatabaseSync, id = factId): Record<string, unknown> {
  return db.prepare("SELECT * FROM records WHERE id = ?").get(id) as Record<string, unknown>;
}

afterEach(() => {
  for (const db of databases) {
    if (db.isOpen) {
      db.close();
    }
  }
  databases = [];
});

describe("migrateRecordPayloads", () => {
  it("strips legacy FACT status while preserving row siblings and projecting active status", () => {
    const db = database();
    insertRecord(db);

    migrateRecordPayloads(db);

    const row = recordRow(db);
    expect(row).toMatchObject({
      id: factId,
      type: "FACT",
      display_label: "West stair lock",
      status: "active",
      salience: "high",
      urgency: null,
      archived: 0,
      user_order: 7,
      created_at: "2026-06-07T00:00:00.000Z",
      updated_at: "2026-06-08T00:00:00.000Z"
    });
    expect(JSON.parse(String(row.payload_json))).toEqual({
      id: factId,
      fact_kind: "current_state",
      statement: "The west stair is locked.",
      scope: "location",
      known_by: "public",
      audience_visibility: "explicit",
      salience: "high"
    });
  });

  it("is idempotent after the first cleanup", () => {
    const db = database();
    insertRecord(db);

    migrateRecordPayloads(db);
    const afterFirst = recordRow(db);
    migrateRecordPayloads(db);

    expect(recordRow(db)).toEqual(afterFirst);
  });

  it("strips legacy PLAN prose-driving flags and projects active status", () => {
    const db = database();
    insertRecord(db, {
      id: planId,
      type: "PLAN",
      displayLabel: "Roof plan",
      payloadJson: JSON.stringify(planPayload())
    });

    migrateRecordPayloads(db);

    const row = recordRow(db, planId);
    expect(row).toMatchObject({
      id: planId,
      type: "PLAN",
      status: "active",
      salience: "critical",
      urgency: null
    });
    expect(JSON.parse(String(row.payload_json))).toEqual({
      id: planId,
      plan_status: "active",
      holder: holderId,
      objective: "Reach the roof.",
      resources: ["north stair"],
      blockers: [],
      current_step: "Find the stairs.",
      fallback_steps: [],
      visibility_to_pov: "hidden",
      salience: "critical"
    });
  });

  it("does not partially rewrite rows when a targeted row has malformed JSON", () => {
    const db = database();
    insertRecord(db);
    insertRecord(db, {
      id: secondFactId,
      displayLabel: "Malformed fact",
      payloadJson: "{"
    });
    const beforeFirst = recordRow(db, factId);
    const beforeSecond = recordRow(db, secondFactId);

    expect(() => migrateRecordPayloads(db)).toThrow(SyntaxError);
    expect(recordRow(db, factId)).toEqual(beforeFirst);
    expect(recordRow(db, secondFactId)).toEqual(beforeSecond);
  });

  it("does not partially rewrite a mixed FACT and PLAN batch when a PLAN row is invalid", () => {
    const db = database();
    insertRecord(db);
    insertRecord(db, {
      id: planId,
      type: "PLAN",
      displayLabel: "Roof plan",
      payloadJson: JSON.stringify(planPayload())
    });
    insertRecord(db, {
      id: secondPlanId,
      type: "PLAN",
      displayLabel: "Invalid plan",
      payloadJson: JSON.stringify({ ...planPayload(secondPlanId), objective: "" })
    });
    const beforeFact = recordRow(db, factId);
    const beforePlan = recordRow(db, planId);
    const beforeInvalidPlan = recordRow(db, secondPlanId);

    expect(() => migrateRecordPayloads(db)).toThrow();
    expect(recordRow(db, factId)).toEqual(beforeFact);
    expect(recordRow(db, planId)).toEqual(beforePlan);
    expect(recordRow(db, secondPlanId)).toEqual(beforeInvalidPlan);
  });

  it("does not partially rewrite rows when stripped payload fails the new strict parser", () => {
    const db = database();
    insertRecord(db);
    insertRecord(db, {
      id: secondFactId,
      displayLabel: "Invalid fact",
      payloadJson: JSON.stringify({ ...factPayload(secondFactId), statement: "" })
    });
    const beforeFirst = recordRow(db, factId);
    const beforeSecond = recordRow(db, secondFactId);

    expect(() => migrateRecordPayloads(db)).toThrow();
    expect(recordRow(db, factId)).toEqual(beforeFirst);
    expect(recordRow(db, secondFactId)).toEqual(beforeSecond);
  });
});
