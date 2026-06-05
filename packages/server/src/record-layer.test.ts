import { readFile } from "node:fs/promises";
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
const managers: ProjectStoreManager[] = [];

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
    const database = new DatabaseSync(join(status.folderPath, "loom.sqlite"));
    try {
      expect(
        database.prepare("SELECT salience FROM records WHERE id = ?").get(belief.id)
      ).toEqual({ salience: "high" });
      expect(
        database.prepare("SELECT salience FROM records WHERE id = ?").get(secret.id)
      ).toEqual({ salience: "critical" });
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

    const source = await readFile(new URL("./record-repository.ts", import.meta.url), "utf8");
    expect(source.match(/accepted_segments/g)).toHaveLength(3);
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
