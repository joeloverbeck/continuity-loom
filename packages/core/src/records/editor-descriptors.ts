import type { z } from "zod";

import { recordTypeRegistry } from "./registry.js";

export type FieldKind =
  | "short_string"
  | "prose"
  | "enum"
  | "reference"
  | "sentinel_reference"
  | "sentinel_reference_list"
  | "sentinel_short_string"
  | "sentinel_prose"
  | "sentinel_prose_list"
  | "list"
  | "nested_group"
  | "boolean"
  | "number";

export interface FieldDescriptor {
  name: string;
  kind: FieldKind;
  required: boolean;
  promptFacing: boolean;
  enumValues?: readonly string[];
  referenceRole?: string;
  itemDescriptor?: FieldDescriptor;
  fields?: readonly FieldDescriptor[];
}

export interface RecordEditorDescriptor {
  recordType: string;
  fields: readonly FieldDescriptor[];
}

export interface RecordSummary {
  id: string;
  type: string;
  displayLabel: string;
  archived?: boolean;
}

const PROSE_FIELD_HINTS = [
  "description",
  "statement",
  "claim",
  "summary",
  "text",
  "pressure",
  "behavioral",
  "current_effect",
  "possible_next_effect",
  "premise",
  "baseline",
  "policy",
  "preferences",
  "constraints",
  "guidance",
  "terms",
  "consequence",
  "activity",
  "voice",
  "presence",
  "strategy",
  "style",
  "rule",
  "warning",
  "notes",
  "cues",
  "reveals",
  "answer",
  "triggers"
] as const;

const STATUS_OR_VALIDATION_FIELDS = new Set([
  "id",
  "status",
  "plan_status",
  "salience",
  "urgency",
  "current_relevance",
  "visibility",
  "audience_visibility",
  "pov_visibility",
  "visibility_to_pov",
  "copy_policy",
  "reveal_permission",
  "can_drive_prose"
]);

export const PROMPT_FACING_FIELD_OVERRIDES: Readonly<Record<string, ReadonlySet<string>>> = Object.freeze({
  BELIEF: new Set(["visibility"])
});

const SYSTEM_MANAGED_FIELDS = new Set(["id"]);

const referenceTargetsByRole: Readonly<Record<string, readonly string[]>> = Object.freeze({
  available_to: ["ENTITY"],
  carried_by: ["ENTITY"],
  current_location: ["LOCATION"],
  entity_id: ["ENTITY"],
  from: ["ENTITY"],
  holder: ["ENTITY"],
  holder_or_target: ["ENTITY"],
  known_by: ["ENTITY"],
  location: ["LOCATION"],
  non_holder_to_protect: ["ENTITY"],
  owed_by: ["ENTITY"],
  owed_to: ["ENTITY"],
  owner: ["ENTITY"],
  participant: ["ENTITY"],
  pov_character: ["ENTITY"],
  record_link: Object.keys(recordTypeRegistry),
  secret_holder: ["ENTITY"],
  to: ["ENTITY"]
});

const labelFieldsByType: Readonly<Record<string, readonly string[]>> = Object.freeze({
  BELIEF: ["claim"],
  "CAST MEMBER": ["identity.one_line", "entity_id"],
  CLOCK: ["title"],
  CONSEQUENCE: ["current_effect"],
  EMOTION: ["description"],
  ENTITY: ["display_name"],
  "ENTITY STATUS": ["current_activity", "entity_id"],
  EVENT: ["description"],
  FACT: ["statement"],
  INTENTION: ["intent"],
  LOCATION: ["label"],
  OBJECT: ["label"],
  OBLIGATION: ["terms"],
  "OPEN THREAD": ["title"],
  PLAN: ["objective"],
  RELATIONSHIP: ["description"],
  SECRET: ["secret_claim"],
  "VISIBLE AFFORDANCE": ["label"]
});

export const recordEditorDescriptors: Readonly<Record<string, RecordEditorDescriptor>> = Object.freeze(
  Object.fromEntries(
    Object.values(recordTypeRegistry).map((definition) => [
      definition.recordType,
      {
        recordType: definition.recordType,
        fields: describeObjectFields(definition.payloadSchema, definition.recordType).filter(
          (field) => !SYSTEM_MANAGED_FIELDS.has(field.name)
        )
      }
    ])
  )
);

export function getEditorDescriptor(recordType: string): RecordEditorDescriptor | undefined {
  return recordEditorDescriptors[recordType];
}

export function getEditorFormSchema(recordType: string): z.ZodType | undefined {
  const schema = recordTypeRegistry[recordType]?.payloadSchema;

  if (!schema || !hasTopLevelField(schema, "id")) {
    return schema;
  }

  return (schema as z.ZodObject<Record<string, z.ZodType>>).omit({ id: true });
}

export function deriveDisplayLabel(recordType: string, payload: unknown): string {
  return truncateLabel(deriveFullDisplayLabel(recordType, payload));
}

export function deriveFullDisplayLabel(recordType: string, payload: unknown): string {
  const label = labelFieldsByType[recordType]
    ?.map((path) => valueAtPath(payload, path))
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (label) {
    return normalizeLabel(label);
  }

  return titleCase(recordType);
}

