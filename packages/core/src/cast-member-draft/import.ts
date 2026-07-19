import { z } from "zod";

import type { CastMember } from "../records/cast-member.js";
import { getRecordTypeDefinition } from "../records/registry.js";

type JsonObject = Record<string, unknown>;

type DeepPartial<T> = T extends readonly (infer TItem)[]
  ? DeepPartial<TItem>[]
  : T extends object
    ? { [TKey in keyof T]?: DeepPartial<T[TKey]> }
    : T;

export type CastMemberDraftValues = DeepPartial<Omit<CastMember, "entity_id">>;

export type CastMemberDraftSkipReason =
  | "protected field"
  | "unknown field"
  | "empty value"
  | "invalid enum value"
  | "malformed entry";

export interface CastMemberDraftSkippedField {
  path: string;
  reason: CastMemberDraftSkipReason;
  message: string;
}

export type CastMemberDraftParseResult =
  | { ok: true; value: JsonObject }
  | { ok: false; message: string };

export interface CastMemberDraftMapping {
  values: CastMemberDraftValues;
  filledFields: readonly string[];
  skippedFields: readonly CastMemberDraftSkippedField[];
  uncertainties: readonly string[];
  inventedFields: readonly string[];
}

export interface CastMemberDraftImportReport {
  filledFields: readonly string[];
  skippedFields: readonly CastMemberDraftSkippedField[];
  needsAuthor: {
    entityId: string;
    uncertainties: readonly string[];
    inventedFields: readonly string[];
  };
}

type MappedValue = { present: true; value: unknown } | { present: false };

const reviewMetadataKeys = new Set(["uncertainties", "invented_fields"]);

export function parseCastMemberDraftResponse(input: string): CastMemberDraftParseResult {
  const fencedPattern = /```(?:json)?\s*([\s\S]*?)```/giu;

  for (const match of input.matchAll(fencedPattern)) {
    const parsed = parseObject(match[1] ?? "");
    if (parsed) {
      return { ok: true, value: parsed };
    }
  }

  for (const candidate of balancedObjectCandidates(input)) {
    const parsed = parseObject(candidate);
    if (parsed) {
      return { ok: true, value: parsed };
    }
  }

  return {
    ok: false,
    message: "Could not find and parse a complete JSON object. Paste the fenced JSON response and retry."
  };
}

export function mapCastMemberDraftFields(input: unknown): CastMemberDraftMapping {
  const skippedFields: CastMemberDraftSkippedField[] = [];
  const filledFields: string[] = [];
  const recordSchema = concreteSchema(getRecordTypeDefinition("CAST MEMBER")?.payloadSchema);

  if (!(recordSchema instanceof z.ZodObject)) {
    throw new Error("The registered CAST MEMBER payload schema must be an object.");
  }

  if (!isJsonObject(input)) {
    return {
      values: {},
      filledFields,
      skippedFields: [skipped("$", "malformed entry")],
      uncertainties: [],
      inventedFields: []
    };
  }

  const values = mapObject(input, recordSchema, "", skippedFields, filledFields, true);
  const uncertainties = mapReviewList(input.uncertainties, "uncertainties", skippedFields);
  const inventedFields = mapReviewList(input.invented_fields, "invented_fields", skippedFields);

  return {
    values,
    filledFields,
    skippedFields,
    uncertainties,
    inventedFields
  };
}

export function buildCastMemberDraftImportReport(
  mapping: CastMemberDraftMapping
): CastMemberDraftImportReport {
  return {
    filledFields: [...mapping.filledFields],
    skippedFields: [...mapping.skippedFields],
    needsAuthor: {
      entityId: "Select or confirm the linked ENTITY in the Cast Member editor.",
      uncertainties: [...mapping.uncertainties],
      inventedFields: [...mapping.inventedFields]
    }
  };
}

function parseObject(candidate: string): JsonObject | null {
  try {
    const parsed: unknown = JSON.parse(candidate.trim());
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function balancedObjectCandidates(input: string): string[] {
  const candidates: string[] = [];

  for (let start = 0; start < input.length; start += 1) {
    if (input[start] !== "{") {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < input.length; index += 1) {
      const character = input[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === '"') {
          inString = false;
        }
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          candidates.push(input.slice(start, index + 1));
          break;
        }
      }
    }
  }

  return candidates;
}

