# Triage recommendation

Reject PR #205.

- **Eligibility:** Eligible for triage. `FIRST_TIME_CONTRIBUTOR` is one of this repository's external-PR author associations; collaborator exclusion does not apply.
- **Category:** `enhancement`. The PR proposes a new phone-testing capability rather than repairing broken promised behavior.
- **Recommended state:** `wontfix`.
- **Recommended labels:** exactly one category label, `enhancement`, and exactly one state label, `wontfix`.
- **Next owner:** the maintainer should record the rejection and close the PR. The contributor has no implementation follow-up on this diff. Any future LAN-testing mode would need a separate maintainer-sponsored security/design proposal and a deliberate change to the governing localhost-only boundary.

## Verification findings

- The supplied diff does what its title claims: it changes the Vite, API, and production launch bindings to `0.0.0.0`, which exposes the app beyond loopback.
- Current repository code deliberately binds all serving paths to `127.0.0.1`: the Vite dev script and config, `startServer`, and the production `launch` path. The desired LAN behavior is therefore not already implemented.
- The change directly contradicts `AGENTS.md`, which requires every dev, API, and production server path to bind only to `127.0.0.1` and forbids LAN exposure. It also widens access to a local-first application containing user-owned story data and a global OpenRouter secret surface.
- The PR adds no authentication, origin protection, threat analysis, or security-boundary tests. Existing server binding tests compare the bound address with the exported `LOOPBACK_HOST`; changing that constant could let those tests continue passing without proving the localhost-only invariant.
- No matching prior-rejection record was found under `.out-of-scope/`. This is a fresh rejected enhancement, not an already-implemented duplicate.
- The relevant host-binding files are clean in the local worktree; unrelated pre-existing changes should remain untouched.

This is not a `needs-info` case: more contributor detail cannot make the submitted design compatible with the current repository contract. If the recommendation is applied later, the triage workflow calls for an AI-disclaimed rejection comment, an `.out-of-scope/` entry for the rejected enhancement, the two labels above, and closure with exact tracker readback.

No GitHub query or mutation was performed. Because this was a snapshot-based analysis-only simulation, I did not check out the PR or run its branch; diff verification is limited to the supplied PR snapshot plus the current repository authorities and code paths.
