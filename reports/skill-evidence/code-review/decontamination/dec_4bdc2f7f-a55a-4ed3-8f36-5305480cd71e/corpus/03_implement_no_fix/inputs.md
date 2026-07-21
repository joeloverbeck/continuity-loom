# Scenario facts

- Fixed-point input `HEAD~1` resolved to `5555555555555555555555555555555555555555`; reviewed HEAD is `6666666666666666666666666666666666666666`; committed diff only; no excluded dirt.
- Spec authority: issue #151. Standards authorities: `AGENTS.md`, `docs/ACTIVE-DOCS.md`, plus the smell baseline.
- Normal parallel review ran. Standards reviewer `standards-151` and Spec reviewer `spec-151` completed with zero findings. No recovery was needed.
- The host has no close primitive; both reviewer sessions reached terminal completion, and tool inspection confirmed no close capability surfaced.
- No browser/manual evidence was used. No stateful fixture, browser session, packet, revision, or artifact was used. No identities were superseded or retained as historical red evidence.
- Existing named verification gates on the unchanged final tree: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; all passed before review. No files changed after review.
- The durable sink is local file `review-body.md`.

