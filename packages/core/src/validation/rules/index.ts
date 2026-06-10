import type { ValidationRule } from "./types.js";
import { durableChangeMatrixRules } from "./matrix-durable.js";
import { knowledgeMatrixRules } from "./matrix-knowledge.js";
import { physicalMatrixRules } from "./matrix-physical.js";
import { referentialBriefRules } from "./referential-brief.js";
import { voiceMatrixRules } from "./matrix-voice.js";
import { securityRules } from "./security.js";
import { universalBlockerRules } from "./universal-blockers.js";
import { universalCompletenessRules } from "./universal-completeness.js";
import { warningRules } from "./warnings.js";

export const validationRules: readonly ValidationRule[] = Object.freeze([
  ...universalCompletenessRules,
  ...universalBlockerRules,
  ...durableChangeMatrixRules,
  ...knowledgeMatrixRules,
  ...physicalMatrixRules,
  ...voiceMatrixRules,
  ...referentialBriefRules,
  ...securityRules,
  ...warningRules
]);
