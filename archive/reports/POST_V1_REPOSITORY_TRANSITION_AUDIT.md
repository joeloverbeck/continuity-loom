# Post-v1 Repository Transition Audit — Continuity Loom

I am not verifying that this commit is the current `main`. I am using the supplied commit as the target of record and fetching files only by exact commit URL from `joeloverbeck/continuity-loom`.

## Evidence ledger summary

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: a0a17a41919ab3fd44dd72ea2e033318abd5b393
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Code search used: no
Clone used: no
URL fetch method: web.run open exact raw URL; container.download exact raw URL for Markdown/text files after web.run open
Contamination observed: no
Connector/tool namespace trusted as evidence: no
```

The uploaded manifest was used only to decide which paths exist at the supplied commit. All repository content used for this audit was fetched by mechanically constructing exact raw URLs of this form:

```text
https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/<manifest path>
```

No fetched URL, source, or visible tool output pointed to `joeloverbeck/one-more-branch` or to any repository other than `joeloverbeck/continuity-loom`.

### Exact fetched file URLs

Required v1 requirements documents:

- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/DEMO-PROJECT-AND-STRESS-COVERAGE.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/LOCAL-FIRST-STORAGE.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/OPENROUTER-INTEGRATION.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/PRODUCT-SCOPE.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/PROMPT-COMPILER.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/README-SPEC-INDEX.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/RESEARCH-NOTES.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/TESTING-STRATEGY.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/UI-WORKFLOWS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/requirements-version-1/VALIDATION-ENGINE.md`

Active/root docs and process docs:

- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/README.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/AGENTS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/CLAUDE.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/FOUNDATIONS.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/archival-workflow.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/compiler-contract.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/demo-blocker-recipes.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/prompt-template-rationale.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/prompt-template.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/story-record-schema.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/stress-coverage-matrix.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/stress-suite.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/docs/user-guide.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/tickets/README.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/tickets/_TEMPLATE.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/tickets/CLEANUP-001.md`

Minimum code and metadata inspected:

- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/.nvmrc`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/package.json`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/package.json`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/server/package.json`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/web/package.json`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/src/version.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/server/src/version-schema.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/src/compiler/compile-prompt.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/src/validation/types.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/src/validation/rules/universal-blockers.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/core/test/accepted-prose-exclusion.test.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/server/src/generate-routes.secret-leakage.test.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/server/src/project-store.secret-boundary.test.ts`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/packages/server/src/project-store.ts`

Reports inspected for archive classification:

- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/reports/cast-member-record-field-guide.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/reports/continuity-first-prose-prompt-redesign-first-iteration.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/reports/red-bunny-prompt-example.md`

Archived SPEC-014 dependencies fetched only because the active cleanup ticket explicitly depended on them:

- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/archive/specs/SPEC-014-polish-regression-hardening-and-documentation.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/archive/tickets/SPEC014POLREGHAR-002.md`
- `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a0a17a41919ab3fd44dd72ea2e033318abd5b393/archive/tickets/SPEC014POLREGHAR-006.md`

## Executive judgment

The v1 implementation sequence is complete enough to transition the repo out of v1-planning mode. `docs/requirements-version-1/**` is now historical planning material, not active backlog or live implementation guidance. Archive it.

Do **not** archive the root canonical docs. `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/demo-blocker-recipes.md`, and `docs/user-guide.md` remain active.

The repo does need a small active-doc cleanup pass for future agents:

1. Add a single active map: `docs/ACTIVE-DOCS.md`.
2. Correct `docs/archival-workflow.md` so completed requirements folders have an archive destination.
3. Correct `AGENTS.md`, `CLAUDE.md`, and `README.md` so the new map is discoverable.
4. Correct `tickets/CLEANUP-001.md` because it still describes SPEC-014 as active even though SPEC-014 is archived at the target commit.

No new implementation/fix spec is warranted. The only real remaining implementation work I found is the existing cleanup ticket, and it is properly ticket-sized after correction.

## Documents and code inspected

### v1 requirements docs

All files under `docs/requirements-version-1/` were read. `IMPLEMENTATION-ORDER.md` marks all fourteen phases as implemented. The phase statuses and gate boxes establish that this folder has served its implementation-order purpose.

