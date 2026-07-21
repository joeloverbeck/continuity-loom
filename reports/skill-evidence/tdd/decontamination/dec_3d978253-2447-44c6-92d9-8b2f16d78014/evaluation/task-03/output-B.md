# TDD execution plan: sanitized OpenRouter failures

The implementation should proceed as four small vertical slices. Do not begin by changing all five consumers, and do not count a malformed provider fixture, an invalid route fixture, or a failing test harness as the red.

## Before the first red

Confirm the existing public seams and reuse them rather than creating parallel error paths:

- the server function that converts an OpenRouter/provider failure into the API error result;
- the public HTTP route exercised through the server's normal injection/test seam;
- the web API client parser/result type;
- the current browser error-rendering seam and the five concrete consumer components; and
- the provider-request boundary, so tests can prove that failure rendering never retries or falls back.

The shared safe detail should be a narrow typed value, not an exception or response object. Its intended shape is equivalent to `{ category, message, status?, retryAfter?, reason? }`, using the repository's existing names and units. `category` and the generic safe `message` are required; every optional value must be independently validated. The exact existing category set, status/retry field names, route, consumer names, and focused test command are uncertain because the supplied evidence does not include product source. Resolve those names before editing, but do not widen the contract to accommodate one observed OpenRouter response.

## Slice 1: server sanitizer and normalizer

Add one table-driven test through the smallest public server normalization seam. The first run must fail on the missing safe-detail behavior, with valid provider-boundary fixtures. Include these independent literals/canaries:

- a supported scalar reason such as `rate limited by upstream` survives;
- `first line\nsecond line` becomes one line and the retained result is at most 240 characters;
- `Authorization: Bearer SECRET_CANARY` does not expose `SECRET_CANARY`;
- `Bearer TOKEN_CANARY` and an OpenRouter-shaped `sk-or-v1-KEY_CANARY` do not expose either canary;
- JSON-looking request/payload text is discarded, not partially displayed;
- strings containing `prompt`, `record`, `candidate`, or `accepted prose` markers are discarded;
- an object/array supplied as a reason is rejected rather than stringified; and
- a safe status and retry value survive, while invalid or unsupported optional values do not.

Assert both the positive contract and the negative one: the normalized result has the stable category and generic safe message, may contain only validated optional fields, and its serialization contains none of the secret/payload canaries or arbitrary response keys. If logging is observable through an injected/test logger boundary, assert that its captured output also contains none of those canaries. A logger call count alone is insufficient.

Run only this test and confirm that the intended assertion fails. Then make the smallest production change: a pure server-side `sanitizeSupportedProviderReason`-style helper and a normalizer that explicitly picks supported scalar fields. Reject dump-like or sensitive input before retention, redact recognized credential forms defensively, normalize whitespace to one line, and cap at 240 characters. Never spread, stringify, log, or serialize the provider response/error object. Rerun the same focused test to green.

## Slice 2: wire-contract survival

Add a route-level test through the real local API route with the external provider client replaced by a faithful boundary fake. Return a provider failure containing a safe category/message/status/retry/reason plus a raw-object and secret canary. The first route assertion should require the exact typed safe detail to survive JSON serialization while proving the raw object and canaries are absent.

Keep the provider fake valid and verify that the route was reached; otherwise a parser/setup failure is not the red. Make the minimum route/DTO change needed to serialize the shared safe type. Do not serialize an exception, add a second error envelope, or change success responses. Rerun the focused route test.

Next, add the corresponding public web API-client test with `fetch` controlled at that system boundary. Assert that it parses and retains every supported safe field and ignores/rejects unsupported additions according to the existing parser policy. Make the minimal shared type/parser change needed for green. Prefer the existing platform-free shared contract location if server and web already share public DTOs; do not make web import server internals.

As regression invariants in this slice, assert that one failed user request produces exactly one provider request, no fallback request, and no scheduled or automatic retry. Also assert that no safe-detail work changes a success response. These assertions may already pass; if so, record them as added coverage rather than inventing a red.

## Slice 3: one browser presentation function

Add a focused test for one shared presentation seam that accepts only the safe failure type. Cover each stable category with an independently written expected generic message and category-appropriate manual recovery text. A supported sanitized reason may be shown only in the designated safe detail position. Unknown/missing optional detail must fall back to generic safe copy.

Negative assertions should prove that the presentation contains no automatic-retry promise, provider-fallback behavior, or new send action, and cannot accept an arbitrary response object. Make the smallest implementation: one pure web presentation function returning the display model/copy used by consumers. It must not resanitize arbitrary raw provider material in the browser; only the server-originated, client-validated safe type reaches it. Rerun this focused test to green.

## Slice 4: five consumer integrations

Enumerate the five actual browser consumers before editing and make a five-row acceptance matrix. Convert one consumer first:

1. Render it through its public component/user-flow seam with a typed safe failure.
2. Assert the generic/category recovery copy and supported reason are visible.
3. Assert secret and payload canaries are absent from rendered text/accessible output.
4. Assert failure display causes no provider request, retry timer, fallback, or new send action.
5. If the acceptance contract explicitly requires the shared function, add the smallest source/import check for that import and keep the rendered behavior test as the primary evidence.

Confirm the first unconverted consumer fails for the missing shared presentation, replace only its local error formatting with the shared presenter, and rerun to green. Repeat one consumer at a time for all five; do not bulk-write five tests before any integration is green. Existing manual send/recovery controls may remain, but their behavior and the candidate/success flow must not change.

## Refactor boundary

Refactor only after every focused slice is green. Permitted consolidation is limited to:

- one pure server sanitizer/normalizer for provider failures;
- one shared, platform-free safe wire type/parser at the existing DTO boundary; and
- one pure web presentation function used by all five consumers.

Do not refactor provider selection, request dispatch, prompt/candidate handling, success paths, or general error UI. Do not add compatibility aliases or retain the old consumer-specific formatters. After removing duplication, rerun the sanitizer, route/client, presenter, and five-consumer focused tests.

## Verification

Retain, for each slice, the exact focused command, the intended failing assertion, the minimal change, and the green result. Use the repository's existing focused runner syntax for the resolved server and web test files; do not claim a red from a test-discovery or fixture failure.

Then run the focused server suite containing sanitizer, normalizer, and route tests; the focused web suite containing API-client, presentation, and all five consumer tests; and finally the canonical repository gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires all safe details to survive server, route, client, and UI boundaries; every canary to remain absent from wire output, logs, and rendered/accessible UI; all five consumers to use the shared presenter; and the no-retry, no-fallback, no-new-send-action, and unchanged-success-path invariants to remain green.
