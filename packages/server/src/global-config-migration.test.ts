import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { migrateGlobalConfigRecords } from "./global-config-migration.js";
import { ensureRecordTables } from "./record-tables.js";
import type { StoryConfigKind } from "./record-repository.js";

let databases: DatabaseSync[] = [];

const storyContractPayload = {
  title: "Continuity Test",
  premise: "A city keeps its promises badly.",
  genre_mode: "urban fantasy",
  tone: "tense and intimate",
  setting_baseline: "Rainy districts under old bargains.",
  content_intensity: "mature",
  explicitness: "Render mature material only when earned.",
  language_register: "controlled contemporary prose"
} as const;
const removedStoryContractProsePreferencesKey = "prose" + "_preferences";
const removedStoryContractContinuityPhilosophyKey = "continuity" + "_philosophy";
const legacyStoryContractPayload = {
  ...storyContractPayload,
  [removedStoryContractProsePreferencesKey]: {
    psychic_distance: "close",
    dialogue_density: "moment_led",
    interiority: "filtered",
    paragraphing: "mixed"
  }
} as const;
const legacyStoryContractContinuityPhilosophyPayload = {
  ...storyContractPayload,
  [removedStoryContractContinuityPhilosophyKey]: "continuity_first"
} as const;

const contentPolicyPayload = {
  rating_label: "Mature",
  allowed_content_scope: "Political danger and emotional intensity.",
  tonal_handling: "Treat harm as consequential.",
  governing_policy_note: "Follow provider policy.",
  character_bias_handling: "Render character bias without endorsing it."
} as const;

const proseModePayload = {
  pov_character: "omniscient",
  person: "third",
  tense: "past",
  psychic_distance: "close",
  interiority_mode: "filtered",
  dialogue_density: "balanced",
  paragraphing: "mixed",
  language_output: "English",
  special_style_constraints: ["avoid summary"]
} as const;

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function insertOrphan(
  db: DatabaseSync,
  input: {
    id: string;
    type: StoryConfigKind;
    payload: unknown;
    updatedAt?: string;
  }
): void {
  const timestamp = input.updatedAt ?? "2026-06-07T00:00:00.000Z";
  db.prepare(
    `INSERT INTO records (
      id, type, display_label, archived, created_at, updated_at, payload_json
    ) VALUES (?, ?, ?, 0, ?, ?, ?)`
  ).run(input.id, input.type, input.type, timestamp, timestamp, JSON.stringify(input.payload));
}

function setStoryConfig(db: DatabaseSync, kind: StoryConfigKind, payload: unknown): void {
  db.prepare("INSERT INTO story_config (kind, payload_json, updated_at) VALUES (?, ?, ?)").run(
    kind,
    JSON.stringify(payload),
    "2026-06-06T00:00:00.000Z"
  );
}

function storyConfigPayload(db: DatabaseSync, kind: StoryConfigKind): unknown {
  const row = db.prepare("SELECT payload_json FROM story_config WHERE kind = ?").get(kind) as
    | { payload_json: string }
    | undefined;
  return row ? (JSON.parse(row.payload_json) as unknown) : undefined;
}

function orphanCount(db: DatabaseSync): number {
  const row = db
    .prepare(
      `SELECT count(*) AS count FROM records
       WHERE type IN ('STORY CONTRACT', 'UNIVERSAL CONTENT POLICY', 'PROSE MODE')`
    )
    .get() as { count: number };
  return row.count;
}

afterEach(() => {
  for (const db of databases) {
    if (db.isOpen) {
      db.close();
    }
  }
  databases = [];
});

