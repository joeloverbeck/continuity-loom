import type { ValidationRule } from "./types.js";
import { universalBlockerRules } from "./universal-blockers.js";
import { universalCompletenessRules } from "./universal-completeness.js";

export const validationRules: readonly ValidationRule[] = Object.freeze([
  ...universalCompletenessRules,
  ...universalBlockerRules
]);
