import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { LOOPBACK_HOST, startServer, type StartedServer } from "./server.js";

const apps: StartedServer[] = [];

const entityId = "019b0298-5c00-7000-8000-000000000101";
const factId = "019b0298-5c00-7000-8000-000000000103";
const locationId = "019b0298-5c00-7000-8000-000000000104";
const intentionId = "019b0298-5c00-7000-8000-000000000105";
const relationshipId = "019b0298-5c00-7000-8000-000000000106";
const otherEntityId = "019b0298-5c00-7000-8000-000000000107";
const payloadSentinel = "PHASE4_PAYLOAD_SENTINEL_DO_NOT_LOG";
const briefSentinel = "PHASE4_BRIEF_SENTINEL_DO_NOT_LOG";

interface JsonResponse<T = unknown> {
  statusCode: number;
  body: T;
}

function captureProcessWrites(): { restore: () => string } {
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  let captured = "";

  function capture(chunk: unknown, encodingOrCallback?: unknown, callback?: unknown): boolean {
    captured += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    const done = typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (typeof done === "function") {
      done();
    }
    return true;
  }

  process.stdout.write = capture as typeof process.stdout.write;
  process.stderr.write = capture as typeof process.stderr.write;

  return {
    restore: () => {
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      return captured;
    }
  };
}

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-phase4-gate-"));
}

async function requestJson<T = unknown>(
  baseUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<JsonResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers
    }
  });

  return {
    statusCode: response.status,
    body: (await response.json()) as T
  };
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}

function entityPayload(id: string, displayName: string) {
  return {
    id,
    display_name: displayName,
    entity_kind: "person",
    roles_in_story: ["primary_actor"],
    short_description: `${displayName} anchors the phase-four gate.`
  };
}

function castMemberPayload(entityIdInput: string) {
  return {
    entity_id: entityIdInput,
    identity: {
      one_line: "A precise witness.",
      public_face: "calm",
      private_pressure: "protects the hidden archive"
    },
    voice_anchor: {
      core_voice: "measured",
      rhythm_and_syntax: "short declarative beats",
      register_and_diction: "plain",
      vocabulary_and_metaphor_pools: "keys and doors",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "never names the archive",
      dialogue_tactics_and_speech_functions: "answers narrowly",
      address_terms_and_naming: "formal names",
      silence_interruption_and_turntaking: "waits through pressure",
      under_pressure_voice: "quieter",
      suppression_or_evasion_rule: "redirects to procedure",
      must_preserve: ["precision"],
      must_avoid: ["raw dumps"],
      anti_repetition_warnings: ["do not repeat the key image"]
    },
    pressure_behavior_core: {
      cornered: "narrows the available facts",
      tempted_or_offered_power: "asks for proof",
      protecting_attachment: "keeps the archive closed"
    },
    body_presence_core: {
      physicality: "still",
      habitual_gestures_or_presence: "hands folded",
      social_presentation: "controlled"
    },
    agency_core: { default_strategy: "verify first", risk_style: "low" }
  };
}

function factPayload(statement: string, salience = "medium") {
  return {
    id: factId,
    status: "active",
    fact_kind: "current_state",
    statement,
    scope: "entity",
    known_by: [entityId],
    audience_visibility: "explicit",
    salience
  };
}

function locationPayload() {
  return {
    id: locationId,
    status: "active",
    label: "Archive room",
    description: "A locked room beneath the station.",
    layout_relevant_now: "One visible exit and one sealed cabinet.",
    access_routes: ["north stair"],
    visibility_and_sound: "Dim light, clear voices.",
    hazards_or_shelters: [],
    social_rules: ["speak softly"]
  };
}

function intentionPayload() {
  return {
    id: intentionId,
    status: "active",
    holder: entityId,
    intent: "Keep the archive sealed.",
    urgency: "high",
    behavioral_pressure: payloadSentinel
  };
}

function relationshipPayload() {
  return {
    id: relationshipId,
    status: "active",
    axis: "trust",
    direction_kind: "directed",
    from: entityId,
    to: otherEntityId,
    value: "medium",
    valence: "asymmetric",
    visibility: "private",
    description: "Aster trusts Vale to keep quiet.",
    pressure_text: "Trust makes the choice slower.",
    current_expression: "A guarded glance."
  };
}

const recordsToCreate = [
  { type: "ENTITY", displayLabel: "Aster", payload: entityPayload(entityId, "Aster") },
  { type: "ENTITY", displayLabel: "Vale", payload: entityPayload(otherEntityId, "Vale") },
  { type: "CAST MEMBER", displayLabel: "Aster cast", payload: castMemberPayload(entityId) },
  { type: "FACT", displayLabel: "Archive fact", payload: factPayload(`The archive contains ${payloadSentinel}.`) },
  { type: "LOCATION", displayLabel: "Archive room", payload: locationPayload() },
  { type: "INTENTION", displayLabel: "Seal archive", payload: intentionPayload() },
  { type: "RELATIONSHIP", displayLabel: "Aster trusts Vale", payload: relationshipPayload() }
] as const;

