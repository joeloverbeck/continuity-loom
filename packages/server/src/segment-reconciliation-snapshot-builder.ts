import {
  normalizeAcceptedSegmentText,
  type SegmentReconciliationRequest,
  type SegmentReconciliationSnapshot
} from "@loom/core";

import {
  buildAcceptedSegmentAssistanceSource,
  type AcceptedSegmentAssistanceRepository
} from "./accepted-segment-assistance-source-builder.js";

export type BuildSegmentReconciliationSnapshotResult =
  | { ok: true; snapshot: SegmentReconciliationSnapshot }
  | {
      ok: false;
      status: 409 | 422;
      body: { ok: false; kind: "no-accepted-segment" | "malformed-reconciliation-source"; message: string };
    };

export type SegmentReconciliationRepository = AcceptedSegmentAssistanceRepository;

export function buildSegmentReconciliationSnapshot(
  repository: SegmentReconciliationRepository,
  request: SegmentReconciliationRequest
): BuildSegmentReconciliationSnapshotResult {
  const result = buildAcceptedSegmentAssistanceSource(repository, request);
  if (!result.ok) {
    return result.body.kind === "no-accepted-segment"
      ? {
          ok: false,
          status: result.status,
          body: { ok: false, kind: "no-accepted-segment", message: "No accepted segment exists to reconcile." }
        }
      : {
          ok: false,
          status: result.status,
          body: { ok: false, kind: "malformed-reconciliation-source", message: result.body.message }
        };
  }

  return {
    ok: true,
    snapshot: {
      ...result.source,
      versions: { template: "server-built", compiler: "server-built", contract: "server-built" },
      normalizedAcceptedSegmentText: normalizeAcceptedSegmentText(result.source.acceptedSegment.text)
    }
  };
}
