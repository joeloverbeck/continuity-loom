# Design note: keep two source seams, deepen the accepted-segment one

## Current responsibility map

- `buildStoryRecordHygieneSnapshot` owns a hygiene-specific projection. It reads non-archived records, derives complete labels before filtering, applies whole-project or generation-session working-set scope, rejects malformed/duplicate/unsupported in-scope rows, selects and orders hygiene-active record types, and builds a bidirectional reference index. Its repository interface uniquely needs outgoing and incoming reference queries.
- `buildAcceptedSegmentAssistanceSource` is already the substantial shared module behind the other two builders. It reads the latest accepted segment and generation draft, applies record scope, validates and projects complete records, builds out-of-scope reference stubs, projects the nineteen brief fields, and partitions accepted prose into bounded evidence spans.
- `buildSegmentReconciliationSnapshot` is a profile adapter over that source: it translates source failures into reconciliation error kinds/messages, adds server-built versions, and adds normalized accepted-segment text.
- `buildAcceptedSegmentChangeReviewSnapshot` is the other profile adapter: it translates failures into change-review errors, converts brief fields into `generationBriefProjection`, uses the change-review version constants, and separately returns consumed generation guidance.
- The three route modules are the callers. They pass the resulting snapshots to their profile-specific core compilers; they should not learn the shared source-building implementation.

The dominant dependency is local-substitutable repository I/O. The existing production repository and test repositories exercise a real seam. The core projections and validations behind it are in-process.

## Proposed interface and owner

Keep hygiene separate. Make `packages/server/src/accepted-segment-assistance-source-builder.ts` the explicit owner of the shared accepted-segment source interface, but remove profile and HTTP concerns from its result:

```ts
export interface AcceptedSegmentSourceScope {
  recordScope: "active_working_set" | "whole_project";
}

export type AcceptedSegmentSourceResult =
  | { ok: true; source: AcceptedSegmentAssistanceSource }
  | {
      ok: false;
      failure:
        | { kind: "no-accepted-segment" }
        | { kind: "malformed-source"; detail: string };
    };

export function buildAcceptedSegmentAssistanceSource(
  repository: AcceptedSegmentAssistanceRepository,
  scope: AcceptedSegmentSourceScope
): AcceptedSegmentSourceResult;
```

`AcceptedSegmentAssistanceSource` should contain only the shared evidence source; it need not echo either profile's request. Each profile adapter retains its original request in its own snapshot. The common module hides session-default rules, scoping, validation, label derivation, stub construction, brief-state projection, and span partitioning. The adapters own HTTP status, public error kind/message, versions, and final snapshot shape.

This is a deep module: two callers get substantial source behavior through one small interface. A generic `buildSnapshot(profile, callbacks...)` module would be shallow because callers would have to supply almost every meaningful difference as policy.

## Callers affected

Only `segment-reconciliation-snapshot-builder.ts` and `accepted-segment-change-review-snapshot-builder.ts` should adapt to the semantic failure and narrower scope input. Their route interfaces remain unchanged. `record-hygiene-snapshot-builder.ts` and its route remain outside this seam.

## Preserved differences

- Hygiene keeps its distinct request modes, active-record/type filter, deterministic hygiene ordering, full-record payload boundary, bidirectional reference index, repository dependencies, and `malformed-hygiene-source` contract.
- Reconciliation keeps detailed malformed-source messages, `normalizedAcceptedSegmentText`, its snapshot fields, and its `no-accepted-segment` wording.
- Change review keeps its deliberately opaque malformed-source message, brief projection shape, version constants, consumed-guidance result, and review-specific no-segment wording.
- Accepted prose remains bounded to the two sanctioned accepted-segment profiles; the hygiene source cannot accidentally acquire it through a generic abstraction.

## Test surface

Test the shared module through `buildAcceptedSegmentAssistanceSource` with a local repository stand-in: no segment; missing versus malformed generation session; both scopes; malformed rows inside versus outside scope; duplicate ids; full payload-derived labels; out-of-scope stubs; missing reference targets; all nineteen brief states; and deterministic accepted-segment spans.

Keep focused adapter tests for each public result: exact status/kind/message translation, reconciliation normalization and versions, and change-review projection, versions, and consumed guidance. Existing hygiene tests remain the interface tests for its separate module, including record selection/order, label privacy, reference summaries, and fail-closed behavior. Route tests remain integration coverage, not substitutes for these module-interface tests.

## Migration sequence

1. Add characterization tests at the accepted-segment source interface for the shared behavior above.
2. Narrow its input to `recordScope`, remove the echoed request, and replace HTTP-shaped failures with semantic failures.
3. Update the two profile adapters and add focused tests for every preserved error and success projection.
4. Leave route contracts and the hygiene module unchanged; run the three builder suites and their route suites.
5. Delete any now-duplicated tests that assert shared internals through an adapter, retaining adapter tests only for observable profile shaping.

One uncertainty should be resolved before implementation: whether the two core request types intentionally share one authority or are merely structurally identical today. The narrower local `recordScope` input avoids coupling the shared source to either answer.
