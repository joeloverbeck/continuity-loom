import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS
} from "./types.js";

export function acceptedSegmentChangeReviewOutputJsonSchema(): unknown {
  return strictObject({
    contract: { const: ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT },
    items: {
      type: "array",
      items: strictObject({
        id: { type: "string", pattern: "^ITEM-[0-9]{3}$" },
        change_statement: nonblankString(),
        evidence: nonemptyStringArray(),
        contrast: nonemptyStringArray(),
        epistemic_status: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES },
        retention_horizon: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS },
        affected_target_hints: nonemptyStringArray(),
        uncertainty_or_rival_reading: nonblankString()
      })
    },
    coverage: {
      type: "array",
      minItems: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.length,
      maxItems: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.length,
      items: strictObject({
        dimension: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS },
        status: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES },
        reason: nonblankString()
      })
    }
  });
}

function strictObject(properties: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: Object.keys(properties),
    properties
  };
}

function nonblankString(): Record<string, unknown> {
  return { type: "string", pattern: "\\S" };
}

function nonemptyStringArray(): Record<string, unknown> {
  return {
    type: "array",
    minItems: 1,
    uniqueItems: true,
    items: nonblankString()
  };
}
