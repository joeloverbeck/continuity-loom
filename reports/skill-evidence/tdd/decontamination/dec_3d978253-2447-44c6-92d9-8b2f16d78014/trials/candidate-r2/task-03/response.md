# TDD execution plan

The accepted public seams are the server failure normalizer, the serialized API error, the browser API client's typed result, one shared browser presentation function, and the rendered failure state in each of the five consumers. The raw provider failure must stop at the server normalization boundary. I would first identify the existing category union, route/client contract module, five consumers, focused test commands, and valid provider-failure fixture shape. I would not broaden the category vocabulary or invent a second API-error framework unless the existing contract cannot express an acceptance criterion.

## Slice 1: sanitize one provider failure correctly

The first red is a table-driven test through the server normalizer's public entry point. It should use valid boundary-shaped failures and independent expected literals, including:

- a supported reason such as `Rate limited\ntry later` produces the one-line literal `Rate limited try later`, while the existing rate-limit category, generic safe message, HTTP `429`, and supported retry timing survive;
- a reason longer than 240 characters is truncated to at most 240 characters without adding a second line;
- reasons containing `Authorization: Bearer secret-canary`, `Bearer secret-canary`, and an `sk-or-v1-...` canary cannot expose those canaries in any normalized field;
- JSON-like request or payload dumps, and strings containing prompt, record, candidate, or accepted-prose markers plus unique canaries, cause the optional reason to be discarded rather than partially displayed;
- an arbitrary response object with enumerable secret/payload canaries normalizes to the stable category and generic safe message without serializing the object, its keys, or `[object Object]`.

The oracle must inspect the complete normalized value, not just one field. Where redaction retains harmless surrounding text, assert the exact safe literal; where the entire reason is unsafe, assert that the optional reason is absent. Also capture the test logger boundary, if this path logs, and prove no canary reaches logs. This red only counts if the normalizer currently returns the wrong safe value; malformed fixtures or a parser rejection are setup failures to repair and rerun first.

The smallest green is a single unknown-input-to-safe-contract normalizer. It should construct a fresh primitive-only object from recognized fields, normalize whitespace, enforce the 240-character bound, redact recognized credential patterns, and reject JSON-like/marked payload text before retaining a reason. It must never spread, stringify, or serialize the provider response. Logging at this catch boundary, if any, is limited to already-sanitized category/status metadata. Preserve the existing stable category and generic safe message instead of deriving either from provider prose.

Rerun this focused test to green before proceeding.

## Slice 2: prove the safe contract crosses the server route

Add a failing route test using the real in-process route and a fake only at the external provider boundary. Make the provider reject with a representative failure containing safe status/retry/reason fields alongside secret and payload canaries. Assert the public HTTP status and exact JSON error envelope: stable category and generic safe message are present, allowed optional fields survive, and raw/provider-only fields and every canary are absent.

As regression invariants, assert that the public result is the failure immediately, no success payload or persisted candidate is produced, and the provider boundary records exactly one attempt with no fallback. The attempt count supports the explicit no-automatic-retry rule; it is not the sole behavior oracle.

The smallest green is to make the route serialize only the normalized safe DTO. Do not pass the caught error, provider response, headers, or arbitrary `details` object to the serializer or logger. Do not touch the success branch, retry policy, provider choice, or send actions.

## Slice 3: preserve the typed fields through the browser client

Next, add a failing client-boundary test. Prefer the repository's real in-process HTTP harness; otherwise fake only `fetch` with the exact JSON emitted by the route. Exercise the public browser client and assert that its typed failure retains category, generic safe message, status, retry timing, and supported safe reason. Include an extra unknown/raw field in the external response and assert it is not promoted into the client result.

The smallest green is for the client parser to recognize the shared safe fields instead of collapsing them to a generic string. The contract should live in the existing shared API-contract seam. If no such shared seam exists, introduce the narrowest platform-free DTO/schema that both route and client can consume; do not put raw provider error types into it. Do not add a compatibility alias or permissive arbitrary-details bag.

## Slice 4: centralize manual recovery presentation

Add a failing test through one shared pure presentation function. For every existing stable category, assert the user-visible generic message and the category-appropriate manual recovery instruction. For example, authentication failures should direct the user to review their key/settings, and rate-limit failures should explain when they may manually try again when safe retry timing exists. A supported sanitized reason may be shown, but unsupported/raw text may not. The returned presentation must not express an automatic retry/fallback state or expose a new send action.

The smallest green is one pure `safe failure -> presentation model` function containing the category-to-recovery mapping. It consumes only the sanitized DTO and has no provider, timer, logging, or persistence effects.

## Slice 5: migrate the five rendered consumers

Start with one consumer as the vertical tracer. Render it with a typed safe failure and assert the common message, safe optional detail, and manual recovery are visible, while raw canaries and any automatic-retry/new-send UI are absent. Make that consumer call the real shared presenter; do not mock code we own.

Once that is green, repeat at each of the other four public rendered seams. A small shared fixture/table is reasonable after the first tracer, but each assertion must render the actual consumer and prove its user-visible failure state. The production change at each step is only to replace local formatting with the shared presenter. Candidate flow, success rendering, and existing actions remain unchanged.

## Refactor boundary

Refactor only after every focused slice is green. Appropriate cleanup is limited to deduplicating the safe DTO/category exhaustiveness, adversarial fixture builder, and presentation mapping. Keep server sanitization separate from browser presentation: the server enforces secrecy, while the browser decides manual recovery wording. Do not create a general error hierarchy, move unrelated error paths, or alter retries, fallback, request shape, persistence, or success behavior.

## Verification and retained evidence

For every slice, retain the exact focused command, the intended failing assertion, the minimal production change, and the same command's green result. Then run the focused server normalizer/route tests and focused web client/presenter/consumer tests together. Finish with the repository gates:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

The packet does not expose test filenames, package names, category literals, retry-time representation, the supported-reason vocabulary, or the existing shared API-contract location, so those must be taken from the repository before naming exact focused commands or fields. If an added invariant test is already green, record it as characterization coverage and do not fabricate a red. Completion requires all five consumers, adversarial secret/payload fixtures, route and client survival, absence of unsafe logs/UI, and the no-retry/no-fallback invariants to be green.
