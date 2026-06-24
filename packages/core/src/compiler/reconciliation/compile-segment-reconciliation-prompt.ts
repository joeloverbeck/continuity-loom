import { versionInfo } from "../../version.js";
import { estimatePromptTokens, fingerprintPrompt } from "../fingerprint.js";
import type { CompileResult } from "../types.js";
import { buildSegmentReconciliationSchemaCatalog } from "./schema-catalog.js";
import { renderReconciliationRecordSet } from "./record-renderer.js";
import { RECONCILIATION_SECTION_ORDER, RECONCILIATION_STATIC_SECTIONS, type ReconciliationSectionId } from "./template.js";
import type {
  AcceptedSegmentSpan,
  ReconciliationBriefField,
  SegmentReconciliationRequest,
  SegmentReconciliationSnapshot
} from "./types.js";

const defaultRequest: SegmentReconciliationRequest = {
  segmentSelection: "latest",
  recordScope: "active_working_set"
};

export function compileSegmentReconciliationPrompt(
  snapshot: SegmentReconciliationSnapshot,
  request: Partial<SegmentReconciliationRequest> = defaultRequest
): CompileResult {
  const normalizedRequest = normalizeRequest(request);
  const renderedRecords = renderReconciliationRecordSet(snapshot.records, snapshot.referenceStubs);
  const schemaCatalog = buildSegmentReconciliationSchemaCatalog(versionInfo.contract.version);
  const prompt = renderPrompt(snapshot, normalizedRequest, renderedRecords, schemaCatalog);

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
      countsByType: countsByType(snapshot.records),
      citationMap: citationMapFor(snapshot, renderedRecords.recordKeys, renderedRecords.referenceStubKeys)
    }
  };
}

function normalizeRequest(request: Partial<SegmentReconciliationRequest>): SegmentReconciliationRequest {
  const segmentSelection = request.segmentSelection ?? defaultRequest.segmentSelection;
  const recordScope = request.recordScope ?? defaultRequest.recordScope;

  if (segmentSelection !== "latest") {
    throw new Error(`Invalid segment reconciliation segment selection: ${String(segmentSelection)}`);
  }

  if (recordScope !== "active_working_set" && recordScope !== "whole_project") {
    throw new Error(`Invalid segment reconciliation record scope: ${String(recordScope)}`);
  }

  return { segmentSelection, recordScope };
}

function renderPrompt(
  snapshot: SegmentReconciliationSnapshot,
  request: SegmentReconciliationRequest,
  renderedRecords: ReturnType<typeof renderReconciliationRecordSet>,
  schemaCatalog: ReturnType<typeof buildSegmentReconciliationSchemaCatalog>
): string {
  return [
    "# Segment Reconciliation Prompt",
    "",
    ...RECONCILIATION_SECTION_ORDER.map((sectionId) =>
      renderSection(sectionId, snapshot, request, renderedRecords, schemaCatalog)
    )
  ].join("\n\n");
}

function renderSection(
  sectionId: ReconciliationSectionId,
  snapshot: SegmentReconciliationSnapshot,
  request: SegmentReconciliationRequest,
  renderedRecords: ReturnType<typeof renderReconciliationRecordSet>,
  schemaCatalog: ReturnType<typeof buildSegmentReconciliationSchemaCatalog>
): string {
  switch (sectionId) {
    case "segment_reconciliation_request":
      return tag(sectionId, renderRequest(snapshot, request));
    case "accepted_segment_evidence":
      return tag(sectionId, renderAcceptedSegmentEvidence(snapshot.acceptedSegmentSpans));
    case "current_reconciliation_fields":
      return tag(sectionId, renderBriefFields(snapshot.briefFields));
    case "record_contrast_scope":
      return tag(sectionId, renderRecordContrastScope(snapshot, request));
    case "record_contrast_records":
      return tag(sectionId, renderRecordContrastRecords(renderedRecords));
    case "record_creation_schema_catalog":
      return tag(sectionId, canonicalBlock(schemaCatalog));
    case "segment_reconciliation_output_format":
      return tag(sectionId, renderOutputFormat(snapshot, request));
    default:
      return tag(sectionId, RECONCILIATION_STATIC_SECTIONS[sectionId]);
  }
}

