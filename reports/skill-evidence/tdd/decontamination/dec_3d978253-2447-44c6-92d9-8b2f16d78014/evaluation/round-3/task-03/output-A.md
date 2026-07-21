# TDD response: sanitized OpenRouter failure detail

## Preflight and agreed seams

This is one issue, but it crosses four materially different public seams. The issue pre-agrees these seams: server failure normalization, the HTTP wire contract, the browser API client, and rendered browser consumers through one shared presentation function. Each gets its own tracer and evidence row; passing at one seam is not evidence for another.

The trial constraints prevent reading `CONTEXT.md`, ADRs, governing project docs, package scripts, or the current implementation. Before a real first red command, record those authority dispositions and the exact test paths/commands. If an authority conflicts with this issue, stop rather than treating this plan as an exception. The type/property names below are provisional; reuse the repository's existing public error DTO and vocabulary rather than introducing aliases.

Privacy and behavior invariants apply to every slice:

- no authorization header, bearer token, OpenRouter-style key, prompt/record/candidate/accepted-prose material, or arbitrary response object reaches JSON, logs, or rendered text;
- no automatic retry, provider fallback, new send action, or success-path change;
- stable category and generic safe message remain the fallback when optional detail is absent.

## Vertical red-to-green slices

### 1. Server sanitizer and normalizer

Start with one table-driven test against the smallest public server normalization function. It should fail because a supported clean reason is currently discarded, while also installing adversarial canaries before any preservation code exists.

The cases should assert:

- a known category plus generic safe message survives, with optional `429`, retry timing, and a supported plain-text provider reason;
- CR/LF and other line breaks cannot produce more than one line, and retained reason text is at most 240 characters;
- `Authorization: ...`, `Bearer SECRET_CANARY`, and an `sk-or-v1-SECRET_CANARY`-style key never occur in the normalized value;
- JSON-like request/payload text is discarded rather than selectively copied;
- any reason containing prompt, record, candidate, or accepted-prose markers is discarded;
- unknown values, nested response objects, arrays, and thrown objects do not become serialized detail;
- a rejected reason leaves the stable category and generic safe message intact.

Use independent literal expected values and literal secret/payload canaries. Do not recreate the sanitizer algorithm in the assertion. Confirm the red is the missing safe-detail behavior, not fixture construction or a stale workspace build.

The smallest green change is a server-owned sanitizer that accepts `unknown` and returns either a bounded safe reason or `undefined`, followed by a narrow extension of the existing normalizer to carry only allowlisted scalar fields: status, retry timing, and sanitized reason. Do not copy a provider response object or log the rejected input. “Supported reason” needs an explicit allowlist or existing provider contract; do not infer support merely because a value is a string.

### 2. HTTP route and typed wire contract

Add a route-level test that injects a provider failure containing both a supported reason and unique secret/payload canaries. Assert the response body contains the typed category, generic message, status/retry fields, and sanitized reason. Assert recursively that the serialized body contains none of the canaries and no provider response/request object. Capture the route logger if the existing harness permits it and assert the same canaries are absent there.

The minimal green change is to extend the existing shared error DTO/schema and its route mapper with the optional safe scalar fields. The route must serialize only that DTO. Do not add a second error shape.

### 3. Browser API client survival

At the API client's public request boundary, return the exact safe route fixture from a fake HTTP boundary and assert the rejected client result retains the typed safe fields. In a second adversarial fixture, include unsupported extra keys and assert they are ignored rather than surfaced.

The minimal green change is to parse/map the extended DTO in the existing failure path. Do not change request construction, successful response parsing, or retry behavior.

### 4. Shared browser presentation

Test one exported presentation function with representative categories. Assert it returns the generic safe message, an optional sanitized reason, and category-appropriate manual recovery guidance. Also assert that retryable metadata remains informational: it must not expose an automatic-retry callback, provider-fallback action, or new send action. Feed it adversarially shaped input as defense in depth and assert no canary is rendered.

The minimal green change is one typed presentation result used by all consumers. Keep sanitization authoritative on the server; the presenter may defensively omit invalid detail, but it must not develop a second, divergent sanitizer.

### 5. Five consumer integrations

Inventory the five issue-scoped consumer names from the implementation before editing. Add one rendered-DOM assertion for each named consumer, preferably as explicit named cases rather than a broad source-string check. For each, drive a typed client failure through its public UI boundary and assert the shared safe message/reason and the correct manual recovery text are visible, while the canaries and any automatic retry/fallback/new-send control are absent.

Make one consumer green at a time by replacing its local error formatting with the shared presenter; rerun that consumer's test before moving to the next. Do not change candidate state, accepted prose, successful rendering, or send behavior.

## Refactor boundary

Refactor only after all five consumer tracers are green. The allowed refactor is deletion of duplicated browser message/recovery formatting and tightening names/types around the single DTO and presenter. Do not move provider-specific parsing into the browser, generalize unrelated error handling, change success paths, or add compatibility aliases. Rerun the sanitizer and route tests after any type/schema cleanup because they own the privacy boundary.

## Verification

Run, in order:

1. the focused server sanitizer/normalizer test;
2. the focused route test, confirming the intended assertion and logger capture ran;
3. the focused browser API-client test;
4. the focused shared-presenter test;
5. each of the five focused rendered-consumer tests;
6. the combined server and web package suites;
7. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from the repository root;
8. a browser smoke on each affected error surface, checking rendered recovery guidance, absence of secrets, absence of automatic retry/fallback controls, and a clean console.

The exact focused runner commands and file paths cannot be stated honestly without reading the prohibited package and implementation files. Resolve them before execution and record the literal red failure and green command for every seam. If an allegedly new assertion is green before production changes, verify that it reaches the intended public boundary; only then classify it as coverage-only existing behavior rather than manufacturing a red.