export function eligibleReferenceTargets(refRole: string, records: readonly RecordSummary[]): RecordSummary[] {
  const eligibleTypes = referenceTargetsByRole[refRole] ?? [];
  const eligibleTypeSet = new Set(eligibleTypes);

  return records
    .filter((record) => eligibleTypeSet.has(record.type) && !record.archived)
    .sort((left, right) =>
      left.type.localeCompare(right.type) ||
      left.displayLabel.localeCompare(right.displayLabel) ||
      left.id.localeCompare(right.id)
    );
}

export function referenceTargetTypes(refRole: string): readonly string[] {
  return referenceTargetsByRole[refRole] ?? [];
}

export function describeSchemaFields(schema: z.ZodType): readonly FieldDescriptor[] {
  return describeObjectFields(schema);
}

function describeObjectFields(schema: z.ZodType, recordType?: string): readonly FieldDescriptor[] {
  const unwrapped = unwrapSchema(schema).schema;
  const shape = objectShape(unwrapped);
  const fields = Object.entries(shape).map(([name, fieldSchema]) => describeField(name, fieldSchema, recordType));

  return [...fields.filter((field) => field.required), ...fields.filter((field) => !field.required)];
}

function describeField(name: string, schema: z.ZodType, recordType?: string): FieldDescriptor {
  const { schema: unwrapped, required } = unwrapSchema(schema);
  const base = {
    name,
    required,
    promptFacing: isPromptFacingField(name, recordType)
  };

  if (isSentinelReferenceListSchema(unwrapped, name)) {
    return {
      ...base,
      kind: "sentinel_reference_list",
      enumValues: enumValuesForSchema(unwrapped),
      referenceRole: roleForField(name)
    };
  }

  if (isSentinelReferenceSchema(unwrapped, name)) {
    return {
      ...base,
      kind: "sentinel_reference",
      enumValues: enumValuesForSchema(unwrapped),
      referenceRole: roleForField(name)
    };
  }

  if (isReferenceSchema(unwrapped, name)) {
    return { ...base, kind: "reference", referenceRole: roleForField(name) };
  }

  if (isSentinelProseListSchema(unwrapped, name)) {
    return {
      ...base,
      kind: "sentinel_prose_list",
      enumValues: enumValuesForSchema(unwrapped),
      itemDescriptor: describeListItem(name, sentinelListArrayElement(unwrapped), recordType)
    };
  }

  if (isSentinelScalarSchema(unwrapped, name)) {
    return {
      ...base,
      kind: stringFieldKind(name) === "prose" ? "sentinel_prose" : "sentinel_short_string",
      enumValues: enumValuesForSchema(unwrapped)
    };
  }

  if (isRecordLinkListSchema(unwrapped, name)) {
    return {
      ...base,
      kind: "list",
      itemDescriptor: {
        ...base,
        name,
        kind: "reference",
        required: true,
        referenceRole: roleForField(name)
      }
    };
  }

  if (schemaType(unwrapped) === "array") {
    const element = arrayElement(unwrapped);
    return {
      ...base,
      kind: "list",
      itemDescriptor: describeListItem(name, element, recordType)
    };
  }

  if (schemaType(unwrapped) === "object") {
    return {
      ...base,
      kind: "nested_group",
      fields: describeObjectFields(unwrapped, recordType)
    };
  }

  const enumValues = enumValuesForSchema(unwrapped);

  if (enumValues.length > 0) {
    return { ...base, kind: "enum", enumValues };
  }

  if (schemaType(unwrapped) === "boolean") {
    return { ...base, kind: "boolean" };
  }

  if (schemaType(unwrapped) === "number") {
    return { ...base, kind: "number" };
  }

  return { ...base, kind: stringFieldKind(name) };
}

function describeListItem(name: string, schema: z.ZodType, recordType?: string): FieldDescriptor {
  const item = describeField(`${name}[]`, schema, recordType);

  return {
    ...item,
    name: name,
    required: true
  };
}

function isPromptFacingField(name: string, recordType?: string): boolean {
  return Boolean(recordType && PROMPT_FACING_FIELD_OVERRIDES[recordType]?.has(name))
    || !STATUS_OR_VALIDATION_FIELDS.has(name);
}

function unwrapSchema(schema: z.ZodType): { schema: z.ZodType; required: boolean } {
  let current = schema;
  let required = true;

  while (schemaType(current) === "optional" || schemaType(current) === "default") {
    required = false;
    current = schemaDefinition(current).innerType as z.ZodType;
  }

  return { schema: current, required };
}

function schemaDefinition(schema: z.ZodType): Record<string, unknown> {
  return (schema as unknown as { _def?: Record<string, unknown>; def?: Record<string, unknown> })._def
    ?? (schema as unknown as { def?: Record<string, unknown> }).def
    ?? {};
}

function schemaType(schema: z.ZodType): string | undefined {
  return schemaDefinition(schema).type as string | undefined;
}

