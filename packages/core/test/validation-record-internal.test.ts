import {
  buildValidationSnapshot,
  DIAGNOSTIC_CODES,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord,
  type ValidationResult
} from "../src/index.js";
import {
  expectedRecordReferenceTypes,
  isRecordReferenceRequired,
  recordInternalReferences,
  recordInternalReferenceRules
} from "../src/validation/rules/record-internal.js";
import { warningRules } from "../src/validation/rules/warnings.js";
import { describe, expect, it } from "vitest";

const sourceId = "019b0298-5c00-7000-8000-000000000501";
const entityId = "019b0298-5c00-7000-8000-000000000502";
const locationId = "019b0298-5c00-7000-8000-000000000503";
const unselectedEntityId = "019b0298-5c00-7000-8000-000000000504";
const wrongTypeId = "019b0298-5c00-7000-8000-000000000505";
const danglingId = "019b0298-5c00-7000-8000-000000000506";

describe("record-internal reference validation", () => {
  it("stays silent for selected coherent record references", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "BELIEF", beliefPayload(entityId))];

    const result = validate(input);

    expect(result.blockers).toEqual([]);
    expect(codes(result.warnings)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
  });

  it("blocks extracted references that are absent from the project index", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "BELIEF", beliefPayload(danglingId))];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.recordReferenceDangling);
  });

  it("blocks extracted references that resolve to the wrong lane type", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "OBJECT", objectPayload({ current_location: wrongTypeId }))];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.recordReferenceTypeMismatch);
  });

  it("blocks unselected references in required record-internal lanes", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "SECRET", secretPayload({ holders: [unselectedEntityId] }))];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
  });

  it("does not require unselected secret references when the secret is inactive", () => {
    const input = baseInput();
    input.records = [
      ...input.records,
      record(sourceId, "SECRET", secretPayload({ holders: [unselectedEntityId], status: "resolved" }))
    ];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
  });

  it("treats hidden-plan holder references as required when the focus demands hidden plan behavior", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "PLAN", planPayload({ holder: unselectedEntityId }))];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "non_pov_hidden_plan_behavior"
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
  });

  it("requires selected active PLAN holder references without a prose-driving flag", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "PLAN", planPayload({ holder: unselectedEntityId }))];
    input.generationSession.active_working_set!.selected_records = [
      ...input.generationSession.active_working_set!.selected_records,
      sourceId
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
  });

  it("allows optional PLAN holder references when the plan is inactive and unselected", () => {
    const input = baseInput();
    input.records = [
      ...input.records,
      record(sourceId, "PLAN", planPayload({ holder: unselectedEntityId, plan_status: "abandoned" }))
    ];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
  });

  it("allows optional PLAN holder references when the plan is inactive but selected", () => {
    const input = baseInput();
    input.records = [
      ...input.records,
      record(sourceId, "PLAN", planPayload({ holder: unselectedEntityId, plan_status: "abandoned" }))
    ];
    input.generationSession.active_working_set!.selected_records = [
      ...input.generationSession.active_working_set!.selected_records,
      sourceId
    ];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
  });

  it("does not require PLAN holder references when hidden-plan focus tags are absent", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "PLAN", planPayload({ holder: unselectedEntityId }))];
    delete input.generationSession.generation_validation_focus;

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
  });

  it("allows OBJECT current_location to target an object container", () => {
    const input = baseInput();
    const containerId = "019b0298-5c00-7000-8000-000000000507";
    input.records = [
      ...input.records,
      record(containerId, "OBJECT", objectPayload({ current_location: locationId })),
      record(sourceId, "OBJECT", objectPayload({ current_location: containerId }))
    ];
    input.projectRecordIndex = {
      ...input.projectRecordIndex,
      [containerId]: "OBJECT"
    };

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.recordReferenceTypeMismatch);
  });

  it("warns without blocking for unselected references in optional record-internal lanes", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "RELATIONSHIP", relationshipPayload({ from: unselectedEntityId, to: entityId }))];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedRequired);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.recordReferenceUnselectedOptional);
    expect(result.isBlocked).toBe(false);
  });

  it("ignores extracted references with blank target ids", () => {
    const input = baseInput();
    input.records = [...input.records, record(sourceId, "BELIEF", beliefPayload(""))];

    const snapshot = buildValidationSnapshot(input);

    expect(recordInternalReferences(snapshot)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRecord: expect.objectContaining({ id: sourceId })
        })
      ])
    );
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.recordReferenceDangling);
  });

  it("exposes role-specific expected target types", () => {
    expect(expectedRecordReferenceTypes("current_location", record(sourceId, "OBJECT", {}) as ValidationRecord)).toEqual([
      "LOCATION",
      "OBJECT"
    ]);
    expect(expectedRecordReferenceTypes("current_location", record(sourceId, "ENTITY STATUS", {}) as ValidationRecord)).toEqual([
      "LOCATION"
    ]);
    expect(expectedRecordReferenceTypes("holder", record(sourceId, "PLAN", {}) as ValidationRecord)).toEqual(["ENTITY", "CAST MEMBER"]);
  });

  it.each([
    ["hidden secret holder", record(sourceId, "SECRET", secretPayload({ status: "hidden" })), "secret_holder", true],
    [
      "partially revealed protected non-holder",
      record(sourceId, "SECRET", secretPayload({ status: "partially_revealed" })),
      "non_holder_to_protect",
      true
    ],
    ["revealed secret holder", record(sourceId, "SECRET", secretPayload({ status: "revealed" })), "secret_holder", true],
    ["resolved secret holder", record(sourceId, "SECRET", secretPayload({ status: "resolved" })), "secret_holder", false],
    ["non-secret secret-holder role", record(sourceId, "BELIEF", beliefPayload(entityId)), "secret_holder", false],
    ["selected active plan holder", record(sourceId, "PLAN", planPayload()), "holder", true],
    ["selected inactive plan holder", record(sourceId, "PLAN", planPayload({ plan_status: "abandoned" })), "holder", false],
    ["selected active plan participant", record(sourceId, "PLAN", planPayload()), "participant", false]
  ])("classifies required-reference status for %s", (_name, sourceRecord, refRole, expected) => {
    const input = baseInput();
    input.records = [...input.records, sourceRecord];
    input.generationSession.active_working_set!.selected_records = [
      ...input.generationSession.active_working_set!.selected_records,
      sourceId
    ];
    const snapshot = buildValidationSnapshot(input);

    expect(isRecordReferenceRequired(snapshot, sourceRecord as ValidationRecord, refRole)).toBe(expected);
  });
});

