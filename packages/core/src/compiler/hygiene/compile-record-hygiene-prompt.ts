import { estimatePromptTokens, fingerprintPrompt } from "../fingerprint.js";
import type { CompileResult } from "../types.js";
import { versionInfo } from "../../version.js";
import { hygieneCitationKeysFor } from "./citation-keys.js";
import { renderHygieneRecord } from "./record-renderer.js";
import {
  EMPTY_HYGIENE_RECORDS_STATE,
  RECORD_HYGIENE_SECTION_ORDER,
  RECORD_HYGIENE_STATIC_SECTIONS
} from "./template.js";
import {
  HYGIENE_TYPE_ORDER,
  type HygieneRecord,
  type HygieneRecordType,
  type RecordHygieneRequest,
  type StoryRecordHygieneSnapshot
} from "./types.js";

const defaultRequest: RecordHygieneRequest = { mode: "full_active_atomic_review" };
const typeRank = new Map<string, number>(HYGIENE_TYPE_ORDER.map((recordType, index) => [recordType, index]));

export function compileRecordHygienePrompt(
  snapshot: StoryRecordHygieneSnapshot,
  request: Partial<RecordHygieneRequest> = defaultRequest
): CompileResult {
  const normalizedRequest = normalizeRequest(request);
  const records = orderHygieneRecords(snapshot.records);
  const citationKeys = hygieneCitationKeysFor(records);
  const countsByType = countsFor(records);
  const prompt = renderPrompt(snapshot, records, citationKeys, countsByType, normalizedRequest);
  const citationMap = Object.fromEntries([...citationKeys.entries()].map(([recordId, key]) => [key, recordId]));

  return {
    prompt,
    metadata: {
      versions: {
        template: versionInfo.templates.version,
        compiler: versionInfo.compiler.version,
        contract: versionInfo.contract.version
      },
      fingerprint: fingerprintPrompt(prompt),
      lengthEstimate: prompt.length,
      tokenEstimate: estimatePromptTokens(prompt),
      countsByType,
      citationMap
    }
  };
}

export function orderHygieneRecords(records: readonly HygieneRecord[]): readonly HygieneRecord[] {
  return [...records].sort(
    (left, right) =>
      (typeRank.get(left.type) ?? Number.MAX_SAFE_INTEGER) - (typeRank.get(right.type) ?? Number.MAX_SAFE_INTEGER)
      || left.fullDisplayLabel.localeCompare(right.fullDisplayLabel)
      || left.id.localeCompare(right.id)
  );
}

function normalizeRequest(request: Partial<RecordHygieneRequest>): RecordHygieneRequest {
  if (request.mode !== undefined && request.mode !== "full_active_atomic_review") {
    throw new Error(`Invalid record hygiene request mode: ${String(request.mode)}`);
  }

  return defaultRequest;
}

function renderPrompt(
  snapshot: StoryRecordHygieneSnapshot,
  records: readonly HygieneRecord[],
  citationKeys: ReadonlyMap<string, string>,
  countsByType: Readonly<Record<string, number>>,
  request: RecordHygieneRequest
): string {
  return [
    "# Story-Record Hygiene Prompt",
    "",
    ...RECORD_HYGIENE_SECTION_ORDER.map((sectionId) => {
      if (sectionId === "record_hygiene_records") {
        return renderRecordsSection(snapshot, records, citationKeys, countsByType, request);
      }

      return tag(sectionId, RECORD_HYGIENE_STATIC_SECTIONS[sectionId]);
    })
  ].join("\n\n");
}

function renderRecordsSection(
  snapshot: StoryRecordHygieneSnapshot,
  records: readonly HygieneRecord[],
  citationKeys: ReadonlyMap<string, string>,
  countsByType: Readonly<Record<string, number>>,
  request: RecordHygieneRequest
): string {
  const lines = [
    `request_mode: ${request.mode}`,
    `hygiene_record_count: ${records.length}`,
    "hygiene_counts_by_type:",
    ...HYGIENE_TYPE_ORDER.map((recordType) => `- ${recordType}: ${countsByType[recordType] ?? 0}`),
    "hygiene_records:"
  ];

  if (records.length === 0) {
    lines.push(EMPTY_HYGIENE_RECORDS_STATE);
  } else {
    for (const record of records) {
      lines.push(renderHygieneRecord(record, citationKeys.get(record.id) ?? "[UNKNOWN-0]", snapshot.referenceIndex[record.id] ?? { outgoing: [], incoming: [] }));
    }
  }

  return tag("record_hygiene_records", lines.join("\n"));
}

function countsFor(records: readonly HygieneRecord[]): Readonly<Record<HygieneRecordType, number>> {
  const counts = Object.fromEntries(HYGIENE_TYPE_ORDER.map((recordType) => [recordType, 0])) as Record<HygieneRecordType, number>;

  for (const record of records) {
    counts[record.type] += 1;
  }

  return counts;
}

function tag(sectionId: string, body: string): string {
  return `<${sectionId}>\n${body}\n</${sectionId}>`;
}
