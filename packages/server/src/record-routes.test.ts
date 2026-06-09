import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "./server.js";

const apps: ReturnType<typeof createServer>[] = [];
const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const idC = "019b0298-5c00-7000-8000-000000000003";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function tempParent(): Promise<string> {
  return mkdtemp(join(tmpdir(), "loom-record-routes-"));
}

function app(): ReturnType<typeof createServer> {
  const fastify = createServer();
  apps.push(fastify);
  return fastify;
}

async function openProject(fastify: ReturnType<typeof createServer>): Promise<void> {
  const response = await fastify.inject({
    method: "POST",
    url: "/api/project/create",
    payload: {
      parentPath: await tempParent(),
      folderName: "records",
      title: "Records"
    }
  });

  expect(response.statusCode).toBe(201);
}

function factPayload(id: string, statement: string, salience = "medium") {
  return {
    id,
    status: "active",
    fact_kind: "current_state",
    statement,
    scope: "entity",
    known_by: [],
    audience_visibility: "explicit",
    salience
  };
}

function entityPayload(id: string, displayName: string) {
  return {
    id,
    display_name: displayName,
    entity_kind: "person",
    roles_in_story: ["primary_actor"],
    short_description: `${displayName} is present.`
  };
}

function entityPayloadWithoutId(displayName: string) {
  return {
    display_name: displayName,
    entity_kind: "person",
    roles_in_story: ["primary_actor"],
    short_description: `${displayName} is present.`
  };
}

function emotionPayload(id: string, holder: string, intensity = "high") {
  return {
    id,
    status: "active",
    holder,
    description: "Mara is furious that the door was sealed.",
    affect_kind: "anger",
    intensity,
    behavioral_pressure: ["attack", "reject"],
    visibility: "visible",
    surface_expression: "Her hands shake against the latch."
  };
}

function castMemberPayload(entityId: string) {
  return {
    entity_id: entityId,
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
  };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((fastify) => fastify.close()));
});