function renderRequest(snapshot: SegmentReconciliationSnapshot, request: SegmentReconciliationRequest): string {
  return canonicalBlock({
    source_profile: "segment-reconciliation",
    segment_selection: request.segmentSelection,
    record_scope: request.recordScope,
    accepted_segment: {
      id: snapshot.acceptedSegment.id,
      sequence: snapshot.acceptedSegment.sequence,
      accepted_at: snapshot.acceptedSegment.acceptedAt,
      span_count: snapshot.acceptedSegmentSpans.length
    },
    source_counts: {
      reconciliation_field_count: snapshot.briefFields.length,
      full_record_count: snapshot.records.length,
      reference_stub_count: snapshot.referenceStubs.length
    },
    versions: {
      template: versionInfo.templates.version,
      compiler: versionInfo.compiler.version,
      contract: versionInfo.contract.version
    }
  });
}

function renderAcceptedSegmentEvidence(spans: readonly AcceptedSegmentSpan[]): string {
  if (spans.length === 0) {
    return "No accepted-segment text spans were representable.";
  }

  return spans
    .map((span) =>
      [
        `<segment_span key="${escapeAttribute(span.key)}" sequence="${span.sequence}" start="${span.startOffset}" end="${span.endOffset}">`,
        canonicalBlock({ text: span.text }),
        "</segment_span>"
      ].join("\n")
    )
    .join("\n\n");
}

function renderBriefFields(fields: readonly ReconciliationBriefField[]): string {
  return fields.map(renderBriefField).join("\n\n");
}

function renderBriefField(field: ReconciliationBriefField): string {
  return [
    `<brief_field key="${escapeAttribute(field.citationKey)}" path="${escapeAttribute(field.fieldPath)}">`,
    canonicalBlock({
      state: field.currentState,
      value: field.currentState === "present" ? field.currentValue : undefined
    }),
    "</brief_field>"
  ].join("\n");
}

function renderRecordContrastScope(
  snapshot: SegmentReconciliationSnapshot,
  request: SegmentReconciliationRequest
): string {
  return canonicalBlock({
    record_scope: request.recordScope,
    archive_predicate: "non_archived_only",
    lifecycle_predicate: "all_lifecycle_states",
    ordering: "registry_order_then_display_label_then_id",
    full_record_count: snapshot.records.length,
    reference_stub_count: snapshot.referenceStubs.length
  });
}

function renderRecordContrastRecords(renderedRecords: ReturnType<typeof renderReconciliationRecordSet>): string {
  return [
    "full_records:",
    renderedRecords.recordsText,
    "",
    "reference_stubs:",
    renderedRecords.referenceStubsText
  ].join("\n");
}

function renderOutputFormat(snapshot: SegmentReconciliationSnapshot, request: SegmentReconciliationRequest): string {
  return [
    "Return one strict JSON object only. No Markdown, preamble, comments, or trailing prose.",
    "Top-level object shape:",
    canonicalBlock({
      contract: "segment_reconciliation.v1",
      source: {
        profile: "segment-reconciliation",
        accepted_segment_id: snapshot.acceptedSegment.id,
        accepted_segment_sequence: snapshot.acceptedSegment.sequence,
        record_scope: request.recordScope,
        prompt_fingerprint: "<echo inspected prompt fingerprint>"
      },
      brief_proposals: [],
      record_change_proposals: [],
      record_creation_proposals: []
    }),
    "All object layers are strict: do not include undeclared keys. The local parser remains authoritative and quarantines the full response on any malformed item."
  ].join("\n");
}

function countsByType(records: readonly { type: string }[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const record of records) {
    counts[record.type] = (counts[record.type] ?? 0) + 1;
  }

  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function citationMapFor(
  snapshot: SegmentReconciliationSnapshot,
  recordKeys: ReadonlyMap<string, string>,
  referenceStubKeys: ReadonlyMap<string, string>
): Readonly<Record<string, string>> {
  const entries: Array<[string, string]> = [
    ...snapshot.acceptedSegmentSpans.map((span): [string, string] => [
      span.key,
      `${snapshot.acceptedSegment.id}:${span.startOffset}-${span.endOffset}`
    ]),
    ...snapshot.briefFields.map((field): [string, string] => [field.citationKey, field.fieldPath]),
    ...[...recordKeys.entries()].map(([recordId, key]): [string, string] => [key, recordId]),
    ...[...referenceStubKeys.entries()].map(([recordId, key]): [string, string] => [key, recordId])
  ];

  return Object.fromEntries(
    entries.sort(([left], [right]) => left.localeCompare(right))
  );
}

function canonicalBlock(value: unknown): string {
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
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortJson(nestedValue)])
    );
  }

  return value;
}

function tag(sectionId: string, body: string): string {
  return `<${sectionId}>\n${body}\n</${sectionId}>`;
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
