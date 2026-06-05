import type { ValidationRule } from "./types.js";
import { knowledgeMatrixRules } from "./matrix-knowledge.js";
import { physicalMatrixRules } from "./matrix-physical.js";
import { voiceMatrixRules } from "./matrix-voice.js";
import { universalBlockerRules } from "./universal-blockers.js";
import { universalCompletenessRules } from "./universal-completeness.js";

export const validationRules: readonly ValidationRule[] = Object.freeze([
  ...universalCompletenessRules,
  ...universalBlockerRules,
  ...knowledgeMatrixRules,
  ...physicalMatrixRules,
  ...voiceMatrixRules
]);
