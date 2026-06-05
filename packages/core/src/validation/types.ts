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
  acceptedProseContamination: "accepted-prose-contamination",
  apiKeyLikePromptFacingText: "api-key-like-prompt-facing-text",
  castMissingCoreDossier: "cast-missing-core-dossier",
  contentEnvelopeContradiction: "content-envelope-contradiction",
  directiveStopGuidanceDisagreement: "directive-stop-guidance-disagreement",
  focusTagCountInvalid: "focus-tag-count-invalid",
  hiddenTruthInPovKnowledge: "hidden-truth-in-pov-knowledge",
  impossibleActionPhysicalContext: "impossible-action-physical-context",
  localProseScopeViolation: "local-prose-scope-violation",
  missingConstitutionalSection: "missing-constitutional-section",
  missingCurrentAuthoritativeState: "missing-current-authoritative-state",
  missingImmediateHandoff: "missing-immediate-handoff",
  missingStoryConfig: "missing-story-config",
  povKnowledgeMissing: "pov-knowledge-missing",
  promptLengthRisk: "prompt-length-risk",
  secretRevealContradiction: "secret-reveal-contradiction",
  sparseVoicePressure: "sparse-voice-pressure",
  staleSelectedRecord: "stale-selected-record"
});
