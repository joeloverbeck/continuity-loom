export const SEGMENT_RECONCILIATION_OUTPUT_CONTRACT = "segment_reconciliation.v1";

/**
 * Strict `response_format` schema for the live Segment Reconciliation workflow.
 *
 * The compiled schema emits only provider-safe JSON-Schema keywords (see
 * `provider-safe-output-schema.ts`). The constraints the Anthropic
 * structured-output implementation rejects pre-generation — `pattern`
 * (`^BRIEF/RECORD/NEW-[0-9]{3}$`) and `const` (the contract and source-profile
 * literals) — are intentionally absent. Each is re-enforced with equal strength
 * by `parseSegmentReconciliationOutput`, which quarantines any violating output
 * (sequential id check, contract/profile literal check). See GitHub issue #142.
 */
export function segmentReconciliationOutputJsonSchema(): unknown {
  return strictObject({
    contract: literal(SEGMENT_RECONCILIATION_OUTPUT_CONTRACT),
    source: strictObject({
      profile: literal("segment-reconciliation"),
      accepted_segment_id: { type: "string" },
      accepted_segment_sequence: { type: "number" },
      record_scope: { enum: ["active_working_set", "whole_project"] },
      prompt_fingerprint: { type: "string" }
    }),
    brief_proposals: {
      type: "array",
      items: strictObject({
        id: { type: "string" },
        action: { enum: ["FILL", "REPLACE", "CLEAR"] },
        field_path: { type: "string" },
        proposed_value: {},
        evidence: stringArray(),
        contrast: stringArray(),
        rationale: { type: "string" }
      })
    },
    record_change_proposals: {
      type: "array",
      items: strictObject({
        id: { type: "string" },
        action: { enum: ["UPDATE_FIELDS", "DEACTIVATE"] },
        record_key: { type: "string" },
        patches: {
          type: "array",
          items: strictObject({
            op: { enum: ["add", "replace", "remove"] },
            path: { type: "string" },
            value: {}
          })
        },
        lifecycle_destination: { type: "string" },
        evidence: stringArray(),
        contrast: stringArray(),
        rationale: { type: "string" }
      })
    },
    record_creation_proposals: {
      type: "array",
      items: strictObject({
        id: { type: "string" },
        record_type: { type: "string" },
        payload: {},
        dependencies: stringArray(),
        evidence: stringArray(),
        contrast: stringArray(),
        rationale: { type: "string" }
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

function stringArray(): Record<string, unknown> {
  return {
    type: "array",
    items: { type: "string" }
  };
}
