import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

const entityId = "019b0298-5c00-7000-8000-000000000001";
const povId = "019b0298-5c00-7000-8000-000000000002";
const locationId = "019b0298-5c00-7000-8000-000000000003";
const castId = "019b0298-5c00-7000-8000-000000000004";
const unselectedEntityId = "019b0298-5c00-7000-8000-000000000005";
const unselectedStatusId = "019b0298-5c00-7000-8000-000000000006";
const danglingId = "019b0298-5c00-7000-8000-000000000999";

describe("validation stress-suite mapping", () => {
  it.each([
    ["two current locations", DIAGNOSTIC_CODES.entityCurrentLocationContradiction, twoLocations],
    ["two object holders", DIAGNOSTIC_CODES.objectCurrentHolderContradiction, twoObjectHolders],
    ["secret leakage", DIAGNOSTIC_CODES.secretRevealContradiction, secretLeakage],
    ["impossible physical action", DIAGNOSTIC_CODES.impossibleActionPhysicalContext, impossiblePhysicalAction],
    ["non-local directive", DIAGNOSTIC_CODES.localProseScopeViolation, nonLocalDirective],
    ["accepted-prose contamination", DIAGNOSTIC_CODES.promptFacingProseContamination, acceptedProseContamination],
    ["dangling onstage entity reference", DIAGNOSTIC_CODES.onstageEntityReferenceInvalid, danglingOnstageEntity],
    ["dangling offstage pressure reference", DIAGNOSTIC_CODES.offstageEntityReferenceInvalid, danglingOffstageEntity],
    ["dangling entity-status reference", DIAGNOSTIC_CODES.entityStatusesReferenceInvalid, danglingEntityStatusReference],
    ["unselected current-location reference", DIAGNOSTIC_CODES.currentLocationReferenceInvalid, unselectedCurrentLocation],
    ["cast-band duplicate membership", DIAGNOSTIC_CODES.castBandDuplicateMembership, duplicateCastBandMembership],
    ["cast-band dangling member", DIAGNOSTIC_CODES.castBandReferenceInvalid, danglingCastBandMember],
    ["selected POV dangling record", DIAGNOSTIC_CODES.selectedPovReferenceInvalid, danglingSelectedPov],
    ["voice-pressure dangling attachment", DIAGNOSTIC_CODES.voicePressureAttachmentInvalid, danglingVoicePressureAttachment],
    ["record-internal dangling reference", DIAGNOSTIC_CODES.recordReferenceDangling, danglingRecordInternalReference],
    ["record-internal type mismatch", DIAGNOSTIC_CODES.recordReferenceTypeMismatch, recordInternalTypeMismatch],
    ["migration unselected required secret holder", DIAGNOSTIC_CODES.recordReferenceUnselectedRequired, migrationUnselectedRequiredSecretHolder],
    ["onstage/offstage entity overlap", DIAGNOSTIC_CODES.onstageOffstageEntityOverlap, onstageOffstageOverlap],
    ["onstage entity status contradiction", DIAGNOSTIC_CODES.onstageEntityStatusContradiction, onstageEntityStatusContradiction],
    ["object carried-by-holder incoherence", DIAGNOSTIC_CODES.objectLocationHolderIncoherence, objectLocationHolderIncoherence],
    ["relationship self-reference", DIAGNOSTIC_CODES.relationshipSelfReference, relationshipSelfReference]
  ])("blocks representative hard-fail stress case: %s", (_name, code, mutate) => {
    const input = baseInput();
    mutate(input);
    const snapshot = buildValidationSnapshot(input);
    const first = runValidation(snapshot);
    const second = runValidation(snapshot);

    expect(first).toEqual(second);
    expect(first.isBlocked).toBe(true);
    expect(first.blockers.map((diagnostic) => diagnostic.code)).toContain(code);
  });

  it.each([
    ["optional offstage pressure unselected reference", DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional, optionalOffstageUnselected],
    ["optional entity-status unselected reference", DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional, optionalEntityStatusUnselected],
    ["voice pressure orphaned attachment", DIAGNOSTIC_CODES.voicePressureOrphanedAttachment, orphanedVoicePressure],
    ["record-internal optional unselected reference", DIAGNOSTIC_CODES.recordReferenceUnselectedOptional, optionalRecordInternalUnselected]
  ])("warns for representative stress case without blocking: %s", (_name, code, mutate) => {
    const input = warningReadyInput();
    mutate(input);
    const snapshot = buildValidationSnapshot(input);
    const first = runValidation(snapshot);
    const second = runValidation(snapshot);

    expect(first).toEqual(second);
    expect(first.isBlocked).toBe(false);
    expect(first.warnings.map((diagnostic) => diagnostic.code)).toContain(code);
  });
});

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [entityRecord(entityId), entityRecord(povId)],
    generationSession: {
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        immediate_situation_summary: "A is at the loading door while the key changes hands.",
        offstage_pressuring_entities: [],
        positions: "A stands near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "A can see the door.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["The roof exit is blocked."]
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
      current_cast_voice_pressure: [],
      cast_voice_overrides: [],
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
      storyContract: {
        title: "Continuity Test",
        premise: "A city keeps its promises badly.",
        genre_mode: "urban fantasy",
        tone: "tense and intimate",
        setting_baseline: "Rainy districts under old bargains.",
        content_intensity: "mature",
        explicitness: "Render mature material only when earned.",
        language_register: "controlled contemporary prose",
      },
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      },
      proseMode: {
        pov_character: povId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" },
    projectRecordIndex: {
      [entityId]: "ENTITY",
      [povId]: "ENTITY"
    }
  };
}

