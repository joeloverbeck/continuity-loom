import type { ValidationRule } from "./types.js";
import { castBandRules } from "./cast-band.js";
import { durableChangeMatrixRules } from "./matrix-durable.js";
import { knowledgeMatrixRules } from "./matrix-knowledge.js";
import { physicalMatrixRules } from "./matrix-physical.js";
import { onstageCastBandRules } from "./onstage-cast-band.js";
import { referentialBriefRules } from "./referential-brief.js";
import { recordInternalReferenceRules } from "./record-internal.js";
import { voiceMatrixRules } from "./matrix-voice.js";
import { securityRules } from "./security.js";
import { structuralContradictionRules } from "./structural-contradiction.js";
import { universalBlockerRules } from "./universal-blockers.js";
import { universalCompletenessRules } from "./universal-completeness.js";
import { warningRules } from "./warnings.js";

export const validationRules: readonly ValidationRule[] = Object.freeze([
  ...universalCompletenessRules,
  ...universalBlockerRules,
  ...structuralContradictionRules,
  ...durableChangeMatrixRules,
  ...knowledgeMatrixRules,
  ...physicalMatrixRules,
  ...voiceMatrixRules,
  ...referentialBriefRules,
  ...castBandRules,
  ...onstageCastBandRules,
  ...recordInternalReferenceRules,
  ...securityRules,
  ...warningRules
]);
