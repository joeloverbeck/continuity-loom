import { escapeDataText } from "../escaping.js";
import type {
  HygieneIncomingReference,
  HygieneOutgoingReference,
  HygieneRecord,
  HygieneReferenceSummary
} from "./types.js";

export function renderHygieneRecord(record: HygieneRecord, key: string, references: HygieneReferenceSummary): string {
  return [
    `<record key="${escapeAttribute(key)}" record_id="${escapeAttribute(record.id)}" type="${escapeAttribute(record.type)}">`,
    `display_label: ${escapeDataText(record.displayLabel)}`,
    `projected_status: ${record.status ?? "none"}`,
    "payload_json:",
    canonicalEscapedJson(record.payload),
    "references:",
    `  outgoing: ${renderReferenceList(references.outgoing.map(renderOutgoingReference))}`,
    `  incoming: ${renderReferenceList(references.incoming.map(renderIncomingReference))}`,
    "</record>"
  ].join("\n");
}

export function canonicalEscapedJson(value: unknown): string {
  return JSON.stringify(sortJson(value), null, 2).replace(/[<>&]/g, (character) => {
    if (character === "<") {
      return "\\u003c";
    }

    if (character === ">") {
      return "\\u003e";
    }

    return "\\u0026";
  });
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortJson(nestedValue)])
    );
  }

  return value;
}

function renderOutgoingReference(reference: HygieneOutgoingReference): string {
  return `${escapeDataText(reference.refRole)} -> ${escapeDataText(reference.targetLabel)} (${escapeDataText(reference.targetId)})`;
}

function renderIncomingReference(reference: HygieneIncomingReference): string {
  return `${escapeDataText(reference.sourceLabel)} (${escapeDataText(reference.sourceId)}):${escapeDataText(reference.refRole)}`;
}

function renderReferenceList(references: readonly string[]): string {
  return references.length === 0 ? "none" : references.join("; ");
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
