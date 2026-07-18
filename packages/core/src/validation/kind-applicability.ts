import type { PromptKind } from "../compiler/ideation/types.js";
import { DIAGNOSTIC_CODES } from "./types.js";

const proseOnlyBlockerCodes = new Set<string>([
  DIAGNOSTIC_CODES.missingManualDirective,
  DIAGNOSTIC_CODES.missingImmediateHandoff,
  DIAGNOSTIC_CODES.localProseScopeViolation,
  DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
  DIAGNOSTIC_CODES.focusTagCountInvalid,
  DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch,
  DIAGNOSTIC_CODES.povKnowledgeMissing,
  DIAGNOSTIC_CODES.activeCastIncomplete,
  DIAGNOSTIC_CODES.matrixDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
  DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
  DIAGNOSTIC_CODES.matrixIntrospectionIncomplete
]);

export function blockerApplies(code: string, promptKind: PromptKind): boolean {
  return promptKind === "prose" || !proseOnlyBlockerCodes.has(code);
}

export function ideationApplicabilityFor(code: string): "applies" | "prose-only" {
  return proseOnlyBlockerCodes.has(code) ? "prose-only" : "applies";
}
