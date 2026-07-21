import { describe, expect, it } from "vitest";

import {
  PROVIDER_SAFE_OUTPUT_SCHEMA_KEYWORDS,
  PROVIDER_UNSAFE_OUTPUT_SCHEMA_KEYWORDS,
  acceptedSegmentChangeReviewOutputJsonSchema,
  collectDisallowedOutputSchemaKeywords,
  segmentReconciliationOutputJsonSchema
} from "../src/index.js";

const compiledSchemas: ReadonlyArray<readonly [string, unknown]> = [
  ["change-review", acceptedSegmentChangeReviewOutputJsonSchema()],
  ["reconciliation", segmentReconciliationOutputJsonSchema()]
];

describe("provider-safe strict output schemas", () => {
  it.each(compiledSchemas)(
    "emits only provider-safe keywords for the %s schema",
    (_label, schema) => {
      expect(collectDisallowedOutputSchemaKeywords(schema)).toEqual([]);
    }
  );

  it.each(compiledSchemas)(
    "contains none of the provider-unsupported keywords in the %s schema",
    (_label, schema) => {
      const everyKey = collectEverySchemaKey(schema);
      for (const forbidden of PROVIDER_UNSAFE_OUTPUT_SCHEMA_KEYWORDS) {
        expect(everyKey).not.toContain(forbidden);
      }
    }
  );

  it("preserves the single-value contract literal as an enum, not a const", () => {
    const changeReview = acceptedSegmentChangeReviewOutputJsonSchema() as SchemaObject;
    const reconciliation = segmentReconciliationOutputJsonSchema() as SchemaObject;

    expect((changeReview.properties as SchemaObject).contract).toEqual({
      enum: ["accepted_segment_change_review.v2"]
    });
    const reconciliationProps = reconciliation.properties as SchemaObject;
    expect(reconciliationProps.contract).toEqual({ enum: ["segment_reconciliation.v1"] });
    expect((reconciliationProps.source as SchemaObject).properties).toMatchObject({
      profile: { enum: ["segment-reconciliation"] }
    });
  });

  it("detects disallowed keywords wherever they appear and passes a clean schema", () => {
    const dirty = {
      type: "object",
      additionalProperties: false,
      required: ["id", "tags", "coverage"],
      properties: {
        id: { type: "string", pattern: "^X-[0-9]{3}$" },
        tags: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", pattern: "\\S" } },
        coverage: { type: "array", minItems: 6, maxItems: 6, items: { const: "only" } }
      }
    };

    expect(collectDisallowedOutputSchemaKeywords(dirty)).toEqual([
      "const",
      "maxItems",
      "minItems",
      "pattern",
      "uniqueItems"
    ]);
    expect(
      collectDisallowedOutputSchemaKeywords({
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: { id: { type: "string", enum: ["A", "B"] } }
      })
    ).toEqual([]);
  });

  it("descends into tuple-form items and object-form additionalProperties", () => {
    expect(
      collectDisallowedOutputSchemaKeywords({
        type: "array",
        items: [{ const: "x" }, { type: "string", minItems: 1 }]
      })
    ).toEqual(["const", "minItems"]);

    expect(
      collectDisallowedOutputSchemaKeywords({
        type: "object",
        additionalProperties: { type: "string", pattern: "\\S" }
      })
    ).toEqual(["pattern"]);
  });

  it("does not mistake a property named like a keyword for a keyword", () => {
    // A property literally named "pattern" is a property NAME, not a schema
    // keyword; only the subschema under it is inspected.
    expect(
      collectDisallowedOutputSchemaKeywords({
        type: "object",
        additionalProperties: false,
        required: ["pattern"],
        properties: { pattern: { type: "string" } }
      })
    ).toEqual([]);
  });

  it("keeps the allowlist and forbidden list disjoint", () => {
    for (const forbidden of PROVIDER_UNSAFE_OUTPUT_SCHEMA_KEYWORDS) {
      expect(PROVIDER_SAFE_OUTPUT_SCHEMA_KEYWORDS.has(forbidden)).toBe(false);
    }
  });
});

interface SchemaObject {
  [key: string]: unknown;
}

function collectEverySchemaKey(node: unknown): string[] {
  const keys = new Set<string>();
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key);
      walk(nested);
    }
  };
  walk(node);
  return [...keys];
}
