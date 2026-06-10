import {
  buildValidationSnapshot,
  DIAGNOSTIC_CODES,
  relationshipSchema,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationResult
} from "../src/index.js";
import { structuralContradictionRules } from "../src/validation/rules/structural-contradiction.js";
import { describe, expect, it } from "vitest";

const entityId = "019b0298-5c00-7000-8000-000000000701";
const otherEntityId = "019b0298-5c00-7000-8000-000000000702";
const locationId = "019b0298-5c00-7000-8000-000000000703";
const otherLocationId = "019b0298-5c00-7000-8000-000000000704";
const recordId = "019b0298-5c00-7000-8000-000000000705";

describe("structural contradiction validation", () => {
  it("blocks entities that are both onstage and offstage-pressuring", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [entityId];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.onstageOffstageEntityOverlap);
  });

  it.each(["offstage", "concealed"])("blocks onstage entity statuses with %s locations", (location) => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location })];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it("blocks onstage entity statuses at a different record-id current location", () => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location: otherLocationId })];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it.each(["unknown", "not_applicable"])("allows onstage entity status location sentinel %s", (location) => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location })];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it("allows onstage entity status location checks when scene current location is prose", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.current_location = "north stair";
    input.records = [...input.records, entityStatus({ location: otherLocationId })];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it("blocks carried-by-holder object location when carried_by is none", () => {
    const input = baseInput();
    input.records = [...input.records, objectRecord({ current_location: "carried_by_holder", carried_by: "none" })];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.objectLocationHolderIncoherence);
  });

  it("allows carried-by-holder object location when carried_by is unknown", () => {
    const input = baseInput();
    input.records = [...input.records, objectRecord({ current_location: "carried_by_holder", carried_by: "unknown" })];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.objectLocationHolderIncoherence);
  });

  it("blocks relationship self-reference without making the schema reject the record", () => {
    const payload = relationshipPayload({ from: entityId, to: entityId });
    const input = baseInput();
    input.records = [...input.records, record(recordId, "RELATIONSHIP", payload)];

    expect(() => relationshipSchema.parse(payload)).not.toThrow();
    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.relationshipSelfReference);
  });

  it("stays silent for structurally coherent selected records", () => {
    const input = baseInput();
    input.records = [
      ...input.records,
      entityStatus({ location: locationId }),
      objectRecord({ current_location: "carried_by_holder", carried_by: entityId }),
      record(recordId, "RELATIONSHIP", relationshipPayload({ from: entityId, to: otherEntityId }))
    ];

    expect(validate(input).blockers).toEqual([]);
  });
});

function validate(input: BuildValidationSnapshotInput): ValidationResult {
  return runValidation(buildValidationSnapshot(input), structuralContradictionRules);
}

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return validate(input).blockers.map((diagnostic) => diagnostic.code);
}

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
      current_authoritative_state: {
        current_time: "Night.",
        current_location: locationId,
        onstage_entities: [entityId],
        immediate_situation_summary: "A waits by the door.",
        offstage_pressuring_entities: [],
        positions: "Near the door.",
        possessions: "None.",
        visible_conditions: [],
        environmental_conditions: "Dry.",
        entity_statuses: [],
        line_of_sight_and_visibility: "Clear.",
        routes_and_exits: ["door"],
        available_time: "One exchange.",
        consent_or_force_conditions: "none",
        current_locks: []
      }
    },
    storyConfig: {},
    versions: {
      template: "1.0.0",
      compiler: "1.0.0",
      contract: "1.0.0"
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

function entityStatus(overrides: Partial<{ location: string }> = {}) {
  return record(recordId, "ENTITY STATUS", {
    entity_id: entityId,
    life: "alive",
    agency: "free",
    location: locationId,
    visibility_to_pov: "visible",
    current_activity: "Listening.",
    ...overrides
  });
}

function objectRecord(overrides: Partial<{ current_location: string; carried_by: string }> = {}) {
  return record(recordId, "OBJECT", {
    id: recordId,
    status: "active",
    label: "Key",
    description: "A brass key.",
    owner: "none",
    carried_by: entityId,
    current_location: "carried_by_holder",
    visibility_to_pov: "visible",
    usable_affordances: [],
    constraints: [],
    durability: "continuity_relevant",
    ...overrides
  });
}

function relationshipPayload(overrides: Partial<{ from: string; to: string }> = {}) {
  return {
    id: recordId,
    status: "active",
    axis: "trust",
    direction_kind: "directed",
    from: entityId,
    to: otherEntityId,
    value: "medium",
    valence: "asymmetric",
    visibility: "private",
    description: "A guarded alliance.",
    pressure_text: "Trust is conditional.",
    current_expression: "Careful cooperation.",
    ...overrides
  };
}
