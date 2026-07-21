import {
  acceptedSegmentChangeReviewVersionInfo,
  type AcceptedSegmentChangeReviewRequest,
  type AcceptedSegmentChangeReviewSnapshot,
  type ConsumedGenerationGuidanceEntry,
  listConsumedGenerationGuidance
} from "@loom/core";

import {
  buildAcceptedSegmentAssistanceSource,
  type AcceptedSegmentAssistanceRepository
} from "./accepted-segment-assistance-source-builder.js";

export type BuildAcceptedSegmentChangeReviewSnapshotResult =
  | {
      ok: true;
      snapshot: AcceptedSegmentChangeReviewSnapshot;
      consumedGuidance: readonly ConsumedGenerationGuidanceEntry[];
    }
  | {
      ok: false;
      status: 409 | 422;
      body: {
        ok: false;
        kind: "no-accepted-segment" | "malformed-accepted-segment-change-review-source";
        message: string;
      };
    };

export type AcceptedSegmentChangeReviewRepository = AcceptedSegmentAssistanceRepository;

export function buildAcceptedSegmentChangeReviewSnapshot(
  repository: AcceptedSegmentChangeReviewRepository,
  request: AcceptedSegmentChangeReviewRequest
): BuildAcceptedSegmentChangeReviewSnapshotResult {
  const source = buildAcceptedSegmentAssistanceSource(repository, request);
  if (!source.ok) {
    if (source.body.kind === "no-accepted-segment") {
      return {
        ok: false,
        status: source.status,
        body: {
          ok: false,
          kind: "no-accepted-segment",
          message: "No accepted segment exists to review."
        }
      };
    }

    return {
      ok: false,
      status: source.status,
      body: {
        ok: false,
        kind: "malformed-accepted-segment-change-review-source",
        message: "The complete Accepted-Segment Change Review source is malformed."
      }
    };
  }

  return {
    ok: true,
    snapshot: {
      request,
      acceptedSegment: source.source.acceptedSegment,
      acceptedSegmentSpans: source.source.acceptedSegmentSpans,
      generationBriefProjection: Object.fromEntries(
        source.source.briefFields.map((field) => [
          field.fieldPath,
          field.currentState === "present"
            ? field.currentValue
            : { state: field.currentState }
        ])
      ),
      records: source.source.records,
      referenceStubs: source.source.referenceStubs,
      versions: acceptedSegmentChangeReviewVersionInfo
    },
    consumedGuidance: listConsumedGenerationGuidance(source.source.generationBriefDraft)
  };
}
