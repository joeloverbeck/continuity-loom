import { describe, expect, it } from "vitest";

import { buildStoryRecordHygieneSnapshot, type RecordHygieneRepository } from "./record-hygiene-snapshot-builder.js";
import type { RecordRepositoryRecord, RecordReadResult } from "./record-repository.js";

const idA = "019b0298-5c00-7000-8000-000000000001";
const idB = "019b0298-5c00-7000-8000-000000000002";
const idC = "019b0298-5c00-7000-8000-000000000003";
const idD = "019b0298-5c00-7000-8000-000000000004";
const idE = "019b0298-5c00-7000-8000-000000000005";
const idF = "019b0298-5c00-7000-8000-000000000006";
const wholeProject = { mode: "full_active_atomic_review" } as const;
const workingSet = { mode: "active_working_set_atomic_review" } as const;

describe("record hygiene snapshot builder", () => {
  it("includes all non-archived hygiene-active records and excludes archived, terminal, ENTITY, and CAST payloads", () => {
    const repository = fakeRepository([
      ok(record(idA, "FACT", "Hard fact", factPayload(idA), false)),
      ok(record(idB, "BELIEF", "Active belief", beliefPayload(idB), false)),
      ok(record(idC, "PLAN", "Fulfilled plan", planPayload(idC, "fulfilled"), false)),
      ok(record(idD, "ENTITY", "Niko", entityPayload(idD), false)),
      ok(record(idE, "CAST MEMBER", "Niko cast", castPayload(idD), false)),
      ok(record(idF, "FACT", "Archived fact", factPayload(idF), true))
    ]);

    const result = buildStoryRecordHygieneSnapshot(repository, wholeProject);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.snapshot.records.map((item) => item.id)).toEqual([idA, idB]);
    expect(JSON.stringify(result.snapshot)).not.toContain("Private cast pressure");
    expect(JSON.stringify(result.snapshot)).not.toContain("Person entity payload");
    expect(result.snapshot.referenceIndex[idB]?.outgoing).toEqual([`holder -> Niko (${idD})`]);
  });

  it("fails closed on malformed rows, duplicate ids, and unsupported types", () => {
    expect(buildStoryRecordHygieneSnapshot(fakeRepository([{ ok: false, kind: "malformed-record", message: "bad", id: idA }]), wholeProject)).toMatchObject({
      ok: false,
      status: 422,
      body: { kind: "malformed-hygiene-source" }
    });

    expect(buildStoryRecordHygieneSnapshot(fakeRepository([
      ok(record(idA, "FACT", "One", factPayload(idA), false)),
      ok(record(idA, "FACT", "Two", factPayload(idA), false))
    ]), wholeProject)).toMatchObject({ ok: false, body: { kind: "malformed-hygiene-source" } });

    expect(buildStoryRecordHygieneSnapshot(fakeRepository([
      ok(record("bad-type", "UNKNOWN", "Unknown", {}, false))
    ]), wholeProject)).toMatchObject({ ok: false, body: { kind: "malformed-hygiene-source" } });
  });

  it("keeps whole-project mode independent from the working set", () => {
    const repository = fakeRepository([
      ok(record(idA, "FACT", "Hard fact", factPayload(idA), false)),
      ok(record(idB, "BELIEF", "Active belief", beliefPayload(idB), false))
    ], [idA]);

    const result = buildStoryRecordHygieneSnapshot(repository, wholeProject);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.snapshot.records.map((item) => item.id)).toEqual([idA, idB]);
  });

  it("restricts working-set mode to selected hygiene-active records in fixed output order", () => {
    const repository = fakeRepository([
      ok(record(idB, "BELIEF", "Active belief", beliefPayload(idB), false)),
      ok(record(idA, "FACT", "Hard fact", factPayload(idA), false)),
      ok(record(idC, "PLAN", "Fulfilled plan", planPayload(idC, "fulfilled"), false)),
      ok(record(idF, "FACT", "Archived fact", factPayload(idF), true))
    ], [idB, idA, idC, idF, "missing-record"]);

    const result = buildStoryRecordHygieneSnapshot(repository, workingSet);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.snapshot.records.map((item) => item.id)).toEqual([idA, idB]);
  });

  it("treats absent or malformed sessions as an empty working-set scope", () => {
    const records = [ok(record(idA, "FACT", "Hard fact", factPayload(idA), false))];

    for (const generationSession of [
      { ok: false, kind: "not-found", message: "No generation session." } as const,
      { ok: false, kind: "malformed-json", message: "Bad generation session." } as const,
      { ok: true, payload: { active_working_set: { selected_records: "bad-shape" } } } as const
    ]) {
      const result = buildStoryRecordHygieneSnapshot(fakeRepository(records, generationSession), workingSet);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.snapshot.records).toEqual([]);
      }
    }
  });

  it("fails closed on malformed rows selected into working-set scope but ignores malformed rows outside scope", () => {
    const malformedRow = { ok: false, kind: "malformed-record", message: "bad", id: idB } as const;

    expect(buildStoryRecordHygieneSnapshot(fakeRepository([
      ok(record(idA, "FACT", "Hard fact", factPayload(idA), false)),
      malformedRow
    ], [idA]), workingSet)).toMatchObject({ ok: true });

    expect(buildStoryRecordHygieneSnapshot(fakeRepository([
      ok(record(idA, "FACT", "Hard fact", factPayload(idA), false)),
      malformedRow
    ], [idB]), workingSet)).toMatchObject({
      ok: false,
      status: 422,
      body: { kind: "malformed-hygiene-source" }
    });
  });
});