function warningReadyInput(): BuildValidationSnapshotInput {
  const input = baseInput();
  input.storyConfig.proseMode = {
    ...input.storyConfig.proseMode!,
    pov_character: "omniscient"
  };
  input.generationSession.current_authoritative_state = {
    ...input.generationSession.current_authoritative_state!,
    current_location: locationId,
    entity_statuses: []
  };
  input.records = [entityRecord(entityId), entityRecord(povId), locationRecord(locationId)];
  input.projectRecordIndex = {
    [entityId]: "ENTITY",
    [povId]: "ENTITY",
    [locationId]: "LOCATION",
    [unselectedEntityId]: "ENTITY",
    [unselectedStatusId]: "ENTITY STATUS",
    [castId]: "CAST MEMBER"
  };

  return input;
}

function twoLocations(input: BuildValidationSnapshotInput): void {
  input.records = [
    entityStatus("019b0298-5c00-7000-8000-000000000101", "019b0298-5c00-7000-8000-000000000201"),
    entityStatus("019b0298-5c00-7000-8000-000000000102", "019b0298-5c00-7000-8000-000000000202")
  ];
}

function twoObjectHolders(input: BuildValidationSnapshotInput): void {
  input.records = [
    {
      id: "019b0298-5c00-7000-8000-000000000103",
      type: "OBJECT",
      payload: {
        owner: "019b0298-5c00-7000-8000-000000000301",
        carried_by: "019b0298-5c00-7000-8000-000000000302"
      }
    }
  ];
}

function secretLeakage(input: BuildValidationSnapshotInput): void {
  input.generationSession.active_working_set = {
    selected_records: [],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [],
    selected_pov: povId
  };
  input.records = [
    {
      id: "019b0298-5c00-7000-8000-000000000104",
      type: "SECRET",
      payload: {
        status: "hidden",
        secret_claim: "The watcher is behind the glass.",
        holders: [povId],
        non_holders_to_protect: [povId],
        pov_access: "hidden",
        audience_visibility: "hidden",
        allowed_surface_cues: ["a chill"],
        forbidden_reveals: ["Do not name the watcher."],
        reveal_permission: "locked"
      }
    }
  ];
}

function impossiblePhysicalAction(input: BuildValidationSnapshotInput): void {
  input.generationSession.generation_validation_focus = {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: ["physical_interaction_expected"],
      possible_durable_changes: []
    }
  };
  input.generationSession.current_authoritative_state = {
    ...input.generationSession.current_authoritative_state!,
    consent_or_force_conditions: ""
  };
}

function nonLocalDirective(input: BuildValidationSnapshotInput): void {
  input.generationSession.manual_moment_directive = {
    must_render: ["Write the whole chapter outline."],
    may_render_if_naturally_caused: [],
    do_not_force: []
  };
}

function acceptedProseContamination(input: BuildValidationSnapshotInput): void {
  input.generationSession.immediate_handoff = {
    ...input.generationSession.immediate_handoff!,
    recent_causal_context: "This includes copied accepted prose from the prior candidate."
  };
}

function danglingOnstageEntity(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.onstage_entities = [danglingId];
}

function danglingOffstageEntity(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [danglingId];
}

function danglingEntityStatusReference(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.entity_statuses = [danglingId];
}

function unselectedCurrentLocation(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.current_location = locationId;
  input.projectRecordIndex = {
    ...input.projectRecordIndex,
    [locationId]: "LOCATION"
  };
}

