import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

type DurableChangeTag = NonNullable<
  BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"]
>["validation_focus_tags"]["possible_durable_changes"][number];

const objectId = "019b0298-5c00-7000-8000-000000000001";
const affordanceUseId = "019b0298-5c00-7000-8000-000000000002";
const affordanceTransferId = "019b0298-5c00-7000-8000-000000000003";
const affordanceHarmId = "019b0298-5c00-7000-8000-000000000004";
const affordanceBondId = "019b0298-5c00-7000-8000-000000000005";
const entityId = "019b0298-5c00-7000-8000-000000000006";
const institutionId = "019b0298-5c00-7000-8000-000000000007";
const clockId = "019b0298-5c00-7000-8000-000000000008";
const obligationId = "019b0298-5c00-7000-8000-000000000009";

describe("durable-change matrix validation", () => {
  it("stays silent when durable matrix tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [];
    input.records = [];

    expect(blockerCodes(input)).not.toEqual(expect.arrayContaining([...allDurableCodes]));
  });

  it("stays silent when all durable matrix tags are satisfied", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      ...allDurableTags
    ];

    expect(blockerCodes(input)).not.toEqual(expect.arrayContaining([...allDurableCodes]));
  });

  it("accepts escalated obligations and faction or system institutions", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      "institutional_involvement_possible",
      "obligation_breach_possible"
    ];
    input.records = input.records.map((record) => {
      if (record.id === institutionId) {
        return { ...record, payload: { ...(record.payload as Record<string, unknown>), entity_kind: "faction" } };
      }
      if (record.id === obligationId) {
        return { ...record, payload: { ...(record.payload as Record<string, unknown>), status: "escalated" } };
      }
      return record;
    });

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete,
        DIAGNOSTIC_CODES.matrixObligationBreachIncomplete
      ])
    );

    input.records = input.records.map((record) =>
      record.id === institutionId ? { ...record, payload: { ...(record.payload as Record<string, unknown>), entity_kind: "system" } } : record
    );

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete);
  });

  it("allows intimacy when content policy is absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      "intimacy_or_sex_possible"
    ];
    delete input.storyConfig.universalContentPolicy;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete);
  });

  it("blocks durable changes when current locks or payload objects are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      "object_use_possible",
      "object_transfer_possible"
    ];
    (input.generationSession.current_authoritative_state as { current_locks?: unknown }).current_locks = undefined;
    input.records = input.records.map((record) =>
      record.id === objectId ? { ...record, payload: null } : record
    );

    expect(blockerCodes(input)).toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixObjectUseIncomplete,
        DIAGNOSTIC_CODES.matrixObjectTransferIncomplete
      ])
    );
  });

  it.each([
    ["object_use_possible", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, objectId)],
    ["object_transfer_possible", DIAGNOSTIC_CODES.matrixObjectTransferIncomplete, (input: BuildValidationSnapshotInput) => removeLock(input, "resulting holder")],
    ["location_change_possible", DIAGNOSTIC_CODES.matrixLocationChangeIncomplete, (input: BuildValidationSnapshotInput) => removeLock(input, "destination")],
    ["restraint_or_coercion_possible", DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete, (input: BuildValidationSnapshotInput) => removeLock(input, "power relationship")],
    ["intimacy_or_sex_possible", DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, affordanceBondId)],
    ["violence_or_injury_possible", DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, affordanceHarmId)],
    ["institutional_involvement_possible", DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, institutionId)],
    ["clock_tick_possible", DIAGNOSTIC_CODES.matrixClockTickIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, clockId)],
    ["obligation_breach_possible", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, (input: BuildValidationSnapshotInput) => removeRecord(input, obligationId)]
  ])("blocks %s when required durable state is missing", (tag, code, mutate) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      tag as DurableChangeTag
    ];
    mutate(input);

    expect(blockerCodes(input)).toContain(code);
  });

  it.each([
    ["missing owner", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setObjectPayload(input, { owner: "" })],
    ["missing carried-by", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setObjectPayload(input, { carried_by: "" })],
    ["missing object location", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setObjectPayload(input, { current_location: "" })],
    ["missing object POV visibility", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setObjectPayload(input, { visibility_to_pov: "" })],
    ["empty object affordances", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setObjectPayload(input, { usable_affordances: [] })],
    ["wrong affordance family", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setAffordancePayload(input, affordanceUseId, { action_families: ["inspect"] })],
    ["blank affordance prompt", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setAffordancePayload(input, affordanceUseId, { prompt_text: " " })],
    ["missing positions", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "positions", [])],
    ["missing line of sight", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "line_of_sight_and_visibility", "")],
    ["missing routes", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "routes_and_exits", [])],
    ["missing available time", DIAGNOSTIC_CODES.matrixObjectUseIncomplete, "object_use_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "available_time", "")]
  ])("blocks object use when %s", (_name, code, tag, mutate) => {
    expectDurableBlock(tag, code, mutate);
  });

  it.each([
    ["missing transfer affordance", DIAGNOSTIC_CODES.matrixObjectTransferIncomplete, "object_transfer_possible", (input: BuildValidationSnapshotInput) => removeRecord(input, affordanceTransferId)],
    ["blank consent or force", DIAGNOSTIC_CODES.matrixObjectTransferIncomplete, "object_transfer_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "consent_or_force_conditions", " ")],
    ["missing transfer route", DIAGNOSTIC_CODES.matrixObjectTransferIncomplete, "object_transfer_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "routes_and_exits", [])],
    ["missing source location", DIAGNOSTIC_CODES.matrixLocationChangeIncomplete, "location_change_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "current_location", "")],
    ["missing movement time", DIAGNOSTIC_CODES.matrixLocationChangeIncomplete, "location_change_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "available_time", "")],
    ["missing movement constraint", DIAGNOSTIC_CODES.matrixLocationChangeIncomplete, "location_change_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "movement constraint")]
  ])("blocks transfer and movement when %s", (_name, code, tag, mutate) => {
    expectDurableBlock(tag, code, mutate);
  });

  it.each([
    ["missing entity status", DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete, "restraint_or_coercion_possible", (input: BuildValidationSnapshotInput) => removeRecord(input, entityId)],
    ["missing consent or force", DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete, "restraint_or_coercion_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "consent_or_force_conditions", "")],
    ["missing physical constraint", DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete, "restraint_or_coercion_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "physical constraint")],
    ["forbidden by no-intimacy policy", DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete, "intimacy_or_sex_possible", (input: BuildValidationSnapshotInput) => setAllowedContentScope(input, "No intimacy in this scene.")],
    ["missing relationship pressure", DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete, "intimacy_or_sex_possible", (input: BuildValidationSnapshotInput) => removeRecordsOfType(input, "RELATIONSHIP")],
    ["missing bond affordance", DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete, "intimacy_or_sex_possible", (input: BuildValidationSnapshotInput) => setAffordancePayload(input, affordanceBondId, { action_families: ["harm"] })],
    ["missing harm affordance", DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete, "violence_or_injury_possible", (input: BuildValidationSnapshotInput) => setAffordancePayload(input, affordanceHarmId, { prompt_text: "" })],
    ["missing consequence record", DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete, "violence_or_injury_possible", (input: BuildValidationSnapshotInput) => removeRecordsOfType(input, "CONSEQUENCE")],
    ["missing injury consequence lock", DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete, "violence_or_injury_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "injury consequence")]
  ])("blocks body-state durable changes when %s", (_name, code, tag, mutate) => {
    expectDurableBlock(tag, code, mutate);
  });

  it.each([
    ["entity is a person", DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete, "institutional_involvement_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, institutionId, { entity_kind: "person" })],
    ["missing communication route", DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete, "institutional_involvement_possible", (input: BuildValidationSnapshotInput) => setStateField(input, "routes_and_exits", [])],
    ["missing authority relation", DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete, "institutional_involvement_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "authority relation")],
    ["inactive clock", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, clockId, { status: "paused" })],
    ["missing clock pressure", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, clockId, { current_pressure: "" })],
    ["missing tick trigger", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, clockId, { tick_trigger: "" })],
    ["missing next threshold", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, clockId, { next_threshold: "" })],
    ["missing possible effects", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, clockId, { possible_effects: [] })],
    ["missing clock cause", DIAGNOSTIC_CODES.matrixClockTickIncomplete, "clock_tick_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "clock tick cause")]
  ])("blocks institutional and clock changes when %s", (_name, code, tag, mutate) => {
    expectDurableBlock(tag, code, mutate);
  });

  it.each([
    ["closed obligation", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { status: "closed" })],
    ["missing terms", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { terms: "" })],
    ["missing owing party", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { owed_by: [] })],
    ["missing owed-to party", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { owed_to: null })],
    ["missing visibility", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { visibility: "" })],
    ["missing breach consequence", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => setRecordPayload(input, obligationId, { consequence_if_broken: "" })],
    ["missing opportunity lock", DIAGNOSTIC_CODES.matrixObligationBreachIncomplete, "obligation_breach_possible", (input: BuildValidationSnapshotInput) => removeLock(input, "obligation opportunity")]
  ])("blocks obligation breach when %s", (_name, code, tag, mutate) => {
    expectDurableBlock(tag, code, mutate);
  });
});

