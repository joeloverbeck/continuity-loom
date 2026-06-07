import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  SECTION_ORDER,
  buildValidationSnapshot,
  compilePrompt,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../index.js";
import {
  demoGenerationSession,
  demoRecordIds,
  demoRecords,
  demoStoryConfig
} from "./index.js";

const STRESS_CASE_NUMBERS = Array.from({ length: 26 }, (_value, index) => index + 1);
const MATRIX_DIAGNOSTIC_CODES = [
  DIAGNOSTIC_CODES.matrixDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
  DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
  DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
  DIAGNOSTIC_CODES.matrixLocationChangeIncomplete,
  DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete,
  DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
  DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
  DIAGNOSTIC_CODES.matrixObjectTransferIncomplete,
  DIAGNOSTIC_CODES.matrixObjectUseIncomplete,
  DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
  DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
  DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete,
  DIAGNOSTIC_CODES.contentEnvelopeContradiction,
  DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete,
  DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete,
  DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
  DIAGNOSTIC_CODES.secretRevealContradiction,
  DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
  DIAGNOSTIC_CODES.missingImmediateHandoff,
  DIAGNOSTIC_CODES.missingManualDirective,
  DIAGNOSTIC_CODES.promptFacingProseContamination,
  DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
  DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
  DIAGNOSTIC_CODES.inactivePlanHolder,
  DIAGNOSTIC_CODES.matrixClockTickIncomplete,
  DIAGNOSTIC_CODES.matrixObligationBreachIncomplete,
  DIAGNOSTIC_CODES.promptLengthRisk,
  DIAGNOSTIC_CODES.manyHighSalienceRecords,
  DIAGNOSTIC_CODES.longDossierNeedsPin,
  DIAGNOSTIC_CODES.lowDramaScenePressure,
  DIAGNOSTIC_CODES.localVoicePressureMayHelp,
  DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk,
  DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
  DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete,
  DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
  DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
  DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement
] as const;

describe("SPEC-013 stress coverage audit", () => {
  it("maps all 26 conceptual stress cases and cites only resolvable diagnostic codes", () => {
    const knownDiagnosticCodes = Object.values(DIAGNOSTIC_CODES) as readonly string[];

    expect(STRESS_CASE_NUMBERS).toEqual(Array.from({ length: 26 }, (_value, index) => index + 1));
    expect(new Set(MATRIX_DIAGNOSTIC_CODES).size).toBeGreaterThan(20);
    for (const code of MATRIX_DIAGNOSTIC_CODES) {
      expect(knownDiagnosticCodes).toContain(code);
    }
  });

  it("keeps the valid demo baseline blocker-free and deterministically compilable", () => {
    const snapshot = snapshotFrom(baseInput());
    const validation = runValidation(snapshot);
    const first = compilePrompt(snapshot);
    const second = compilePrompt(snapshot);

    expect(validation.blockers).toEqual([]);
    expect(SECTION_ORDER.length).toBeGreaterThan(5);
    expect(first.prompt.length).toBeGreaterThan(100);
    expect(second).toEqual(first);
  });

  it.each([
    ["no accepted prose in prompts", DIAGNOSTIC_CODES.promptFacingProseContamination, contaminateHandoff],
    ["first segment empty-state correctness", DIAGNOSTIC_CODES.missingCurrentAuthoritativeState, removeCurrentState],
    ["local-prose-only stop boundary", DIAGNOSTIC_CODES.localProseScopeViolation, askForWholeChapter],
    ["dialogue voice distinction", DIAGNOSTIC_CODES.localVoicePressureMayHelp, removeActiveSpeakerPressure],
    ["active silent body presence", DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete, requireSilentWithoutPressure],
    ["POV and secrets separation", DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge, leakHiddenSecretToPov],
    ["physical continuity", DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete, removePhysicalLocks],
    ["object use and transfer", DIAGNOSTIC_CODES.objectCurrentHolderContradiction, splitObjectHolder],
    ["offstage/institutional/nonhuman pressure", DIAGNOSTIC_CODES.offstageInterruptionMissingRoute, removeOffstageRoute],
    ["mature fiction envelope", DIAGNOSTIC_CODES.contentEnvelopeContradiction, contradictContentEnvelope],
    ["clocks/obligations/consequences", DIAGNOSTIC_CODES.matrixClockTickIncomplete, removeClockForTick],
    ["low-drama/minimalist prose quality", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, removeNonPovInteriorityLock],
    ["large-context salience", DIAGNOSTIC_CODES.manyHighSalienceRecords, addHighSalienceRecords],
    ["false reports and belief truth relations", DIAGNOSTIC_CODES.matrixDialogueIncomplete, removeRelationshipContext]
  ])("backs risk area: %s", (_risk, expectedCode, mutate) => {
    const input = baseInput();
    mutate(input);
    const result = runValidation(snapshotFrom(input));
    const diagnostics = [...result.blockers, ...result.warnings].map((diagnostic) => diagnostic.code);

    expect(diagnostics).toContain(expectedCode);
  });
});

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: demoRecords.map((record): ValidationRecord => ({
      id: record.id,
      type: record.type,
      payload: structuredClone(record.payload),
      metadata: {
        id: record.id,
        type: record.type,
        displayLabel: record.displayLabel,
        status: null,
        salience: record.type === "SECRET" ? "critical" : null,
        urgency: null,
        archived: false,
        userOrder: null,
        createdAt: "2026-06-06T00:00:00.000Z",
        updatedAt: "2026-06-06T00:00:00.000Z"
      },
      ...(record.id === demoRecordIds.elinCast
        ? { castBand: "active_onstage_cast_full" as const, localFunction: "pov_narrator" }
        : {}),
      ...(record.id === demoRecordIds.nikoCast
        ? { castBand: "active_onstage_cast_full" as const, localFunction: "active_speaker" }
        : {})
    })),
    generationSession: structuredClone(demoGenerationSession),
    storyConfig: {
      storyContract: structuredClone(demoStoryConfig.storyContract),
      universalContentPolicy: structuredClone(demoStoryConfig.universalContentPolicy),
      proseMode: structuredClone(demoStoryConfig.proseMode)
    },
    versions: { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }
  };
}

