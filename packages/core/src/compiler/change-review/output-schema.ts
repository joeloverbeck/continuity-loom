import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS
} from "./types.js";

/**
 * Strict `response_format` schema for the Accepted-Segment Change Review
 * candidate.
 *
 * The compiled schema emits only provider-safe JSON-Schema keywords (see
 * `provider-safe-output-schema.ts`). The constraints the Anthropic
 * structured-output implementation rejects pre-generation — `pattern`
 * (`^ITEM-[0-9]{3}$`, non-blank `\S`), `minItems`/`uniqueItems` (non-empty
 * unique citation arrays), `minItems`/`maxItems` (exactly six coverage rows),
 * and `const` (the contract literal) — are intentionally absent. The stronger
 * semantic constraints on the item shape, including the `evidence_excerpt`
 * three-to-seven-word bounded-witness rule, are likewise not expressible in
 * provider-safe keywords. Each is re-enforced with equal strength by
 * `parseAcceptedSegmentChangeReviewOutput`, which quarantines any violating
 * output. See GitHub issues #142 and #147.
 */
export function acceptedSegmentChangeReviewOutputJsonSchema(): unknown {
  return strictObject({
    contract: literal(ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT),
    items: {
      type: "array",
      items: strictObject({
        id: string(),
        change_statement: string(),
        evidence_excerpt: string(),
        evidence: stringArray(),
        contrast: stringArray(),
        epistemic_status: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_EPISTEMIC_STATUSES },
        retention_horizon: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_RETENTION_HORIZONS },
        affected_target_hints: stringArray(),
        uncertainty_or_rival_reading: string()
      })
    },
    coverage: {
      type: "array",
      items: strictObject({
        dimension: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS },
        status: { enum: ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_STATUSES },
        reason: string()
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

function literal(value: string): Record<string, unknown> {
  return { enum: [value] };
}

function string(): Record<string, unknown> {
  return { type: "string" };
}

function stringArray(): Record<string, unknown> {
  return {
    type: "array",
    items: string()
  };
}
