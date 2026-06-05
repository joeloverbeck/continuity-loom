# OpenRouter Integration — Continuity Loom v1

## Purpose

This spec defines OpenRouter integration as a transport layer only. OpenRouter gives access to external prose-writing models; it never becomes continuity authority, validation authority, or record authority.

## Scope

This spec covers global settings, API key handling, non-streaming chat completions, model list refresh/manual model entry, exposed parameters, request/response lifecycle, error handling, logging prohibitions, prompt secrecy boundaries, and Done Means.

It does not define production code, provider routing experiments, streaming UI, advanced OpenRouter options, or model recommendations.

## Non-goals

This spec does not make OpenRouter a continuity authority, does not expose advanced provider routing in v1, does not implement streaming, does not store prompts or responses as transport logs, and does not choose models based on story meaning.

## Global settings

OpenRouter settings are global in v1, not per-project. The project store must not contain API keys and should not need per-project model configuration.

V1 settings:

- model identifier / slug;
- temperature;
- maximum output tokens, mapped to OpenRouter’s supported token parameter for the request;
- optional `top_p` only if the UI can explain it simply and avoid clutter;
- optional app/site metadata headers if configured globally and non-secret.

Do not expose advanced provider routing, transforms, streaming-only debug options, guardrail routing, provider preferences, or experimental knobs in v1 unless a future spec justifies them.

## API key handling

The app reads the key from `OPENROUTER_API_KEY` or equivalent global local secret storage outside project folders.

The key must never appear in:

- project metadata;
- SQLite project stores;
- generated prompts;
- prompt preview;
- logs;
- accepted prose;
- candidate text;
- generated files;
- demo fixtures;
- screenshots or debug export.

Settings UI may show “API key configured” or “API key missing,” not the key value.

## Model list

V1 should support both:

- manual model identifier entry; and
- optional refresh from OpenRouter’s model list API.

The model list API returns model metadata including ID, name, context length, pricing, and supported parameters. The app may cache this list globally outside project folders. Cache failure must not prevent manual model entry.

## Non-streaming send

V1 uses OpenRouter’s non-streaming chat completion endpoint.

Request shape conceptually:

- endpoint: OpenRouter chat completions API;
- method: POST;
- authorization: bearer API key;
- model: global model setting;
- messages: one user message containing the compiled prompt, unless later provider-neutral role splitting is justified;
- temperature/max tokens/top_p according to global settings;
- stream: false or omitted for non-streaming behavior.

The app expects a response with at least one choice and a message content string. The returned content becomes the current session candidate, not an accepted segment.

## Request lifecycle

1. User fixes validation blockers.
2. App compiles and previews prompt.
3. User chooses Generate.
4. App verifies API key and model setting.
5. App sends non-streaming request.
6. App receives response or error.
7. On success, app displays editable candidate prose.
8. No project records or accepted segments are written until the user accepts.
9. On error, app shows a clear error and leaves project data unchanged.

A request in flight should be cancellable if practical, but cancellation support is not required to store any durable state.

## Error handling

OpenRouter errors must be normalized into user-facing categories:

- missing API key before request;
- invalid API key / authentication failure;
- insufficient credits;
- invalid request or unsupported parameter;
- provider/model unavailable;
- rate limit;
- timeout;
- moderation/guardrail refusal or provider policy response;
- malformed response;
- network failure;
- unknown error.

OpenRouter documents common HTTP statuses such as 400, 401, 402, 403, 408, 429, 502, and 503, with a JSON error shape and `Retry-After` for some retryable cases. The UI should translate these into actionable messages without dumping raw sensitive payloads.

## Response handling

The app should trim only transport artifacts, not rewrite prose. It should not ask another LLM to clean the response. If the response contains assistant commentary contrary to prompt instructions, the candidate editor can show it; the user decides whether to edit, discard, or regenerate.

Malformed responses must not create accepted segments or mutate records. They should produce an error and leave the current generation session safe.

## Logging prohibitions

Default logs must not include:

- API key;
- authorization headers;
- full prompt;
- full candidate text;
- accepted prose;
- full record payloads;
- OpenRouter raw request/response bodies.

Logs may include non-sensitive request metadata such as timestamp, model ID, status category, latency, and error category.

## Prompt secrecy boundaries

The prompt contains story records and may be sensitive. It is visible locally to the user and sent to OpenRouter only after explicit action. It is not stored permanently by default.

OpenRouter is a remote transport/provider-access layer. Sending a prompt is an intentional privacy boundary crossing. The UI should make this obvious without moralizing.

## User-facing behavior

Settings should make the minimum path simple:

- choose or type model;
- set temperature;
- set maximum output tokens;
- optionally set top_p;
- see whether API key is configured;
- refresh model list if desired.

Generation errors should appear in the candidate/generation area with practical next steps, such as configure key, change model, reduce prompt/settings, wait and retry, or inspect validation/prompt.

## Data/logic implications

OpenRouter code must depend on a compiled prompt string and global settings. It must not read story records directly. It must not mutate records. It must not write accepted segments. It returns candidate text to the active generation session only.

Model settings are global app settings. If cached model metadata is stored, it lives outside project folders and contains no API key.

## Alignment with `FOUNDATIONS.md`

This integration preserves OpenRouter as transport only, global v1 model settings, safe missing-key failure, no API keys in project data/prompts/logs/accepted prose, no model authority over continuity, and no record mutation from external model output.

## Security/privacy implications

The authorization header is sensitive. It must be redacted at source. Prompt payloads may contain sensitive fiction and private notes; they should not be retained in logs. The local server should prevent browser-origin abuse by binding to localhost and using minimal local endpoints.

If a key-like string is detected in prompt text or project data, that is a security bug/diagnostic.

## Validation implications

OpenRouter send is blocked when validation blockers exist. Missing API key blocks send but does not invalidate records or prompt preview. Provider policy errors do not mutate continuity; they are transport/model outcomes.

## Failure modes

OpenRouter failure modes include:

- sending with stale prompt after records changed;
- logging full prompts or keys;
- storing raw request/response bodies in project files;
- writing accepted segments before acceptance;
- treating provider refusal as validation success/failure of the story state;
- exposing advanced routing clutter that makes v1 settings unsafe or confusing;
- retrying automatically and creating multiple unsaved candidates without user clarity;
- corrupting project data on network failure.

## Done Means

OpenRouter integration is satisfied when:

- global settings support model, temperature, max output tokens, and optionally top_p;
- API key is read from global secret storage only;
- missing/invalid key fails clearly and safely;
- model list refresh works or manual entry remains available when refresh fails;
- non-streaming chat completion send produces an editable candidate on success;
- errors are normalized and do not mutate records or accepted segments;
- logs redact/exclude keys, prompts, candidates, accepted prose, and raw bodies;
- send is impossible when validation blockers exist;
- OpenRouter code cannot become a continuity source.

## Research sources

- OpenRouter authentication: https://openrouter.ai/docs/api/reference/authentication
- OpenRouter chat completions: https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request
- OpenRouter parameters: https://openrouter.ai/docs/api/reference/parameters
- OpenRouter models API: https://openrouter.ai/docs/api/api-reference/models/get-models
- OpenRouter errors: https://openrouter.ai/docs/api/reference/errors-and-debugging
- OpenRouter quickstart: https://openrouter.ai/docs/quickstart
