# Accepted-Segment Change Review comparison protocol

This protocol makes the old-versus-new evidence comparison reproducible and bounded. Issue #134 creates and verifies the offline evidence system only. It authorizes no provider call, performs no product or project-store write, and is not the GO/NO-GO decision for a runtime change.

## Issue #134 dry run

From the repository root, validate the synthetic gold corpus and print the complete request plan:

```bash
node scripts/accepted-segment-change-review/cli.mjs dry-run
```

The command exits nonzero if the corpus or protocol is incomplete. A successful plan contains exactly 16 non-executed entries: old and new once for each case, in this fixed order:

1. death
2. injury
3. location change
4. custody change
5. clock-threshold crossing
6. commitment change
7. secret disclosure
8. genuine no-change

Every pair uses the same pinned model and settings envelope from `protocol.json`. The old and new roles also carry stable contract identities, `segment_reconciliation.v1` and `accepted_segment_change_review.v1`; the role labels never substitute for those identities in captured provenance. The protocol permits at most 16 provider requests and requires no automatic retries, fallback requests, repair calls, or unapproved substitutions. The CLI deliberately has no execute command and cannot contact a provider.

## Later comparison run owned by issue #136

Only a separately authorized run under GitHub issue #136 may execute the plan. Its operator must:

1. Validate the corpus and protocol with the dry-run command.
2. Execute each emitted entry exactly once, preserving request ordinal, case, workflow, model, settings, latest-segment selection, and record scope.
3. Stop rather than retry, fall back, repair, or substitute when a request fails or returns malformed output.
4. Capture each request as a JSON object with:
   - workflow contract, model and settings, latest-segment selection, record scope, start/completion timestamps, source fingerprint, and prompt SHA-256;
   - completed, malformed, or failed status plus a structured failure when applicable;
   - complete source accounting, findings, all six coverage rows, request-policy counters, and zero-write counters;
   - review time, prompt characters and token estimate, latency, input/output tokens, and actual USD cost.
5. Put those request objects in a comparison-run object with schema version 1, the pinned protocol ID, `issueClosureIsGo: false`, and a steward receipt.

Before a decision, the steward receipt is:

```json
{
  "status": "not-recorded",
  "steward": null,
  "decision": null,
  "recordedAt": null,
  "rationale": null
}
```

Evaluate a captured run without further provider access:

```bash
node scripts/accepted-segment-change-review/cli.mjs evaluate --results path/to/comparison-run.json
```

The command validates every input, calculates the per-request metrics and deterministic floors, and prints the durable format defined by `result-format.schema.json`. It also calculates whether the exact ordered 16-entry protocol matrix is complete, aggregate old/new request counts, actual request count and cost, empty and malformed frequencies, and metric averages. A partial capture remains scoreable for diagnosis but cannot pass the overall deterministic gate.

Any unknown case, malformed request, duplicate request or finding ID, coverage status outside `changes found`, `checked - no relevant change`, or `uncertain`, request count above 16, drift from the pinned protocol ID, workflow contract, model, settings, segment selection, or record scope, missing provenance, incomplete measurements, undeclared input field, or invalid receipt aborts evaluation. A completed request that omits declared source accounting or a coverage dimension remains evaluable but fails its deterministic floor. Seeded IDs count only when their evidence keys, contrast keys, and epistemic status match the gold adjudication; citation drift cannot be hidden by setting `invented` false. The result must be retained exactly as emitted so failures are visible rather than repaired away.

## Steward decision boundary

After reviewing the evaluated result, a named steward records `GO` or `NO-GO`, their name, timestamp, and rationale in the receipt. A GO requires every deterministic floor to pass and remains a separate human judgment; a NO-GO may be recorded for any qualitative or operational concern even when floors pass.

Issue closure is not GO. Closing #134 only proves that the offline corpus, evaluator, bounded dry-run plan, and result contract exist. It neither authorizes the #136 provider run nor changes any production prompt or product behavior.
