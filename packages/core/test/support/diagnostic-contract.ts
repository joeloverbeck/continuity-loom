import {
  DIAGNOSTIC_CODES,
  type AffectedReference,
  type BuildValidationSnapshotInput,
  type Severity,
  type ValidationRecord
} from "../../src/index.js";
import { cleanValidationInput, validationIds } from "./arbitraries/validation-snapshots.js";

export type PromptApplicability = "applies" | "prose-only";

export type RunnableDiagnosticContract = {
  readonly status: "covered";
  readonly code: string;
  readonly severity: Severity;
  readonly promptKinds: PromptApplicability;
  readonly buildValidBaseline: () => BuildValidationSnapshotInput;
  readonly introduceMinimalDefect: (input: BuildValidationSnapshotInput) => void;
  readonly repairDefect: (input: BuildValidationSnapshotInput) => void;
  readonly expectedAffected: readonly AffectedReference[];
};

export type DeferredDiagnosticContract = {
  readonly status: "deferred";
  readonly code: string;
  readonly reason: string;
};

export type DiagnosticContract = RunnableDiagnosticContract | DeferredDiagnosticContract;

const auxIds = Object.freeze({
  actor: "019b0298-5c00-7000-8000-000000000101",
  actorStatusA: "019b0298-5c00-7000-8000-000000000102",
  actorStatusB: "019b0298-5c00-7000-8000-000000000103",
  object: "019b0298-5c00-7000-8000-000000000104",
  plan: "019b0298-5c00-7000-8000-000000000105",
  secret: "019b0298-5c00-7000-8000-000000000106",
  location: "019b0298-5c00-7000-8000-000000000107",
  otherLocation: "019b0298-5c00-7000-8000-000000000108",
  relationship: "019b0298-5c00-7000-8000-000000000109",
  fact: "019b0298-5c00-7000-8000-000000000110",
  dangling: "019b0298-5c00-7000-8000-000000000111",
  unselectedEntity: "019b0298-5c00-7000-8000-000000000112",
  unselectedStatus: "019b0298-5c00-7000-8000-000000000113",
  unselectedLocation: "019b0298-5c00-7000-8000-000000000114"
});

const matrixIds = Object.freeze({
  object: "019b0298-5c00-7000-8000-000000000201",
  useAffordance: "019b0298-5c00-7000-8000-000000000202",
  transferAffordance: "019b0298-5c00-7000-8000-000000000203",
  harmAffordance: "019b0298-5c00-7000-8000-000000000204",
  bondAffordance: "019b0298-5c00-7000-8000-000000000205",
  entity: "019b0298-5c00-7000-8000-000000000206",
  institution: "019b0298-5c00-7000-8000-000000000207",
  clock: "019b0298-5c00-7000-8000-000000000208",
  obligation: "019b0298-5c00-7000-8000-000000000209",
  cast: "019b0298-5c00-7000-8000-000000000210",
  fact: "019b0298-5c00-7000-8000-000000000211",
  status: "019b0298-5c00-7000-8000-000000000212",
  relationship: "019b0298-5c00-7000-8000-000000000213",
  consequence: "019b0298-5c00-7000-8000-000000000214",
  castB: "019b0298-5c00-7000-8000-000000000215",
  castC: "019b0298-5c00-7000-8000-000000000216",
  minor: "019b0298-5c00-7000-8000-000000000217",
  nonPov: "019b0298-5c00-7000-8000-000000000218",
  secret: "019b0298-5c00-7000-8000-000000000219",
  belief: "019b0298-5c00-7000-8000-000000000220",
  emotion: "019b0298-5c00-7000-8000-000000000221",
  plan: "019b0298-5c00-7000-8000-000000000222",
  dangling: "019b0298-5c00-7000-8000-000000000223"
});

export const expectedRunnableDiagnosticCodes = [
  DIAGNOSTIC_CODES.activeCastIncomplete,
  DIAGNOSTIC_CODES.activePhysicalContextIncomplete,
  DIAGNOSTIC_CODES.activeSecretIncomplete,
  DIAGNOSTIC_CODES.apiKeyLikePromptFacingText,
  DIAGNOSTIC_CODES.castBandDuplicateMembership,
  DIAGNOSTIC_CODES.castBandReferenceInvalid,
  DIAGNOSTIC_CODES.castSalienceRisk,
  DIAGNOSTIC_CODES.contentEnvelopeContradiction,
  DIAGNOSTIC_CODES.currentLocationReferenceInvalid,
  DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
  DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
  DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
  DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional,
  DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk,
  DIAGNOSTIC_CODES.focusTagCountInvalid,
  DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
  DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
  DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
  DIAGNOSTIC_CODES.inactivePlanHolder,
  DIAGNOSTIC_CODES.localProseScopeViolation,
  DIAGNOSTIC_CODES.localVoicePressureMayHelp,
  DIAGNOSTIC_CODES.lowDramaScenePressure,
  DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
  DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
  DIAGNOSTIC_CODES.matrixClockTickIncomplete,
  DIAGNOSTIC_CODES.matrixDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
  DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete,
  DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete,
  DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
  DIAGNOSTIC_CODES.matrixLocationChangeIncomplete,
  DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete,
  DIAGNOSTIC_CODES.matrixObjectTransferIncomplete,
  DIAGNOSTIC_CODES.matrixObjectUseIncomplete,
  DIAGNOSTIC_CODES.matrixObligationBreachIncomplete,
  DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
  DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
  DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
  DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete,
  DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
  DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete,
  DIAGNOSTIC_CODES.manyHighSalienceRecords,
  DIAGNOSTIC_CODES.missingConstitutionalSection,
  DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
  DIAGNOSTIC_CODES.missingImmediateHandoff,
  DIAGNOSTIC_CODES.missingManualDirective,
  DIAGNOSTIC_CODES.missingStoryConfig,
  DIAGNOSTIC_CODES.noActiveClockPressure,
  DIAGNOSTIC_CODES.noSampleUtterances,
  DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
  DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional,
  DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
  DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
  DIAGNOSTIC_CODES.onstageCastBandMissing,
  DIAGNOSTIC_CODES.onstageEntityReferenceInvalid,
  DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
  DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
  DIAGNOSTIC_CODES.povKnowledgeMissing,
  DIAGNOSTIC_CODES.promptFacingProseContamination,
  DIAGNOSTIC_CODES.promptMiddleSalienceRisk,
  DIAGNOSTIC_CODES.recordReferenceDangling,
  DIAGNOSTIC_CODES.recordReferenceTypeMismatch,
  DIAGNOSTIC_CODES.recordReferenceUnselectedRequired,
  DIAGNOSTIC_CODES.recordReferenceUnselectedOptional,
  DIAGNOSTIC_CODES.relationshipSelfReference,
  DIAGNOSTIC_CODES.secretRevealContradiction,
  DIAGNOSTIC_CODES.selectedPovConflictsWithProseMode,
  DIAGNOSTIC_CODES.selectedPovReferenceInvalid,
  DIAGNOSTIC_CODES.selectedPovRequiredForVariableMode,
  DIAGNOSTIC_CODES.sparseSettingTexture,
  DIAGNOSTIC_CODES.staleSelectedRecord,
  DIAGNOSTIC_CODES.voicePressureAttachmentInvalid,
  DIAGNOSTIC_CODES.voicePressureOrphanedAttachment,
  DIAGNOSTIC_CODES.factHiddenAudienceVisibilityNotConcealment
] as const;