### Active/root docs

Inspected:

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/FOUNDATIONS.md`
- `docs/archival-workflow.md`
- `docs/compiler-contract.md`
- `docs/demo-blocker-recipes.md`
- `docs/prompt-template-rationale.md`
- `docs/prompt-template.md`
- `docs/story-record-schema.md`
- `docs/stress-coverage-matrix.md`
- `docs/stress-suite.md`
- `docs/user-guide.md`
- `tickets/README.md`
- `tickets/_TEMPLATE.md`
- `tickets/CLEANUP-001.md`

### Minimum implementation/metadata inspection

Inspected:

- `.nvmrc`
- `package.json`
- `packages/core/package.json`
- `packages/server/package.json`
- `packages/web/package.json`
- `packages/core/src/version.ts`
- `packages/server/src/version-schema.ts`
- `packages/core/src/compiler/compile-prompt.ts`
- `packages/core/src/validation/types.ts`
- `packages/core/src/validation/rules/universal-blockers.ts`
- `packages/core/test/accepted-prose-exclusion.test.ts`
- `packages/server/src/generate-routes.secret-leakage.test.ts`
- `packages/server/src/project-store.secret-boundary.test.ts`
- `packages/server/src/project-store.ts`

### Archived dependency inspection

I did not re-audit archived specs/tickets generally. I fetched three archived SPEC-014 files because `tickets/CLEANUP-001.md` explicitly depends on them and had stale path/status wording.

## Archive move manifest

Apply these moves manually. Do not edit archived historical implementation artifacts merely to normalize old upload filenames; once archived, those names are historical provenance, not active authority.

| Current path | Recommended destination | Pre-archive edit required? | Reason | Confidence | Can archive manually now? |
|---|---|---:|---|---:|---:|
| `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` | `archive/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` | No | Completed v1 planning spec; Phase 10-12 candidate/archive/reminder work is implemented. | High | Yes |
| `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` | `archive/requirements-version-1/DATA-MODEL-AND-RECORDS.md` | No | Completed v1 data-model planning; active schema authority is `docs/story-record-schema.md` plus code schemas. | High | Yes |
| `docs/requirements-version-1/DEMO-PROJECT-AND-STRESS-COVERAGE.md` | `archive/requirements-version-1/DEMO-PROJECT-AND-STRESS-COVERAGE.md` | No | Completed demo/stress planning; active support docs are `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, and `docs/demo-blocker-recipes.md`. | High | Yes |
| `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` | `archive/requirements-version-1/IMPLEMENTATION-ORDER.md` | No | All fourteen v1 phases are marked implemented; this is historical sequencing, not active backlog. | High | Yes |
| `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` | `archive/requirements-version-1/LOCAL-FIRST-STORAGE.md` | No | Completed v1 storage planning; active behavior is documented in `docs/user-guide.md`, `docs/FOUNDATIONS.md`, and code. | High | Yes |
| `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` | `archive/requirements-version-1/OPENROUTER-INTEGRATION.md` | No | Completed v1 transport planning; active user behavior is in `docs/user-guide.md` and implemented settings/generate routes. | High | Yes |
| `docs/requirements-version-1/PRODUCT-SCOPE.md` | `archive/requirements-version-1/PRODUCT-SCOPE.md` | No | Completed v1 scope planning; active constitution is `docs/FOUNDATIONS.md`. | High | Yes |
| `docs/requirements-version-1/PROMPT-COMPILER.md` | `archive/requirements-version-1/PROMPT-COMPILER.md` | No | Completed compiler planning; active compiler authority is `docs/compiler-contract.md` and `docs/prompt-template.md`. | High | Yes |
| `docs/requirements-version-1/README-SPEC-INDEX.md` | `archive/requirements-version-1/README-SPEC-INDEX.md` | No | Completed v1 requirements index; keeping it active would imply v1 planning is still live. | High | Yes |
| `docs/requirements-version-1/RESEARCH-NOTES.md` | `archive/requirements-version-1/RESEARCH-NOTES.md` | No | Research basis for v1 decisions; not active implementation guidance after v1 completion. | High | Yes |
| `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` | `archive/requirements-version-1/TECHNOLOGY-DECISIONS.md` | No | Completed v1 technology decision rationale; active runtime shape is in README/agent docs/package files. | High | Yes |
| `docs/requirements-version-1/TESTING-STRATEGY.md` | `archive/requirements-version-1/TESTING-STRATEGY.md` | No | Completed v1 testing plan; active test expectations are in agent docs, tickets, and CI scripts. | High | Yes |
| `docs/requirements-version-1/UI-WORKFLOWS.md` | `archive/requirements-version-1/UI-WORKFLOWS.md` | No | Completed v1 UI workflow planning; active user loop is in `docs/user-guide.md`. | High | Yes |
| `docs/requirements-version-1/VALIDATION-ENGINE.md` | `archive/requirements-version-1/VALIDATION-ENGINE.md` | No | Completed validation planning; active behavior is governed by `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, and validation code. | High | Yes |
| `reports/cast-member-record-field-guide.md` | `archive/reports/cast-member-record-field-guide.md` | No | Useful historical/support report, but not canonical; active source of truth is `docs/story-record-schema.md`. | Medium | Yes |
| `reports/continuity-first-prose-prompt-redesign-first-iteration.md` | `archive/reports/continuity-first-prose-prompt-redesign-first-iteration.md` | No | Completed prompt redesign report; active prompt authorities are `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, and `docs/compiler-contract.md`. | High | Yes |
| `reports/red-bunny-prompt-example.md` | `archive/reports/red-bunny-prompt-example.md` | No | Historical stress/example prompt; active stress coverage is `docs/stress-suite.md` and `docs/stress-coverage-matrix.md`. | High | Yes |

