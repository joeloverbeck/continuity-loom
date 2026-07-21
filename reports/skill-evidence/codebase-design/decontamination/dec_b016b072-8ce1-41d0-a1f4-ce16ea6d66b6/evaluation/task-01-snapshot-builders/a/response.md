# Design note: keep the profile seams; deepen the accepted-segment source owner

## Current responsibility map

- `buildStoryRecordHygieneSnapshot` owns a hygiene-specific source contract. It reads non-archived records, derives complete labels, applies whole-project or Active Working Set scope, fails closed for malformed in-scope rows, validates record payloads and hygiene eligibility, orders the supported hygiene types, and builds bidirectional reference summaries. Its repository interface includes outgoing and incoming reference queries and does not read accepted prose.
- `buildAcceptedSegmentAssistanceSource` is already a deep shared module for the two accepted-segment profiles. It reads the latest accepted segment and generation draft, applies record scope, validates and projects complete records, creates minimal out-of-scope reference stubs, derives brief-field states, and partitions bounded accepted-segment evidence. A missing generation session becomes an empty draft; a malformed one fails. Missing accepted prose is a distinct 409 result.
- `buildSegmentReconciliationSnapshot` is a profile adapter over that source. It preserves the shared fields, translates source failures into reconciliation error kinds/messages, adds normalized accepted text, and supplies reconciliation's version placeholder.
- `buildAcceptedSegmentChangeReviewSnapshot` is a different profile adapter. It deliberately collapses malformed-source detail, converts brief fields into the nineteen-field projection, uses the change-review version constants, and returns consumed generation guidance separately from the snapshot.

The superficial overlap between hygiene and accepted-segment assistance is record iteration and projection. Their source boundaries, repository capabilities, scoping failure behavior, references, and result contracts differ. A three-profile configurable builder would expose those differences as flags and callbacks, reducing locality.

## Proposed module and interface

Keep `packages/server/src/accepted-segment-assistance-source-builder.ts` as the sole owner of the shared accepted-segment source behavior, and make its request vocabulary profile-neutral rather than importing a reconciliation-named request. Do not put hygiene behind this interface.

```ts
export interface AcceptedSegmentSourceRequest {
  segmentSelection: "latest";
  recordScope: "active_working_set" | "whole_project";
}

export interface AcceptedSegmentAssistanceRepository {
  listRecords(options: { includeArchived: false }): RecordReadResult[];
  getGenerationSession(): JsonReadResult;
  getLatestAcceptedSegmentForReconciliation():
    | AcceptedSegmentReconciliationSource
    | null;
}

export function buildAcceptedSegmentAssistanceSource(
  repository: AcceptedSegmentAssistanceRepository,
  request: AcceptedSegmentSourceRequest
): BuildAcceptedSegmentAssistanceSourceResult;
```

The returned source should remain the validated common evidence model: request, accepted segment, generation draft, brief fields, full records, reference stubs, and accepted-segment spans. It should not acquire profile versions, normalized prose, change-review projections, consumed-guidance shaping, or profile-facing error text. Those remain in the two adapters. `buildStoryRecordHygieneSnapshot` remains its own deep module and interface.

## Callers affected

Only the reconciliation and Accepted-Segment Change Review snapshot builders should depend on `AcceptedSegmentSourceRequest` and the common result. Their route interfaces and result types need not change. The hygiene builder and its callers are intentionally unaffected.

## Preserved differences

- Hygiene keeps its `malformed-hygiene-source` error, empty scope on an absent or malformed working-set session, hygiene-active/type filtering, fixed ordering, full payload projection, and bidirectional reference index.
- Reconciliation keeps `no-accepted-segment` wording, detailed malformed-source messages, normalized accepted text, reconciliation snapshot shape, and its version values.
- Change review keeps its non-leaking generic malformed-source response, exact brief projection, change-review version information, selected source fields, and separate `consumedGuidance` result.
- Accepted prose remains bounded to the two sanctioned accepted-segment profiles and never enters hygiene source construction.

## Test surface

Test the shared module through `buildAcceptedSegmentAssistanceSource`: no accepted segment; absent versus malformed generation session; whole-project versus Active Working Set scope; malformed in-scope rows versus ignored out-of-scope rows; duplicate IDs; invalid payload/type; missing reference targets; minimal reference stubs; complete labels; and deterministic accepted-segment spans/brief-field states.

Test each adapter through its exported builder for only its observable translation and projection: profile-specific 409/422 bodies, reconciliation normalization and versions, change-review brief projection/versions/consumed guidance, and absence of excluded payloads. Keep the existing hygiene builder tests at its own interface for ordering, eligibility, scope, reference summaries, and fail-closed cases. Once common-source coverage exists, delete wrapper tests that assert the same internal source behavior twice.

## Migration sequence

1. Add characterization tests at the existing accepted-segment source interface, without changing behavior.
2. Introduce the neutral request type and switch both accepted-segment adapters to it directly; do not leave a compatibility alias.
3. Reduce the two adapter suites to profile-owned error/result shaping, retaining end-to-end route coverage for source disclosure.
4. Leave the hygiene implementation and repository interface unchanged, then run the focused server suites before the repository-wide checks.

Uncertainty: the frozen inputs do not establish whether record iteration order is itself a published accepted-segment contract or merely repository order. Preserve it during this migration and decide ordering only from the compiler contract or explicit caller tests. No repository authority inspected requires merging these seams; the fail-closed validation decision supports retaining explicit failure behavior.