const coveredContracts = [
  covered({
    code: DIAGNOSTIC_CODES.missingStoryConfig,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      delete input.storyConfig.storyContract;
    },
    expectedAffected: [{ field: "storyConfig.storyContract" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      delete input.generationSession.current_authoritative_state;
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingManualDirective,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive = {
        must_render: [],
        may_render_if_naturally_caused: [],
        do_not_force: []
      };
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingImmediateHandoff,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: () => {
      const input = cleanValidationInput();
      input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
        "continuation_after_accepted_segment"
      ];
      return input;
    },
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff = {
        recent_causal_context: "",
        last_visible_moment: "",
        begin_after: ""
      };
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.missingConstitutionalSection,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.versions.template = "";
    },
    expectedAffected: [{ field: "versions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.povKnowledgeMissing,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.records = input.records.filter((record) => record.id !== validationIds.fact);
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.localProseScopeViolation,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render[0]" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
      input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location),
        entityStatus(auxIds.actorStatusB, auxIds.actor, auxIds.otherLocation)
      ];
    },
    expectedAffected: [{ recordId: auxIds.actor, field: "ENTITY STATUS.location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.inactivePlanHolder,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location, { agency: "unconscious" }),
        planRecord({ holder: auxIds.actor })
      ];
    },
    expectedAffected: [{ recordId: auxIds.plan, field: "PLAN.holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.secretRevealContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, hiddenKnownSecret({ pov_access: "knows" })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.holders/non_holders_to_protect" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, hiddenKnownSecret({ pov_access: "hidden" })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.pov_access" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "offstage_interruption_possible"
      ];
      input.generationSession.current_authoritative_state!.routes_and_exits = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "physical_interaction_expected"
      ];
      input.generationSession.current_authoritative_state!.consent_or_force_conditions = "";
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.contentEnvelopeContradiction,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex or non-graphic violence.";
      input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
    },
    expectedAffected: [{ field: "storyConfig.universalContentPolicy.allowed_content_scope" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.promptFacingProseContamination,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.generationSession.immediate_handoff!.recent_causal_context = "This is copied accepted prose from the last scene.";
    },
    expectedAffected: [{ field: "generationSession.immediate_handoff.recent_causal_context" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activeSecretIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        secretRecord({
          holders: [],
          non_holders_to_protect: "none",
          forbidden_reveals: [],
          reveal_permission: "locked"
        })
      ];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "holders" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activePhysicalContextIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, objectRecord()];
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "object_use_possible"
      ];
      input.generationSession.current_authoritative_state!.possessions = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.activeCastIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: completeCastBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.map((record) =>
        record.id === validationIds.cast
          ? {
              ...recordWithoutLocalFunction(record),
              payload: { entity_id: validationIds.entity, identity: { one_line: "A witness." } }
            }
          : record
      );
    },
    expectedAffected: [{ recordId: validationIds.cast, field: "CAST MEMBER" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.focusTagCountInvalid,
    severity: "blocker",
    promptKinds: "prose-only",
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
        "first_segment",
        "continuation_after_accepted_segment"
      ];
    },
    expectedAffected: [{ field: "generationSession.generation_validation_focus.validation_focus_tags.generation_context" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageEntityReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.unselectedEntity];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.onstage_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.offstageEntityReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [auxIds.unselectedEntity];
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "offstage_interruption_possible"
      ];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.entityStatusesReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.entity_statuses = [auxIds.unselectedStatus];
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "physical_interaction_expected"
      ];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.entity_statuses" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.currentLocationReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.current_location = auxIds.unselectedLocation;
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.current_location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceDangling,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, beliefRecord(auxIds.dangling)];
    },
    expectedAffected: [{ recordId: auxIds.fact, field: "BELIEF.holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceTypeMismatch,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, objectRecord({ current_location: auxIds.fact })];
    },
    expectedAffected: [{ recordId: auxIds.object, field: "OBJECT.current_location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceUnselectedRequired,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, secretRecord({ holders: [auxIds.unselectedEntity] })];
    },
    expectedAffected: [{ recordId: auxIds.secret, field: "SECRET.secret_holder" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageOffstageEntityOverlap,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [auxIds.actor];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.onstage_entities/offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageEntityStatusContradiction,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, entityStatus(auxIds.actorStatusA, auxIds.actor, "offstage")];
    },
    expectedAffected: [{ recordId: auxIds.actorStatusA, field: "ENTITY STATUS.location" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.objectLocationHolderIncoherence,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        objectRecord({ current_location: "carried_by_holder", carried_by: "none" })
      ];
    },
    expectedAffected: [{ recordId: auxIds.object, field: "OBJECT.current_location/carried_by" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.relationshipSelfReference,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: structuralBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, relationshipRecord({ from: auxIds.actor, to: auxIds.actor })];
    },
    expectedAffected: [{ recordId: auxIds.relationship, field: "RELATIONSHIP.from/to" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixObjectUseIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "object_use_possible"
      ];
      removeMatrixRecord(input, matrixIds.object);
    },
    expectedAffected: [{ field: "OBJECT" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixObjectTransferIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "object_transfer_possible"
      ];
      removeMatrixLock(input, "resulting holder");
    },
    expectedAffected: [{ field: "OBJECT" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixLocationChangeIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "location_change_possible"
      ];
      removeMatrixLock(input, "destination");
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.routes_and_exits" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixRestraintOrCoercionIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "restraint_or_coercion_possible"
      ];
      removeMatrixLock(input, "power relationship");
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.consent_or_force_conditions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixIntimacyOrSexIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "intimacy_or_sex_possible"
      ];
      removeMatrixRecord(input, matrixIds.bondAffordance);
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.consent_or_force_conditions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixViolenceOrInjuryIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "violence_or_injury_possible"
      ];
      removeMatrixRecord(input, matrixIds.harmAffordance);
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.consent_or_force_conditions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixInstitutionalInvolvementIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "institutional_involvement_possible"
      ];
      removeMatrixRecord(input, matrixIds.institution);
    },
    expectedAffected: [{ field: "ENTITY" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixClockTickIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "clock_tick_possible"
      ];
      removeMatrixRecord(input, matrixIds.clock);
    },
    expectedAffected: [{ field: "CLOCK" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixObligationBreachIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: durableMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
        "obligation_breach_possible"
      ];
      removeMatrixRecord(input, matrixIds.obligation);
    },
    expectedAffected: [{ field: "OBLIGATION" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: physicalMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "physical_interaction_expected"
      ];
      input.generationSession.current_authoritative_state!.positions = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: physicalMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "offstage_interruption_possible"
      ];
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: physicalMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "nonhuman_or_institutional_pressure_expected"
      ];
      removeMatrixRecord(input, matrixIds.institution);
    },
    expectedAffected: [{ field: "ENTITY" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: knowledgeMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "introspection_expected"
      ];
      removeMatrixRecord(input, matrixIds.emotion);
    },
    expectedAffected: [{ field: "generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: knowledgeMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "ambiguous_perception_expected"
      ];
      input.generationSession.current_authoritative_state!.current_locks = ["No non-POV interiority leak."];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: knowledgeMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "secret_or_clue_pressure"
      ];
      input.records = input.records.map((record) =>
        record.id === matrixIds.secret
          ? { ...record, payload: { ...(record.payload as Record<string, unknown>), allowed_surface_cues: [] } }
          : record
      );
    },
    expectedAffected: [{ field: "SECRET" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: knowledgeMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "non_pov_hidden_plan_behavior"
      ];
      removeMatrixRecord(input, matrixIds.status);
    },
    expectedAffected: [{ field: "PLAN" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixDialogueIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: voiceMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "dialogue_expected"
      ];
      input.records = input.records.filter((record) => record.id !== matrixIds.relationship && record.id !== matrixIds.status);
    },
    expectedAffected: [{ field: "generationSession.active_working_set.active_onstage_cast_full" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: voiceMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "ensemble_dialogue_expected"
      ];
      input.records = input.records.map((record) =>
        record.id === matrixIds.castB
          ? { ...record, payload: { ...(record.payload as Record<string, unknown>), voice_anchor: undefined } }
          : record
      );
    },
    expectedAffected: [{ field: "generationSession.active_working_set.active_onstage_cast_full" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: voiceMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "active_silent_presence_expected"
      ];
      input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
        entry.cast_member_id === matrixIds.castC ? { ...entry, nonverbal_or_silence_pressure: "none" } : entry
      );
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
    severity: "blocker",
    promptKinds: "prose-only",
    buildValidBaseline: voiceMatrixBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
        "present_minor_speech_possible"
      ];
      input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.filter(
        (entry) => entry.cast_member_id !== matrixIds.minor
      );
    },
    expectedAffected: [{ field: "generationSession.active_working_set.present_minor_cast_compressed" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.apiKeyLikePromptFacingText,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.manual_moment_directive = {
        must_render: ["Remove sk-or-v1-abcdefghijklmnopqrstuvwxyz123456 before generation."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      };
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render[0]" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.castBandDuplicateMembership,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.active_working_set!.present_minor_cast_compressed = [matrixIds.cast];
    },
    expectedAffected: [{ field: "generationSession.active_working_set" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.castBandReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.active_working_set!.active_onstage_cast_full = [
        { cast_member_id: matrixIds.dangling, local_function: "active_speaker" }
      ];
    },
    expectedAffected: [{ field: "generationSession.active_working_set.active_onstage_cast_full" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.selectedPovReferenceInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.active_working_set!.selected_pov = matrixIds.dangling;
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.selectedPovRequiredForVariableMode,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      delete input.generationSession.active_working_set!.selected_pov;
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.selectedPovConflictsWithProseMode,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.storyConfig.proseMode!.pov_character = matrixIds.castB;
    },
    expectedAffected: [{ field: "generationSession.active_working_set.selected_pov" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.voicePressureAttachmentInvalid,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_cast_voice_pressure = [matrixPressure(matrixIds.dangling, "x", "x", "none")];
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.onstageCastBandMissing,
    severity: "blocker",
    promptKinds: "applies",
    buildValidBaseline: onstageBandBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.map((record) =>
        record.id === matrixIds.cast ? withoutCastBand(record) : record
      );
    },
    expectedAffected: [{ recordId: matrixIds.cast, field: "generationSession.active_working_set" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.promptMiddleSalienceRisk,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [simpleRecord("big", "FACT", { statement: "x".repeat(6000) })];
    },
    expectedAffected: [{ field: "records" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.manyHighSalienceRecords,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = Array.from({ length: 7 }, (_, index) => simpleRecord(`high-${index}`, "FACT", { salience: "critical" }));
    },
    expectedAffected: [{ field: "records" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.noSampleUtterances,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [simpleRecord(matrixIds.cast, "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
    },
    expectedAffected: [{ field: "CAST MEMBER.sample_utterances" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.sparseSettingTexture,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.filter((record) => record.type !== "LOCATION");
      input.generationSession.current_authoritative_state = {
        ...minimalCurrentState(),
        environmental_conditions: "Bare."
      };
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.environmental_conditions" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.noActiveClockPressure,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.filter((record) => !["CLOCK", "OBLIGATION", "OPEN THREAD"].includes(record.type));
      input.generationSession.manual_moment_directive = {
        must_render: ["Ask for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      };
    },
    expectedAffected: [{ field: "records" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.localVoicePressureMayHelp,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: warningVoiceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_cast_voice_pressure = [];
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: warningVoiceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["ensemble_dialogue_expected"];
      input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
        entry.cast_member_id === matrixIds.cast || entry.cast_member_id === matrixIds.castB
          ? { ...entry, current_voice_pressure: "same" }
          : entry
      );
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.castSalienceRisk,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [simpleRecord(matrixIds.cast, "CAST MEMBER", { biography: "x".repeat(1300) })];
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.lowDramaScenePressure,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = input.records.filter((record) => !["CLOCK", "OBLIGATION", "OPEN THREAD", "SECRET", "RELATIONSHIP", "EMOTION"].includes(record.type));
      input.generationSession.manual_moment_directive = {
        must_render: ["Pause."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      };
    },
    expectedAffected: [{ field: "generationSession.manual_moment_directive.must_render" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.staleSelectedRecord,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: minimalBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [simpleRecord("old", "EVENT", { status: "resolved" })];
    },
    expectedAffected: [{ field: "record:old" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [auxIds.unselectedEntity];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.offstage_pressuring_entities" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_authoritative_state!.entity_statuses = [auxIds.unselectedStatus];
    },
    expectedAffected: [{ field: "generationSession.current_authoritative_state.entity_statuses" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.voicePressureOrphanedAttachment,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: castBandBaseline,
    introduceMinimalDefect: (input) => {
      input.generationSession.current_cast_voice_pressure = [matrixPressure(matrixIds.castB, "x", "x", "none")];
    },
    expectedAffected: [{ field: "generationSession.current_cast_voice_pressure" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.recordReferenceUnselectedOptional,
    severity: "warning",
    promptKinds: "applies",
    buildValidBaseline: referenceBaseline,
    introduceMinimalDefect: (input) => {
      input.records = [...input.records, relationshipRecord({ from: auxIds.unselectedEntity, to: validationIds.entity })];
    },
    expectedAffected: [{ field: "RELATIONSHIP.from" }]
  }),
  covered({
    code: DIAGNOSTIC_CODES.factHiddenAudienceVisibilityNotConcealment,
    severity: "warning",
    promptKinds: "applies",
    introduceMinimalDefect: (input) => {
      input.records = [
        ...input.records,
        simpleRecord(auxIds.fact, "FACT", {
          fact_kind: "hard_canon",
          statement: "The point-of-view character is secretly immortal.",
          scope: "global",
          known_by: "public",
          audience_visibility: "hidden",
          salience: "critical"
        })
      ];
    },
    expectedAffected: [{ recordId: auxIds.fact, field: "FACT.audience_visibility" }]
  })
] as const satisfies readonly RunnableDiagnosticContract[];

export const diagnosticContractRegistry: ReadonlyMap<string, DiagnosticContract> = new Map(
  Object.values(DIAGNOSTIC_CODES).map((code) => {
    const covered = coveredContracts.find((contract) => contract.code === code);
    if (code === DIAGNOSTIC_CODES.castMissingCoreDossier) {
      return [
        code,
        {
          status: "deferred",
          code,
          reason:
            "Reserved taxonomy/UI fixture code; validation-rule-inventory.test.ts documents it is not emitted by the current validation rule registry."
        }
      ] as const satisfies readonly [string, DiagnosticContract];
    }
    const contract: DiagnosticContract =
      covered ?? {
        status: "deferred",
        code,
        reason: "Deferred to later SPEC026MUTDRIROB P3 family contract ticket."
      };
    return [
      code,
      contract
    ] as const satisfies readonly [string, DiagnosticContract];
  })
);

export const runnableDiagnosticContracts = coveredContracts;

function covered(
  contract: Omit<RunnableDiagnosticContract, "status" | "buildValidBaseline" | "repairDefect"> & {
    readonly buildValidBaseline?: () => BuildValidationSnapshotInput;
    readonly repairDefect?: (input: BuildValidationSnapshotInput) => void;
  }
): RunnableDiagnosticContract {
  const buildValidBaseline = contract.buildValidBaseline ?? cleanValidationInput;

  return {
    status: "covered",
    buildValidBaseline,
    repairDefect: contract.repairDefect ?? restoreFrom(buildValidBaseline),
    ...contract
  };
}

function restoreFrom(buildValidBaseline: () => BuildValidationSnapshotInput): (input: BuildValidationSnapshotInput) => void {
  return (input) => {
    Object.assign(input, buildValidBaseline());
  };
}

function minimalBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = input.records.map((record) =>
    record.id === validationIds.cast
      ? {
          ...record,
          payload: {
            ...(record.payload as Record<string, unknown>),
            sample_utterances: ["I heard it turn."]
          }
        }
      : record
  );
  input.records = [
    ...input.records,
    locationRecord(auxIds.location),
    {
      id: matrixIds.clock,
      type: "CLOCK",
      payload: {
        id: matrixIds.clock,
        status: "active",
        current_pressure: "The alarm is close.",
        tick_trigger: "Door opens.",
        next_threshold: "Alarm sounds.",
        possible_effects: ["guards arrive"]
      }
    }
  ];
  return input;
}

function minimalCurrentState(): NonNullable<BuildValidationSnapshotInput["generationSession"]["current_authoritative_state"]> {
  return {
    current_time: "Night.",
    current_location: "Warehouse.",
    onstage_entities: [],
    immediate_situation_summary: "The room is quiet before the next beat.",
    offstage_pressuring_entities: [],
    positions: "No one has moved yet.",
    possessions: "Nothing changes hands.",
    visible_conditions: ["dim"],
    environmental_conditions: "Rain outside the warehouse.",
    entity_statuses: "No status changes.",
    line_of_sight_and_visibility: "The room is visible.",
    routes_and_exits: ["loading door"],
    available_time: "A few seconds.",
    consent_or_force_conditions: "none",
    current_locks: []
  };
}

function castBandBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [
    entityRecord(matrixIds.entity),
    matrixCastRecord(matrixIds.cast, matrixIds.entity, "active_speaker"),
    matrixCastRecord(matrixIds.castB, matrixIds.entity, "active_speaker"),
    factRecord(matrixIds.fact)
  ];
  input.generationSession = matrixGenerationSession({
    selectedRecords: [matrixIds.entity, matrixIds.cast, matrixIds.castB, matrixIds.fact],
    activeCast: [{ cast_member_id: matrixIds.cast, local_function: "active_speaker" }],
    onstageEntities: [matrixIds.entity],
    currentLocks: ["A remains visible in the warehouse."],
    currentCastVoicePressure: [matrixPressure(matrixIds.cast, "A is clipped.", "A asks directly.", "none")]
  });
  input.generationSession.active_working_set!.selected_pov = matrixIds.entity;
  input.storyConfig = matrixStoryConfig();
  input.storyConfig.proseMode!.pov_character = "variable";
  return input;
}

function onstageBandBaseline(): BuildValidationSnapshotInput {
  return castBandBaseline();
}

function warningVoiceBaseline(): BuildValidationSnapshotInput {
  const input = voiceMatrixBaseline();
  input.generationSession.active_working_set!.active_onstage_cast_full = input.generationSession.active_working_set!.active_onstage_cast_full.map(
    (entry) => ({ ...entry, local_function: "active_speaker" })
  );
  return input;
}

function simpleRecord(
  id: string,
  type: string,
  payload: Record<string, unknown>,
  castBand?: ValidationRecord["castBand"]
): ValidationRecord {
  const record: ValidationRecord = {
    id,
    type,
    payload: { id, ...payload }
  };
  if (castBand) {
    record.castBand = castBand;
  }
  return record;
}

function withoutCastBand(record: ValidationRecord): ValidationRecord {
  const copy: ValidationRecord = { ...record };
  delete copy.castBand;
  return copy;
}

function referenceBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [
    ...input.records,
    entityRecord(validationIds.pov),
    entityRecord(auxIds.actor),
    entityStatus(auxIds.actorStatusA, auxIds.actor, auxIds.location),
    locationRecord(auxIds.location),
    factRecord(auxIds.fact)
  ];
  input.generationSession.active_working_set!.selected_records = [
    ...input.generationSession.active_working_set!.selected_records,
    auxIds.actor,
    auxIds.actorStatusA,
    auxIds.location,
    auxIds.fact
  ];
  input.generationSession.current_authoritative_state!.current_location = auxIds.location;
  input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.actor];
  input.generationSession.current_authoritative_state!.entity_statuses = [auxIds.actorStatusA];
  input.projectRecordIndex = {
    [auxIds.actor]: "ENTITY",
    [auxIds.actorStatusA]: "ENTITY STATUS",
    [auxIds.unselectedEntity]: "ENTITY",
    [auxIds.unselectedStatus]: "ENTITY STATUS",
    [auxIds.location]: "LOCATION",
    [auxIds.unselectedLocation]: "LOCATION",
    [auxIds.fact]: "FACT",
    [validationIds.pov]: "ENTITY"
  };
  return input;
}

function completeCastBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = input.records.map((record) =>
    record.id === validationIds.cast
      ? {
          ...record,
          payload: {
            ...completeCastPayload(validationIds.entity)
          }
        }
      : record
  );
  return input;
}

function structuralBaseline(): BuildValidationSnapshotInput {
  const input = cleanValidationInput();
  input.records = [
    ...input.records,
    entityRecord(auxIds.actor),
    locationRecord(auxIds.location),
    locationRecord(auxIds.otherLocation)
  ];
  input.generationSession.current_authoritative_state!.current_location = auxIds.location;
  input.generationSession.current_authoritative_state!.onstage_entities = [auxIds.actor];
  input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [];
  return input;
}

function durableMatrixBaseline(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: matrixIds.object,
        type: "OBJECT",
        payload: {
          owner: matrixIds.entity,
          carried_by: matrixIds.entity,
          current_location: "carried_by_holder",
          visibility_to_pov: "visible",
          usable_affordances: ["unlock", "hand over"],
          constraints: ["requires consent"]
        }
      },
      matrixAffordance(matrixIds.useAffordance, ["use"]),
      matrixAffordance(matrixIds.transferAffordance, ["transfer"]),
      matrixAffordance(matrixIds.harmAffordance, ["harm"]),
      matrixAffordance(matrixIds.bondAffordance, ["bond"]),
      {
        id: matrixIds.entity,
        type: "ENTITY STATUS",
        payload: {
          entity_id: matrixIds.entity,
          life: "alive",
          agency: "free",
          location: auxIds.location
        }
      },
      {
        id: matrixIds.institution,
        type: "ENTITY",
        payload: {
          id: matrixIds.institution,
          entity_kind: "institution",
          short_description: "A local office with immediate authority."
        }
      },
      {
        id: matrixIds.relationship,
        type: "RELATIONSHIP",
        payload: { status: "active", pressure_text: "Tense trust.", current_expression: "Careful distance." }
      },
      {
        id: matrixIds.consequence,
        type: "CONSEQUENCE",
        payload: { status: "active", current_effect: "A bruise would change the next beat." }
      },
      {
        id: matrixIds.clock,
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
        id: matrixIds.obligation,
        type: "OBLIGATION",
        payload: {
          status: "open",
          terms: "Return the key.",
          owed_by: [matrixIds.entity],
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
        onstage_entities: [matrixIds.entity],
        immediate_situation_summary: "A is at the loading door while the key changes hands.",
        offstage_pressuring_entities: [matrixIds.institution],
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

function physicalMatrixBaseline(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: matrixIds.entity,
        type: "ENTITY",
        payload: { id: matrixIds.entity, entity_kind: "person" }
      },
      {
        id: matrixIds.institution,
        type: "ENTITY",
        payload: {
          id: matrixIds.institution,
          entity_kind: "institution",
          short_description: "A local office that can apply immediate pressure."
        }
      },
      {
        id: matrixIds.status,
        type: "ENTITY STATUS",
        payload: {
          entity_id: matrixIds.institution,
          life: "not_applicable",
          agency: "not_applicable",
          location: auxIds.location,
          visibility_to_pov: "audible"
        }
      },
      {
        id: matrixIds.cast,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        localFunction: "active_speaker",
        payload: completeCastPayload(matrixIds.entity)
      },
      {
        id: matrixIds.fact,
        type: "FACT",
        payload: { id: matrixIds.fact, known_by: [validationIds.pov] }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [matrixIds.cast, matrixIds.fact, matrixIds.institution, matrixIds.status],
        active_onstage_cast_full: [{ cast_member_id: matrixIds.cast, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: validationIds.pov
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [matrixIds.entity],
        immediate_situation_summary: "A and B are at the loading door while the key changes hands.",
        offstage_pressuring_entities: [matrixIds.institution],
        positions: "A and B stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim", "phone buzzing"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "They can see each other.",
        routes_and_exits: ["loading door", "phone call"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: [
          "The roof exit is blocked.",
          "Awareness mechanism: the phone buzzes.",
          "Interruption route: phone call.",
          "Pressure mechanism: institutional warning.",
          "Agency limit: institution has no interiority."
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
      current_cast_voice_pressure: [
        {
          cast_member_id: matrixIds.cast,
          current_voice_pressure: "B is clipped and afraid.",
          dialogue_pressure: "Direct question.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "none",
          current_must_preserve: [],
          current_must_avoid: []
        }
      ],
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
        language_register: "controlled contemporary prose"
      },
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      },
      proseMode: {
        pov_character: validationIds.pov,
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
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function knowledgeMatrixBaseline(): BuildValidationSnapshotInput {
  return {
    records: [
      entityRecord(matrixIds.entity),
      entityRecord(matrixIds.nonPov),
      matrixCastRecord(matrixIds.cast, matrixIds.entity, "active_speaker"),
      factRecord(matrixIds.fact),
      {
        id: matrixIds.belief,
        type: "BELIEF",
        payload: {
          id: matrixIds.belief,
          status: "active",
          holder: validationIds.pov,
          claim: "The doorway may be watched.",
          truth_relation: "unknown"
        }
      },
      {
        id: matrixIds.emotion,
        type: "EMOTION",
        payload: {
          id: matrixIds.emotion,
          status: "active",
          holder: validationIds.pov,
          surface_expression: "A keeps glancing at the door."
        }
      },
      {
        id: matrixIds.secret,
        type: "SECRET",
        payload: {
          id: matrixIds.secret,
          status: "hidden",
          secret_claim: "The watcher is behind the glass.",
          holders: [matrixIds.nonPov],
          non_holders_to_protect: [validationIds.pov],
          pov_access: "can_suspect",
          audience_visibility: "ambiguous",
          allowed_surface_cues: ["A faint reflection."],
          forbidden_reveals: ["Do not name the watcher."],
          reveal_permission: "clue_only"
        }
      },
      {
        id: matrixIds.status,
        type: "ENTITY STATUS",
        payload: {
          entity_id: matrixIds.nonPov,
          life: "alive",
          agency: "free",
          location: auxIds.location
        }
      },
      {
        id: matrixIds.plan,
        type: "PLAN",
        payload: {
          id: matrixIds.plan,
          plan_status: "active",
          holder: matrixIds.nonPov,
          current_step: "Signal through the reflection.",
          visibility_to_pov: "hidden",
          resources: ["reflection"],
          blockers: ["must not reveal intent"],
          fallback_steps: []
        }
      }
    ],
    generationSession: matrixGenerationSession({
      selectedRecords: [matrixIds.cast, matrixIds.fact, matrixIds.belief, matrixIds.emotion, matrixIds.secret, matrixIds.plan],
      activeCast: [{ cast_member_id: matrixIds.cast, local_function: "active_speaker" }],
      onstageEntities: [matrixIds.entity],
      offstageEntities: [matrixIds.nonPov],
      currentLocks: [
        "POV cannot perceive behind the glass and may misread the reflection.",
        "No non-POV interiority leak."
      ],
      currentCastVoicePressure: [matrixPressure(matrixIds.cast, "B is clipped and afraid.", "Direct question.", "none")]
    }),
    storyConfig: matrixStoryConfig(),
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function voiceMatrixBaseline(): BuildValidationSnapshotInput {
  return {
    records: [
      matrixCastRecord(matrixIds.cast, matrixIds.entity, "active_speaker"),
      matrixCastRecord(matrixIds.castB, matrixIds.entity, "active_speaker"),
      matrixCastRecord(matrixIds.castC, matrixIds.entity, "active_silent"),
      factRecord(matrixIds.fact),
      {
        id: matrixIds.status,
        type: "ENTITY STATUS",
        payload: {
          entity_id: matrixIds.entity,
          life: "alive",
          agency: "free",
          location: auxIds.location,
          visibility_to_pov: "visible"
        }
      },
      {
        id: matrixIds.relationship,
        type: "RELATIONSHIP",
        payload: {
          id: matrixIds.relationship,
          status: "active",
          from: matrixIds.entity,
          to: validationIds.pov,
          pressure_text: "They are testing each other.",
          current_expression: "Tense courtesy."
        }
      }
    ],
    generationSession: matrixGenerationSession({
      selectedRecords: [matrixIds.cast, matrixIds.castB, matrixIds.castC, matrixIds.fact, matrixIds.status, matrixIds.relationship],
      activeCast: [
        { cast_member_id: matrixIds.cast, local_function: "active_speaker" },
        { cast_member_id: matrixIds.castB, local_function: "active_speaker" },
        { cast_member_id: matrixIds.castC, local_function: "active_silent" }
      ],
      presentMinorCast: [matrixIds.minor],
      onstageEntities: [matrixIds.entity],
      currentLocks: ["C may only act visibly; no non-POV interiority leak."],
      currentCastVoicePressure: [
        matrixPressure(matrixIds.cast, "A is clipped.", "A asks directly.", "none"),
        matrixPressure(matrixIds.castB, "B is evasive.", "B deflects.", "none"),
        matrixPressure(matrixIds.castC, "C is watchful.", "none", "C grips the doorframe."),
        matrixPressure(matrixIds.minor, "Minor speaks in short factual fragments.", "one line only", "none")
      ]
    }),
    storyConfig: matrixStoryConfig(),
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function entityRecord(id: string): ValidationRecord {
  return {
    id,
    type: "ENTITY",
    payload: { id, entity_kind: "person" }
  };
}

function locationRecord(id: string): ValidationRecord {
  return {
    id,
    type: "LOCATION",
    payload: { id, status: "active", name: "Warehouse" }
  };
}

function factRecord(id: string): ValidationRecord {
  return {
    id,
    type: "FACT",
    payload: { id, statement: "The hatch is locked.", known_by: [validationIds.pov] }
  };
}

function matrixCastRecord(
  id: string,
  entityId: string,
  localFunction: "active_speaker" | "active_silent"
): ValidationRecord {
  return {
    id,
    type: "CAST MEMBER",
    castBand: "active_onstage_cast_full",
    localFunction,
    payload: completeCastPayload(entityId)
  };
}

function matrixGenerationSession(input: {
  selectedRecords: readonly string[];
  activeCast: readonly NonNullable<BuildValidationSnapshotInput["generationSession"]["active_working_set"]>["active_onstage_cast_full"][number][];
  presentMinorCast?: readonly string[];
  onstageEntities: readonly string[];
  offstageEntities?: readonly string[];
  currentLocks: readonly string[];
  currentCastVoicePressure: BuildValidationSnapshotInput["generationSession"]["current_cast_voice_pressure"];
}): BuildValidationSnapshotInput["generationSession"] {
  return {
    active_working_set: {
      selected_records: [...input.selectedRecords],
      active_onstage_cast_full: [...input.activeCast],
      present_minor_cast_compressed: [...(input.presentMinorCast ?? [])],
      offstage_relevant_cast: [],
      selected_pov: validationIds.pov
    },
    current_authoritative_state: {
      current_time: "Night.",
      current_location: "Warehouse.",
      onstage_entities: [...input.onstageEntities],
      immediate_situation_summary: "A and B are at the loading door while the key changes hands.",
      offstage_pressuring_entities: [...(input.offstageEntities ?? [])],
      positions: "A and B stand near the loading door.",
      possessions: "The key is in A's hand.",
      visible_conditions: ["dim", "reflection in glass"],
      environmental_conditions: "Rain outside.",
      entity_statuses: "A is awake.",
      line_of_sight_and_visibility: "A can see the glass but not behind it.",
      routes_and_exits: ["loading door"],
      available_time: "A few seconds.",
      consent_or_force_conditions: "none",
      current_locks: [...input.currentLocks]
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
    current_cast_voice_pressure: input.currentCastVoicePressure,
    cast_voice_overrides: [],
    generation_validation_focus: {
      validation_focus_tags: {
        generation_context: ["first_segment"],
        expected_local_modes: [],
        possible_durable_changes: []
      }
    },
    stop_guidance: { soft_unit_guidance: "Stop after B's first response point." }
  };
}

function matrixStoryConfig(): BuildValidationSnapshotInput["storyConfig"] {
  return {
    storyContract: {
      title: "Continuity Test",
      premise: "A city keeps its promises badly.",
      genre_mode: "urban fantasy",
      tone: "tense and intimate",
      setting_baseline: "Rainy districts under old bargains.",
      content_intensity: "mature",
      explicitness: "Render mature material only when earned.",
      language_register: "controlled contemporary prose"
    },
    universalContentPolicy: {
      rating_label: "Mature",
      allowed_content_scope: "Tense but non-graphic.",
      tonal_handling: "Grounded.",
      character_bias_handling: "Render bias as character belief, not endorsement."
    },
    proseMode: {
      pov_character: validationIds.pov,
      person: "third",
      tense: "past",
      psychic_distance: "close",
      interiority_mode: "filtered",
      dialogue_density: "balanced",
      paragraphing: "mixed",
      language_output: "English",
      special_style_constraints: []
    }
  };
}

function matrixPressure(
  castMemberId: string,
  currentVoicePressure: string,
  dialoguePressure: string,
  silencePressure: string
): BuildValidationSnapshotInput["generationSession"]["current_cast_voice_pressure"][number] {
  return {
    cast_member_id: castMemberId,
    current_voice_pressure: currentVoicePressure,
    dialogue_pressure: dialoguePressure,
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: silencePressure,
    current_must_preserve: [],
    current_must_avoid: []
  };
}

function matrixAffordance(id: string, actionFamilies: readonly string[]): ValidationRecord {
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

function removeMatrixRecord(input: BuildValidationSnapshotInput, id: string): void {
  input.records = input.records.filter((record) => record.id !== id);
}

function removeMatrixLock(input: BuildValidationSnapshotInput, marker: string): void {
  input.generationSession.current_authoritative_state!.current_locks = input.generationSession.current_authoritative_state!.current_locks.filter(
    (lock) => !lock.toLowerCase().includes(marker)
  );
}

function entityStatus(
  id: string,
  entityId: string,
  location: string,
  overrides: Partial<{ life: string; agency: string }> = {}
): ValidationRecord {
  return {
    id,
    type: "ENTITY STATUS",
    payload: {
      id,
      entity_id: entityId,
      life: "alive",
      agency: "free",
      location,
      visibility_to_pov: "visible",
      current_activity: "Listening.",
      ...overrides
    }
  };
}

function objectRecord(overrides: Partial<{
  owner: string;
  carried_by: string;
  current_location: string;
}> = {}): ValidationRecord {
  return {
    id: auxIds.object,
    type: "OBJECT",
    payload: {
      id: auxIds.object,
      status: "active",
      label: "Key",
      description: "A brass key.",
      owner: "none",
      carried_by: "none",
      current_location: auxIds.location,
      visibility_to_pov: "visible",
      usable_affordances: [],
      constraints: [],
      durability: "continuity_relevant",
      ...overrides
    }
  };
}

function planRecord(overrides: Partial<{ holder: string }> = {}): ValidationRecord {
  return {
    id: auxIds.plan,
    type: "PLAN",
    payload: {
      id: auxIds.plan,
      plan_status: "active",
      holder: validationIds.entity,
      objective: "Reach the door.",
      resources: [],
      blockers: [],
      current_step: "Act now.",
      fallback_steps: [],
      visibility_to_pov: "hidden",
      salience: "high",
      ...overrides
    }
  };
}

function secretRecord(overrides: Partial<{
  holders: string[];
  non_holders_to_protect: string | string[];
  forbidden_reveals: string[];
  reveal_permission: string;
}> = {}): ValidationRecord {
  return {
    id: auxIds.secret,
    type: "SECRET",
    payload: {
      id: auxIds.secret,
      status: "hidden",
      secret_kind: "identity",
      secret_claim: "The witness is using an alias.",
      holders: [validationIds.entity],
      non_holders_to_protect: "none",
      audience_visibility: "hidden",
      pov_access: "hidden",
      salience: "critical",
      allowed_surface_cues: ["A pause at the old name."],
      forbidden_reveals: ["Do not state the alias."],
      reveal_permission: "locked",
      reveal_triggers: [],
      clue_carriers: [],
      ...overrides
    }
  };
}

function hiddenKnownSecret(overrides: Partial<{ pov_access: string }> = {}): ValidationRecord {
  return secretRecord({
    holders: [validationIds.pov],
    non_holders_to_protect: [validationIds.pov],
    forbidden_reveals: ["Do not state the alias."],
    reveal_permission: "locked",
    ...overrides
  });
}

function beliefRecord(holder: string): ValidationRecord {
  return {
    id: auxIds.fact,
    type: "BELIEF",
    payload: {
      id: auxIds.fact,
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
    }
  };
}

function relationshipRecord(overrides: Partial<{ from: string; to: string }> = {}): ValidationRecord {
  return {
    id: auxIds.relationship,
    type: "RELATIONSHIP",
    payload: {
      id: auxIds.relationship,
      status: "active",
      axis: "trust",
      direction_kind: "directed",
      from: auxIds.actor,
      to: validationIds.entity,
      value: "medium",
      valence: "asymmetric",
      visibility: "private",
      description: "A guarded alliance.",
      pressure_text: "Trust is conditional.",
      current_expression: "Careful cooperation.",
      ...overrides
    }
  };
}

function completeCastPayload(entityId: string): Record<string, unknown> {
  return {
    entity_id: entityId,
    identity: {
      one_line: "A careful witness.",
      public_face: "Composed.",
      private_pressure: "Afraid."
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
      posture: "still",
      movement_style: "precise",
      tactile_details: "cold fingers",
      physicality: "still hands"
    },
    agency_core: {
      default_agency_level: "active",
      initiative_pattern: "waits for openings",
      constraint_response: "works around locks"
    },
    status: "active"
  };
}

function recordWithoutLocalFunction(record: ValidationRecord): ValidationRecord {
  const copy = { ...record };
  delete copy.localFunction;
  return copy;
}