function duplicateCastBandMembership(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, castRecord(castId)];
  input.projectRecordIndex = {
    ...input.projectRecordIndex,
    [castId]: "CAST MEMBER"
  };
  input.generationSession.active_working_set = {
    selected_records: [castId],
    active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
    present_minor_cast_compressed: [castId],
    offstage_relevant_cast: [],
    selected_pov: "omniscient"
  };
}

function danglingCastBandMember(input: BuildValidationSnapshotInput): void {
  input.generationSession.active_working_set = {
    selected_records: [],
    active_onstage_cast_full: [{ cast_member_id: danglingId, local_function: "active_speaker" }],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [],
    selected_pov: "omniscient"
  };
}

function danglingSelectedPov(input: BuildValidationSnapshotInput): void {
  input.storyConfig.proseMode = {
    ...input.storyConfig.proseMode!,
    pov_character: "variable"
  };
  input.generationSession.active_working_set = {
    selected_records: [],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [],
    selected_pov: danglingId
  };
}

function danglingVoicePressureAttachment(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_cast_voice_pressure = [voicePressure(danglingId)];
}

function danglingRecordInternalReference(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, beliefRecord(danglingId)];
}

function recordInternalTypeMismatch(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, objectRecord({ current_location: entityId })];
}

function migrationUnselectedRequiredSecretHolder(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, secretRecord([unselectedEntityId])];
  input.projectRecordIndex = {
    ...input.projectRecordIndex,
    [unselectedEntityId]: "ENTITY"
  };
}

function onstageOffstageOverlap(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [entityId];
}

function onstageEntityStatusContradiction(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, entityStatus("019b0298-5c00-7000-8000-000000000107", "offstage")];
}

function objectLocationHolderIncoherence(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, objectRecord({ current_location: "carried_by_holder", carried_by: "none" })];
}

function relationshipSelfReference(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, relationshipRecord(entityId, entityId)];
}

function optionalOffstageUnselected(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [unselectedEntityId];
}

function optionalEntityStatusUnselected(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.entity_statuses = [unselectedStatusId];
}

function orphanedVoicePressure(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_cast_voice_pressure = [voicePressure(castId)];
}

function optionalRecordInternalUnselected(input: BuildValidationSnapshotInput): void {
  input.records = [...input.records, relationshipRecord(unselectedEntityId, entityId)];
}

function entityRecord(id: string) {
  return {
    id,
    type: "ENTITY",
    payload: {
      id,
      display_name: id,
      entity_kind: "person",
      roles_in_story: ["primary_actor"],
      short_description: "A selected entity."
    }
  };
}

function locationRecord(id: string) {
  return {
    id,
    type: "LOCATION",
    payload: {
      id,
      status: "active",
      label: "Warehouse",
      description: "A rain-dark warehouse.",
      layout_relevant_now: "One loading door.",
      access_routes: [],
      visibility_and_sound: "Dim.",
      hazards_or_shelters: [],
      social_rules: []
    }
  };
}

function castRecord(id: string) {
  return {
    id,
    type: "CAST MEMBER",
    payload: {
      entity_id: entityId
    }
  };
}

function beliefRecord(holder: string) {
  return {
    id: "019b0298-5c00-7000-8000-000000000108",
    type: "BELIEF",
    payload: {
      holder
    }
  };
}

function secretRecord(holders: string[]) {
  return {
    id: "019b0298-5c00-7000-8000-000000000109",
    type: "SECRET",
    payload: {
      status: "hidden",
      holders,
      non_holders_to_protect: "none"
    }
  };
}

function objectRecord(overrides: Partial<{ current_location: string; carried_by: string }> = {}) {
  return {
    id: "019b0298-5c00-7000-8000-000000000110",
    type: "OBJECT",
    payload: {
      owner: "none",
      carried_by: "unknown",
      current_location: locationId,
      ...overrides
    }
  };
}

function relationshipRecord(from: string, to: string) {
  return {
    id: "019b0298-5c00-7000-8000-000000000111",
    type: "RELATIONSHIP",
    payload: {
      from,
      to
    }
  };
}

function voicePressure(castMemberId: string) {
  return {
    cast_member_id: castMemberId,
    current_voice_pressure: "Clipped.",
    dialogue_pressure: "Direct.",
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: "none",
    current_must_preserve: [],
    current_must_avoid: []
  };
}

function entityStatus(id: string, location: string) {
  return {
    id,
    type: "ENTITY STATUS",
    payload: {
      entity_id: entityId,
      life: "alive",
      agency: "free",
      location
    }
  };
}
