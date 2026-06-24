import {
  buildSegmentReconciliationSchemaCatalog,
  parseSegmentReconciliationOutput,
  reconciliationRecordCitationKeysFor,
  referenceStubCitationKeysFor,
  type SegmentReconciliationParseContext,
  type SegmentReconciliationParseResult,
  type SegmentReconciliationRequest,
  type SegmentReconciliationSnapshot
} from "@loom/core";

export function parseSegmentReconciliationResponse({
  rawOutput,
  promptFingerprint,
  snapshot,
  request,
  contractVersion
}: {
  rawOutput: string;
  promptFingerprint: string;
  snapshot: SegmentReconciliationSnapshot;
  request: SegmentReconciliationRequest;
  contractVersion: string;
}): SegmentReconciliationParseResult {
  return parseSegmentReconciliationOutput(rawOutput, parseContext({
    promptFingerprint,
    snapshot,
    request,
    contractVersion
  }));
}

function parseContext({
  promptFingerprint,
  snapshot,
  request,
  contractVersion
}: {
  promptFingerprint: string;
  snapshot: SegmentReconciliationSnapshot;
  request: SegmentReconciliationRequest;
  contractVersion: string;
}): SegmentReconciliationParseContext {
  const schemaCatalog = buildSegmentReconciliationSchemaCatalog(contractVersion);

  return {
    promptFingerprint,
    acceptedSegmentId: snapshot.acceptedSegment.id,
    acceptedSegmentSequence: snapshot.acceptedSegment.sequence,
    recordScope: request.recordScope,
    acceptedSegmentText: snapshot.normalizedAcceptedSegmentText,
    segmentSpanKeys: snapshot.acceptedSegmentSpans.map((span) => span.key),
    briefFields: snapshot.briefFields,
    records: snapshot.records,
    referenceStubs: snapshot.referenceStubs,
    recordKeyById: reconciliationRecordCitationKeysFor(snapshot.records),
    referenceStubKeyById: referenceStubCitationKeysFor(snapshot.referenceStubs),
    schemaCatalogRecordTypes: schemaCatalog.recordTypes.map((entry) => entry.recordType)
  };
}