function fakeRepository(
  results: RecordReadResult[],
  generationSession: readonly string[] | ReturnType<RecordHygieneRepository["getGenerationSession"]> = []
): RecordHygieneRepository {
  return {
    listRecords: () => results,
    referencesForRecord: (id) => (id === idB ? [{ refRole: "holder", targetId: idD }] : []),
    incomingReferencesForRecord: () => [],
    getGenerationSession: () =>
      Array.isArray(generationSession)
        ? { ok: true, payload: { active_working_set: { selected_records: generationSession } } }
        : generationSession
  };
}

function ok(recordValue: RecordRepositoryRecord): RecordReadResult {
  return { ok: true, record: recordValue };
}

function record(id: string, type: string, displayLabel: string, payload: unknown, archived: boolean): RecordRepositoryRecord {
  return {
    id,
    type,
    displayLabel,
    status: null,
    salience: null,
    urgency: null,
    archived,
    userOrder: null,
    createdAt: "2026-06-21T00:00:00.000Z",
    updatedAt: "2026-06-21T00:00:00.000Z",
    payload
  };
}

function factPayload(id: string) {
  return {
    id,
    fact_kind: "current_state",
    statement: "The door is locked.",
    scope: "current_segment",
    known_by: "public",
    audience_visibility: "explicit",
    salience: "high"
  };
}

function beliefPayload(id: string) {
  return {
    id,
    status: "active",
    holder: idD,
    claim: "The door is locked.",
    belief_mode: "believes",
    truth_relation: "true",
    confidence: "high",
    visibility: "private",
    access_route: "direct_observation",
    behavioral_effect: "Tests the latch.",
    salience: "medium"
  };
}

function planPayload(id: string, plan_status: string) {
  return {
    id,
    plan_status,
    holder: idD,
    objective: "Open the door.",
    resources: [],
    blockers: [],
    current_step: "Find a key.",
    fallback_steps: [],
    visibility_to_pov: "visible",
    salience: "medium"
  };
}

function entityPayload(id: string) {
  return {
    id,
    display_name: "Niko",
    entity_kind: "person",
    roles_in_story: ["primary_actor"],
    short_description: "Person entity payload"
  };
}

function castPayload(entity_id: string) {
  return {
    entity_id,
    identity: {
      one_line: "Niko in one line.",
      public_face: "Careful",
      private_pressure: "Private cast pressure"
    },
    voice_anchor: {
      core_voice: "plain",
      rhythm_and_syntax: "short",
      register_and_diction: "direct",
      vocabulary_and_metaphor_pools: "locks",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "none",
      dialogue_tactics_and_speech_functions: "asks",
      address_terms_and_naming: "names",
      silence_interruption_and_turntaking: "waits",
      under_pressure_voice: "quieter",
      suppression_or_evasion_rule: "deflects",
      must_preserve: ["directness"],
      must_avoid: ["florid speech"],
      anti_repetition_warnings: ["no catchphrase"]
    },
    pressure_behavior_core: {
      cornered: "stalls",
      tempted_or_offered_power: "hesitates",
      protecting_attachment: "steps closer"
    },
    body_presence_core: {
      physicality: "still",
      habitual_gestures_or_presence: "hands in pockets",
      social_presentation: "guarded"
    },
    agency_core: {
      default_strategy: "ask first",
      risk_style: "measured"
    }
  };
}
