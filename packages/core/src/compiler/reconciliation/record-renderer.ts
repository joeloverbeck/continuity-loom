import { extractRecordReferences, projectRecordStatus, recordTypes } from "../../records/registry.js";
import { escapeDataText } from "../escaping.js";
import { reconciliationRecordCitationKeysFor, referenceStubCitationKeysFor } from "./citation-keys.js";
import type { ReconciliationRecord, ReconciliationReferenceStub } from "./types.js";

export const EMPTY_RECONCILIATION_RECORDS_TEXT = "No non-archived records exist in the selected reconciliation scope.";

export interface RenderedReconciliationRecords {
  recordsText: string;
  referenceStubsText: string;
  recordKeys: ReadonlyMap<string, string>;
  referenceStubKeys: ReadonlyMap<string, string>;
}

export function renderReconciliationRecordSet(
  records: readonly ReconciliationRecord[],
  referenceStubs: readonly ReconciliationReferenceStub[]
): RenderedReconciliationRecords {
  const sortedRecords = sortReconciliationRecords(records);
  const sortedReferenceStubs = sortReferenceStubs(referenceStubs);
  const recordKeys = reconciliationRecordCitationKeysFor(sortedRecords);
  const referenceStubKeys = referenceStubCitationKeysFor(sortedReferenceStubs);

  return {
    recordsText:
      sortedRecords.length === 0
        ? EMPTY_RECONCILIATION_RECORDS_TEXT
        : sortedRecords.map((record) => renderReconciliationRecord(record, recordKeys.get(record.id) ?? "")).join("\n\n"),
    referenceStubsText:
      sortedReferenceStubs.length === 0
        ? "No out-of-scope reference stubs."
        : sortedReferenceStubs.map((stub) => renderReferenceStub(stub, referenceStubKeys.get(stub.id) ?? "")).join("\n"),
    recordKeys,
    referenceStubKeys
  };
}

export function renderReconciliationRecord(record: ReconciliationRecord, key: string): string {
  return [
    `<record key="${escapeAttribute(key)}" record_id="${escapeAttribute(record.id)}" type="${escapeAttribute(record.type)}">`,
    `display_label: ${escapeDataText(record.displayLabel)}`,
    `projected_status: ${record.lifecycleStatus ?? projectRecordStatus(record.type, record.payload) ?? "none"}`,
    "payload_json:",
    canonicalEscapedJson(record.payload),
    "outgoing_references:",
    renderOutgoingReferences(record),
    "</record>"
  ].join("\n");
}

export function renderReferenceStub(stub: ReconciliationReferenceStub, key: string): string {
  return [
    `<reference_stub key="${escapeAttribute(key)}" record_id="${escapeAttribute(stub.id)}" type="${escapeAttribute(stub.type)}">`,
    `display_label: ${escapeDataText(stub.displayLabel)}`,
    "</reference_stub>"
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

export function sortReconciliationRecords(records: readonly ReconciliationRecord[]): readonly ReconciliationRecord[] {
  return [...records].sort(
    (left, right) =>
      compareRecordTypes(left.type, right.type) ||
      left.displayLabel.localeCompare(right.displayLabel) ||
      left.id.localeCompare(right.id)
  );
}

export function sortReferenceStubs(stubs: readonly ReconciliationReferenceStub[]): readonly ReconciliationReferenceStub[] {
  return [...stubs].sort(
    (left, right) =>
      compareRecordTypes(left.type, right.type) ||
      left.displayLabel.localeCompare(right.displayLabel) ||
      left.id.localeCompare(right.id)
  );
}

function renderOutgoingReferences(record: ReconciliationRecord): string {
  const references = extractRecordReferences(record.type, record.payload)
    .map((reference) => `${reference.refRole}:${reference.targetId}`)
    .sort();

  return references.length === 0 ? "none" : references.join("\n");
}

function compareRecordTypes(left: string, right: string): number {
  const leftIndex = recordTypes.indexOf(left);
  const rightIndex = recordTypes.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return normalizeTypeIndex(leftIndex) - normalizeTypeIndex(rightIndex);
  }

  return left.localeCompare(right);
}

function normalizeTypeIndex(index: number): number {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
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

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
