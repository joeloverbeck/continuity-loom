# Frozen paired-trial corpus

Frozen before semantic review of the target or creation of a candidate.

Each task is an offline simulation. The trial runner must load only the assigned skill snapshot, the named task, its input files, `rubric.md`, and the repository-level `AGENTS.md`. It must not inspect the live target, other trial outputs, decontamination analysis, or prior audit reports. It must not call GitHub or mutate the tracker; where publication is approved, it should describe or stage the exact next actions against the supplied tracker snapshot.

Historical inputs are exact issue metadata/body snapshots fetched from the Continuity Loom tracker on 2026-07-20. Family snapshots are exact child metadata from the same read. Scenario overlays are deliberately small counterfactual state changes used to exercise resume, durability, idempotency, and authorization boundaries.

## Tasks

1. `tasks/01-fresh-large-prd.md` — common fresh decomposition.
2. `tasks/02-cross-surface-dependencies.md` — materially different dependency graph.
3. `tasks/03-unready-parent.md` — high-risk refusal/needs-information branch.
4. `tasks/04-partial-resume.md` — partial-publication resume branch.
5. `tasks/05-pending-source.md` — unpublished source-artifact branch.
6. `tasks/06-idempotent-retry.md` — duplicate-safe retry branch.
7. `tasks/07-parent-transition-authorization.md` — parent-state authorization regression.

