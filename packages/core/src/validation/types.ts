export type Severity = "blocker" | "warning";

export type SuggestedAction =
  | "revise"
  | "remove"
  | "deselect"
  | "add-current-state"
  | "add-route"
  | "add-knowledge-constraint"
  | "add-reveal-permission"
  | "promote-cast"
  | "add-voice-or-body-pressure"
  | "change-directive"
  | "change-stop-guidance";

export interface AffectedReference {
  recordId?: string;
  field?: string;
}

export interface Diagnostic {
  severity: Severity;
  code: string;
  message: string;
  affected: readonly AffectedReference[];
  whyItMatters: string;
  suggestedActions: readonly SuggestedAction[];
}

export interface ValidationResult {
  blockers: readonly Diagnostic[];
  warnings: readonly Diagnostic[];
  isBlocked: boolean;
}

export const DIAGNOSTIC_CODES = Object.freeze({
  apiKeyLikePromptFacingText: "api-key-like-prompt-facing-text",
  castMissingCoreDossier: "cast-missing-core-dossier",
  contentEnvelopeContradiction: "content-envelope-contradiction",
  directiveStopGuidanceDisagreement: "directive-stop-guidance-disagreement",
  entityCurrentLocationContradiction: "entity-current-location-contradiction",
  focusTagCountInvalid: "focus-tag-count-invalid",
  hiddenTruthInPovKnowledge: "hidden-truth-in-pov-knowledge",
  handoffCurrentStateContradiction: "handoff-current-state-contradiction",
  impossibleActionPhysicalContext: "impossible-action-physical-context",
  inactivePlanHolder: "inactive-plan-holder",
  localProseScopeViolation: "local-prose-scope-violation",
  activeCastIncomplete: "active-cast-incomplete",
  activePhysicalContextIncomplete: "active-physical-context-incomplete",
  activeSecretIncomplete: "active-secret-incomplete",
  missingConstitutionalSection: "missing-constitutional-section",
  missingCurrentAuthoritativeState: "missing-current-authoritative-state",
  missingImmediateHandoff: "missing-immediate-handoff",
  missingManualDirective: "missing-manual-directive",
  missingStoryConfig: "missing-story-config",
  matrixAmbiguousPerceptionIncomplete: "matrix-ambiguous-perception-incomplete",
  matrixActiveSilentPresenceIncomplete: "matrix-active-silent-presence-incomplete",
  matrixDialogueIncomplete: "matrix-dialogue-incomplete",
  matrixEnsembleDialogueIncomplete: "matrix-ensemble-dialogue-incomplete",
  matrixClockTickIncomplete: "matrix-clock-tick-incomplete",
  matrixHiddenPlanIncomplete: "matrix-hidden-plan-incomplete",
  matrixInstitutionalInvolvementIncomplete: "matrix-institutional-involvement-incomplete",
  matrixIntimacyOrSexIncomplete: "matrix-intimacy-or-sex-incomplete",
  matrixIntrospectionIncomplete: "matrix-introspection-incomplete",
  matrixLocationChangeIncomplete: "matrix-location-change-incomplete",
  matrixNonhumanPressureIncomplete: "matrix-nonhuman-pressure-incomplete",
  matrixObjectTransferIncomplete: "matrix-object-transfer-incomplete",
  matrixObjectUseIncomplete: "matrix-object-use-incomplete",
  matrixObligationBreachIncomplete: "matrix-obligation-breach-incomplete",
  matrixOffstageInterruptionIncomplete: "matrix-offstage-interruption-incomplete",
  matrixPhysicalInteractionIncomplete: "matrix-physical-interaction-incomplete",
  matrixPresentMinorSpeechIncomplete: "matrix-present-minor-speech-incomplete",
  matrixRestraintOrCoercionIncomplete: "matrix-restraint-or-coercion-incomplete",
  matrixSecretClueIncomplete: "matrix-secret-clue-incomplete",
  matrixViolenceOrInjuryIncomplete: "matrix-violence-or-injury-incomplete",
  castBandDuplicateMembership: "cast-band-duplicate-membership",
  castBandReferenceInvalid: "cast-band-reference-invalid",
  selectedPovReferenceInvalid: "selected-pov-reference-invalid",
  voicePressureAttachmentInvalid: "voice-pressure-attachment-invalid",
  onstageEntityReferenceInvalid: "onstage-entity-reference-invalid",
  offstageEntityReferenceInvalid: "offstage-entity-reference-invalid",
  entityStatusesReferenceInvalid: "entity-statuses-reference-invalid",
  currentLocationReferenceInvalid: "current-location-reference-invalid",
  povKnowledgeMissing: "pov-knowledge-missing",
  promptMiddleSalienceRisk: "prompt-middle-salience-risk",
  promptFacingProseContamination: "prompt-facing-prose-contamination",
  offstageEntityReferenceUnselectedOptional: "offstage-entity-reference-unselected-optional",
  entityStatusesReferenceUnselectedOptional: "entity-statuses-reference-unselected-optional",
  voicePressureOrphanedAttachment: "voice-pressure-orphaned-attachment",
  secretRevealContradiction: "secret-reveal-contradiction",
  manyHighSalienceRecords: "many-high-salience-records",
  noActiveClockPressure: "no-active-clock-pressure",
  localVoicePressureMayHelp: "local-voice-pressure-may-help",
  ensembleVoiceDistinctionRisk: "ensemble-voice-distinction-risk",
  noSampleUtterances: "no-sample-utterances",
  lowDramaScenePressure: "low-drama-scene-pressure",
  castSalienceRisk: "cast-salience-risk",
  sparseSettingTexture: "sparse-setting-texture",
  staleSelectedRecord: "stale-selected-record",
  objectCurrentHolderContradiction: "object-current-holder-contradiction",
  offstageInterruptionMissingRoute: "offstage-interruption-missing-route"
});
