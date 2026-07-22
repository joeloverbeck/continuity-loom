import { estimatePromptTokens, fingerprintPrompt } from "../fingerprint.js";
import {
  buildAssistanceCitationMap,
  countRecordsByType,
  escapePromptAttribute,
  renderTaggedSection
} from "../assistance-prompt-primitives.js";
import {
  briefFieldCitationKey,
  reconciliationRecordCitationKeysFor,
  referenceStubCitationKeysFor
} from "../reconciliation/citation-keys.js";
import { canonicalEscapedJson, renderReconciliationRecordSet } from "../reconciliation/record-renderer.js";
import { partitionAcceptedSegmentSpans } from "../reconciliation/segment-spans.js";
import { acceptedSegmentChangeReviewOutputJsonSchema } from "./output-schema.js";
import {
  ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT,
  ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
  type AcceptedSegmentChangeReviewCompileResult,
  type AcceptedSegmentChangeReviewSnapshot
} from "./types.js";

export function compileAcceptedSegmentChangeReviewPrompt(
  snapshot: AcceptedSegmentChangeReviewSnapshot
): AcceptedSegmentChangeReviewCompileResult {
  validateSnapshot(snapshot);

  const renderedRecords = renderReconciliationRecordSet(snapshot.records, snapshot.referenceStubs);
  const recordKeys = reconciliationRecordCitationKeysFor(snapshot.records);
  const stubKeys = referenceStubCitationKeysFor(snapshot.referenceStubs);
  const prompt = renderPrompt(snapshot, renderedRecords);
  const counts = countRecordsByType(snapshot.records);

  return {
    prompt,
    disclosure: {
      acceptedSegmentId: snapshot.acceptedSegment.id,
      acceptedSegmentSequence: snapshot.acceptedSegment.sequence,
      acceptedSegmentAcceptedAt: snapshot.acceptedSegment.acceptedAt,
      sourceProfile: ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
      recordScope: snapshot.request.recordScope,
      fullRecordCount: snapshot.records.length,
      countsByType: counts,
      includesSecrets: (counts.SECRET ?? 0) > 0 || snapshot.referenceStubs.some((stub) => stub.type === "SECRET"),
      promptLength: prompt.length,
      tokenEstimate: estimatePromptTokens(prompt),
      versions: snapshot.versions,
      fingerprint: fingerprintPrompt(prompt),
      citationMap: buildAssistanceCitationMap({
        acceptedSegmentId: snapshot.acceptedSegment.id,
        acceptedSegmentSpans: snapshot.acceptedSegmentSpans,
        fieldEntries: ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS.map((fieldPath) => [
          briefFieldCitationKey(fieldPath),
          fieldPath
        ]),
        recordKeys,
        referenceStubKeys: stubKeys
      })
    }
  };
}

