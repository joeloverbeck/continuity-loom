import { parseRecordPayload, recordTypes } from "./registry.js";

export type ColumnKind = "enum" | "boolean" | "short_string" | "ordinal";
export type ColumnAlignment = "left" | "right";

export interface ColumnDescriptor {
  fieldKey: string;
  header: string;
  kind: ColumnKind;
  align?: ColumnAlignment;
}

export interface RecordColumnManifestEntry {
  primaryLabelHeader: string;
  additionalColumns: readonly ColumnDescriptor[];
}

const ordinal = (fieldKey: string, header: string): ColumnDescriptor => ({
  fieldKey,
  header,
  kind: "ordinal"
});

const enumColumn = (fieldKey: string, header: string): ColumnDescriptor => ({
  fieldKey,
  header,
  kind: "enum"
});

const shortStringColumn = (fieldKey: string, header: string): ColumnDescriptor => ({
  fieldKey,
  header,
  kind: "short_string"
});

export const recordColumnManifest: Readonly<Record<string, RecordColumnManifestEntry>> = Object.freeze({
  ENTITY: {
    primaryLabelHeader: "Label",
    additionalColumns: [
      enumColumn("entity_kind", "Entity kind"),
      shortStringColumn("roles_in_story", "Roles")
    ]
  },
  "ENTITY STATUS": {
    primaryLabelHeader: "Activity",
    additionalColumns: [
      enumColumn("life", "Life"),
      enumColumn("agency", "Agency"),
      enumColumn("visibility_to_pov", "POV visibility")
    ]
  },
  "CAST MEMBER": {
    primaryLabelHeader: "Label",
    additionalColumns: []
  },
  FACT: {
    primaryLabelHeader: "Statement",
    additionalColumns: [
      enumColumn("fact_kind", "Fact kind"),
      enumColumn("scope", "Scope"),
      ordinal("salience", "Salience"),
      enumColumn("audience_visibility", "Audience visibility")
    ]
  },
  BELIEF: {
    primaryLabelHeader: "Claim",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("belief_mode", "Belief mode"),
      enumColumn("confidence", "Confidence"),
      ordinal("salience", "Salience"),
      enumColumn("visibility", "Visibility")
    ]
  },
  SECRET: {
    primaryLabelHeader: "Secret",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("secret_kind", "Secret kind"),
      ordinal("salience", "Salience"),
      enumColumn("audience_visibility", "Audience visibility"),
      enumColumn("pov_access", "POV access")
    ]
  },
  LOCATION: {
    primaryLabelHeader: "Label",
    additionalColumns: [enumColumn("status", "Status")]
  },
  OBJECT: {
    primaryLabelHeader: "Label",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("visibility_to_pov", "POV visibility"),
      enumColumn("durability", "Durability")
    ]
  },
  "VISIBLE AFFORDANCE": {
    primaryLabelHeader: "Label",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("risk", "Risk"),
      enumColumn("durability", "Durability")
    ]
  },
  EVENT: {
    primaryLabelHeader: "Description",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("event_kind", "Event kind"),
      ordinal("current_relevance", "Current relevance"),
      enumColumn("pov_visibility", "POV visibility")
    ]
  },
  INTENTION: {
    primaryLabelHeader: "Intent",
    additionalColumns: [enumColumn("status", "Status"), ordinal("urgency", "Urgency")]
  },
  PLAN: {
    primaryLabelHeader: "Objective",
    additionalColumns: [
      enumColumn("plan_status", "Status"),
      ordinal("salience", "Salience"),
      enumColumn("visibility_to_pov", "POV visibility")
    ]
  },
  CLOCK: {
    primaryLabelHeader: "Title",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("clock_kind", "Clock kind"),
      ordinal("salience", "Salience"),
      enumColumn("visibility", "Visibility")
    ]
  },
  OBLIGATION: {
    primaryLabelHeader: "Terms",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("obligation_kind", "Obligation kind"),
      ordinal("urgency", "Urgency"),
      enumColumn("visibility", "Visibility")
    ]
  },
  CONSEQUENCE: {
    primaryLabelHeader: "Effect",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("consequence_kind", "Consequence kind"),
      ordinal("urgency", "Urgency"),
      enumColumn("visibility", "Visibility")
    ]
  },
  "OPEN THREAD": {
    primaryLabelHeader: "Title",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("type", "Thread kind"),
      ordinal("urgency", "Urgency"),
      ordinal("current_relevance", "Current relevance")
    ]
  },
  RELATIONSHIP: {
    primaryLabelHeader: "Description",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("axis", "Axis"),
      ordinal("value", "Value"),
      enumColumn("valence", "Valence"),
      enumColumn("visibility", "Visibility")
    ]
  },
  EMOTION: {
    primaryLabelHeader: "Description",
    additionalColumns: [
      enumColumn("status", "Status"),
      enumColumn("affect_kind", "Affect kind"),
      ordinal("intensity", "Intensity"),
      enumColumn("visibility", "Visibility")
    ]
  }
});

export const allTypesColumns: readonly ColumnDescriptor[] = Object.freeze([
  enumColumn("type", "Type"),
  shortStringColumn("displayLabel", "Label"),
  enumColumn("status", "Status"),
  shortStringColumn("updatedAt", "Updated")
]);

export const severityOrdinal: Readonly<Record<string, number>> = Object.freeze({
  none: 0,
  low: 1,
  trace: 1,
  medium: 2,
  high: 3,
  critical: 4,
  extreme: 4
});

export function compareSeverityDesc(left: string | null | undefined, right: string | null | undefined): number {
  return severityRank(right) - severityRank(left);
}

export function getColumnManifest(recordType: string): RecordColumnManifestEntry | undefined {
  return recordColumnManifest[recordType];
}

export function getAdditionalColumnKeys(recordType: string): readonly string[] {
  return getColumnManifest(recordType)?.additionalColumns.map((column) => column.fieldKey) ?? [];
}

export function projectDisplayValues(recordType: string, payload: unknown): Record<string, string | null> {
  const manifest = getColumnManifest(recordType);

  if (!manifest) {
    return {};
  }

  const parsedPayload = parseRecordPayload(recordType, payload);

  return Object.fromEntries(
    manifest.additionalColumns.map((column) => [column.fieldKey, formatDisplayValue(valueAtKey(parsedPayload, column.fieldKey))])
  );
}

function severityRank(value: string | null | undefined): number {
  return value ? severityOrdinal[value] ?? 0 : 0;
}

function valueAtKey(payload: unknown, fieldKey: string): unknown {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return (payload as Record<string, unknown>)[fieldKey];
}

function formatDisplayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map(formatArrayItem).join(", ") : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  return null;
}

function formatArrayItem(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  return "";
}

const manifestTypes = new Set(Object.keys(recordColumnManifest));
const missingTypes = recordTypes.filter((recordType) => !manifestTypes.has(recordType));
const extraTypes = Object.keys(recordColumnManifest).filter((recordType) => !recordTypes.includes(recordType));

if (missingTypes.length > 0 || extraTypes.length > 0) {
  throw new Error(
    `Record column manifest mismatch; missing: ${missingTypes.join(", ") || "none"}; extra: ${
      extraTypes.join(", ") || "none"
    }`
  );
}
