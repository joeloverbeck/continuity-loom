import {
  buildValidationSnapshot,
  DIAGNOSTIC_CODES,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationResult
} from "../src/index.js";
import { referentialBriefRules } from "../src/validation/rules/referential-brief.js";
import { warningRules } from "../src/validation/rules/warnings.js";
import { describe, expect, it } from "vitest";

const entityId = "019b0298-5c00-7000-8000-000000000301";
const locationId = "019b0298-5c00-7000-8000-000000000302";
const entityStatusId = "019b0298-5c00-7000-8000-000000000303";
const unselectedEntityId = "019b0298-5c00-7000-8000-000000000304";
const unselectedLocationId = "019b0298-5c00-7000-8000-000000000305";
const unselectedStatusId = "019b0298-5c00-7000-8000-000000000306";
const wrongTypeId = "019b0298-5c00-7000-8000-000000000307";
const danglingId = "019b0298-5c00-7000-8000-000000000308";

describe("generation-brief reference validation", () => {
  it("stays silent for selected coherent brief references and prose current location", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.entity_statuses = [entityStatusId];
    input.generationSession.current_authoritative_state!.current_location = "Warehouse floor";

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.onstageEntityReferenceInvalid);
    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.entityStatusesReferenceInvalid);
    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.currentLocationReferenceInvalid);
    expect(codes(result.warnings)).not.toContain(DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional);
  });

  it.each([
    ["dangling", danglingId],
    ["mistyped", wrongTypeId],
    ["unselected", unselectedEntityId]
  ])("blocks %s onstage entity references", (_name, id) => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.onstage_entities = [id];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.onstageEntityReferenceInvalid);
  });

  it.each([
    ["dangling", danglingId],
    ["mistyped", wrongTypeId]
  ])("blocks %s offstage pressure references even when the lane is optional", (_name, id) => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [id];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.offstageEntityReferenceInvalid);
  });

  it("blocks unselected offstage pressure references when offstage interruption is required", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [unselectedEntityId];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "offstage_interruption_possible"
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.offstageEntityReferenceInvalid);
  });

  it("warns for unselected offstage pressure references when the lane is optional", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [unselectedEntityId];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.offstageEntityReferenceInvalid);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional);
  });

  it.each([
    ["dangling", danglingId],
    ["mistyped", wrongTypeId]
  ])("blocks %s entity-status references even when the lane is optional", (_name, id) => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.entity_statuses = [id];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.entityStatusesReferenceInvalid);
  });

  it("blocks unselected entity-status references when current agency/status is required", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.entity_statuses = [unselectedStatusId];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "physical_interaction_expected"
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.entityStatusesReferenceInvalid);
  });

  it("warns for unselected entity-status references when the lane is optional", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.entity_statuses = [unselectedStatusId];

    const result = validate(input);

    expect(codes(result.blockers)).not.toContain(DIAGNOSTIC_CODES.entityStatusesReferenceInvalid);
    expect(codes(result.warnings)).toContain(DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional);
  });

  it.each([
    ["mistyped", wrongTypeId],
    ["unselected", unselectedLocationId]
  ])("blocks %s project-record current location references", (_name, id) => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.current_location = id;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.currentLocationReferenceInvalid);
  });

  it("treats a current-location value absent from the project index as prose", () => {
    const input = baseInput();
    input.generationSession.current_authoritative_state!.current_location = danglingId;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.currentLocationReferenceInvalid);
  });
});

function validate(input: BuildValidationSnapshotInput): ValidationResult {
  return runValidation(buildValidationSnapshot(input), [...referentialBriefRules, ...warningRules]);
}

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return validate(input).blockers.map((diagnostic) => diagnostic.code);
}

function codes(diagnostics: ValidationResult["blockers"]): readonly string[] {
  return diagnostics.map((diagnostic) => diagnostic.code);
}

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [
      record(entityId, "ENTITY"),
      record(locationId, "LOCATION"),
      record(entityStatusId, "ENTITY STATUS"),
      record(wrongTypeId, "FACT")
    ],
    generationSession: {
      active_working_set: {
        selected_records: [entityId, locationId, entityStatusId, wrongTypeId],
        active_onstage_cast_full: [],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: entityId
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: locationId,
        onstage_entities: [entityId],
        immediate_situation_summary: "The room is quiet.",
        offstage_pressuring_entities: [],
        positions: "Near the door.",
        possessions: "None.",
        visible_conditions: [],
        environmental_conditions: "Dry.",
        entity_statuses: "Everyone is awake.",
        line_of_sight_and_visibility: "Clear.",
        routes_and_exits: ["door"],
        available_time: "One exchange.",
        consent_or_force_conditions: "none",
        current_locks: []
      },
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
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
      [entityStatusId]: "ENTITY STATUS",
      [unselectedEntityId]: "ENTITY",
      [unselectedLocationId]: "LOCATION",
      [unselectedStatusId]: "ENTITY STATUS",
      [wrongTypeId]: "FACT"
    }
  };
}

function record(id: string, type: string) {
  return {
    id,
    type,
    payload: {}
  };
}