function mapObject(
  input: JsonObject,
  schema: z.ZodObject,
  parentPath: string,
  skippedFields: CastMemberDraftSkippedField[],
  filledFields: string[],
  topLevel: boolean
): JsonObject {
  const shape = schema.shape as Record<string, z.ZodType>;
  const output: JsonObject = {};

  for (const key of Object.keys(input)) {
    const path = joinPath(parentPath, key);

    if (topLevel && reviewMetadataKeys.has(key)) {
      continue;
    }

    if (topLevel && key === "entity_id") {
      skippedFields.push(skipped(path, "protected field"));
      continue;
    }

    if (!(key in shape)) {
      skippedFields.push(skipped(path, "unknown field"));
    }
  }

  for (const [key, childSchema] of Object.entries(shape)) {
    if (topLevel && key === "entity_id") {
      continue;
    }

    if (!Object.hasOwn(input, key)) {
      continue;
    }

    const path = joinPath(parentPath, key);
    const mapped = mapValue(input[key], childSchema, path, skippedFields, filledFields);
    if (mapped.present) {
      output[key] = mapped.value;
    }
  }

  return output;
}

function mapValue(
  value: unknown,
  schema: z.ZodType,
  path: string,
  skippedFields: CastMemberDraftSkippedField[],
  filledFields: string[]
): MappedValue {
  const concrete = concreteSchema(schema);

  if (!concrete) {
    throw new Error(`Missing registered schema for ${path}.`);
  }

  if (isEmptyValue(value)) {
    skippedFields.push(skipped(path, "empty value"));
    return { present: false };
  }

  if (concrete instanceof z.ZodObject) {
    if (!isJsonObject(value)) {
      skippedFields.push(skipped(path, "malformed entry"));
      return { present: false };
    }

    const mapped = mapObject(value, concrete, path, skippedFields, filledFields, false);
    return Object.keys(mapped).length > 0
      ? { present: true, value: mapped }
      : { present: false };
  }

  if (concrete instanceof z.ZodArray) {
    if (!Array.isArray(value)) {
      skippedFields.push(skipped(path, "malformed entry"));
      return { present: false };
    }

    const mappedItems: unknown[] = [];
    value.forEach((item, index) => {
      const mapped = mapValue(
        item,
        classicSchema(concrete.element),
        `${path}[${index}]`,
        skippedFields,
        filledFields
      );
      if (mapped.present) {
        mappedItems.push(mapped.value);
      }
    });

    return mappedItems.length > 0
      ? { present: true, value: mappedItems }
      : { present: false };
  }

  const parsed = concrete.safeParse(value);
  if (!parsed.success) {
    const reason = concrete instanceof z.ZodEnum ? "invalid enum value" : "malformed entry";
    skippedFields.push(skipped(path, reason, parsed.error.issues[0]?.message));
    return { present: false };
  }

  filledFields.push(path);
  return { present: true, value: parsed.data };
}

function mapReviewList(
  value: unknown,
  path: string,
  skippedFields: CastMemberDraftSkippedField[]
): string[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    skippedFields.push(skipped(path, "malformed entry"));
    return [];
  }

  const items: string[] = [];
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (typeof item !== "string") {
      skippedFields.push(skipped(itemPath, "malformed entry"));
    } else if (item.trim().length === 0) {
      skippedFields.push(skipped(itemPath, "empty value"));
    } else {
      items.push(item);
    }
  });

  return items;
}

function concreteSchema(schema: z.ZodType | undefined): z.ZodType | undefined {
  let current = schema;

  while (
    current instanceof z.ZodOptional
    || current instanceof z.ZodDefault
    || current instanceof z.ZodNullable
  ) {
    current = classicSchema(current.unwrap());
  }

  return current;
}

function classicSchema(schema: unknown): z.ZodType {
  if (!(schema instanceof z.ZodType)) {
    throw new Error("The registered CAST MEMBER schema contains an unsupported schema node.");
  }

  return schema;
}

function skipped(
  path: string,
  reason: CastMemberDraftSkipReason,
  detail?: string
): CastMemberDraftSkippedField {
  const defaultMessages: Record<CastMemberDraftSkipReason, string> = {
    "protected field": "This field stays under the author's control and was not imported.",
    "unknown field": "This key is not part of the registered CAST MEMBER schema.",
    "empty value": "Empty values are not imported.",
    "invalid enum value": "The value is not one of the registered enum options.",
    "malformed entry": "The value does not match the registered field shape."
  };

  return { path, reason, message: detail ?? defaultMessages[reason] };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmptyValue(value: unknown): boolean {
  return (typeof value === "string" && value.trim().length === 0)
    || (Array.isArray(value) && value.length === 0)
    || (isJsonObject(value) && Object.keys(value).length === 0);
}

function joinPath(parentPath: string, key: string): string {
  return parentPath ? `${parentPath}.${key}` : key;
}
