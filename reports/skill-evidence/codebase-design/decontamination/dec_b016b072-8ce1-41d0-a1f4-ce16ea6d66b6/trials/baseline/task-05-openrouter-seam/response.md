# Recommendation

Do not introduce a transport adapter interface yet. Keep `sendChatCompletion` as the caller-facing OpenRouter module and keep `buildChatCompletionRequest` as its pure request-shaping dependency. The current lower seam at `fetch` is hypothetical: there is one production transport, and endpoint substitution plus a stubbed global `fetch` already exercises the required behavior. Revisit this decision when a second adapter is demanded by observed variation, not merely when a mock interface can be invented.

## Current interface and dependency map

```text
generation / assistance routes
        |
        | SendChatCompletionInput
        v
sendChatCompletion  ->  TransportResult
        |
        +-- process.env / explicit apiKey
        +-- buildChatCompletionRequest (in-process, pure)
        +-- OpenRouter endpoint + request headers
        +-- global fetch (true external network dependency)
        +-- response JSON + Retry-After decoding
        +-- candidate extraction
        +-- normalizeOpenRouterError
```

The existing `sendChatCompletion` interface is already deep. Callers supply a prompt, settings, and optional key, signal, configuration, and request options; they receive either candidate text or a normalized error. They do not need to know OpenRouter's URL, bearer-header construction, JSON response shape, retry header, status mapping, or exception behavior.

`buildChatCompletionRequest` owns deterministic OpenRouter request shaping: model, one user message containing the compiled prompt, temperature, maximum output tokens, optional `top_p`, `stream: false`, and declared request options. The client owns credentials, HTTP execution, response parsing, candidate extraction, and normalization. Tests cross these same two interfaces: pure request tests call `buildChatCompletionRequest`, while client tests call `sendChatCompletion` and substitute endpoint configuration and global `fetch`.

The directly related model-list path also calls `fetch` and repeats some headers, JSON reading, retry handling, and normalization. That is evidence of local implementation duplication. It may eventually justify a private OpenRouter HTTP helper, but it does not establish multiple transport adapters or multiple providers.

## Strongest case for extraction

OpenRouter is a true external dependency, so an injected port with a production fetch adapter and an in-memory test adapter could give the implementation better locality. It would remove mutation of process-global `fetch`, reduce the chance of concurrent-test interference, and make transport outcomes such as aborts, invalid JSON, status codes, and retry headers deterministic test inputs. If chat completion and model-list operations must share materially evolving HTTP policy, a single adapter could also concentrate authentication, app headers, signal propagation, response decoding, and network-error handling.

That case is strongest if the port remains an internal seam of the OpenRouter module. The external interface should still return `TransportResult`; callers should not learn `Request`, `Response`, bearer headers, or provider response bodies. Request shaping and error normalization should remain owned by the deep module rather than being split among routes or exposed through a provider-neutral abstraction.

## Strongest case against extraction

There is no demonstrated transport variation today. A new interface would either be a fetch-shaped pass-through—adding nearly as much interface as implementation—or speculate about common behavior across providers that do not yet exist. Both make a shallow module. A nominal in-memory adapter created only to justify the production adapter would not prove a real seam; current tests can already control the endpoint and every fetch outcome.

Premature extraction also risks putting the wrong facts on the new interface. Authentication, request schemas, response parsing, retry metadata, moderation/status semantics, and abort behavior are OpenRouter-specific. A supposedly generic transport could leak those details to callers or freeze a false provider-neutral model. Future providers may differ enough that separate deep modules are better than one common adapter. The repository also forbids speculative provider machinery, compatibility aliases, and provider-specific hidden behavior in the core.

## Evidence threshold for a real seam

Extract only when there are two justified adapters and a concrete behavior that must vary across them. Qualifying evidence would be one of the following:

- a committed runtime requirement for a second transport, such as direct OpenRouter HTTP plus an owned local proxy/process adapter, with both exercised in production-relevant flows;
- a required runtime where the current fetch contract is unavailable or materially different, demonstrated by failing integration behavior rather than anticipated portability;
- repeated, measured test isolation or fidelity failures caused by global fetch substitution, together with an in-memory adapter that represents provider outcomes without exposing transport details to callers; or
- a second provider implementation whose proven common contract is the existing normalized result, after validating that credentials, aborts, request shaping, and errors can remain provider-local.

An alternate endpoint using the same fetch behavior, a second test fixture, or the mere ability to write a mock does not meet the threshold. This makes the recommendation falsifiable: if one of the qualifying cases lands, the no-adapter recommendation should be reversed; absent that evidence, it stands.

## Invariants any later extraction must preserve

- **API-key secrecy:** resolve the key on the server; fail before network I/O when absent; put it only in the outbound authorization header; never put it in prompts, logs, inspection UI, fixtures, returned errors, or story data; retain provider-reason redaction.
- **Abort behavior:** pass the caller's `AbortSignal` unchanged to the actual I/O and continue normalizing an abort or timeout failure to the current `timeout` result rather than throwing across the interface.
- **Error normalization:** preserve status/category mapping, malformed/non-JSON handling, sanitized provider reasons, and `Retry-After` propagation behind `TransportResult`.
- **Request shaping:** keep `buildChatCompletionRequest` as the deterministic source of the OpenRouter request body, including `stream: false` and optional request fields. An adapter must not rewrite, omit, or secretly transform it.

## Minimum test changes

For the recommended no-extraction decision: none. The smallest sufficient surface is already present:

- `buildChatCompletionRequest` tests for deterministic body shaping; and
- `sendChatCompletion` tests for success extraction, exact outbound method/headers/body, missing-key short-circuit, endpoint/app headers, signal forwarding, abort/network/status normalization, non-JSON and malformed responses, retry metadata, and secret redaction.

Do not add parallel adapter-contract tests while no adapter exists. If the evidence threshold is later met, replace the fetch-stubbing client tests with outcome tests through `sendChatCompletion` using the injected test adapter, add only the production adapter contract tests needed to prove URL/header/body/signal wiring and response translation, retain the pure request-shaping tests, and delete superseded tests rather than layering both suites.