function validateSnapshot(snapshot: AcceptedSegmentChangeReviewSnapshot): void {
  if (snapshot.request.segmentSelection !== "latest") {
    throw new Error("Accepted-Segment Change Review supports only the latest accepted segment.");
  }

  if (snapshot.request.recordScope !== "active_working_set" && snapshot.request.recordScope !== "whole_project") {
    throw new Error("Accepted-Segment Change Review record scope is invalid.");
  }

  if (!snapshot.acceptedSegment.id.trim() || snapshot.acceptedSegment.sequence < 1 || !snapshot.acceptedSegment.text.trim()) {
    throw new Error("Accepted-Segment Change Review requires one representable accepted segment.");
  }

  const suppliedPaths = Object.keys(snapshot.generationBriefProjection).sort();
  const expectedPaths = [...ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS].sort();

  if (JSON.stringify(suppliedPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("Accepted-Segment Change Review requires exactly the nineteen declared Generation Brief paths.");
  }

  const expectedSpans = partitionAcceptedSegmentSpans(
    snapshot.acceptedSegment.text,
    snapshot.acceptedSegment.sequence
  );
  if (
    snapshot.acceptedSegmentSpans.length === 0 ||
    JSON.stringify(snapshot.acceptedSegmentSpans) !== JSON.stringify(expectedSpans)
  ) {
    throw new Error("Accepted-Segment Change Review accepted-segment evidence is unrepresentable.");
  }

  if (snapshot.records.some((record) => record.archived === true)) {
    throw new Error("Accepted-Segment Change Review cannot compile archived records.");
  }
}

function renderPrompt(
  snapshot: AcceptedSegmentChangeReviewSnapshot,
  renderedRecords: ReturnType<typeof renderReconciliationRecordSet>
): string {
  const outputSchema = acceptedSegmentChangeReviewOutputJsonSchema();

  return [
    "# Accepted-Segment Change Review Candidate Prompt",
    renderTaggedSection("accepted_segment_change_review_role", [
      "You are reviewing possible continuity changes in one accepted prose segment.",
      "Return advisory, non-canonical accounting only. Do not draft canonical values, story prose, future possibilities, patches, lifecycle operations, or creation payloads.",
      "A strongly caused but unstated present implication may appear only as interpretation requiring author judgment.",
      "Drift in the reverse direction also matters: an inherited Generation Brief current-state or immediate-handoff field can presuppose a beat the latest accepted segment does not render. Because such drift rests on the segment's absence of that beat, it may appear only as interpretation requiring author judgment with an empty evidence_excerpt and can never be an established change."
    ].join("\n")),
    renderTaggedSection("accepted_segment_change_review_source_contract", canonicalEscapedJson({
      source_profile: ACCEPTED_SEGMENT_CHANGE_REVIEW_SOURCE_PROFILE,
      segment_selection: "latest",
      record_scope: snapshot.request.recordScope,
      archive_predicate: "non_archived_only",
      completeness: "complete_declared_source_without_retrieval_ranking_summarization_batching_or_trimming"
    })),
    renderTaggedSection("accepted_segment_change_review_request", canonicalEscapedJson({
      accepted_segment_id: snapshot.acceptedSegment.id,
      accepted_segment_sequence: snapshot.acceptedSegment.sequence,
      accepted_segment_accepted_at: snapshot.acceptedSegment.acceptedAt,
      full_record_count: snapshot.records.length,
      versions: snapshot.versions
    })),
    renderTaggedSection("accepted_segment_evidence", snapshot.acceptedSegmentSpans.map((span) => [
      `<segment_span key="${escapePromptAttribute(span.key)}">`,
      canonicalEscapedJson({ text: span.text }),
      "</segment_span>"
    ].join("\n")).join("\n\n")),
    renderTaggedSection("current_change_review_fields", ACCEPTED_SEGMENT_CHANGE_REVIEW_BRIEF_FIELD_PATHS.map((fieldPath) => [
      `<brief_field key="${escapePromptAttribute(briefFieldCitationKey(fieldPath))}" path="${escapePromptAttribute(fieldPath)}">`,
      canonicalEscapedJson({ value: snapshot.generationBriefProjection[fieldPath] }),
      "</brief_field>"
    ].join("\n")).join("\n\n")),
    renderTaggedSection("record_contrast_records", [
      "full_records:",
      renderedRecords.recordsText,
      "",
      "reference_label_stubs_only:",
      renderedRecords.referenceStubsText
    ].join("\n")),
    renderTaggedSection("accepted_segment_change_review_procedure", [
      "Compare the complete segment evidence with every declared brief field and complete in-scope record.",
      "When an inherited brief current-state or immediate-handoff field presupposes a beat the latest accepted segment does not render, report it as interpretation requiring author judgment: name the drifted brief field through its contrast key, cite the accepted-segment span where the segment actually ends as evidence, and leave evidence_excerpt empty. Never upgrade such absence-grounded drift to an established change.",
      "Number items sequentially as ITEM-001, ITEM-002, and so on, in the order you report them.",
      "Every item must cite evidence and current contrast keys. The evidence and contrast arrays contain only exact bracketed citation keys, for example [SEG-21-S001] or [ENTITY-STATUS-1], with no appended prose. Reference stubs may be cited as labels but are never change targets.",
      "Write change_statement as an independently readable, present-tense statement of the change. Do not copy accepted prose into it.",
      "Every item carries an evidence_excerpt string. For an established change, evidence_excerpt is an exact three-to-seven-word verbatim excerpt copied from one of the item's cited segment spans; change_statement stays free readable prose and need not equal the excerpt. For an interpretation requiring author judgment, evidence_excerpt is the empty string \"\".",
      "Use established change only for an explicit present change grounded by its evidence_excerpt; otherwise use interpretation requiring author judgment. The local parser rejects an established item whose evidence_excerpt is missing, is not a three-to-seven-word verbatim excerpt, or does not occur in one cited span, and rejects an interpretation whose evidence_excerpt is not empty.",
      `Account for exactly these dimensions: ${ACCEPTED_SEGMENT_CHANGE_REVIEW_COVERAGE_DIMENSIONS.join(" | ")}.`,
      "An empty items list remains unverified advisory output and is valid only with all six reasoned coverage rows."
    ].join("\n")),
    renderTaggedSection("accepted_segment_change_review_output_format", [
      "Return one strict JSON object only with top-level keys contract, items, and coverage. No Markdown, preamble, source metadata, comments, or trailing prose.",
      `Contract: ${ACCEPTED_SEGMENT_CHANGE_REVIEW_OUTPUT_CONTRACT}`,
      canonicalEscapedJson(outputSchema)
    ].join("\n"))
  ].join("\n\n");
}
