# TDD execution plan: preserve sanitized OpenRouter failure detail

This is a behavior-changing bug, so I would deliver it as small red → green → refactor slices. I would first read the repository guidance and the issue/contract authorities, then locate the current provider-error normalizer, public API error schema/client decoder, the five named browser consumers, and their focused test commands. Because this trial forbids repository inspection, their exact file names, error categories, and commands are unknown; the executor must resolve those before coding. The acceptance scope is not optional: all five consumers, the route boundary, supported safe fields, and every rejection/redaction class need evidence.

## Acceptance map and proposed public contract

The shared value should be a closed, typed contract rather than an arbitrary provider object, for example:

```ts
type SafeProviderFailure = {
  category: ProviderFailureCategory;
  message: string;
  status?: number;
  retryAfterMs?: number;
  reason?: string;
};
```

`category` must use the categories already authorized by the repository. `message` remains the existing generic safe message. The optional fields are the only provider details allowed through the server/API boundary. No raw response, headers, body, request, cause, or provider error object belongs in this value.

Before accepting this shape, verify whether an existing public error contract or presentation seam already owns these fields. Extend that owner instead of introducing a parallel type. Also identify the issue's supported-provider-reason allowlist or grammar. “Supported provider reason” is otherwise ambiguous; do not guess an allowlist from observed payloads.

## Slice 1: server normalization and route survival

The first red is one focused route-level test using the real server normalizer and serializer with a controlled provider failure. This is the smallest end-to-end tracer for the loss reported in the bug.

Fixture:

```text
provider status: 429
retry timing: known valid value in the provider boundary's real unit/format
provider reason: "Rate limit reached for this model"
```

Initial failing assertions:

```ts
expect(response.status).toBe(/* existing public status */);
expect(response.json()).toMatchObject({
  error: {
    category: /* existing rate-limit category */,
    message: /* existing generic safe message */,
    status: 429,
    retryAfterMs: /* independently derived expected conversion */,
    reason: "Rate limit reached for this model",
  },
});
expect(Object.keys(response.json().error).sort()).toEqual(
  ["category", "message", "reason", "retryAfterMs", "status"].sort(),
);
```

The intended red is that the typed optional fields disappear during normalization or serialization. A missing dependency, invalid fixture, stale build, unregistered route, or schema-validation failure is a setup failure; repair only that precondition and rerun until the assertion fails for lost safe detail.

Smallest green production change:

1. Extend the existing shared public failure type/schema with only `status`, `retryAfterMs`, and `reason` as optional typed fields.
2. At the provider boundary, project the raw failure into that closed shape. Preserve the existing category/message mapping and success behavior.
3. Pass that value through the existing route serializer. Do not spread or serialize the raw provider response.

Rerun the exact focused test and retain the red command/failure and green result.

## Slice 2: sanitization is fail-closed

Add table-driven tests through the same public route, one adversarial case at a time. Derive literal expected outputs from this issue, not from the sanitizer implementation.

Required assertions:

- A safe multiline reason becomes one line. Define the line-folding rule in the shared contract first (for example, replace line breaks with spaces and normalize adjacent whitespace), then assert the literal result.
- A reason longer than 240 characters is capped at at most 240 characters. Define whether truncation uses an ellipsis and whether the cap is UTF-16 code units or Unicode code points before implementation; assert `reason.length <= 240` plus the exact authorized output.
- Any reason containing an authorization header, a bearer token, or an OpenRouter-style key never emits the secret. Prefer omitting `reason` entirely unless the authority specifies an exact redaction token.
- JSON objects/arrays and JSON-like request or payload dumps are omitted.
- Strings containing prompt, record, candidate, or accepted-prose markers are omitted. Resolve whether marker matching is case-insensitive and whether it is token-, prefix-, or substring-based from the authority before coding.
- Unsupported provider reasons are omitted.
- Invalid status or retry values are omitted rather than coerced into misleading values.
- The serialized response has no raw response/body/headers/request/cause fields.

