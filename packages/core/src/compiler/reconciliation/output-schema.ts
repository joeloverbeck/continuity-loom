export const SEGMENT_RECONCILIATION_OUTPUT_CONTRACT = "segment_reconciliation.v1";

export function segmentReconciliationOutputJsonSchema(): unknown {
  return strictObject({
    contract: { const: SEGMENT_RECONCILIATION_OUTPUT_CONTRACT },
    source: strictObject({
      profile: { const: "segment-reconciliation" },
      accepted_segment_id: { type: "string" },
      accepted_segment_sequence: { type: "number" },
      record_scope: { enum: ["active_working_set", "whole_project"] },
      prompt_fingerprint: { type: "string" }
    }),
    brief_proposals: {
      type: "array",
      items: strictObject({
        id: { type: "string", pattern: "^BRIEF-[0-9]{3}$" },
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
        id: { type: "string", pattern: "^RECORD-[0-9]{3}$" },
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
        id: { type: "string", pattern: "^NEW-[0-9]{3}$" },
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

function stringArray(): Record<string, unknown> {
  return {
    type: "array",
    items: { type: "string" }
  };
}
