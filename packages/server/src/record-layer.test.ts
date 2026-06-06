import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";

import { createProjectStoreManager, type ProjectStoreManager } from "./project-store.js";
import { ensureRecordTables } from "./record-tables.js";
import { RecordIntegrityError } from "./record-repository.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const idC = "019b0298-5c00-7000-8000-000000000003";
const idD = "019b0298-5c00-7000-8000-000000000004";
const managers: ProjectStoreManager[] = [];

interface TableCounts {
  accepted_segments: number;
  generation_session: number;
  record_references: number;
  records: number;
  story_config: number;
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-record-layer-"));
}

function manager(): ProjectStoreManager {
  const storeManager = createProjectStoreManager();
  managers.push(storeManager);
  return storeManager;
}

function tableNames(databasePath: string): string[] {
  const database = new DatabaseSync(databasePath);
  try {
    return (
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
  } finally {
    database.close();
  }
}

function recordsColumnTypes(databasePath: string): Record<string, string> {
  const database = new DatabaseSync(databasePath);
  try {
    const rows = database.prepare("PRAGMA table_info(records)").all() as Array<{ name: string; type: string }>;
    return Object.fromEntries(rows.map((row) => [row.name, row.type]));
  } finally {
    database.close();
  }
}

afterEach(async () => {
  await Promise.all(managers.splice(0).map((storeManager) => storeManager.closeProject()));
});

describe("SPEC-003 record tables and repository", () => {
  it("ensures record tables on create and open without changing PRAGMAs", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "tables",
      title: "Tables"
    });
    const databasePath = join(status.folderPath, "loom.sqlite");

    expect(tableNames(databasePath)).toEqual(
      expect.arrayContaining([
        "accepted_segments",
        "generation_session",
        "record_references",
        "records",
        "story_config"
      ])
    );
    expect(recordsColumnTypes(databasePath)).toMatchObject({ salience: "TEXT", urgency: "TEXT" });

    await storeManager.closeProject();
    const database = new DatabaseSync(databasePath);
    try {
      database.exec(`
        DROP TABLE accepted_segments;
        DROP TABLE generation_session;
        DROP TABLE story_config;
        DROP TABLE record_references;
        DROP TABLE records;
      `);
      expect(database.prepare("PRAGMA user_version").get()).toEqual({ user_version: 1 });
    } finally {
      database.close();
    }

    const opened = await storeManager.openProject(status.folderPath);
    expect(opened).toMatchObject({ ok: true });
    expect(tableNames(databasePath)).toEqual(
      expect.arrayContaining(["accepted_segments", "generation_session", "record_references", "records", "story_config"])
    );
  });

  it("round-trips records, refreshes projections, and blocks dangling references", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "records",
      title: "Records"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    const entity = repository.createRecord({
      type: "ENTITY",
      displayLabel: "A",
      payload: {
        id: idA,
        display_name: "A",
        entity_kind: "person",
        roles_in_story: ["primary_actor"],
        short_description: "A person"
      }
    });
    expect(entity.id).toBe(idA);

    const secret = repository.createRecord({
      type: "SECRET",
      displayLabel: "Secret",
      payload: {
        id: idC,
        status: "hidden",
        secret_kind: "identity",
        secret_claim: "A knows the door code.",
        holders: [idA],
        non_holders_to_protect: [idB],
        audience_visibility: "hidden",
        pov_access: "hidden",
        salience: "critical",
        reveal_permission: "locked",
        allowed_surface_cues: [],
        forbidden_reveals: ["the code"],
        reveal_triggers: [],
        clue_carriers: []
      }
    });

    expect(secret.status).toBe("hidden");
    expect(repository.referencesForRecord(secret.id)).toEqual(
      expect.arrayContaining([
        { refRole: "secret_holder", targetId: idA },
        { refRole: "non_holder_to_protect", targetId: idB }
      ])
    );
    expect(repository.referencesForRecord(secret.id)).toHaveLength(2);
    expect(repository.getRecord(secret.id)).toMatchObject({ ok: true });
    expect(() => repository.deleteRecord(idA)).toThrow(RecordIntegrityError);

    const belief = repository.createRecord({
      type: "BELIEF",
      displayLabel: "Belief",
      payload: {
        id: idB,
        status: "active",
        holder: idB,
        claim: "B believes the door code still works.",
        belief_mode: "believes",
        truth_relation: "unknown",
        confidence: "medium",
        visibility: "private",
        access_route: "inference",
        behavioral_effect: "B keeps testing old locks.",
        salience: "high"
      }
    });

    expect(belief.salience).toBe("high");
    expect(secret.salience).toBe("critical");
    const obligation = repository.createRecord({
      type: "OBLIGATION",
      displayLabel: "Obligation",
      payload: {
        id: idD,
        status: "open",
        obligation_kind: "promise",
        owed_by: [idD],
        owed_to: [idB],
        urgency: "high",
        terms: "A must keep the signal lit.",
        consequence_if_broken: "B loses the route.",
        visibility: "shared"
      }
    });
    expect(obligation.urgency).toBe("high");
    const database = new DatabaseSync(join(status.folderPath, "loom.sqlite"));
    try {
      expect(
        database.prepare("SELECT salience FROM records WHERE id = ?").get(belief.id)
      ).toEqual({ salience: "high" });
      expect(
        database.prepare("SELECT salience FROM records WHERE id = ?").get(secret.id)
      ).toEqual({ salience: "critical" });
      expect(
        database.prepare("SELECT urgency FROM records WHERE id = ?").get(obligation.id)
      ).toEqual({ urgency: "high" });
    } finally {
      database.close();
    }

    repository.updateRecord({
      id: secret.id,
      payload: {
        id: idC,
        status: "revealed",
        secret_kind: "identity",
        secret_claim: "A knows the door code.",
        holders: [idC],
        non_holders_to_protect: [],
        audience_visibility: "explicit",
        pov_access: "knows",
        salience: "critical",
        reveal_permission: "natural_reveal_allowed",
        allowed_surface_cues: [],
        forbidden_reveals: [],
        reveal_triggers: [],
        clue_carriers: []
      }
    });
    expect(repository.referencesForRecord(secret.id)).toEqual([{ refRole: "secret_holder", targetId: idC }]);
    expect(() => repository.deleteRecord(idA)).not.toThrow();
  });

  it("rejects malformed writes and surfaces malformed reads", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "malformed",
      title: "Malformed"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    expect(() =>
      repository.createRecord({
        type: "FACT",
        displayLabel: "Bad",
        payload: {
          status: "inactive",
          id: idA,
          fact_kind: "current_state",
          statement: "Bad status",
          scope: "entity",
          known_by: [],
          audience_visibility: "explicit",
          salience: "medium"
        }
      })
    ).toThrow();

    const good = repository.createRecord({
      type: "FACT",
      displayLabel: "Good",
      payload: {
        id: idA,
        status: "active",
        fact_kind: "current_state",
        statement: "Good status",
        scope: "entity",
        known_by: [],
        audience_visibility: "explicit",
        salience: "medium"
      }
    });
    const database = new DatabaseSync(join(status.folderPath, "loom.sqlite"));
    try {
      database.prepare("UPDATE records SET payload_json = ? WHERE id = ?").run("{", good.id);
    } finally {
      database.close();
    }

    expect(repository.getRecord(good.id)).toMatchObject({ ok: false, kind: "malformed-record" });
  });

  it("rejects update payload ids that diverge from the row id", async () => {
    const storeManager = manager();
    await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "update-id-mismatch",
      title: "Update Id Mismatch"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    repository.createRecord({
      type: "FACT",
      displayLabel: "Original",
      payload: {
        id: idA,
        status: "active",
        fact_kind: "current_state",
        statement: "Original statement",
        scope: "entity",
        known_by: [],
        audience_visibility: "explicit",
        salience: "medium"
      }
    });

    expect(() =>
      repository.updateRecord({
        id: idA,
        payload: {
          id: idB,
          status: "active",
          fact_kind: "current_state",
          statement: "Changed statement",
          scope: "entity",
          known_by: [],
          audience_visibility: "explicit",
          salience: "high"
        }
      })
    ).toThrow(RecordIntegrityError);

    const stored = repository.getRecord(idA);
    expect(stored).toMatchObject({
      ok: true,
      record: {
        id: idA,
        displayLabel: "Original",
        salience: "medium",
        payload: { id: idA, statement: "Original statement" }
      }
    });
  });

  it("updates id-less record payloads without a payload id guard", async () => {
    const storeManager = manager();
    await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "update-idless",
      title: "Update Idless"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    const castMember = repository.createRecord({
      type: "CAST MEMBER",
      displayLabel: "A",
      payload: {
        entity_id: idA,
        identity: {
          one_line: "A careful operator.",
          public_face: "Composed",
          private_pressure: "Fearful"
        },
        voice_anchor: {
          core_voice: "formal",
          rhythm_and_syntax: "measured",
          register_and_diction: "precise",
          vocabulary_and_metaphor_pools: "weather",
          profanity_and_intensity: "low",
          taboo_and_avoidance_patterns: "home",
          dialogue_tactics_and_speech_functions: "deflects",
          address_terms_and_naming: "titles",
          silence_interruption_and_turntaking: "strategic",
          under_pressure_voice: "clipped",
          suppression_or_evasion_rule: "redirects",
          must_preserve: ["precision"],
          must_avoid: ["rambling"],
          anti_repetition_warnings: ["do not repeat weather metaphors"]
        },
        pressure_behavior_core: {
          cornered: "narrows choices",
          tempted_or_offered_power: "bargains",
          protecting_attachment: "deflects"
        },
        body_presence_core: {
          physicality: "still",
          habitual_gestures_or_presence: "folded hands",
          social_presentation: "controlled"
        },
        agency_core: { default_strategy: "delay", risk_style: "calculated" }
      }
    });

    const updated = repository.updateRecord({
      id: castMember.id,
      displayLabel: "A updated",
      payload: {
        entity_id: idA,
        identity: {
          one_line: "A decisive operator.",
          public_face: "Composed",
          private_pressure: "Fearful"
        },
        voice_anchor: {
          core_voice: "formal",
          rhythm_and_syntax: "measured",
          register_and_diction: "precise",
          vocabulary_and_metaphor_pools: "weather",
          profanity_and_intensity: "low",
          taboo_and_avoidance_patterns: "home",
          dialogue_tactics_and_speech_functions: "deflects",
          address_terms_and_naming: "titles",
          silence_interruption_and_turntaking: "strategic",
          under_pressure_voice: "clipped",
          suppression_or_evasion_rule: "redirects",
          must_preserve: ["precision"],
          must_avoid: ["rambling"],
          anti_repetition_warnings: ["do not repeat weather metaphors"]
        },
        pressure_behavior_core: {
          cornered: "narrows choices",
          tempted_or_offered_power: "bargains",
          protecting_attachment: "deflects"
        },
        body_presence_core: {
          physicality: "still",
          habitual_gestures_or_presence: "folded hands",
          social_presentation: "controlled"
        },
        agency_core: { default_strategy: "delay", risk_style: "calculated" }
      }
    });

    expect(updated).toMatchObject({
      id: castMember.id,
      displayLabel: "A updated",
      payload: { entity_id: idA, identity: { one_line: "A decisive operator." } }
    });
  });

  it("round-trips story config, generation session, accepted segments, and keeps accepted prose out of records", async () => {
    const storeManager = manager();
    await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "accessors",
      title: "Accessors"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    repository.setStoryConfig("PROSE MODE", {
      pov_character: idA,
      person: "third",
      tense: "past",
      psychic_distance: "close",
      interiority_mode: "filtered",
      dialogue_density: "balanced",
      paragraphing: "mixed",
      language_output: "direct",
      special_style_constraints: []
    });
    expect(repository.getStoryConfig("PROSE MODE")).toMatchObject({ ok: true });
    expect(() => repository.setStoryConfig("UNIVERSAL CONTENT POLICY", { rating_label: "M" })).toThrow();

    repository.setGenerationSession({
      immediate_handoff: {
        recent_causal_context: "A arrived.",
        last_visible_moment: "Doorway",
        prior_accepted_prose_status_or_handoff_note: "none",
        begin_after: "A waits"
      },
      manual_moment_directive: { must_render: ["A waits"] },
      generation_validation_focus: {
        validation_focus_tags: { generation_context: ["first_segment"] }
      }
    });
    expect(repository.getGenerationSession()).toMatchObject({ ok: true });
    expect(() => repository.setGenerationSession({ manual_moment_directive: { must_render: [] } })).toThrow();

    repository.appendAcceptedSegment({ text: "Accepted prose.", metadata: { source: "test" } });
    expect(repository.listAcceptedSegments()).toHaveLength(1);
    expect(repository.listRecords({ includeArchived: true })).toEqual([]);
  });

  it("deletes accepted segments without renumbering or writing record tables", async () => {
    const storeManager = manager();
    const status = await storeManager.createProject({
      parentPath: await tempParent(),
      folderName: "accepted-delete",
      title: "Accepted Delete"
    });
    const repository = storeManager.getRecordRepository();
    expect(repository).not.toBeNull();
    if (!repository) {
      return;
    }

    repository.createRecord({
      type: "FACT",
      displayLabel: "Persistent record",
      payload: {
        id: idA,
        status: "active",
        fact_kind: "current_state",
        statement: "Records remain untouched.",
        scope: "global",
        known_by: [],
        audience_visibility: "explicit",
        salience: "medium"
      }
    });
    const first = repository.appendAcceptedSegment({ text: "First accepted prose.", metadata: { source: "test" } });
    const second = repository.appendAcceptedSegment({ text: "Second accepted prose.", metadata: { source: "test" } });
    const third = repository.appendAcceptedSegment({ text: "Third accepted prose.", metadata: { source: "test" } });
    const databasePath = join(status.folderPath, "loom.sqlite");
    const before = tableCounts(databasePath);

    expect(repository.deleteAcceptedSegment(second.id)).toBe(true);
    expect(repository.listAcceptedSegments().map(({ id, sequence, text }) => ({ id, sequence, text }))).toEqual([
      { id: first.id, sequence: 1, text: "First accepted prose." },
      { id: third.id, sequence: 3, text: "Third accepted prose." }
    ]);
    expect(tableCounts(databasePath)).toEqual({
      ...before,
      accepted_segments: before.accepted_segments - 1
    });

    const afterDelete = tableCounts(databasePath);
    expect(repository.deleteAcceptedSegment(999)).toBe(false);
    expect(tableCounts(databasePath)).toEqual(afterDelete);
  });

  it("can run the table initializer idempotently", () => {
    const database = new DatabaseSync(":memory:");
    try {
      ensureRecordTables(database);
      ensureRecordTables(database);
      const tables = (
        database
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
          .all() as Array<{ name: string }>
      ).map((row) => row.name);
      expect(tables).toEqual(
        expect.arrayContaining(["accepted_segments", "generation_session", "record_references", "records", "story_config"])
      );
    } finally {
      database.close();
    }
  });
});

function tableCounts(databasePath: string): TableCounts {
  const database = new DatabaseSync(databasePath);
  try {
    return {
      accepted_segments: countRows(database, "accepted_segments"),
      generation_session: countRows(database, "generation_session"),
      record_references: countRows(database, "record_references"),
      records: countRows(database, "records"),
      story_config: countRows(database, "story_config")
    };
  } finally {
    database.close();
  }
}

function countRows(database: DatabaseSync, tableName: keyof TableCounts): number {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number };
  return row.count;
}
