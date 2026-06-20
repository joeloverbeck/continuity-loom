import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { RecordRepository } from "./record-repository.js";
import { ensureRecordTables } from "./record-tables.js";
import { repairWorkingSetReferences } from "./working-set-integrity-migration.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";

let databases: DatabaseSync[] = [];

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  ensureRecordTables(db);
  databases.push(db);
  return db;
}

function repository(): RecordRepository {
  return new RecordRepository(database());
}

function insertFact(repositoryUnderTest: RecordRepository, id: string): void {
  repositoryUnderTest.createRecord({
    type: "FACT",
    displayLabel: `Fact ${id}`,
    payload: {
      id,
      fact_kind: "current_state",
      statement: `Fact for ${id}.`,
      scope: "global",
      known_by: [],
      audience_visibility: "explicit",
      salience: "medium"
    }
  });
}

function setGenerationSession(db: DatabaseSync, session: unknown): void {
  db.prepare("INSERT INTO generation_session (id, payload_json, updated_at) VALUES (1, ?, ?)").run(
    JSON.stringify(session),
    "2026-06-07T00:00:00.000Z"
  );
}

function generationSessionPayload(db: DatabaseSync): unknown {
  const row = db.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as {
    payload_json: string;
  };
  return JSON.parse(row.payload_json) as unknown;
}

afterEach(() => {
  for (const db of databases) {
    if (db.isOpen) {
      db.close();
    }
  }
  databases = [];
});

describe("RecordRepository generation-session draft parsing", () => {
  it("round-trips a partial blank draft through setGenerationSession and getGenerationSession", () => {
    const repositoryUnderTest = repository();
    const draft = {
      immediate_handoff: {
        recent_causal_context: "",
        last_visible_moment: "",
        begin_after: ""
      },
      manual_moment_directive: {
        must_render: [],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      stop_guidance: {
        soft_unit_guidance: ""
      }
    };

    repositoryUnderTest.setGenerationSession(draft);

    expect(repositoryUnderTest.getGenerationSession()).toEqual({
      ok: true,
      payload: draft
    });
  });

  it("prunes deleted record references without throwing when the stored session is a partial draft", () => {
    const repositoryUnderTest = repository();
    insertFact(repositoryUnderTest, idA);
    repositoryUnderTest.setGenerationSession({
      active_working_set: {
        selected_records: [idA],
        selected_pov: idA,
      },
      manual_moment_directive: {
        must_render: []
      },
      stop_guidance: {
        soft_unit_guidance: ""
      }
    });

    expect(() => repositoryUnderTest.deleteRecord(idA)).not.toThrow();
    expect(repositoryUnderTest.getGenerationSession()).toMatchObject({
      ok: true,
      payload: {
        active_working_set: {
          selected_records: [],
          active_onstage_cast_full: [],
          present_minor_cast_compressed: [],
          offstage_relevant_cast: []
        },
        manual_moment_directive: {
          must_render: []
        },
        stop_guidance: {
          soft_unit_guidance: ""
        }
      }
    });
  });

  it("still reads a strict-shaped generation session", () => {
    const repositoryUnderTest = repository();
    const strictSession = {
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "At the door.",
        begin_after: "A waits."
      },
      manual_moment_directive: {
        must_render: ["A waits."]
      },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"]
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop after the first response."
      }
    };

    repositoryUnderTest.setGenerationSession(strictSession);

    expect(repositoryUnderTest.getGenerationSession()).toEqual({
      ok: true,
      payload: strictSession
    });
  });

  it("repairs working-set references when migration reads a partial draft", () => {
    const db = database();
    const repositoryUnderTest = new RecordRepository(db);
    insertFact(repositoryUnderTest, idA);
    setGenerationSession(db, {
      active_working_set: {
        selected_records: [idA, idB]
      },
      manual_moment_directive: {
        must_render: []
      }
    });

    expect(repairWorkingSetReferences(db)).toEqual({
      removedReferenceIds: [idB]
    });
    expect(generationSessionPayload(db)).toMatchObject({
      active_working_set: {
        selected_records: [idA],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      },
      manual_moment_directive: {
        must_render: []
      }
    });
  });
});
