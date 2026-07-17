import { z } from "zod";

import {
  describeSchemaFields,
  referenceTargetTypes,
  type FieldDescriptor
} from "../../records/editor-descriptors.js";
import { recordTypeRegistry, recordTypes, type RecordTypeDefinition } from "../../records/registry.js";

export const SEGMENT_RECONCILIATION_CATALOG_SECTION_CEILING_UTF16 = 18_688;

export interface SegmentReconciliationSchemaCatalog {
  catalogVersion: string;
  grammar: "segment_reconciliation.schema_catalog.v1";
  uuidPattern: string | null;
  recordTypes: readonly SegmentReconciliationRecordTypeCatalogEntry[];
}

export interface SegmentReconciliationRecordTypeCatalogEntry {
  recordType: string;
  fields: readonly SegmentReconciliationCatalogField[];
  repositoryFields: readonly SegmentReconciliationRepositoryField[];
  lifecycle: SegmentReconciliationLifecycle;
}

export type SegmentReconciliationLifecycle =
  | { kind: "field" }
  | { kind: "none" }
  | { kind: "projected"; legalValues: readonly string[] };

export interface SegmentReconciliationRepositoryField {
  path: "id";
  repositoryManaged: true;
  forbiddenOutput: true;
}

export interface SegmentReconciliationCatalogField {
  path: string;
  presence: "required" | "optional";
  shape: string;
  defaultValue?: unknown;
  repositoryManaged?: true;
  forbiddenOutput?: true;
  reference?: SegmentReconciliationReferenceCatalogEntry;
  deactivationDestinations?: readonly string[];
}

export interface SegmentReconciliationReferenceCatalogEntry {
  cardinality: "one" | "many";
  refRole: string;
  targetTypes: readonly string[];
}

const ALLOWED_DEACTIVATION_DESTINATIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ENTITY: [],
  "ENTITY STATUS": [],
  "CAST MEMBER": [],
  FACT: [],
  BELIEF: ["resolved", "abandoned"],
  SECRET: ["disproven", "abandoned"],
  LOCATION: ["inactive", "destroyed", "inaccessible"],
  OBJECT: ["lost", "destroyed", "transferred", "inactive"],
  "VISIBLE AFFORDANCE": ["unavailable"],
  EVENT: ["resolved", "background", "abandoned"],
  INTENTION: ["satisfied", "abandoned"],
  PLAN: ["fulfilled", "failed", "abandoned", "revised"],
  CLOCK: ["resolved", "abandoned"],
  OBLIGATION: ["closed", "abandoned", "transferred"],
  CONSEQUENCE: ["resolved", "abandoned"],
  "OPEN THREAD": ["answered", "resolved", "abandoned", "superseded"],
  RELATIONSHIP: ["resolved", "abandoned"],
  EMOTION: ["settled"]
});

export function buildSegmentReconciliationSchemaCatalog(
  contractVersion: string,
  registry: Readonly<Record<string, RecordTypeDefinition>> = recordTypeRegistry,
  types: readonly string[] = recordTypes,
  lifecycleDestinations: Readonly<Record<string, readonly string[]>> = ALLOWED_DEACTIVATION_DESTINATIONS
): SegmentReconciliationSchemaCatalog {
  assertRegistryCoverage(registry, types);
  const context: CatalogBuildContext = {};
  const catalogRecordTypes = types.map((recordType) =>
    catalogEntryFor(recordType, registry, lifecycleDestinations, context)
  );

  return {
    catalogVersion: contractVersion,
    grammar: "segment_reconciliation.schema_catalog.v1",
    uuidPattern: context.uuidPattern ?? null,
    recordTypes: catalogRecordTypes
  };
}

export function allowedDeactivationDestinationsFor(recordType: string): readonly string[] {
  return ALLOWED_DEACTIVATION_DESTINATIONS[recordType] ?? [];
}

