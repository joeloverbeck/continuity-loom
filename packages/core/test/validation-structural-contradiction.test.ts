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

    expect(findBlocker(input, DIAGNOSTIC_CODES.onstageOffstageEntityOverlap)).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
      affected: [{ field: "generationSession.current_authoritative_state.onstage_entities/offstage_pressuring_entities" }],
      message: "The same entity is both onstage and offstage-pressuring in current authoritative state.",
      whyItMatters: "A selected entity cannot be physically present and offstage-pressuring in the same local moment without an explicit state distinction.",
      suggestedActions: ["revise", "remove", "deselect"]
    });
  });

  it.each(["offstage", "concealed"])("blocks onstage entity statuses with %s locations", (location) => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location })];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it("emits exact diagnostic copy for offstage onstage-entity status", () => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location: "offstage" })];

    expect(findBlocker(input, DIAGNOSTIC_CODES.onstageEntityStatusContradiction)).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
      affected: [{ recordId, field: "ENTITY STATUS.location" }],
      message: "An onstage entity has a selected status placing it offstage or concealed.",
      whyItMatters: "Onstage participation requires physical continuity that does not contradict the selected entity status.",
      suggestedActions: ["revise", "remove", "deselect"]
    });
  });

  it("blocks onstage entity statuses at a different record-id current location", () => {
    const input = baseInput();
    input.records = [...input.records, entityStatus({ location: otherLocationId })];

    expect(findBlocker(input, DIAGNOSTIC_CODES.onstageEntityStatusContradiction)).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
      affected: [{ recordId, field: "ENTITY STATUS.location" }],
      message: "An onstage entity status places the entity at a different current location than the scene.",
      whyItMatters: "The prompt cannot deterministically render an onstage entity in two different current locations.",
      suggestedActions: ["revise", "remove", "deselect"]
    });
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

  it.each([
    ["non-status record", record(recordId, "FACT", { entity_id: entityId, location: "offstage" })],
    ["missing entity id", entityStatus({ entity_id: undefined } as never)],
    ["blank entity id with contradictory location", entityStatus({ entity_id: "", location: "offstage" } as never)],
    ["unselected entity id", entityStatus({ entity_id: otherEntityId } as never)],
    ["missing location", entityStatus({ location: undefined } as never)],
    ["array payload", record(recordId, "ENTITY STATUS", [entityId, "offstage"])]
  ])("does not inspect %s as an onstage entity-status contradiction", (_name, candidate) => {
    const input = baseInput();
    input.records = [...input.records, candidate];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.onstageEntityStatusContradiction);
  });

  it("blocks carried-by-holder object location when carried_by is none", () => {
    const input = baseInput();
    input.records = [...input.records, objectRecord({ current_location: "carried_by_holder", carried_by: "none" })];

    expect(findBlocker(input, DIAGNOSTIC_CODES.objectLocationHolderIncoherence)).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
      affected: [{ recordId, field: "OBJECT.current_location/carried_by" }],
      message: "Object current_location says it is carried by its holder, but carried_by is none.",
      whyItMatters: "Object location and holder state must agree before physical use, transfer, or possession can compile deterministically.",
      suggestedActions: ["revise", "remove", "deselect"]
    });
  });

  it("allows carried-by-holder object location when carried_by is unknown", () => {
    const input = baseInput();
    input.records = [...input.records, objectRecord({ current_location: "carried_by_holder", carried_by: "unknown" })];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.objectLocationHolderIncoherence);
  });

  it.each([
    ["non-object record", record(recordId, "FACT", { current_location: "carried_by_holder", carried_by: "none" })],
    ["array payload", record(recordId, "OBJECT", ["carried_by_holder", "none"])],
    ["different location", objectRecord({ current_location: "shelf", carried_by: "none" })]
  ])("does not inspect %s as object holder/location incoherence", (_name, candidate) => {
    const input = baseInput();
    input.records = [...input.records, candidate];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.objectLocationHolderIncoherence);
  });

  it("blocks relationship self-reference without making the schema reject the record", () => {
    const payload = relationshipPayload({ from: entityId, to: entityId });
    const input = baseInput();
    input.records = [...input.records, record(recordId, "RELATIONSHIP", payload)];

    expect(() => relationshipSchema.parse(payload)).not.toThrow();
    expect(findBlocker(input, DIAGNOSTIC_CODES.relationshipSelfReference)).toEqual({
      severity: "blocker",
      code: DIAGNOSTIC_CODES.relationshipSelfReference,
      affected: [{ recordId, field: "RELATIONSHIP.from/to" }],
      message: "Relationship endpoints reference the same record.",
      whyItMatters: "A relationship record must model pressure between distinct endpoints; self-reference makes the social pressure ambiguous.",
      suggestedActions: ["revise", "remove", "deselect"]
    });
  });

  it.each([
    ["non-relationship record", record(recordId, "FACT", relationshipPayload({ from: entityId, to: entityId }))],
    ["missing from endpoint", record(recordId, "RELATIONSHIP", relationshipPayload({ from: "" }))],
    ["blank endpoints", record(recordId, "RELATIONSHIP", relationshipPayload({ from: "", to: "" }))],
    ["array payload", record(recordId, "RELATIONSHIP", [entityId, entityId])]
  ])("does not inspect %s as relationship self-reference", (_name, candidate) => {
    const input = baseInput();
    input.records = [...input.records, candidate];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.relationshipSelfReference);
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

function findBlocker(input: BuildValidationSnapshotInput, code: string) {
  return validate(input).blockers.find((diagnostic) => diagnostic.code === code);
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
