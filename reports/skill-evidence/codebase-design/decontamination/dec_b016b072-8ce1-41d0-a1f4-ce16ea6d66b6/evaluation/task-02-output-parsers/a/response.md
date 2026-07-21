# Parser design note

## Diagnosis

The current profile parsers are already deep modules. Each exposes one public parse function while hiding exact-key enforcement, source/citation checks, normalization, and a large semantic validator. Their large contexts are domain evidence, not accidental interface ceremony.

The shared `strict-output-primitives.ts` also sits at the right in-process seam: it owns pure-JSON-object admission, plain-object recognition, exact-key mechanics, branded reason errors, and citation-list mechanics. The profile modules supply expected keys, allowed citation sets, reason codes, and messages. Everything remains in platform-free `packages/core`; no server, filesystem, or transport adapter is needed.

The meaningful asymmetries must remain visible: reconciliation returns `malformed`, preserves `rawOutput`, validates source echoes, patches, record payloads, lifecycle destinations, token resolution, and creation graphs; change review returns `quarantined`, never returns raw output, has a fixed recovery, and validates coverage, epistemic claims, future possibilities, and retention horizons.

## Two plausible interface shapes

### Shape A: one discriminated parser facade

```ts
export function parseAssistanceOutput(input: {
  profile: "segment-reconciliation";
  rawOutput: string;
  context: SegmentReconciliationParseContext;
}): SegmentReconciliationParseResult;

export function parseAssistanceOutput(input: {
  profile: "accepted-segment-change-review";
  rawOutput: string;
  context: AcceptedSegmentChangeReviewParseContext;
}): AcceptedSegmentChangeReviewParseResult;
```

One module would dispatch to internal profile validators. This gives callers one named entry point and centralizes syntax admission, but its apparent smallness is misleading: callers still learn a discriminated union of both contexts and both result contracts. Adding a profile enlarges the same interface and owner. The seam is placed above unrelated semantics, so locality worsens.

### Shape B: profile-owned parsers over a shared syntax kernel

Keep one external seam per contract, with `strict-output-primitives.ts` as an internal seam:

```ts
export function parseSegmentReconciliationOutput(
  rawOutput: string,
  context: SegmentReconciliationParseContext
): SegmentReconciliationParseResult;

export function parseAcceptedSegmentChangeReviewOutput(
  rawOutput: string,
  context: AcceptedSegmentChangeReviewParseContext
): AcceptedSegmentChangeReviewParseResult;
```

The implementation may continue composing `parsePureJsonObject`, `expectExactKeys`, `parseCitationKeys`, and branded reasons. A configurable `defineParser(spec)` factory is not warranted: its specification would have to expose profile keys, codes, messages, result envelopes, and callbacks for nearly all the implementation, producing a shallow module.

## Recommendation

Choose Shape B, which is substantially the current structure. Do not add a unified facade or compatibility aliases. The two profile entry points are the test surfaces and already provide high leverage. Keep the syntax kernel private to parser implementations unless a third strict parser demonstrates a repeated orchestration rule that the current primitives do not capture.

## Ownership

The syntax kernel owns only deterministic mechanics: trimming and admitting exactly one JSON object, rejecting surrounding/non-object/malformed JSON, recognizing plain objects, comparing exact keys, checking citation-list shape/duplicates/membership, and carrying typed reason errors.

Each profile parser owns its schema and semantics. That includes its contract string and top-level fields, sequential ids, allowed citations and error mapping, result envelope and raw-output policy, plus reconciliation's source echo, brief/record targets, JSON Patch application, record-schema validation, lifecycle rules, reference tokens, dependency graph, and change review's complete coverage, enum sets, evidence witness, future-possibility rejection, and epistemic rules. The accepted-prose echo firewall remains a shared core safety module invoked by both profile owners.

## Tests at the chosen interfaces

Both parser entry points should be tested with surrounding text, malformed JSON, non-object JSON, missing/extra keys, invalid citation lists, unknown citations, and material accepted-prose echo. Tests must assert the profile-specific failure envelope: reconciliation includes the original `rawOutput`; change review omits it and returns `recovery: "inspect-source-and-response"`.

Reconciliation tests should additionally cover stale source echoes, sequential proposal ids, invalid brief/record targets, immutable-id and unresolved JSON patches, source payload non-mutation, invalid record enums/payloads, raw UUID and unresolved reference tokens, invalid lifecycle destinations, duplicate targets, and cyclic creation dependencies.

Change-review tests should cover exactly six unique coverage dimensions in canonical order, sequential item ids, nonblank unique target hints, invalid enums, future-possibility language, invented established claims, a valid short evidence witness from an allowed evidence key, and full-response quarantine for every failure. Property coverage for undeclared top-level fields is valuable. These tests exercise only the public profile interfaces and survive changes to the shared implementation.
