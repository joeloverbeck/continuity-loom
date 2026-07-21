# Comparative assessment

The two bootstraps look superficially similar because both compose dependencies, but they need different treatment.

The server bootstrap is already a deep module. Its small external interface—`createServer(options)` and `startServer(port, options)`—hides Fastify construction, the complete redaction policy, health/version contracts, route inventory, one owned `ProjectStoreManager`, close propagation, listening, and address validation. The long registration list is explicit composition, not accidental complexity. It lets a human or coding agent answer “what is mounted, in what order, under which gate, and who owns the store?” in one place.

The React `App` is intentionally shallow bootstrap code. It owns one three-state startup request, suppresses updates after unmount, installs `BrowserRouter`, and passes the explicit state to `AppShell`. Its implementation is close in size to the interface a custom hook would require. That is not a defect: a composition root need not be deep when there is little behavior to hide.

## Server recommendation: preserve the existing deep interface

Do not extract `registerAllRoutes`, a logger wrapper, a store-provider abstraction, or a `ServerRuntime` class now.

- `LOOPBACK_HOST` remains the sole host passed by `startServer`; no runtime option should make binding configurable. The real-socket test at port `0` is the stable proof that the server binds only `127.0.0.1`.
- Keep the redaction paths and request serializer adjacent to Fastify construction. They are security policy, and their explicit inventory is valuable. Tests that submit representative secrets and capture logger output should verify the policy through the `createServer({ logger: true })` interface.
- Keep route registration as an explicit ordered list. The one candidate-only registration remains visibly gated by the internal construction option. Moving this list to another file would improve neither leverage nor locality.
- Keep `createProjectStoreManager()` inside `createServer` and the `onClose` hook beside route registration. The Fastify instance owns exactly one store manager; `app.close()` is therefore the close interface for tests and production. Do not expose a second close path or let routes construct managers.
- Keep `startServer` small and separate: it is the only module that crosses the listen seam, verifies a TCP address, and closes the app on invalid binding. `StartedServer.close` delegates to the same Fastify close lifecycle.

The owned HTTP seam is real: production uses the loopback HTTP adapter and server tests use Fastify injection as an in-memory adapter. That does not justify exposing route internals or the project-store implementation through the external interface.

### Server deletion tests

- Delete `createServer`: logger/redaction policy, route composition, project-store ownership, and close propagation reappear in every launcher and test harness. The module is deep and earns its place.
- Delete `startServer`: loopback binding and invalid-address cleanup reappear at each process entry point. Its two-operation interface also earns its place.
- Delete a hypothetical `registerAllRoutes(app, manager)`: only the same registration list moves back into `createServer`; no complexity vanishes or multiplies. That proposed module would be shallow.
- Delete a hypothetical `ServerRuntime` wrapper: callers return to Fastify's existing `listen`/`close` behavior plus the current small `startServer` function. The wrapper would duplicate an interface rather than deepen it.

### Server test surfaces

- `createServer().inject(...)` for health/version and representative routes.
- `createServer({ logger: true })` with captured output for authorization, cookie, prompt, candidate, accepted prose, records, notes, title, and tag redaction.
- `app.close()` after project use for owned project-store closure; route code never receives a separate lifecycle control.
- `startServer(0)` for real loopback binding, address shape, and delegated close.

No server implementation sequence is justified now. If route registration later gains ordering dependencies, shared prefixes, or cross-cutting hooks, reassess a route module around that behavior—not around line count.

## React recommendation: keep `App` deliberately shallow

Do not extract `useRuntimeStatus` or a bootstrap state machine now. The load-state union is explicit, the effect has one request and one cancellation guard, and `AppShell` receives a stable rendering input. Keeping those facts together is easier to navigate than adding a hook interface and a second test layer.

The browser-to-server seam is already in `fetchRuntimeStatus`: it composes the owned `/api/health` and `/api/version` calls. `App` should not learn transport details, retry categories, or project-store state. `AppShell` should continue to render `loading`, `ready`, and `error`, including the clear local-server error, without owning the fetch.

### React deletion tests

- Delete `App`: the router plus roughly one effect and one state union move into `main.tsx` or `AppShell`. Some bootstrap complexity reappears, so `App` is a useful navigation point, but it is not deeply behavioral.
- Delete a hypothetical `useRuntimeStatus`: the current small effect moves back into `App` unchanged. The proposed hook is shallow today.
- If startup later adds retry, refresh, timeout, typed partial failure, or abortable requests, deletion of such a hook would scatter a genuine state machine back into the component. That is the threshold at which a deeper in-process module becomes justified.

### React test surfaces

- `App` with the `fetch` adapter stubbed: assert the initial/loading path, combined ready status, clear error state, and that a late resolution after unmount has no visible effect.
- `AppShell` as a pure rendering/navigation surface for each `loadState` variant.
- `fetchRuntimeStatus` at the transport interface for the two required endpoint results and rejection behavior.

No React implementation sequence is justified now. The current separation—transport in `api.ts`, startup state in `App`, rendering/navigation in `AppShell`, DOM mounting in `main.tsx`—already places each seam cleanly.