const allDurableTags = [
  "object_use_possible",
  "object_transfer_possible",
  "location_change_possible",
  "restraint_or_coercion_possible",
  "intimacy_or_sex_possible",
  "violence_or_injury_possible",
  "institutional_involvement_possible",
  "clock_tick_possible",
  "obligation_breach_possible"
] as const;

const allDurableCodes = [
  DIAGNOSTIC_CODES.matrixObjectUseIncomplete,
  DIAGNOSTIC_CODES.matrixObjectTransferIncomplete,
  DIAGNOSTIC_CODES.matrixLocationChangeIncomplete,
  DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete,
  DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete,
  DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete,
  DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete,
  DIAGNOSTIC_CODES.matrixClockTickIncomplete,
  DIAGNOSTIC_CODES.matrixObligationBreachIncomplete
] as const;

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function expectDurableBlock(
  tag: string,
  code: string,
  mutate: (input: BuildValidationSnapshotInput) => void
): void {
  const input = cleanInput();
  input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
    tag as DurableChangeTag
  ];
  mutate(input);

  expect(blockerCodes(input), tag).toContain(code);
}

function removeRecord(input: BuildValidationSnapshotInput, id: string): void {
  input.records = input.records.filter((record) => record.id !== id);
}

function removeRecordsOfType(input: BuildValidationSnapshotInput, type: string): void {
  input.records = input.records.filter((record) => record.type !== type);
}