describe("record routes", () => {
  it("generates record ids on create and honors explicit ids", async () => {
    const fastify = app();
    await openProject(fastify);

    const generated = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "ENTITY", displayLabel: "Generated", payload: entityPayloadWithoutId("Generated") }
    });
    expect(generated.statusCode).toBe(201);
    const generatedRecord = generated.json().record as { id: string; payload: { id: string } };
    expect(generatedRecord.id).toMatch(uuidPattern);
    expect(generatedRecord.payload.id).toBe(generatedRecord.id);

    const explicit = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "ENTITY", displayLabel: "Explicit", payload: entityPayload(idA, "Explicit") }
    });
    expect(explicit.statusCode).toBe(201);
    expect(explicit.json()).toMatchObject({ ok: true, record: { id: idA, payload: { id: idA } } });
  });

  it("round-trips representative atomic and CAST MEMBER records over HTTP", async () => {
    const fastify = app();
    await openProject(fastify);

    const createFact = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: {
        type: "FACT",
        displayLabel: "Initial fact",
        payload: factPayload(idA, "A knows the door code.")
      }
    });
    expect(createFact.statusCode).toBe(201);
    expect(createFact.json()).toMatchObject({ ok: true, record: { id: idA, type: "FACT" } });
    expect(createFact.json().record.displayValues).toEqual({
      status: "active",
      fact_kind: "current_state",
      scope: "entity",
      salience: "medium",
      audience_visibility: "explicit"
    });

    const listFact = await fastify.inject({ method: "GET", url: "/api/records?type=FACT&q=door" });
    expect(listFact.json()).toMatchObject({ ok: true, records: [{ id: idA, displayLabel: "Initial fact" }] });
    expect(listFact.json().records[0]).not.toHaveProperty("payload");
    expect(listFact.json().records[0].displayValues).toEqual({
      status: "active",
      fact_kind: "current_state",
      scope: "entity",
      salience: "medium",
      audience_visibility: "explicit"
    });

    const updateFact = await fastify.inject({
      method: "PUT",
      url: `/api/records/${idA}`,
      payload: {
        displayLabel: "Updated fact",
        payload: factPayload(idA, "A knows the west door code.", "high")
      }
    });
    expect(updateFact.statusCode).toBe(200);
    expect(updateFact.json()).toMatchObject({ ok: true, record: { displayLabel: "Updated fact", salience: "high" } });
    expect(updateFact.json().record.displayValues.salience).toBe("high");

    const archiveFact = await fastify.inject({ method: "POST", url: `/api/records/${idA}/archive` });
    expect(archiveFact.json()).toEqual({ ok: true });
    const archivedList = await fastify.inject({ method: "GET", url: "/api/records?includeArchived=true" });
    expect(archivedList.json()).toMatchObject({ records: [{ id: idA, archived: true }] });
    expect((await fastify.inject({ method: "DELETE", url: `/api/records/${idA}` })).json()).toEqual({ ok: true });

    await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "ENTITY", displayLabel: "A", payload: entityPayload(idB, "A") }
    });
    const createCast = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "CAST MEMBER", displayLabel: "A cast", payload: castMemberPayload(idB) }
    });
    const castRecord = createCast.json().record as { id: string };
    expect(createCast.statusCode).toBe(201);
    expect((await fastify.inject({ method: "GET", url: `/api/records/${castRecord.id}` })).json()).toMatchObject({
      ok: true,
      record: { type: "CAST MEMBER", payload: { entity_id: idB } }
    });
  });

  it("emits manifest display values on list and detail projections", async () => {
    const fastify = app();
    await openProject(fastify);

    await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "ENTITY", displayLabel: "Mara", payload: entityPayload(idA, "Mara") }
    });
    const createEmotion = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "EMOTION", displayLabel: "Mara's anger", payload: emotionPayload(idB, idA) }
    });
    expect(createEmotion.statusCode).toBe(201);
    expect(createEmotion.json().record.displayValues).toEqual({
      status: "active",
      affect_kind: "anger",
      intensity: "high",
      visibility: "visible"
    });

    const listEmotion = await fastify.inject({ method: "GET", url: "/api/records?type=EMOTION" });
    expect(listEmotion.json().records).toHaveLength(1);
    expect(listEmotion.json().records[0]).not.toHaveProperty("payload");
    expect(listEmotion.json().records[0].displayValues).toEqual({
      status: "active",
      affect_kind: "anger",
      intensity: "high",
      visibility: "visible"
    });

    const detailEmotion = await fastify.inject({ method: "GET", url: `/api/records/${idB}` });
    expect(detailEmotion.json()).toMatchObject({
      ok: true,
      record: {
        id: idB,
        type: "EMOTION",
        displayValues: {
          status: "active",
          affect_kind: "anger",
          intensity: "high",
          visibility: "visible"
        },
        payload: {
          holder: idA,
          intensity: "high"
        }
      }
    });
  });

  it("returns structured malformed-payload errors and persists nothing", async () => {
    const fastify = app();
    await openProject(fastify);

    const response = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: {
        type: "FACT",
        displayLabel: "Bad fact",
        payload: { ...factPayload(idA, "Bad status"), status: "inactive" }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ ok: false, kind: "malformed-payload" });
    expect(response.json().issues.length).toBeGreaterThan(0);
    expect((await fastify.inject({ method: "GET", url: "/api/records?includeArchived=true" })).json()).toEqual({
      ok: true,
      records: []
    });
  });

  it("enumerates reference-integrity blockers and exposes incoming and outgoing references", async () => {
    const fastify = app();
    await openProject(fastify);

    await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: { type: "ENTITY", displayLabel: "A", payload: entityPayload(idA, "A") }
    });
    await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: {
        type: "BELIEF",
        displayLabel: "Belief",
        payload: {
          id: idB,
          status: "active",
          holder: idA,
          claim: "A knows the route.",
          belief_mode: "knows",
          truth_relation: "true",
          confidence: "high",
          visibility: "private",
          access_route: "direct_observation",
          behavioral_effect: "A guards the route.",
          salience: "high"
        }
      }
    });
    await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: {
        type: "INTENTION",
        displayLabel: "Intent",
        payload: {
          id: idC,
          status: "active",
          holder: idA,
          intent: "Keep the route closed.",
          urgency: "medium",
          behavioral_pressure: "A watches the gate."
        }
      }
    });

    const references = await fastify.inject({ method: "GET", url: `/api/records/${idB}/references` });
    expect(references.json()).toMatchObject({
      ok: true,
      outgoing: [{ refRole: "holder", targetId: idA }],
      incoming: []
    });

    const deleteEntity = await fastify.inject({ method: "DELETE", url: `/api/records/${idA}` });
    expect(deleteEntity.statusCode).toBe(409);
    expect(deleteEntity.json()).toMatchObject({ ok: false, kind: "reference-integrity" });
    expect(deleteEntity.json().referrers).toEqual([
      { fromRecordId: idB, refRole: "holder" },
      { fromRecordId: idC, refRole: "holder" }
    ]);

    const incoming = await fastify.inject({ method: "GET", url: `/api/records/${idA}/references` });
    expect(incoming.json().incoming).toEqual([
      { fromRecordId: idB, refRole: "holder" },
      { fromRecordId: idC, refRole: "holder" }
    ]);
  });

  it("scrubs a selected record from the working set when deleted through the route", async () => {
    const fastify = app();
    await openProject(fastify);

    const createFact = await fastify.inject({
      method: "POST",
      url: "/api/records",
      payload: {
        type: "FACT",
        displayLabel: "Selected fact",
        payload: factPayload(idA, "A selected fact.")
      }
    });
    expect(createFact.statusCode).toBe(201);
    const setWorkingSet = await fastify.inject({
      method: "PUT",
      url: "/api/working-set",
      payload: { selectedRecordIds: [idA] }
    });
    expect(setWorkingSet.statusCode).toBe(200);

    const deleteFact = await fastify.inject({ method: "DELETE", url: `/api/records/${idA}` });
    expect(deleteFact.statusCode).toBe(200);
    expect(deleteFact.json()).toEqual({ ok: true });

    const workingSet = await fastify.inject({ method: "GET", url: "/api/working-set" });
    expect(workingSet.json()).toEqual({ ok: true, selectedRecordIds: [] });

    const validate = await fastify.inject({ method: "POST", url: "/api/validate" });
    expect(validate.statusCode).toBe(200);
    expect(validate.body).not.toContain("Record not found");
  });

  it("returns structured no-open-project errors on record routes", async () => {
    const fastify = app();
    const requests = [
      { method: "GET", url: "/api/records" },
      { method: "GET", url: `/api/records/${idA}` },
      { method: "GET", url: `/api/records/${idA}/references` },
      { method: "POST", url: "/api/records", payload: { type: "FACT", payload: factPayload(idA, "A") } },
      { method: "PUT", url: `/api/records/${idA}`, payload: { payload: factPayload(idA, "A") } },
      { method: "POST", url: `/api/records/${idA}/archive` },
      { method: "DELETE", url: `/api/records/${idA}` }
    ] as const;

    for (const request of requests) {
      const response = await fastify.inject(request);
      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual({ ok: false, kind: "no-open-project", message: "No project is open." });
    }
  });
});
