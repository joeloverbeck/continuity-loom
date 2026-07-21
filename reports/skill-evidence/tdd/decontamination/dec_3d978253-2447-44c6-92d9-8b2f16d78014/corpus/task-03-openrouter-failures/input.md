# Historical bug: Preserve sanitized OpenRouter failure detail (#131)

Useful provider failure information is lost during server normalization and again in browser consumers. Implement one shared, sanitized failure contract through server, API client, and five browser consumers.

Constraints and acceptance criteria:

- Preserve stable category and generic safe message; optionally retain HTTP status, retry timing, and a supported provider reason.
- Sanitize reasons to one line and at most 240 characters; redact authorization headers, bearer tokens, and OpenRouter-style keys.
- Discard JSON-like request/payload dumps and strings with prompt, record, candidate, or accepted-prose markers.
- Never serialize arbitrary response objects or put sensitive material in logs/UI.
- All consumers use one shared presentation function with category-appropriate manual recovery.
- No automatic retry, provider fallback, new send action, or success-path behavior change.
- Tests must include adversarial fixtures and prove typed safe details survive the route and UI boundaries.
