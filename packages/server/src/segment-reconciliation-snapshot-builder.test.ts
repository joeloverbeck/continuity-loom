import { describe, expect, it } from "vitest";

import {
  buildSegmentReconciliationSnapshot,
  type SegmentReconciliationRepository
} from "./segment-reconciliation-snapshot-builder.js";
import type { RecordRepositoryRecord, RecordReadResult } from "./record-repository.js";

const beliefA = "019b0298-5c00-7000-8000-000000000001";
const beliefB = "019b0298-5c00-7000-8000-000000000002";
const entityId = "019b0298-5c00-7000-8000-000000000003";
const castId = "019b0298-5c00-7000-8000-000000000004";

describe("segment reconciliation snapshot builder", () => {
  it("derives complete labels for full records and minimal out-of-scope ENTITY and CAST MEMBER stubs", () => {
    const sharedPrefix = "S".repeat(80);
    const browseLabel = `${sharedPrefix.slice(0, 77)}...`;
    const fullBeliefA = `${sharedPrefix}Zulu Ω > complete`;
    const fullBeliefB = `${sharedPrefix}Alpha ñ < & complete`;
    const fullEntity = `${sharedPrefix}Entity é > complete`;
    const fullCast = `${sharedPrefix}Cast Ω < complete`;
    const repository = fakeRepository([
      ok(record(beliefA, "BELIEF", browseLabel, beliefPayload(beliefA, entityId, fullBeliefA))),
      ok(record(beliefB, "BELIEF", browseLabel, beliefPayload(beliefB, castId, fullBeliefB))),
      ok(record(entityId, "ENTITY", browseLabel, entityPayload(entityId, fullEntity))),
      ok(record(castId, "CAST MEMBER", browseLabel, castPayload(entityId, fullCast)))
    ]);

    const result = buildSegmentReconciliationSnapshot(repository, {
      segmentSelection: "latest",
      recordScope: "active_working_set"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.snapshot.records.map(({ id, displayLabel }) => ({ id, displayLabel }))).toEqual([
      { id: beliefA, displayLabel: fullBeliefA },
      { id: beliefB, displayLabel: fullBeliefB }
    ]);
    expect(result.snapshot.referenceStubs).toEqual([
      { id: entityId, type: "ENTITY", displayLabel: fullEntity },
      { id: castId, type: "CAST MEMBER", displayLabel: fullCast }
    ]);
    expect(result.snapshot.referenceStubs.every((stub) => Object.keys(stub).sort().join(",") === "displayLabel,id,type")).toBe(true);
    expect(JSON.stringify(result.snapshot)).not.toContain("Excluded entity private payload");
    expect(JSON.stringify(result.snapshot)).not.toContain("Private cast pressure");
  });
});

function fakeRepository(results: RecordReadResult[]): SegmentReconciliationRepository {
  return {
    listRecords: () => results,
    getGenerationSession: () => ({
      ok: true,
      payload: { active_working_set: { selected_records: [beliefA, beliefB] } }
    }),
    getLatestAcceptedSegmentForReconciliation: () => ({
      id: 1,
      sequence: 1,
      acceptedAt: "2026-06-24T10:00:00.000Z",
      text: "An accepted segment used only as bounded reconciliation evidence."
    })
  };
}

function ok(value: RecordRepositoryRecord): RecordReadResult {
  return { ok: true, record: value };
}

function record(id: string, type: string, displayLabel: string, payload: unknown): RecordRepositoryRecord {
  return {
    id,
    type,
    displayLabel,
    status: null,
    salience: null,
    urgency: null,
    archived: false,
    userOrder: null,
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    payload
  };
}

function beliefPayload(id: string, holder: string, claim: string) {
  return {
    id,
    holder,
    claim,
    belief_mode: "believes",
    truth_relation: "unknown",
    confidence: "medium",
    visibility: "private",
    access_route: "inference",
    behavioral_effect: "Checks the evidence twice.",
    salience: "high",
    status: "active"
  };
}

function entityPayload(id: string, displayName: string) {
  return {
    id,
    display_name: displayName,
    entity_kind: "person",
    roles_in_story: ["primary_actor"],
    short_description: "Excluded entity private payload"
  };
}

function castPayload(entity_id: string, oneLine: string) {
  return {
    entity_id,
    identity: {
      one_line: oneLine,
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