For each red, the intended failure is unsafe or malformed `reason` surviving, excessive length/newlines surviving, or a forbidden extra field being serialized. The smallest green is one pure `sanitizeSupportedProviderReason(unknown): string | undefined` (or the repository's existing equivalent) called only while constructing the closed safe contract. It should reject suspicious material as a whole rather than trying to salvage secrets or prose dumps. Status and retry timing should have equally narrow validators/converters at the boundary.

Add an explicit log-sink assertion if current error handling logs normalized failures: capture the public logger output and assert that unique canary secrets and raw payload markers are absent. This is appropriate because “never put sensitive material in logs” is observable at the logging boundary. Do not assert private logger call order.

Rerun the focused route tests after every case. Do not batch all adversarial tests before the first implementation.

## Slice 3: typed API client boundary

Add a client-level test against a controlled HTTP response containing the safe contract. Initial assertions:

```ts
await expect(callThroughPublicClient()).rejects.toMatchObject({
  category: /* category from fixture */,
  message: /* generic safe message */,
  status: 429,
  retryAfterMs: /* fixture value */,
  reason: "Rate limit reached for this model",
});
```

Also assert that the client does not retain an injected unknown field such as `rawResponse` or `authorization`. The intended red is that the existing client reducer/decoder drops the safe optionals. The smallest green is to extend its existing validated error decoding and returned error type; do not add a second transport model or accept arbitrary keys.

## Slice 4: one shared presentation seam, then all five consumers

First add focused tests for the shared presentation function through its public API. For every existing failure category, assert the exact generic heading/message and category-appropriate manual recovery copy. For the supported reason, assert that it is included as supplemental detail without replacing the generic safe message. Assert that absent `reason`, `status`, or retry timing preserves current presentation. Also assert that the returned model offers no automatic retry, provider fallback, or new send action.

The intended red is either that the function does not exist as the one owner or that safe detail/manual recovery is missing. The smallest green is one pure presenter accepting `SafeProviderFailure` and returning the existing UI-facing presentation model. It must not sanitize raw data; only the server boundary may admit a reason into the safe contract.

Then migrate the five consumers one at a time. For each consumer, add a public rendering/interaction test with a typed safe failure and assert:

- generic category-safe message is visible;
- supported safe reason is visible;
- applicable status/retry information is visible only in the already-authorized form;
- the category-specific manual recovery guidance is visible;
- no automatic retry, fallback, new send action, secret, or raw payload is present;
- the existing success path remains unchanged.

Each consumer is its own red/green slice. The smallest green is replacing that consumer's local error-string construction with the shared presenter. This retains a tracer at every required seam and avoids a broad untested migration.

## Refactor boundary

Refactor only after each focused slice is green. The permitted refactor is to remove the now-duplicated browser presentation branches, centralize the closed contract/type in its existing cross-package owner, and clarify names shared by the changed paths. Do not redesign provider transport, retry policy, success handling, logging, or unrelated UI. Do not retain compatibility aliases or both old and new presenters unless an authority explicitly requires them.

After the fifth consumer is green, search for the old local presentation patterns to confirm all five call the shared presenter; this is a source-level supplement to the behavioral tests, not a replacement for them.

## Verification and retained evidence

For every slice, retain:

- exact focused red command;
- intended assertion and failure output;
- minimal production change;
- exact focused green command/result;
- any legitimate red-first skip (for example, a new test passes because part of the behavior already exists).

Then run, in order:

1. focused server normalization/route suite, including every adversarial fixture;
2. focused API-client suite;
3. shared presentation tests;
4. focused tests for each of the five consumers;
5. relevant server, shared/core, and web package suites;
6. repository lint, typecheck, full test, and build commands specified by repository guidance.

Do not claim completion if an applicable check fails. Report any command that cannot run. Final evidence should explicitly account for all five consumers and show canary secrets absent at route, client, UI, and logging boundaries, while existing success-path tests remain green.

## Uncertainties to resolve before the first red

- exact existing public error type/schema and package ownership;
- the five browser consumers and their public rendering seams;
- authorized category set and exact manual-recovery copy;
- supported reason grammar/allowlist;
- newline normalization, 240-character counting/truncation semantics, and marker matching rules;
- provider retry input format and public output unit;
- whether status/retry details are intended for UI display or only typed transport;
- focused and repository-wide commands.

If the issue or active authority does not answer any of the semantic questions above, pause for scope correction rather than encoding an arbitrary policy in tests.