export function renderSegmentReconciliationSchemaCatalog(
  catalog: SegmentReconciliationSchemaCatalog
): string {
  const lines = [
    `catalog ${catalogToken(catalog.grammar)} contract=${catalogToken(catalog.catalogVersion)}`,
    `uuid_pattern=${catalog.uuidPattern === null ? "none" : catalogToken(catalog.uuidPattern)}`,
    "legend !=required ?=optional text(min=n)=string/prose uuid=registered-pattern boolean number literal(v) enum(values) union(a|b) list(a) object(closed); defaults, references, lifecycle, and repository markers are field-local"
  ];

  for (const entry of catalog.recordTypes) {
    lines.push(`record ${catalogToken(entry.recordType)}`);

    for (const field of entry.repositoryFields) {
      lines.push(`repository_field ${catalogToken(field.path)} managed=repository output=forbidden`);
    }

    for (const field of entry.fields) {
      lines.push(renderCatalogField(field));
    }

    if (entry.lifecycle.kind === "none") {
      lines.push("lifecycle none");
    } else if (entry.lifecycle.kind === "projected") {
      lines.push(`lifecycle projected values=${catalogToken(entry.lifecycle.legalValues)} deactivate=[]`);
    }

    lines.push("end");
  }

  return lines.join("\n");
}

function renderCatalogField(field: SegmentReconciliationCatalogField): string {
  const parts = [
    "field",
    catalogToken(field.path),
    field.presence === "required" ? "!" : "?",
    escapeCatalogText(field.shape)
  ];

  if (field.defaultValue !== undefined) {
    parts.push(`default=${catalogToken(field.defaultValue)}`);
  }
  if (field.repositoryManaged) {
    parts.push("managed=repository");
  }
  if (field.forbiddenOutput) {
    parts.push("output=forbidden");
  }
  if (field.reference) {
    parts.push(
      `ref=${field.reference.cardinality}:${catalogToken(field.reference.refRole)}->${catalogToken(field.reference.targetTypes)}`
    );
  }
  if (field.deactivationDestinations) {
    parts.push(`deactivate=${catalogToken(field.deactivationDestinations)}`);
  }

  return parts.join(" ");
}

function catalogToken(value: unknown): string {
  const rendered = JSON.stringify(value);
  if (rendered === undefined) {
    throw new Error("Undefined catalog tokens are not representable");
  }
  return escapeCatalogText(rendered);
}

function escapeCatalogText(value: string): string {
  return value.replace(/[<>&]/g, (character) => {
    if (character === "<") {
      return "\\u003c";
    }
    if (character === ">") {
      return "\\u003e";
    }
    return "\\u0026";
  });
}

function catalogEntryFor(
  recordType: string,
  registry: Readonly<Record<string, RecordTypeDefinition>>,
  lifecycleDestinations: Readonly<Record<string, readonly string[]>>,
  context: CatalogBuildContext
): SegmentReconciliationRecordTypeCatalogEntry {
  const definition = registry[recordType];

  if (!definition) {
    throw new Error(`Missing registry definition for ${recordType}`);
  }

  const payloadJsonSchema = asSchemaObject(z.toJSONSchema(definition.payloadSchema), recordType);
  const fieldMetadata = fieldMetadataFor(describeSchemaFields(definition.payloadSchema));
  const fields = flattenSchemaFields(recordType, payloadJsonSchema, fieldMetadata, context);

  if (fields.length === 0) {
    throw new Error(`No fields represented for ${recordType}`);
  }

  for (const path of fieldMetadata.keys()) {
    if (!fields.some((field) => field.path === path)) {
      throw new Error(`Descriptor field ${path} is missing from ${recordType}`);
    }
  }

  const idField = fields.find((field) => field.path === "id");
  const repositoryFields: SegmentReconciliationRepositoryField[] = [];
  if (idField) {
    idField.repositoryManaged = true;
    idField.forbiddenOutput = true;
  } else {
    repositoryFields.push({ path: "id", repositoryManaged: true, forbiddenOutput: true });
  }

  const lifecycleField = lifecycleFieldFor(fields);
  const destinations = lifecycleDestinations[recordType];
  if (!destinations) {
    throw new Error(`Missing lifecycle metadata for ${recordType}`);
  }

  const lifecycle = applyLifecycleMetadata(recordType, definition, fields, lifecycleField, destinations);

  return {
    recordType,
    fields,
    repositoryFields,
    lifecycle
  };
}

