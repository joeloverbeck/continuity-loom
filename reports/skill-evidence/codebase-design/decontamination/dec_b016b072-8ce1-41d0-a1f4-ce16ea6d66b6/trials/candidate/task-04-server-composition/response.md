# Comparative assessment

The two bootstraps should not receive the same treatment. The server already has two useful module interfaces and should keep an explicit composition root. The React `App` is intentionally small; extracting its one load-state effect now would create a shallower module.

## Server bootstrap

**Recommendation: keep `createServer` and `startServer`; do not add a route registry, server-builder hierarchy, or project-store port.**

`createServer(options)` hides substantial coherent behavior behind a small interface: Fastify construction, the complete redaction policy, health/version endpoints, ordered route registration, creation of the one owned `ProjectStoreManager`, and closing that store from Fastify's `onClose`. The linear registration list is valuable explicit composition, especially to humans and coding agents. Turning it into arrays of route descriptors or feature installers would move the same knowledge elsewhere and make the conditional comparison-only route less visible.

`startServer(port, options)` is a separate, earned seam. It is the only place allowed to bind; it hardcodes `127.0.0.1`, validates the returned TCP address, closes on invalid startup state, and returns one owned `close` operation. Logger redaction belongs in `createServer`, while network binding belongs in `startServer`; combining them would make in-process route tests more expensive.

Deletion tests:

- Delete `createServer`: Fastify security configuration, every route registration, store construction, and close ownership return to launch code and tests. The complexity does not disappear, so the module earns its keep.
- Delete `startServer`: loopback binding, address validation, startup cleanup, and the close contract spread to every launcher. It also earns its keep.
- Add then delete a proposed `registerAllRoutes` module: only the same ordered calls move back into `createServer`; no complexity disappears. That proposed module fails the deletion test.

The resulting stable test surfaces are `createServer().inject(...)` for HTTP contracts and registration, `app.close()` for owned cleanup, and `startServer(0)` for real loopback binding and close. Add focused integration coverage for the currently under-proved invariants: a route smoke matrix that detects omitted registrations, a logger-enabled request proving sensitive request fields are censored, and shutdown evidence that the project store is closed. These are interface tests; do not test the route-call list or logger option object directly.

No production extraction is justified. The small implementation sequence is test-only: add the three missing invariant tests, keep the composition list in place, and stop. If the list later needs multiple genuine runtime compositions, reconsider one registration module then; one production composition is not evidence for it now.

## React `App` bootstrap

**Recommendation: leave `App` as the bootstrap module and do not extract `useRuntimeStatus` yet.**

`App` has one clear job: own the `loading | ready | error` state, start `fetchRuntimeStatus`, suppress updates after unmount, install `BrowserRouter`, and pass the state to `AppShell`. That behavior is explicit in roughly one screen. `fetchRuntimeStatus` already hides the parallel health/version requests, while `AppShell` owns navigation and rendering. A new hook would add a name and interface without hiding enough implementation.

Deletion tests:

- Delete `App`: router installation and asynchronous runtime-state ownership move into the entrypoint or `AppShell`; they do not disappear. The existing bootstrap earns its keep.
- Add then delete a proposed `useRuntimeStatus`: one effect and one state union move directly back into `App`, with no duplicated caller knowledge removed. The proposed module fails the deletion test at current complexity.

The `App` test surface should be rendered behavior with a controlled `fetch`: initial loading, successful ready data, clear local-server error, and no state update after unmount. Navigation, project-required routing, reminder placement, and routed error containment belong at the existing `AppShell` interface. `fetchRuntimeStatus` can separately prove that health and version are both required. Moving the broad navigation assertions out of `App.test.tsx` would improve locality without changing production modules.

This preserves the important asymmetry: the server uses existing deep interfaces to hide policy-heavy construction and binding, while the web bootstrap stays transparent because its implementation is still simpler than another interface would be.