After moving the three report files, remove the empty `reports/` directory if it is empty.

## Active docs to keep

| Path | Keep active? | Reason |
|---|---:|---|
| `README.md` | Yes, corrected | Public/developer entry point; should link user guide and active-doc map. |
| `AGENTS.md` | Yes, corrected | Codex-style agent entry point; should point at `docs/ACTIVE-DOCS.md` and post-v1 authority rules. |
| `CLAUDE.md` | Yes, corrected | Claude Code entry point; same authority map and post-v1 rules. |
| `docs/ACTIVE-DOCS.md` | Yes, new | Agent-facing active-authority map; reduces future confusion more than scattering notes. |
| `docs/FOUNDATIONS.md` | Yes | Constitutional baseline; do not archive. |
| `docs/compiler-contract.md` | Yes | Active compiler/validation bridge. |
| `docs/prompt-template.md` | Yes | Active universal prompt template baseline. |
| `docs/prompt-template-rationale.md` | Yes | Active rationale companion for template choices. |
| `docs/story-record-schema.md` | Yes | Active schema/reference baseline. |
| `docs/stress-suite.md` | Yes | Active conceptual stress suite for future changes. |
| `docs/stress-coverage-matrix.md` | Yes | Active SPEC-013 coverage audit; keep as v1 support matrix unless superseded by a future coverage doc. |
| `docs/demo-blocker-recipes.md` | Yes | Active demo validation smoke recipes. |
| `docs/user-guide.md` | Yes | Active end-user guide for the implemented v1 loop. |
| `docs/archival-workflow.md` | Yes, corrected | Active archival policy; must learn completed requirements folders. |
| `tickets/README.md` | Yes | Active ticket authoring contract. |
| `tickets/_TEMPLATE.md` | Yes | Active ticket template. |
| `tickets/CLEANUP-001.md` | Yes, corrected | Single pending post-v1 cleanup ticket; do not archive until implemented. |

## Active docs to correct

| Path | Correction | Artifact produced |
|---|---|---:|
| `README.md` | Add a maintainer/agent documentation pointer to `docs/ACTIVE-DOCS.md` and `docs/FOUNDATIONS.md`; keep user-facing run/verify docs intact. | Yes |
| `AGENTS.md` | Add post-v1 active-doc map, archive rules, and clearer spec/ticket guidance. | Yes |
| `CLAUDE.md` | Same correction as `AGENTS.md`, adapted to Claude Code. | Yes |
| `docs/archival-workflow.md` | Add completed requirements folders to the archive policy and clarify when to edit versus preserve historical docs. | Yes |
| `tickets/CLEANUP-001.md` | Correct stale claim that SPEC-014 is active; point to archived SPEC-014 paths and remove brittle line-number claims. | Yes |