describe("migrateGlobalConfigRecords", () => {
  it("moves one valid orphan per kind into story_config and deletes the source rows", () => {
    const db = database();
    insertOrphan(db, { id: "contract", type: "STORY CONTRACT", payload: storyContractPayload });
    insertOrphan(db, {
      id: "policy",
      type: "UNIVERSAL CONTENT POLICY",
      payload: contentPolicyPayload
    });
    insertOrphan(db, { id: "mode", type: "PROSE MODE", payload: proseModePayload });

    const summary = migrateGlobalConfigRecords(db);

    expect(summary.movedKinds).toEqual([
      "STORY CONTRACT",
      "UNIVERSAL CONTENT POLICY",
      "PROSE MODE"
    ]);
    expect(summary.deletedRecordIds).toEqual(["contract", "policy", "mode"]);
    expect(summary.malformedRecordIds).toEqual([]);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(storyContractPayload);
    expect(storyConfigPayload(db, "UNIVERSAL CONTENT POLICY")).toEqual(contentPolicyPayload);
    expect(storyConfigPayload(db, "PROSE MODE")).toEqual(proseModePayload);
    expect(orphanCount(db)).toBe(0);
  });

  it("collapses same-kind duplicates to the most recently updated row with id tie-break", () => {
    const db = database();
    insertOrphan(db, {
      id: "older",
      type: "STORY CONTRACT",
      payload: { ...storyContractPayload, title: "Older" },
      updatedAt: "2026-06-07T00:00:00.000Z"
    });
    insertOrphan(db, {
      id: "newer-a",
      type: "STORY CONTRACT",
      payload: { ...storyContractPayload, title: "Newer A" },
      updatedAt: "2026-06-07T01:00:00.000Z"
    });
    insertOrphan(db, {
      id: "newer-z",
      type: "STORY CONTRACT",
      payload: { ...storyContractPayload, title: "Newer Z" },
      updatedAt: "2026-06-07T01:00:00.000Z"
    });

    const summary = migrateGlobalConfigRecords(db);

    expect(storyConfigPayload(db, "STORY CONTRACT")).toMatchObject({ title: "Newer Z" });
    expect(summary.deletedRecordIds).toEqual(["newer-z", "newer-a", "older"]);
    expect(orphanCount(db)).toBe(0);
  });

  it("preserves existing story_config values and still deletes handled orphans", () => {
    const db = database();
    const existing = { ...storyContractPayload, title: "Already Configured" };
    setStoryConfig(db, "STORY CONTRACT", existing);
    insertOrphan(db, { id: "orphan", type: "STORY CONTRACT", payload: storyContractPayload });

    const summary = migrateGlobalConfigRecords(db);

    expect(summary.movedKinds).toEqual([]);
    expect(summary.preservedExistingKinds).toEqual(["STORY CONTRACT"]);
    expect(summary.deletedRecordIds).toEqual(["orphan"]);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(existing);
    expect(orphanCount(db)).toBe(0);
  });

  it("strips the removed prose defaults key from existing story_config values", () => {
    const db = database();
    setStoryConfig(db, "STORY CONTRACT", legacyStoryContractPayload);

    const first = migrateGlobalConfigRecords(db);
    const second = migrateGlobalConfigRecords(db);

    expect(first).toEqual({
      movedKinds: [],
      deletedRecordIds: [],
      preservedExistingKinds: [],
      malformedRecordIds: []
    });
    expect(second).toEqual(first);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(storyContractPayload);
  });

  it("strips the removed continuity philosophy key from existing story_config values", () => {
    const db = database();
    setStoryConfig(db, "STORY CONTRACT", legacyStoryContractContinuityPhilosophyPayload);

    const first = migrateGlobalConfigRecords(db);
    const second = migrateGlobalConfigRecords(db);

    expect(first).toEqual({
      movedKinds: [],
      deletedRecordIds: [],
      preservedExistingKinds: [],
      malformedRecordIds: []
    });
    expect(second).toEqual(first);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(storyContractPayload);
  });

  it("strips the removed prose defaults key from orphan story contracts before strict parsing", () => {
    const db = database();
    insertOrphan(db, { id: "legacy-contract", type: "STORY CONTRACT", payload: legacyStoryContractPayload });

    const summary = migrateGlobalConfigRecords(db);

    expect(summary.movedKinds).toEqual(["STORY CONTRACT"]);
    expect(summary.deletedRecordIds).toEqual(["legacy-contract"]);
    expect(summary.malformedRecordIds).toEqual([]);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(storyContractPayload);
    expect(orphanCount(db)).toBe(0);
  });

  it("strips the removed continuity philosophy key from orphan story contracts before strict parsing", () => {
    const db = database();
    insertOrphan(db, {
      id: "legacy-contract",
      type: "STORY CONTRACT",
      payload: legacyStoryContractContinuityPhilosophyPayload
    });

    const summary = migrateGlobalConfigRecords(db);

    expect(summary.movedKinds).toEqual(["STORY CONTRACT"]);
    expect(summary.deletedRecordIds).toEqual(["legacy-contract"]);
    expect(summary.malformedRecordIds).toEqual([]);
    expect(storyConfigPayload(db, "STORY CONTRACT")).toEqual(storyContractPayload);
    expect(orphanCount(db)).toBe(0);
  });

  it("retains unparseable orphan rows without writing story_config", () => {
    const db = database();
    insertOrphan(db, {
      id: "bad",
      type: "UNIVERSAL CONTENT POLICY",
      payload: { rating_label: "Mature" }
    });

    const summary = migrateGlobalConfigRecords(db);

    expect(summary).toMatchObject({
      movedKinds: [],
      deletedRecordIds: [],
      malformedRecordIds: ["bad"]
    });
    expect(storyConfigPayload(db, "UNIVERSAL CONTENT POLICY")).toBeUndefined();
    expect(orphanCount(db)).toBe(1);
  });

  it("is idempotent after the first successful run", () => {
    const db = database();
    insertOrphan(db, { id: "mode", type: "PROSE MODE", payload: proseModePayload });

    const first = migrateGlobalConfigRecords(db);
    const second = migrateGlobalConfigRecords(db);

    expect(first.movedKinds).toEqual(["PROSE MODE"]);
    expect(first.deletedRecordIds).toEqual(["mode"]);
    expect(second).toEqual({
      movedKinds: [],
      deletedRecordIds: [],
      preservedExistingKinds: [],
      malformedRecordIds: []
    });
    expect(storyConfigPayload(db, "PROSE MODE")).toEqual(proseModePayload);
    expect(orphanCount(db)).toBe(0);
  });

  it("does nothing for an empty project", () => {
    const db = database();

    expect(migrateGlobalConfigRecords(db)).toEqual({
      movedKinds: [],
      deletedRecordIds: [],
      preservedExistingKinds: [],
      malformedRecordIds: []
    });
    expect(orphanCount(db)).toBe(0);
  });
});