interface CatalogBuildContext {
  uuidPattern?: string;
}

interface CatalogFieldMetadata {
  presence: "required" | "optional";
  reference?: SegmentReconciliationReferenceCatalogEntry;
}

type JsonSchema = Record<string, unknown>;

function assertRegistryCoverage(
  registry: Readonly<Record<string, RecordTypeDefinition>>,
  types: readonly string[]
): void {
  if (new Set(types).size !== types.length) {
    throw new Error("Duplicate record type in schema catalog order");
  }

  for (const recordType of types) {
    if (!registry[recordType]) {
      throw new Error(`Missing registry definition for ${recordType}`);
    }
  }

  const omitted = Object.keys(registry).filter((recordType) => !types.includes(recordType));
  if (omitted.length > 0) {
    throw new Error(`Registry types omitted from schema catalog order: ${omitted.join(", ")}`);
  }
}

function asSchemaObject(value: unknown, subject: string): JsonSchema {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Unrepresentable JSON Schema for ${subject}`);
  }

  return value as JsonSchema;
}

function flattenSchemaFields(
  recordType: string,
  schema: JsonSchema,
  fieldMetadata: ReadonlyMap<string, CatalogFieldMetadata>,
  context: CatalogBuildContext,
  prefix = "",
  root = true
): SegmentReconciliationCatalogField[] {
  assertClosedObjectSchema(schema, `${recordType}${prefix ? `.${prefix}` : ""}`, root);
  const properties = propertySchemas(schema, recordType);
  requiredPropertyNames(schema, properties, recordType);
  const fields: SegmentReconciliationCatalogField[] = [];

  for (const [name, propertyValue] of Object.entries(properties)) {
    const path = prefix ? `${prefix}.${name}` : name;
    const propertySchema = asSchemaObject(propertyValue, `${recordType}.${path}`);
    const metadata = fieldMetadata.get(path);
    if (!metadata) {
      throw new Error(`Schema field ${path} has no descriptor metadata for ${recordType}`);
    }
    const field: SegmentReconciliationCatalogField = {
      path,
      presence: metadata.presence,
      shape: schemaShape(propertySchema, `${recordType}.${path}`, context)
    };

    if (Object.hasOwn(propertySchema, "default")) {
      field.defaultValue = propertySchema.default;
    }

    if (metadata.reference) {
      field.reference = metadata.reference;
    }

    fields.push(field);

    const nested = nestedObjectSchema(propertySchema, `${recordType}.${path}`);
    if (nested) {
      const nestedPrefix = propertySchema.type === "array" ? `${path}[]` : path;
      fields.push(...flattenSchemaFields(recordType, nested, fieldMetadata, context, nestedPrefix, false));
    }
  }

  return fields;
}

function assertClosedObjectSchema(schema: JsonSchema, subject: string, root: boolean): void {
  assertKnownKeys(
    schema,
    root
      ? ["$schema", "type", "properties", "required", "additionalProperties"]
      : ["type", "properties", "required", "additionalProperties", "default"],
    subject
  );

  if (schema.type !== "object" || schema.additionalProperties !== false) {
    throw new Error(`Schema object must be closed for ${subject}`);
  }

  propertySchemas(schema, subject);
}

function propertySchemas(schema: JsonSchema, subject: string): Record<string, unknown> {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    throw new Error(`Schema object properties are missing for ${subject}`);
  }

  return properties as Record<string, unknown>;
}

function requiredPropertyNames(
  schema: JsonSchema,
  properties: Record<string, unknown>,
  subject: string
): ReadonlySet<string> {
  if (schema.required === undefined) {
    return new Set();
  }

  if (!Array.isArray(schema.required) || schema.required.some((value) => typeof value !== "string")) {
    throw new Error(`Invalid required-field list for ${subject}`);
  }

  const required = new Set(schema.required as string[]);
  for (const name of required) {
    if (!Object.hasOwn(properties, name)) {
      throw new Error(`Required field ${name} is missing from ${subject}`);
    }
  }

  return required;
}

function schemaShape(schema: JsonSchema, subject: string, context: CatalogBuildContext): string {
  if (schema.anyOf !== undefined) {
    assertKnownKeys(schema, ["anyOf", "default"], subject);
    if (!Array.isArray(schema.anyOf) || schema.anyOf.length < 2) {
      throw new Error(`Union must contain at least two alternatives for ${subject}`);
    }

    const alternatives = schema.anyOf.map((option, index) => {
      const optionSchema = asSchemaObject(option, `${subject}.union[${index}]`);
      if (nestedObjectSchema(optionSchema, `${subject}.union[${index}]`)) {
        throw new Error(`Nested structural unions are not representable for ${subject}`);
      }
      return schemaShape(optionSchema, `${subject}.union[${index}]`, context);
    });
    return `union(${alternatives.join("|")})`;
  }

  if (schema.const !== undefined) {
    assertKnownKeys(schema, ["type", "const", "default"], subject);
    return `literal(${canonicalInline(schema.const)})`;
  }

  if (schema.enum !== undefined) {
    assertKnownKeys(schema, ["type", "enum", "default"], subject);
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
      throw new Error(`Enum must contain at least one value for ${subject}`);
    }
    return `enum(${canonicalInline(schema.enum)})`;
  }

  switch (schema.type) {
    case "string":
      return stringShape(schema, subject, context);
    case "number":
      assertKnownKeys(schema, ["type", "default"], subject);
      return "number";
    case "boolean":
      assertKnownKeys(schema, ["type", "default"], subject);
      return "boolean";
    case "array": {
      assertKnownKeys(schema, ["type", "items", "default"], subject);
      const items = asSchemaObject(schema.items, `${subject}[]`);
      return `list(${schemaShape(items, `${subject}[]`, context)})`;
    }
    case "object":
      assertClosedObjectSchema(schema, subject, false);
      return "object(closed)";
    default:
      throw new Error(`Unsupported schema type ${String(schema.type)} for ${subject}`);
  }
}

function stringShape(schema: JsonSchema, subject: string, context: CatalogBuildContext): string {
  assertKnownKeys(schema, ["type", "minLength", "format", "pattern", "default"], subject);

  if (schema.format !== undefined) {
    if (schema.format !== "uuid" || typeof schema.pattern !== "string") {
      throw new Error(`Unsupported string format for ${subject}`);
    }

    if (context.uuidPattern && context.uuidPattern !== schema.pattern) {
      throw new Error(`Multiple UUID patterns are not representable for ${subject}`);
    }
    context.uuidPattern = schema.pattern;
    return "uuid";
  }

  const constraints: string[] = [];
  const minLength = schema.minLength;
  if (minLength !== undefined) {
    if (typeof minLength !== "number" || !Number.isInteger(minLength) || minLength < 0) {
      throw new Error(`Invalid minLength for ${subject}`);
    }
    constraints.push(`min=${String(minLength)}`);
  }
  if (schema.pattern !== undefined) {
    if (typeof schema.pattern !== "string") {
      throw new Error(`Invalid string pattern for ${subject}`);
    }
    constraints.push(`pattern=${canonicalInline(schema.pattern)}`);
  }

  return constraints.length > 0 ? `text(${constraints.join(",")})` : "text";
}

function nestedObjectSchema(schema: JsonSchema, subject: string): JsonSchema | null {
  if (schema.anyOf !== undefined) {
    const alternatives = schema.anyOf;
    if (Array.isArray(alternatives) && alternatives.some((option) => {
      const optionSchema = asSchemaObject(option, subject);
      return optionSchema.type === "object"
        || (optionSchema.type === "array" && asSchemaObject(optionSchema.items, `${subject}[]`).type === "object");
    })) {
      throw new Error(`Nested structural unions are not representable for ${subject}`);
    }
    return null;
  }

  if (schema.type === "object") {
    return schema;
  }

  if (schema.type === "array") {
    const items = asSchemaObject(schema.items, `${subject}[]`);
    return items.type === "object" ? items : null;
  }

  return null;
}

function canonicalInline(value: unknown): string {
  const rendered = JSON.stringify(value);
  if (rendered === undefined) {
    throw new Error("Undefined schema values are not representable");
  }
  return rendered;
}

function assertKnownKeys(schema: JsonSchema, allowed: readonly string[], subject: string): void {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(schema).filter((key) => !allowedKeys.has(key));
  if (unknown.length > 0) {
    throw new Error(`Unsupported schema keyword(s) for ${subject}: ${unknown.join(", ")}`);
  }
}

function lifecycleFieldFor(fields: readonly SegmentReconciliationCatalogField[]): string | null {
  return fields.find((field) => field.path === "plan_status")?.path
    ?? fields.find((field) => field.path === "status")?.path
    ?? null;
}

function applyLifecycleMetadata(
  recordType: string,
  definition: RecordTypeDefinition,
  fields: SegmentReconciliationCatalogField[],
  lifecycleField: string | null,
  destinations: readonly string[]
): SegmentReconciliationLifecycle {
  const legalValues = definition.statusValues ?? [];
  if (!lifecycleField) {
    if (destinations.length > 0) {
      throw new Error(`Lifecycle destinations have no lifecycle field for ${recordType}`);
    }
    return legalValues.length > 0
      ? { kind: "projected", legalValues }
      : { kind: "none" };
  }

  if (legalValues.length === 0) {
    throw new Error(`Lifecycle field ${lifecycleField} has no legal values for ${recordType}`);
  }

  const field = fields.find((candidate) => candidate.path === lifecycleField);
  if (!field) {
    throw new Error(`Lifecycle field ${lifecycleField} is missing for ${recordType}`);
  }

  const expectedShape = `enum(${canonicalInline(legalValues)})`;
  if (field.shape !== expectedShape) {
    throw new Error(`Lifecycle legal values disagree with ${lifecycleField} for ${recordType}`);
  }

  const illegalDestination = destinations.find((destination) => !legalValues.includes(destination));
  if (illegalDestination) {
    throw new Error(`Illegal deactivation destination ${illegalDestination} for ${recordType}`);
  }

  field.deactivationDestinations = destinations;
  return { kind: "field" };
}

function fieldMetadataFor(
  fields: readonly FieldDescriptor[],
  prefix = "",
  entries = new Map<string, CatalogFieldMetadata>()
): ReadonlyMap<string, CatalogFieldMetadata> {

  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    if (entries.has(path)) {
      throw new Error(`Duplicate descriptor metadata for ${path}`);
    }

    const metadata: CatalogFieldMetadata = {
      presence: field.required ? "required" : "optional"
    };

    if (field.kind === "reference" || field.kind === "sentinel_reference") {
      metadata.reference = referenceMetadata(path, "one", field);
    }

    if (field.kind === "sentinel_reference_list") {
      metadata.reference = referenceMetadata(path, "many", field);
    }

    if (field.kind === "list" && field.itemDescriptor?.kind === "reference") {
      metadata.reference = referenceMetadata(path, "many", field.itemDescriptor);
    }

    entries.set(path, metadata);

    if (field.kind === "list" && field.itemDescriptor?.fields) {
      fieldMetadataFor(field.itemDescriptor.fields, `${path}[]`, entries);
    }
    if (field.fields) {
      fieldMetadataFor(field.fields, path, entries);
    }
  }

  return entries;
}

function referenceMetadata(
  path: string,
  cardinality: "one" | "many",
  field: FieldDescriptor
): SegmentReconciliationReferenceCatalogEntry {
  const refRole = field.referenceRole;

  if (!refRole) {
    throw new Error(`Reference field ${path} is missing a reference role`);
  }

  const targetTypes = referenceTargetTypes(refRole);
  if (targetTypes.length === 0) {
    throw new Error(`Reference field ${path} has no permitted target types`);
  }

  return {
    cardinality,
    refRole,
    targetTypes
  };
}