function objectShape(schema: z.ZodType): Record<string, z.ZodType> {
  const shape = schemaDefinition(schema).shape as Record<string, z.ZodType> | (() => Record<string, z.ZodType>);

  if (typeof shape === "function") {
    return shape();
  }

  return shape;
}

function hasTopLevelField(schema: z.ZodType, fieldName: string): boolean {
  const unwrapped = unwrapSchema(schema).schema;

  return schemaType(unwrapped) === "object" && Object.hasOwn(objectShape(unwrapped), fieldName);
}

function arrayElement(schema: z.ZodType): z.ZodType {
  const definition = schemaDefinition(schema);

  return (definition.element ?? definition.type) as z.ZodType;
}

function enumValuesForSchema(schema: z.ZodType): readonly string[] {
  const type = schemaType(schema);

  if (type === "enum") {
    return [...((schema as unknown as { options?: readonly string[] }).options ?? [])];
  }

  if (type === "literal") {
    const values = schemaDefinition(schema).values;
    return Array.isArray(values) ? values.map(String) : [];
  }

  if (type === "union") {
    return unionOptions(schema).flatMap((option) => enumValuesForSchema(option));
  }

  return [];
}

function isReferenceSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)]) {
    return false;
  }

  if (schemaType(schema) === "string" && (schema as unknown as { format?: string }).format === "uuid") {
    return true;
  }

  if (schemaType(schema) === "union") {
    return unionOptions(schema).some((option) => isReferenceSchema(option, name));
  }

  return false;
}

function isSentinelReferenceListSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)] || schemaType(schema) !== "union") {
    return false;
  }

  const options = unionOptions(schema);
  const hasSentinels = enumValuesForSchema(schema).length > 0;
  if (!hasSentinels) {
    return false;
  }

  const nonSentinelArms = options.filter((option) => enumValuesForSchema(option).length === 0);

  return (
    nonSentinelArms.length > 0 &&
    nonSentinelArms.every(
      (option) => schemaType(option) === "array" && isReferenceSchema(arrayElement(option), name)
    )
  );
}

function isRecordLinkListSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)] || schemaType(schema) !== "union") {
    return false;
  }

  const options = unionOptions(schema);
  const hasReferenceArray = options.some(
    (option) => schemaType(option) === "array" && isReferenceSchema(arrayElement(option), name)
  );
  const hasSentinels = enumValuesForSchema(schema).length > 0;

  return hasReferenceArray && !hasSentinels;
}

function isSentinelReferenceSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)] || schemaType(schema) !== "union") {
    return false;
  }

  const options = unionOptions(schema);
  const hasReference = options.some((option) => isReferenceSchema(option, name));
  const hasSentinels = enumValuesForSchema(schema).length > 0;

  return hasReference && hasSentinels;
}

function isSentinelProseListSchema(schema: z.ZodType, name: string): boolean {
  if (schemaType(schema) !== "union" || referenceTargetsByRole[roleForField(name)]) {
    return false;
  }

  const options = unionOptions(schema);
  const arrayOption = options.find((option) => schemaType(option) === "array");
  const hasProseArray = Boolean(arrayOption && stringFieldKind(`${name}[]`) === "prose");
  const hasSentinels = enumValuesForSchema(schema).length > 0;

  return hasProseArray && hasSentinels;
}

function isSentinelScalarSchema(schema: z.ZodType, name: string): boolean {
  if (schemaType(schema) !== "union" || referenceTargetsByRole[roleForField(name)]) {
    return false;
  }

  const options = unionOptions(schema);
  const hasSentinels = enumValuesForSchema(schema).length > 0;
  if (!hasSentinels) {
    return false;
  }

  const nonSentinelArms = options.filter((option) => enumValuesForSchema(option).length === 0);

  return (
    nonSentinelArms.length > 0 &&
    nonSentinelArms.every((option) => schemaType(option) === "string" || schemaType(option) === "number")
  );
}

function sentinelListArrayElement(schema: z.ZodType): z.ZodType {
  const arrayOption = unionOptions(schema).find((option) => schemaType(option) === "array");

  if (!arrayOption) {
    throw new Error("Sentinel list schema is missing an array option.");
  }

  return arrayElement(arrayOption);
}

function unionOptions(schema: z.ZodType): z.ZodType[] {
  return (schemaDefinition(schema).options as z.ZodType[] | undefined) ?? [];
}

function roleForField(name: string): string {
  const bare = name.replace(/\[\]$/, "");

  if (bare === "holders") {
    return "secret_holder";
  }

  if (bare === "participants") {
    return "participant";
  }

  if (bare === "non_holders_to_protect") {
    return "non_holder_to_protect";
  }

  if (bare === "causes" || bare === "effects" || bare === "cause") {
    return "record_link";
  }

  return bare;
}

function stringFieldKind(name: string): FieldKind {
  return PROSE_FIELD_HINTS.some((hint) => name.includes(hint)) ? "prose" : "short_string";
}

function valueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

function truncateLabel(label: string): string {
  const trimmed = normalizeLabel(label);
  return trimmed.length <= 80 ? trimmed : `${trimmed.slice(0, 77)}...`;
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

function titleCase(recordType: string): string {
  return recordType
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
