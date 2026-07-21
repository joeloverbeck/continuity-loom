# OpenRouter transport seam

## Current interface and dependency map

The existing deep module is `sendChatCompletion(input): Promise<TransportResult>`.
Route modules provide a compiled prompt, OpenRouter settings, and (for specialized
calls) request options; they receive either candidate text or a normalized error.
They do not know about HTTP status handling, response decoding, headers, or raw
provider responses.

Inside that module, `buildChatCompletionRequest` owns deterministic request
shaping, the environment/config supplies the credential and endpoint, global
`fetch` crosses the true-external OpenRouter seam, and
`normalizeOpenRouterError` turns HTTP, malformed-body, network, and abort failures
into the stable result union. Route tests already substitute
`sendChatCompletion`; client tests substitute global `fetch` and, when useful,
the endpoint URL; request-shaping tests call the pure builder directly.

## Strongest case for extraction

`fetch` is an implicit process-global dependency. A narrow injected transport
port would make the external dependency explicit, allow a per-test mock adapter
without global mutation, and isolate a future HTTP/runtime implementation. That
would be valuable if parallel tests interfere through global stubs, if another
runtime needs a different HTTP adapter, or if another proven transport must
satisfy the same behavioral contract. The production adapter and an in-memory
test adapter could then be exercised without moving provider policy into callers.

If extracted, the port must sit below `sendChatCompletion`: request shaping,
credential policy, abort semantics, response interpretation, and normalized
results remain owned by the deep module. A generic provider abstraction or a
Fetch-shaped public interface would place the seam too high or expose too much
implementation.

## Strongest case against extraction

Today there is one production provider and one `fetch` call concentrated in one
module. The existing function is already the caller-facing seam and gives callers
substantial leverage. A transport interface now would most likely mirror
URL/headers/body/response details merely to replace a working test substitution.
The deletion test is unfavorable: deleting that adapter would restore one direct
`fetch` call, not scatter transport complexity across callers. It would also add
adapter construction/injection rules and a second interface for maintainers to
learn, while endpoint configurability is not evidence of behaviorally distinct
adapters.

## Evidence threshold

Treat the seam as real only when there are at least two justified adapters with
distinct behavior, not two names around the same `fetch` call. Sufficient evidence
would be one of:

- a production or runtime adapter with materially different I/O behavior;
- an isolated in-memory adapter required because global `fetch` substitution has
  caused reproducible concurrency, lifecycle, or test-locality failures; or
- another provider/transport proven to share the same small result contract while
  leaving request shaping and normalization coherent on one side of the seam.

This is falsifiable: if one of those needs appears and cannot be met through the
current `sendChatCompletion` interface without editing callers or sharing global
state, extract the port. Mere anticipation of another provider is insufficient.

## Recommendation

Do not introduce a transport adapter interface now. Keep
`sendChatCompletion` as the external interface and the direct `fetch` dependency
local to its implementation. Do not add speculative provider machinery,
compatibility aliases, or a public Fetch-shaped interface.

Preserve these invariants unchanged:

- the API key stays server-local, is omitted from prompts/logs/results, and is
  redacted from retained provider reasons;
- the supplied `AbortSignal` reaches the request and aborts normalize to the
  stable timeout category;
- HTTP, network, malformed-response, and retry-after handling continue through
  the existing error normalizer;
- `buildChatCompletionRequest` remains the owner of the exact non-streaming body,
  including optional structured-output/provider options.

## Minimum test changes

None. The smallest sufficient test surface already exists: route behavior through
the `sendChatCompletion` interface, client outcomes through that same interface
with a controlled external response, request-shaping assertions through the pure
builder, and focused normalization tests. Add an adapter contract suite only if
the evidence threshold is crossed; at that point, replace global-fetch-specific
setup rather than layering duplicate tests beneath and above the new seam.