function validate(input: BuildValidationSnapshotInput): ValidationResult {
  return runValidation(buildValidationSnapshot(input), [...recordInternalReferenceRules, ...warningRules]);
}

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return codes(validate(input).blockers);
}

function codes(diagnostics: ValidationResult["blockers"]): readonly string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [
      record(entityId, "ENTITY", { id: entityId }),
      record(locationId, "LOCATION", { id: locationId }),
      record(wrongTypeId, "FACT", { id: wrongTypeId, known_by: "public" })
    ],
    generationSession: {
      active_working_set: {
        selected_records: [entityId, locationId, wrongTypeId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: entityId
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
      manual_moment_directive: { must_render: [], may_render_if_naturally_caused: [], do_not_force: [] },
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: [],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      }
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
    },
    projectRecordIndex: {
      [entityId]: "ENTITY",
      [locationId]: "LOCATION",
      [unselectedEntityId]: "ENTITY",
      [wrongTypeId]: "FACT"
    }
  };
}

function record(id: string, type: string, payload: unknown) {
  return {
    id,
    type,
    payload
  };
}

function beliefPayload(holder: string) {
  return {
    id: sourceId,
    status: "active",
    holder,
    claim: "The door is watched.",
    belief_mode: "believes",
    truth_relation: "unknown",
    confidence: "medium",
    visibility: "private",
    access_route: "inference",
    behavioral_effect: "They hesitate.",
    salience: "medium"
  };
}

function objectPayload(overrides: Partial<{ current_location: string }> = {}) {
  return {
    id: sourceId,
    status: "active",
    label: "Key",
    description: "A brass key.",
    owner: "none",
    carried_by: "none",
    current_location: locationId,
    visibility_to_pov: "visible",
    usable_affordances: [],
    constraints: [],
    durability: "continuity_relevant",
    ...overrides
  };
}

function secretPayload(overrides: Partial<{ holders: string[]; status: string }> = {}) {
  return {
    id: sourceId,
    status: "hidden",
    secret_kind: "identity",
    secret_claim: "The witness is using an alias.",
    holders: [entityId],
    non_holders_to_protect: "none",
    audience_visibility: "hidden",
    pov_access: "hidden",
    salience: "critical",
    allowed_surface_cues: [],
    forbidden_reveals: [],
    reveal_permission: "locked",
    reveal_triggers: [],
    clue_carriers: [],
    ...overrides
  };
}

function planPayload(overrides: Partial<{ holder: string; plan_status: string }> = {}) {
  return {
    id: sourceId,
    plan_status: "active",
    holder: entityId,
    objective: "Reach the roof.",
    resources: [],
    blockers: [],
    current_step: "Find the stairs.",
    fallback_steps: [],
    visibility_to_pov: "hidden",
    salience: "high",
    ...overrides
  };
}

function relationshipPayload(overrides: Partial<{ from: string; to: string }> = {}) {
  return {
    id: sourceId,
    status: "active",
    axis: "trust",
    direction_kind: "directed",
    from: entityId,
    to: entityId,
    value: "medium",
    valence: "asymmetric",
    visibility: "private",
    description: "A guarded alliance.",
    pressure_text: "Trust is conditional.",
    current_expression: "Careful cooperation.",
    ...overrides
  };
}
