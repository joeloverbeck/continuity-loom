import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { migrateGenerationSessionDraft } from "./generation-session-draft-migration.js";
import { ensureRecordTables } from "./record-tables.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const removedManualDirectiveIdKey = "manual" + "_directive_id";

let databases: DatabaseSync[] = [];

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function setGenerationSession(db: DatabaseSync, session: unknown, updatedAt = "2026-06-07T00:00:00.000Z"): void {
  db.prepare(
    `INSERT INTO generation_session (id, payload_json, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
  ).run(JSON.stringify(session), updatedAt);
}

function addAcceptedSegment(db: DatabaseSync): void {
  db.prepare(
    `INSERT INTO accepted_segments (sequence, text, metadata_json, created_at)
     VALUES (1, 'Accepted prose text must not be read by the migration.', '{}', ?)`
  ).run("2026-06-07T00:00:00.000Z");
}

function generationSessionRow(db: DatabaseSync): { payload: Record<string, unknown>; updatedAt: string } {
  const row = db.prepare("SELECT payload_json, updated_at FROM generation_session WHERE id = 1").get() as {
    payload_json: string;
    updated_at: string;
  };
  return {
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
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

describe("migrateGenerationSessionDraft", () => {
  it("removes only the exact sole fabricated directive and defaults first-segment context", () => {
    const db = database();
    setGenerationSession(db, {
      manual_moment_directive: {
        must_render: ["Continue the immediate moment."]
      }
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toEqual({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      }
    });
  });

  it("preserves non-fabricated directive content including the phrase among other entries", () => {
    const db = database();
    setGenerationSession(db, {
      manual_moment_directive: {
        must_render: ["Continue the immediate moment.", "Open the sealed door."]
      }
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toMatchObject({
      manual_moment_directive: {
        must_render: ["Continue the immediate moment.", "Open the sealed door."]
      }
    });
  });

  it("strips legacy active-working-set manual directive id while preserving inline directive prose", () => {
    const db = database();
    setGenerationSession(db, {
      active_working_set: {
        selected_records: [idA],
        [removedManualDirectiveIdKey]: idB
      },
      manual_moment_directive: {
        must_render: ["Open the sealed door."],
        may_render_if_naturally_caused: ["Let the hinge complain."],
        do_not_force: ["Do not explain what waits behind it."]
      }
    });

    migrateGenerationSessionDraft(db);
    const afterFirst = generationSessionRow(db);
    migrateGenerationSessionDraft(db);
    const afterSecond = generationSessionRow(db);

    expect(afterFirst.payload).toMatchObject({
      active_working_set: {
        selected_records: [idA]
      },
      manual_moment_directive: {
        must_render: ["Open the sealed door."],
        may_render_if_naturally_caused: ["Let the hinge complain."],
        do_not_force: ["Do not explain what waits behind it."]
      }
    });
    expect(afterFirst.payload.active_working_set).not.toHaveProperty(removedManualDirectiveIdKey);
    expect(afterSecond).toEqual(afterFirst);
  });

  it("backfills continuation context from accepted-segment count and preserves explicit context", () => {
    const db = database();
    addAcceptedSegment(db);
    setGenerationSession(db, {
      stop_guidance: {
        soft_unit_guidance: "Stop after the first answer."
      }
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toMatchObject({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["continuation_after_accepted_segment"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop after the first answer."
      }
    });

    setGenerationSession(db, {
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      }
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toMatchObject({
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      }
    });
  });

  it("backfills missing immediate situation summary without reading accepted prose", () => {
    const db = database();
    addAcceptedSegment(db);
    setGenerationSession(db, {
      current_authoritative_state: {
        current_time: "late morning",
        current_location: "bakery cellar",
        onstage_entities: [idA]
      }
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toMatchObject({
      current_authoritative_state: {
        current_time: "late morning",
        current_location: "bakery cellar",
        onstage_entities: [idA],
        immediate_situation_summary: "None currently specified"
      }
    });
    expect(JSON.stringify(generationSessionRow(db).payload)).not.toContain(
      "Accepted prose text must not be read by the migration."
    );
  });

  it("removes empty current-cast-pressure rows and preserves semantic rows", () => {
    const db = database();
    setGenerationSession(db, {
      current_cast_voice_pressure: [
        {
          cast_member_id: idA,
          local_function: "active_speaker",
          current_voice_pressure: "",
          current_must_preserve: []
        },
        {
          cast_member_id: idB,
          local_function: "active_speaker",
          current_voice_pressure: "Keep answers clipped.",
          current_must_preserve: []
        }
      ]
    });

    migrateGenerationSessionDraft(db);

    expect(generationSessionRow(db).payload).toMatchObject({
      current_cast_voice_pressure: [
        {
          cast_member_id: idB,
          local_function: "active_speaker",
          current_voice_pressure: "Keep answers clipped.",
          current_must_preserve: []
        }
      ]
    });
  });

  it("is idempotent after the first migration", () => {
    const db = database();
    setGenerationSession(
      db,
      {
        manual_moment_directive: {
          must_render: ["Continue the immediate moment."]
        }
      },
      "2026-06-07T01:00:00.000Z"
    );

    migrateGenerationSessionDraft(db);
    const afterFirst = generationSessionRow(db);
    migrateGenerationSessionDraft(db);
    const afterSecond = generationSessionRow(db);

    expect(afterSecond).toEqual(afterFirst);
  });

  it("does nothing when no generation session row exists", () => {
    const db = database();

    expect(() => migrateGenerationSessionDraft(db)).not.toThrow();
  });
});
