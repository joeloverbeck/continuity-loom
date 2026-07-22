# Accepted-Segment Change Review comparison protocol

This protocol makes the old-versus-new evidence comparison reproducible and bounded. The offline tooling authorizes no provider call, performs no product or project-store write, and is not the GO/NO-GO decision for a runtime change.

> **Retired as activation authority (issue #147); comparison CLI removed (issue #149).** The old-versus-new comparison in this document — `protocol.json` / `protocol.v2.json` / `protocol.v3.json` and every captured run — remains historical evidence and keeps its identities, but it is **no longer the activation gate** and is **no longer executable through the CLI**. Issue #149 removed the `dry-run` and `evaluate` CLI commands and the comparison evaluator when Accepted-Segment Change Review became the sole active post-acceptance workflow; the sections below that describe those commands are retained only as historical evidence of the retired protocol. The activation floor is the new-candidate-only readiness bar plus the separately authorized new-candidate-only live conformance smoke described immediately below (the readiness bar remains a repository regression test). Neither of those compiles, sends, scores, or requires the old `segment_reconciliation` prompt.

## New-candidate-only readiness bar (active activation floor)

The deterministic offline readiness bar parses the eight adjudicated gold outputs through the repaired `accepted_segment_change_review.v2` parser and fails unless every fixture parses valid, every declared source is accounted for, every result has exactly six reasoned coverage rows, every seeded change is found or explicitly uncertain, no established item is invented, and zero automatic or project-store writes occur. It issues no provider request.

```bash
npm run change-review:readiness
# or, once @loom/core is built:
node scripts/accepted-segment-change-review/cli.mjs readiness
```

The command exits nonzero on any violation and never contacts a provider.

## New-candidate-only live conformance smoke (prepared, not executed)

`live-smoke.v1.json` (`accepted-segment-change-review-live-smoke.v1`) prepares exactly one new-candidate request per synthetic case under a fixed eight-request ceiling, with no retries, fallbacks, repairs, tools, substitutions, or old-prompt request. It stays `executionAuthorized: false` until fresh owner authorization; execution and the steward `GO`/`NO-GO` are owned by GitHub issue #148.

```bash
node scripts/accepted-segment-change-review/cli.mjs live-smoke
```

This prints the prepared non-executing plan; the plan builder cannot contact a provider.

---

The remainder of this document is retained as historical evidence of the retired old-versus-new comparison protocol. It no longer gates activation.

## Version history and identity

- `accepted-segment-change-review-comparison.v1` (`protocol.json`, schema version 1) pinned `anthropic/claude-sonnet-4`. Its endpoints advertise no `response_format` or `structured_outputs` capability, so the strict-schema `require_parameters: true` envelope was excluded before generation. The authorized GitHub issue #136 run made 16 attempts and received 16 pre-generation endpoint rejections with zero model responses. **v1 and that failed run remain historical evidence and are not rewritten, erased, or reclassified as model-quality evidence.**
- `accepted-segment-change-review-comparison.v2` (`protocol.v2.json`, schema version 2) is the active protocol. It pins `anthropic/claude-sonnet-4.6`, the same two workflow contracts and shared settings, and the exact routing-relevant envelope. GitHub issue #138 repinned it **only after a read-only OpenRouter endpoint-capability check proved at least one current endpoint (for example `Anthropic | anthropic/claude-4.6-sonnet-20260217`) advertises every routing-relevant parameter** — `response_format`, `structured_outputs`, sampling controls, and a completion-length control. That endpoint check makes no chat-completion request and costs nothing.

The dry-run and evaluate commands below operate on the active version-2 protocol.

## Dry run

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

Every pair uses the same pinned model and settings envelope from `protocol.v2.json`. The old and new roles also carry stable contract identities, `segment_reconciliation.v1` and `accepted_segment_change_review.v1`; the role labels never substitute for those identities in captured provenance. The protocol permits at most 16 provider requests and requires no automatic retries, fallback requests, repair calls, or unapproved substitutions. The CLI deliberately has no execute command and cannot contact a provider.

## Version-2 staged operator flow owned by issue #136

The version-2 comparison run separates three phases with distinct budgets and authorities. **The #138 repair authorizes none of the completion requests below; it only prepares and verifies the contracts.** A failed smoke stops the flow before the comparison begins.

1. **Capability preflight (authority: issue #138; ceiling: 0 completion requests; cost: none).** A read-only endpoint-capability check confirms at least one current `anthropic/claude-sonnet-4.6` endpoint advertises every routing-relevant parameter for the exact strict structured-output envelope. This makes no chat-completion request. If no eligible endpoint exists, implementation stops and returns the issue to triage rather than substituting another model.
2. **Compatibility smoke (authority: issue #136; ceiling: 1 completion request).** After the preflight succeeds, one separately authorized minimal synthetic exact-envelope request confirms the live provider accepts the envelope. A failed smoke stops the flow before the comparison.
3. **Bounded comparison (authority: issue #136; ceiling: 16 completion requests).** Only after the smoke succeeds, a separately authorized fresh comparison executes exactly 16 requests — one old and one new for each of the eight gold cases — with no retries, repairs, fallbacks, or substitutions.

Only a separately authorized run under GitHub issue #136 may execute phases 2 and 3. Its operator must:

1. Validate the corpus and protocol with the dry-run command.
2. Execute each emitted entry exactly once, preserving request ordinal, case, workflow, model, settings, latest-segment selection, and record scope.
3. Stop rather than retry, fall back, repair, or substitute when a request fails or returns malformed output.
4. Capture each request as a JSON object with:
   - workflow contract, model and settings, latest-segment selection, record scope, start/completion timestamps, source fingerprint, and prompt SHA-256;
   - completed, malformed, or failed status plus a structured failure when applicable;
   - complete source accounting, findings, all six coverage rows, request-policy counters, and zero-write counters;
   - review time, prompt characters and token estimate, latency, input/output tokens, and actual USD cost.
5. Put those request objects in a comparison-run object with schema version 2, the pinned version-2 protocol ID, `issueClosureIsGo: false`, and a steward receipt.

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

Any unknown case, malformed request, duplicate request or finding ID, coverage status outside `changes found`, `checked - no relevant change`, or `uncertain`, request count above 16, drift from the pinned protocol version, protocol ID, workflow contract, model, settings, routing envelope, phase accounting, segment selection, or record scope, missing provenance, invalid provenance timestamp or source-accounting value, incomplete measurements, undeclared input field, or invalid receipt aborts evaluation. Malformed or failed requests must carry empty findings and coverage arrays so quarantined response fragments cannot survive in durable output. A completed request that omits declared source accounting or a coverage dimension remains evaluable but fails its deterministic floor. Seeded IDs count only when their evidence keys, contrast keys, and epistemic status match the gold adjudication; citation drift cannot be hidden by setting `invented` false. The result must be retained exactly as emitted so failures are visible rather than repaired away.

## Steward decision boundary

After reviewing the evaluated result, a named steward records `GO` or `NO-GO`, their name, timestamp, and rationale in the receipt. A GO requires every deterministic floor to pass and remains a separate human judgment; a NO-GO may be recorded for any qualitative or operational concern even when floors pass.

Issue closure is not GO. Closing the offline-tooling issues only proves that the offline corpus, evaluator, bounded dry-run plan, and result contract exist. It neither authorizes the #136 provider run nor changes any production prompt or product behavior.