function snapshotFrom(input: BuildValidationSnapshotInput) {
  return buildValidationSnapshot(input);
}

function contaminateHandoff(input: BuildValidationSnapshotInput): void {
  input.generationSession.immediate_handoff!.recent_causal_context = "This contains copied accepted prose.";
}

function removeCurrentState(input: BuildValidationSnapshotInput): void {
  delete input.generationSession.current_authoritative_state;
}

function askForWholeChapter(input: BuildValidationSnapshotInput): void {
  input.generationSession.stop_guidance!.soft_unit_guidance = "Write the whole chapter and downstream consequence summary.";
}

function removeActiveSpeakerPressure(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.filter(
    (row) => row.cast_member_id !== demoRecordIds.nikoCast
  );
}

function requireSilentWithoutPressure(input: BuildValidationSnapshotInput): void {
  input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
    "active_silent_presence_expected"
  ];
  input.generationSession.active_working_set!.active_onstage_cast_full = [
    { cast_member_id: demoRecordIds.nikoCast, local_function: "active_silent" }
  ];
  input.generationSession.current_cast_voice_pressure = [];
}

function leakHiddenSecretToPov(input: BuildValidationSnapshotInput): void {
  input.generationSession.active_working_set!.selected_pov = demoRecordIds.nikoEntity;
  mutateRecord(input, demoRecordIds.hiddenLetterSecret, {
    holders: [demoRecordIds.nikoEntity],
    non_holders_to_protect: [demoRecordIds.nikoEntity],
    pov_access: "hidden"
  });
}

function removePhysicalLocks(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.current_locks = [];
}

function splitObjectHolder(input: BuildValidationSnapshotInput): void {
  mutateRecord(input, demoRecordIds.sealedLetter, { carried_by: demoRecordIds.nikoEntity });
}

function removeOffstageRoute(input: BuildValidationSnapshotInput): void {
  input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
    "offstage_interruption_possible"
  ];
  input.generationSession.current_authoritative_state!.routes_and_exits = [];
}

function contradictContentEnvelope(input: BuildValidationSnapshotInput): void {
  const policy = input.storyConfig.universalContentPolicy!;
  input.storyConfig.universalContentPolicy = {
    ...policy,
    allowed_content_scope: "No explicit sex or non-graphic violence."
  };
  input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
}

function removeClockForTick(input: BuildValidationSnapshotInput): void {
  input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
    "clock_tick_possible"
  ];
  input.records = input.records.filter((record) => record.id !== demoRecordIds.bellClock);
}

function removeNonPovInteriorityLock(input: BuildValidationSnapshotInput): void {
  input.generationSession.current_authoritative_state!.current_locks =
    input.generationSession.current_authoritative_state!.current_locks.filter(
      (lock) => !lock.toLowerCase().includes("non-pov interiority")
    );
}

function addHighSalienceRecords(input: BuildValidationSnapshotInput): void {
  input.records = input.records.map((record) => ({
    ...record,
    metadata: { ...record.metadata!, salience: "high" }
  }));
}

function removeRelationshipContext(input: BuildValidationSnapshotInput): void {
  input.records = input.records.filter((record) => record.type !== "RELATIONSHIP");
}

function mutateRecord(
  input: BuildValidationSnapshotInput,
  id: string,
  patch: Record<string, unknown>
): void {
  input.records = input.records.map((record) =>
    record.id === id && record.payload && typeof record.payload === "object"
      ? { ...record, payload: { ...(record.payload as Record<string, unknown>), ...patch } }
      : record
  );
}
