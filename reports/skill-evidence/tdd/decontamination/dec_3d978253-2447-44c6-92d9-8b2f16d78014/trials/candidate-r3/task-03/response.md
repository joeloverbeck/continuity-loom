# TDD plan: preserve sanitized OpenRouter failure detail

The implementation should proceed as small vertical slices through the existing public failure seams. The exact test filenames, exported type names, category values, and focused runner syntax are not supplied, so those must be resolved from the repository before execution. The behavioral assertions below are the contract; placeholder names must not become a reason to create a parallel API.

## Before the first red

Locate the existing provider-error normalizer, server route, server/browser wire type, API client, shared presentation seam if one exists, and all five named consumers. Record an acceptance map with these obligations:

| Obligation | Evidence |
| --- | --- |
| Stable category and generic message; optional status, retry timing, and supported reason | Normalizer test plus route/API-client survival test |
| One-line, 240-character maximum reason | Normalizer adversarial tests |
| Secrets, request/payload dumps, and prose-bearing markers cannot escape | Normalizer, route/log, and rendered-UI canary assertions |
| One shared presentation with category-appropriate manual recovery | Presentation contract test plus five consumer tests |
| No arbitrary response serialization, retry, fallback, new send action, or success-path change | Route/client/component regression assertions and existing success tests |

Use a fake only at the external provider boundary (and a captured logger sink if logging is part of the route harness). Exercise the real normalizer, route serialization, API client, presentation function, and consumers. Canary expectations should be independent literals, not a copy of the production sanitizer.

## Slice 1: safe server normalization

Start here, adding one tracer at a time and rerunning it before production changes.

1. **Supported safe detail survives.** Give the public normalizer a representative provider failure with a known category, the existing generic safe message, HTTP `429`, a known retry value, and one supported provider reason. The failing assertion should expect the normalized typed result to retain exactly those safe fields.
2. **Secret and layout canaries cannot survive.** Supply reasons containing a newline, `Authorization: Bearer AUTH_CANARY`, a bearer token in prose, and an OpenRouter-style `sk-or-v1-KEY_CANARY`. Assert that any retained reason is one line, no longer than 240 characters, and contains none of the canaries. Also cover a reason longer than 240 characters without computing the expected result with the production algorithm.
3. **Payload-like detail is discarded.** Feed JSON-like request bodies and separate strings containing `prompt`, `record`, `candidate`, and `accepted prose` markers with unique canaries. Each assertion should retain the stable category/generic message but omit the provider reason entirely.
4. **Objects are never treated as display detail.** Pass a provider response object whose nested properties contain every canary. Assert that the safe result does not contain those properties and that serializing the normalized result cannot reveal them.

The smallest green change is a single typed safe-failure contract at the existing server/browser contract seam and one normalizer that constructs it field by field. It should copy only allowlisted scalar fields, accept only a supported provider-reason shape, reject payload/prose-marker content, redact secret forms, normalize whitespace to one line, and enforce the 240-character limit. It must never spread, attach, stringify, or log the upstream response/error object. Preserve the current category and generic safe message behavior.

If an adversarial test unexpectedly passes, retain it as regression coverage and move to the next genuinely missing assertion; do not fabricate a red.

## Slice 2: prove the wire contract

Through the public server route, have the injected provider boundary fail with a controlled provider-shaped error. The first route red should assert the exact JSON response contains the typed safe category/message and the allowed optional status, retry timing, and reason. A second adversarial route case should assert that auth/key/payload/prose canaries are absent from both the serialized response and captured logs. It should also assert the provider boundary was invoked once: normalization must not trigger an automatic retry or fallback.

Make only the route mapping change needed to pass: return the already-normalized safe contract instead of reconstructing a lossy error or serializing the provider object.

Next, feed that exact route response through the public browser API client (using a controlled `fetch` response only if an end-to-end route/client harness is unavailable). The red should expect the client's typed failure to preserve the same allowed fields. Its adversarial case should degrade unknown/malformed detail to category plus generic safe message, never to arbitrary fields. The smallest green is to parse/map the shared safe wire contract rather than collapsing it into a new `Error` string. Do not add a second competing failure shape.

## Slice 3: one presentation contract

Add a focused test at the shared presentation seam. For every existing stable category, assert an independent literal user-facing heading/message and a category-appropriate **manual** recovery step. For a failure with optional safe detail, assert only the allowed reason/status/retry information is presented. For malformed or absent optional detail, assert the generic presentation remains usable. Include a secret/payload canary and assert it is not in the presentation.

The minimal green change is one pure presentation function accepting only the typed safe failure and returning the existing UI presentation shape. It must not perform requests, schedule retries, choose a fallback provider, or expose a send action.

## Slice 4: integrate all five browser consumers

Move one consumer at a time through red and green; do not change all five before observing the first tracer.

For each of the five public rendered consumers:

- render a controlled typed failure and assert the shared category presentation, safe optional detail, and manual recovery are visible;
- render an adversarial failure and assert auth/key/payload/prose canaries are absent from the accessible UI;
- assert settling the failure does not initiate another API/provider request, switch providers, or expose a newly added send action; and
- preserve the consumer's existing success/candidate behavior.

A table-driven test is acceptable for the common contract only if it actually renders every consumer. Consumer-specific recovery copy or state transitions need their own assertion. The smallest green for each is to replace its local error formatting with the shared presenter; no generation or success-path logic should move.

## Refactor boundary

Refactor only while each focused slice is green. After server and client agree on the typed contract, remove duplicate type definitions in favor of the existing shared contract location. After every consumer is green, remove superseded local formatters and name the sanitizer predicates clearly. Do not broaden supported reasons, redesign the provider client, alter success/candidate flow, or add generalized retry infrastructure during this refactor.

## Verification

For every slice, retain the exact focused red command and the intended failing diff/assertion, then the same command passing after the minimal change. Since runner/file names are not provided, first substitute the repository's existing focused commands rather than inventing new scripts. The verification order is:

1. focused server normalizer tests;
2. focused server route tests, including response/log canaries and one-call invariant;
3. focused web API-client and shared-presentation tests;
4. focused component tests covering all five consumers;
5. the broader server and web package suites; and
6. canonical repository gates: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Completion requires all applicable gates green, exact evidence that the intended assertions ran, and no change to existing success-path snapshots/contracts. Any unavailable command or unrelated failure must be reported rather than counted as behavioral evidence.
