import { z } from "zod";

import {
  describeSchemaFields,
  referenceTargetTypes,
  type FieldDescriptor
} from "../../records/editor-descriptors.js";
import { recordTypeRegistry, recordTypes, type RecordTypeDefinition } from "../../records/registry.js";

export interface SegmentReconciliationSchemaCatalog {
  catalogVersion: string;
  recordTypes: readonly SegmentReconciliationRecordTypeCatalogEntry[];
}

export interface SegmentReconciliationRecordTypeCatalogEntry {
  recordType: string;
  payloadJsonSchema: unknown;
  fields: readonly FieldDescriptor[];
  repositoryManagedFields: readonly string[];
  forbiddenOutputFields: readonly string[];
  lifecycle: SegmentReconciliationLifecycleCatalogEntry;
  references: readonly SegmentReconciliationReferenceCatalogEntry[];
}

export interface SegmentReconciliationLifecycleCatalogEntry {
  field: string | null;
  legalValues: readonly string[];
  allowedDeactivationDestinations: readonly string[];
}

export interface SegmentReconciliationReferenceCatalogEntry {
  path: string;
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
  types: readonly string[] = recordTypes
): SegmentReconciliationSchemaCatalog {
  return {
    catalogVersion: contractVersion,
    recordTypes: types.map((recordType) => catalogEntryFor(recordType, registry))
  };
}

export function allowedDeactivationDestinationsFor(recordType: string): readonly string[] {
  return ALLOWED_DEACTIVATION_DESTINATIONS[recordType] ?? [];
}

function catalogEntryFor(
  recordType: string,
  registry: Readonly<Record<string, RecordTypeDefinition>>
): SegmentReconciliationRecordTypeCatalogEntry {
  const definition = registry[recordType];

  if (!definition) {
    throw new Error(`Missing registry definition for ${recordType}`);
  }

  const fields = describeSchemaFields(definition.payloadSchema);
  const payloadJsonSchema = z.toJSONSchema(definition.payloadSchema);

  assertRepresentableCatalogEntry(recordType, payloadJsonSchema, fields);

  return {
    recordType,
    payloadJsonSchema,
    fields,
    repositoryManagedFields: ["id"],
    forbiddenOutputFields: ["id"],
    lifecycle: {
      field: lifecycleFieldFor(fields),
      legalValues: definition.statusValues ?? [],
      allowedDeactivationDestinations: allowedDeactivationDestinationsFor(recordType)
    },
    references: referenceEntriesFor(fields)
  };
}

function assertRepresentableCatalogEntry(recordType: string, payloadJsonSchema: unknown, fields: readonly FieldDescriptor[]) {
  if (!payloadJsonSchema || typeof payloadJsonSchema !== "object") {
    throw new Error(`Unrepresentable JSON Schema for ${recordType}`);
  }

  if (fields.length === 0) {
    throw new Error(`No fields represented for ${recordType}`);
  }
}

function lifecycleFieldFor(fields: readonly FieldDescriptor[]): string | null {
  return fields.find((field) => field.name === "plan_status")?.name ?? fields.find((field) => field.name === "status")?.name ?? null;
}

function referenceEntriesFor(fields: readonly FieldDescriptor[]): readonly SegmentReconciliationReferenceCatalogEntry[] {
  return flattenReferenceEntries(fields).sort(
    (left, right) => left.path.localeCompare(right.path) || left.refRole.localeCompare(right.refRole)
  );
}

function flattenReferenceEntries(
  fields: readonly FieldDescriptor[],
  prefix = ""
): SegmentReconciliationReferenceCatalogEntry[] {
  const entries: SegmentReconciliationReferenceCatalogEntry[] = [];

  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.name}` : field.name;

    if (field.kind === "reference" || field.kind === "sentinel_reference") {
      entries.push(referenceEntry(path, "one", field));
    }

    if (field.kind === "sentinel_reference_list") {
      entries.push(referenceEntry(path, "many", field));
    }

    if (field.kind === "list" && field.itemDescriptor) {
      entries.push(...flattenReferenceEntries([field.itemDescriptor], `${path}[]`));
    }

    if (field.fields) {
      entries.push(...flattenReferenceEntries(field.fields, path));
    }
  }

  return entries;
}

function referenceEntry(
  path: string,
  cardinality: "one" | "many",
  field: FieldDescriptor
): SegmentReconciliationReferenceCatalogEntry {
  const refRole = field.referenceRole;

  if (!refRole) {
    throw new Error(`Reference field ${path} is missing a reference role`);
  }

  return {
    path,
    cardinality,
    refRole,
    targetTypes: referenceTargetTypes(refRole)
  };
}