I did not correct `docs/story-record-schema.md`. It has one historical storage note referencing `SPEC004RECCRUBAS-002`, but the note still expresses the implemented storage/validation split and is not a path or authority bug. Correcting that would force a full large schema-file replacement for no practical agent-cleanliness gain.

## New active docs recommended or produced

Produced:

- `docs/ACTIVE-DOCS.md`

I do **not** recommend `CHANGELOG.md`, `docs/current-product-contract.md`, `docs/post-v1-maintenance.md`, or a separate `docs/AGENT-HANDOFF.md` right now. `docs/ACTIVE-DOCS.md` is enough and cleaner.

## Missed-v1 / fix-spec judgment

No new implementation/fix spec is needed.

The only remaining code issue I found is already captured by `tickets/CLEANUP-001.md`: remove the never-emitted `DIAGNOSTIC_CODES.acceptedProseContamination` registry entry while preserving the live `promptFacingProseContamination` behavior. That work is tiny, well-scoped, and ticket-sized; making a full spec for it would be bureaucracy.

### Why this is not a missed-v1 spec

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` marks Phases 1-14 implemented.
- `packages/core/test/accepted-prose-exclusion.test.ts` exists and covers the accepted-prose exclusion boundary.
- `packages/server/src/generate-routes.secret-leakage.test.ts` and `packages/server/src/project-store.secret-boundary.test.ts` cover key secret-leakage surfaces.
- `packages/core/src/compiler/compile-prompt.ts` compiles from a `ValidationSnapshot` through deterministic templates/placeholders; it does not pull accepted-segment archive state.
- `packages/core/src/validation/rules/universal-blockers.ts` contains fail-closed prompt-facing contamination checks via the live `promptFacingProseContamination` diagnostic.
- The package/app version mismatch is not currently a v1 correctness bug: root/workspace packages are private and remain `0.0.0`, while template/compiler/contract versions are `1.0.0` and stable in `packages/core/src/version.ts`. This is acceptable private pre-release metadata. If the project needs public release/version semantics later, create a focused release-metadata spec then.

## Recommended manual application order

1. Add `docs/ACTIVE-DOCS.md`.
2. Replace `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/archival-workflow.md`, and `tickets/CLEANUP-001.md` with the corrected files from this deliverable set.
3. Move the archive-manifest files exactly as listed above.
4. Remove the empty `reports/` directory if it becomes empty.
5. Leave `tickets/CLEANUP-001.md` active until a later implementation pass deletes the orphaned diagnostic code and passes its verification commands.

## Downloadable artifact list and intended repo destinations

| Artifact | Intended repo destination | Purpose |
|---|---|---|
| `POST_V1_REPOSITORY_TRANSITION_AUDIT.md` | outside repo or `archive/reports/POST_V1_REPOSITORY_TRANSITION_AUDIT.md` after use | Audit, archive manifest, and transition decisions. |
| `ACTIVE-DOCS.md` | `docs/ACTIVE-DOCS.md` | New active authority map for future coding agents. |
| `README.md` | `README.md` | Corrected README with active-doc pointer. |
| `AGENTS.md` | `AGENTS.md` | Corrected Codex-style agent instructions. |
| `CLAUDE.md` | `CLAUDE.md` | Corrected Claude Code instructions. |
| `archival-workflow.md` | `docs/archival-workflow.md` | Corrected archival policy. |
| `CLEANUP-001.md` | `tickets/CLEANUP-001.md` | Corrected active cleanup ticket. |

## Unresolved uncertainties

- I did not verify whether the target commit is latest `main`.
- I did not run CI, clone the repo, or inspect repository metadata. The user supplied CI status as already green.
- I did not perform a full repository audit. Code inspection was limited to files needed for the post-v1 transition questions.
- I did not edit or re-audit archived implementation artifacts except the three archived SPEC-014 files explicitly depended on by the live cleanup ticket.