function removeLock(input: BuildValidationSnapshotInput, marker: string): void {
  input.generationSession.current_authoritative_state!.current_locks = input.generationSession.current_authoritative_state!.current_locks.filter(
    (lock) => !lock.toLowerCase().includes(marker)
  );
}

function setObjectPayload(input: BuildValidationSnapshotInput, patch: Record<string, unknown>): void {
  setRecordPayload(input, objectId, patch);
}

function setAffordancePayload(input: BuildValidationSnapshotInput, id: string, patch: Record<string, unknown>): void {
  setRecordPayload(input, id, patch);
}

function setRecordPayload(input: BuildValidationSnapshotInput, id: string, patch: Record<string, unknown>): void {
  input.records = input.records.map((record) =>
    record.id === id ? { ...record, payload: { ...(record.payload as Record<string, unknown>), ...patch } } : record
  );
}

function setStateField(
  input: BuildValidationSnapshotInput,
  field: keyof NonNullable<BuildValidationSnapshotInput["generationSession"]["current_authoritative_state"]>,
  value: unknown
): void {
  input.generationSession.current_authoritative_state = {
    ...input.generationSession.current_authoritative_state!,
    [field]: value
  };
}

function setAllowedContentScope(input: BuildValidationSnapshotInput, allowedContentScope: string): void {
  input.storyConfig.universalContentPolicy = {
    ...input.storyConfig.universalContentPolicy!,
    allowed_content_scope: allowedContentScope
  };
}

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: objectId,
        type: "OBJECT",
        payload: {
          owner: entityId,
          carried_by: entityId,
          current_location: "carried_by_holder",
          visibility_to_pov: "visible",
          usable_affordances: ["unlock", "hand over"],
          constraints: ["requires consent"]
        }
      },
      affordance(affordanceUseId, ["use"]),
      affordance(affordanceTransferId, ["transfer"]),
      affordance(affordanceHarmId, ["harm"]),
      affordance(affordanceBondId, ["bond"]),
      {
        id: entityId,
        type: "ENTITY STATUS",
        payload: {
          entity_id: entityId,
          life: "alive",
          agency: "free",
          location: "019b0298-5c00-7000-8000-000000000111"
        }
      },
      {
        id: institutionId,
        type: "ENTITY",
        payload: {
          id: institutionId,
          entity_kind: "institution",
          short_description: "A local office with immediate authority."
        }
      },
      {
        id: "019b0298-5c00-7000-8000-000000000010",
        type: "RELATIONSHIP",
        payload: { status: "active", pressure_text: "Tense trust.", current_expression: "Careful distance." }
      },
      {
        id: "019b0298-5c00-7000-8000-000000000011",
        type: "CONSEQUENCE",
        payload: { status: "active", current_effect: "A bruise would change the next beat." }
      },
      {
        id: clockId,
        type: "CLOCK",
        payload: {
          status: "active",
          current_pressure: "The alarm is close.",
          tick_trigger: "Door opens.",
          next_threshold: "Alarm sounds.",
          possible_effects: ["guards arrive"]
        }
      },
      {
        id: obligationId,
        type: "OBLIGATION",
        payload: {
          status: "open",
          terms: "Return the key.",
          owed_by: [entityId],
          owed_to: "institution",
          visibility: "public",
          consequence_if_broken: "Sanction."
        }
      }
    ],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        immediate_situation_summary: "A is at the loading door while the key changes hands.",
        offstage_pressuring_entities: [institutionId],
        positions: "A stands by the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "A can see the door and key.",
        routes_and_exits: ["loading door", "phone call"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "Consent is uncertain; force is possible.",
        current_locks: [
          "resulting holder must be stated",
          "destination is the loading bay",
          "movement constraint: blocked roof exit",
          "power relationship: institution over A",
          "physical constraint: narrow doorway",
          "injury consequence: bruise changes the next beat",
          "authority relation: institution can sanction",
          "current opportunity: phone line is open",
          "clock tick cause: door opens",
          "obligation opportunity: A can refuse the key"
        ]
      },
      immediate_handoff: {
        recent_causal_context: "A arrived with the key.",
        last_visible_moment: "B noticed the key.",
        begin_after: "B noticing the key."
      },
      manual_moment_directive: {
        must_render: ["B asks for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: { soft_unit_guidance: "Stop after B's first response point." }
    },
    storyConfig: {
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      }
    },
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function affordance(id: string, actionFamilies: readonly string[]) {
  return {
    id,
    type: "VISIBLE AFFORDANCE",
    payload: {
      status: "available",
      action_families: actionFamilies,
      prompt_text: "A concrete available action."
    }
  };
}
