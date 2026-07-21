/**
 * Provider-safe keyword allowlist for compiled strict `response_format` schemas.
 *
 * The strict structured-output schemas are consumed only as the outbound
 * OpenRouter `response_format`; there is no schema-based (ajv) validation of the
 * model's reply. The Anthropic structured-output implementation rejects several
 * JSON-Schema keywords *before generation* (HTTP 400), reporting one offending
 * keyword per request. To stop that whack-a-mole, every compiled output schema
 * must emit only the conservative keyword set below; each dropped constraint is
 * re-enforced with equal strength by the corresponding deterministic parser
 * (fail-closed quarantine). See GitHub issue #142 and `docs/adr/0002`.
 */
export const PROVIDER_SAFE_OUTPUT_SCHEMA_KEYWORDS: ReadonlySet<string> = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "enum",
  "items",
  "description"
]);

/**
 * The provider-unsupported keywords this repair removed from the compiled
 * schemas. Kept explicit so the static guard test can name them and so a future
 * reader sees exactly which constraints moved into the parsers.
 */
export const PROVIDER_UNSAFE_OUTPUT_SCHEMA_KEYWORDS: readonly string[] = [
  "uniqueItems",
  "minItems",
  "maxItems",
  "pattern",
  "const"
];

/**
 * Walks a compiled JSON Schema and returns, sorted and de-duplicated, every
 * keyword that appears at a schema position but is not on the provider-safe
 * allowlist. An empty array means the schema is provider-safe.
 *
 * Only schema-keyword positions are inspected: the values under `properties`
 * are treated as property-named subschemas, and `items`/`additionalProperties`
 * as nested subschemas. Property *names* and data payloads (`enum` members,
 * `required` entries) are never mistaken for keywords.
 */
export function collectDisallowedOutputSchemaKeywords(schema: unknown): string[] {
  const disallowed = new Set<string>();
  walkSchemaNode(schema, disallowed);
  return [...disallowed].sort();
}

function walkSchemaNode(node: unknown, disallowed: Set<string>): void {
  if (!isSchemaObject(node)) {
    return;
  }

  for (const keyword of Object.keys(node)) {
    if (!PROVIDER_SAFE_OUTPUT_SCHEMA_KEYWORDS.has(keyword)) {
      disallowed.add(keyword);
    }
  }

  const { properties, items, additionalProperties } = node;

  if (isSchemaObject(properties)) {
    for (const subschema of Object.values(properties)) {
      walkSchemaNode(subschema, disallowed);
    }
  }

  if (Array.isArray(items)) {
    for (const subschema of items) {
      walkSchemaNode(subschema, disallowed);
    }
  } else {
    walkSchemaNode(items, disallowed);
  }

  if (isSchemaObject(additionalProperties)) {
    walkSchemaNode(additionalProperties, disallowed);
  }
}

function isSchemaObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