const storyContractPayload = {
  title: "Phase Four Gate",
  premise: `The test keeps ${briefSentinel} private.`,
  genre_mode: "procedural fantasy",
  tone: "tense and exact",
  continuity_philosophy: "continuity_first",
  setting_baseline: "A city archive under watch.",
  content_intensity: "mature",
  explicitness: "Only render earned detail.",
  language_register: "controlled prose",
} as const;

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("phase 4 gate", () => {
  it("round-trips CRUD, config, working set, references, loopback bind, and log privacy", async () => {
    const capture = captureProcessWrites();
    let logs = "";
    let castRecordId = "";

    try {
      const app = await startServer(0, { logger: true });
      apps.push(app);
      expect(app.address.address).toBe(LOOPBACK_HOST);
      const baseUrl = `http://${LOOPBACK_HOST}:${app.address.port}`;

      const createProject = await requestJson(baseUrl, "/api/project/create", {
        method: "POST",
        body: jsonBody({
          parentPath: await tempParent(),
          folderName: "phase4-gate",
          title: "Phase 4 Gate"
        })
      });
      expect(createProject.statusCode).toBe(201);

      const noOpenServer = await startServer(0, { logger: true });
      apps.push(noOpenServer);
      const noOpenUrl = `http://${LOOPBACK_HOST}:${noOpenServer.address.port}`;
      const noOpenRecords = await requestJson(noOpenUrl, "/api/records");
      expect(noOpenRecords).toMatchObject({
        statusCode: 409,
        body: { ok: false, kind: "no-open-project" }
      });

      const expectedCreatedCount = recordsToCreate.length;
      for (const record of recordsToCreate) {
        const response = await requestJson<{ ok: true; record: { id: string } } | { ok: false }>(baseUrl, "/api/records", {
          method: "POST",
          body: jsonBody(record)
        });
        expect(response, `create ${record.type}`).toMatchObject({ statusCode: 201, body: { ok: true } });
        if (record.type === "CAST MEMBER" && response.body.ok) {
          castRecordId = response.body.record.id;
        }
      }
      expect(castRecordId).not.toBe("");

      const listAll = await requestJson<{ ok: true; records: Array<{ id: string; type: string; payload?: unknown }> }>(
        baseUrl,
        "/api/records?includeArchived=true"
      );
      expect(listAll.statusCode).toBe(200);
      expect(listAll.body.records).toHaveLength(expectedCreatedCount);
      expect(listAll.body.records.every((record) => !("payload" in record))).toBe(true);

      const getCast = await requestJson<{ ok: true; record: { type: string; payload: { entity_id: string } } }>(
        baseUrl,
        `/api/records/${castRecordId}`
      );
      expect(getCast).toMatchObject({
        statusCode: 200,
        body: { ok: true, record: { type: "CAST MEMBER", payload: { entity_id: entityId } } }
      });

      const updateFact = await requestJson(baseUrl, `/api/records/${factId}`, {
        method: "PUT",
        body: jsonBody({
          displayLabel: "Archive fact updated",
          payload: factPayload(`The archive now hides ${payloadSentinel}.`, "high")
        })
      });
      expect(updateFact).toMatchObject({
        statusCode: 200,
        body: { ok: true, record: { displayLabel: "Archive fact updated", salience: "high" } }
      });

      const filteredFact = await requestJson<{ ok: true; records: Array<{ id: string }> }>(
        baseUrl,
        `/api/records?type=FACT&status=active&q=${encodeURIComponent("hides")}&refRole=known_by&targetId=${entityId}`
      );
      expect(filteredFact.body.records.map((record) => record.id)).toEqual([factId]);

      const blockedDelete = await requestJson(baseUrl, `/api/records/${entityId}`, { method: "DELETE" });
      expect(blockedDelete).toMatchObject({
        statusCode: 409,
        body: {
          ok: false,
          kind: "reference-integrity",
          referrers: expect.arrayContaining([
            { fromRecordId: castRecordId, refRole: "entity_id" },
            { fromRecordId: factId, refRole: "known_by" },
            { fromRecordId: intentionId, refRole: "holder" },
            { fromRecordId: relationshipId, refRole: "from" }
          ])
        }
      });

      const references = await requestJson(baseUrl, `/api/records/${entityId}/references`);
      expect(references).toMatchObject({
        statusCode: 200,
        body: {
          ok: true,
          incoming: expect.arrayContaining([{ fromRecordId: intentionId, refRole: "holder" }])
        }
      });

      expect(await requestJson(baseUrl, `/api/records/${factId}/archive`, { method: "POST" })).toMatchObject({
        statusCode: 200,
        body: { ok: true }
      });
      expect(await requestJson(baseUrl, `/api/records/${factId}`, { method: "DELETE" })).toMatchObject({
        statusCode: 200,
        body: { ok: true }
      });

      const remainingRecords = await requestJson<{ ok: true; records: unknown[] }>(
        baseUrl,
        "/api/records?includeArchived=true"
      );
      expect(remainingRecords.body.records).toHaveLength(expectedCreatedCount - 1);

      const configResponse = await requestJson(baseUrl, "/api/story-config/STORY%20CONTRACT", {
        method: "PUT",
        body: jsonBody({ payload: storyContractPayload })
      });
      expect(configResponse).toEqual({ statusCode: 200, body: { ok: true } });
      const getConfig = await requestJson(baseUrl, "/api/story-config/STORY%20CONTRACT");
      expect(getConfig).toEqual({ statusCode: 200, body: { ok: true, payload: storyContractPayload } });

      const initialWorkingSet = await requestJson(baseUrl, "/api/working-set");
      expect(initialWorkingSet).toEqual({ statusCode: 200, body: { ok: true, selectedRecordIds: [] } });
      const workingSetResponse = await requestJson(baseUrl, "/api/working-set", {
        method: "PUT",
        body: jsonBody({ selectedRecordIds: [entityId, locationId] })
      });
      expect(workingSetResponse).toEqual({
        statusCode: 200,
        body: { ok: true, selectedRecordIds: [entityId, locationId] }
      });
      expect(await requestJson(baseUrl, "/api/working-set")).toEqual({
        statusCode: 200,
        body: { ok: true, selectedRecordIds: [entityId, locationId] }
      });
    } finally {
      logs = capture.restore();
    }

    expect(logs).not.toContain(payloadSentinel);
    expect(logs).not.toContain(briefSentinel);
  });
});
