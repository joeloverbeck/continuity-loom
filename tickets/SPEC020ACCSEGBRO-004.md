# SPEC020ACCSEGBRO-004: Verification gate, user-guide refresh, and spec archival

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — `docs/user-guide.md` (accepted-segments workflow content) and the spec archival move; no production behavior change
**Deps**: `archive/tickets/SPEC020ACCSEGBRO-001.md`, `archive/tickets/SPEC020ACCSEGBRO-002.md`, `archive/tickets/SPEC020ACCSEGBRO-003.md`

## Problem

Once the disclosure redesign (001), land-on-latest + deep links (002), and the bulk/navigation controls (003) have landed, the feature needs a single trailing gate: run SPEC-020's §Verification end-to-end (green build + manual UI smoke + confirmation that the SPEC-011 regressions still hold), refresh the user-facing workflow doc, and archive the completed spec. This is the merged capstone + cross-cutting-docs ticket — it introduces no new production logic; it exercises the pipeline the prior tickets composed and lands the completion bookkeeping. SPEC-020 Deliverable D6 (§Verification) + D7.

## Assumption Reassessment (2026-06-10)

1. Current code checked: the implementation surfaces under test are owned by the prior tickets in this batch (`packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` + `.test.tsx`, `packages/web/src/styles.css`). The retained SPEC-011 regressions already live in `AcceptedSegmentsView.test.tsx`: export-all-under-filter (lines 129-180) and no-prompt-context / no-durable-change-banner (lines 182-195). The project's test infra is Vitest + jsdom (`packages/web/package.json:11`, root `npm test` builds `@loom/core` then `vitest run`); there is no browser-automation harness in the repo, so the SPEC-020 manual smoke is an implementer runbook, not an automated test.
2. Current specs/docs checked: `specs/SPEC-020-...md` §Verification and Deliverable D7; `docs/user-guide.md` §"Accepted Segments" (lines 87-91) currently describes read/filter/delete/export and the absence of an "include in prompt" action; `docs/archival-workflow.md` is the canonical archival process; `docs/ACTIVE-DOCS.md` treats the `specs/` directory itself as the spec authority (no static active-spec list to edit).
3. Shared boundary under audit: this ticket does not modify the implementation files — it exercises them. The contract under audit is SPEC-020 §Verification (every bullet must map to a CI assertion or a runbook step) and the doc/archival boundary (`docs/user-guide.md` content + spec move into `archive/specs/`).
4. FOUNDATIONS principle restated: §10 / §29.4 — accepted prose must never become prompt context; the capstone re-confirms the retained no-prompt-context regression so the redesign did not introduce an "include in prompt" affordance. §21 — the refreshed user guide must describe seeing segments individually and in order (now via landing-on-latest + disclosure), not imply any segment is hidden.
5. Rename/removal blast radius (archival move): moving `specs/SPEC-020-...md` to `archive/specs/` is a doc-governed-artifact relocation. Grep confirms no active doc carries a static path reference to the active spec (`docs/ACTIVE-DOCS.md` uses directory authority); the sibling tickets reference the spec by ID/deliverable, not by an active-path import, so the move breaks no active reference. Verify repo-wide before the move and after.
6. Mismatch + correction: none — all referenced paths and regression-test line ranges resolved against the current tree during this decomposition.

## Architecture Check

1. Merging the capstone and the cross-cutting-docs ticket is correct here because SPEC-020's §Verification is a manual UI smoke (no automation harness) and the docs/archival bookkeeping is gated on that smoke passing; both depend on the same upstream leaf (003, whose transitive `Deps` reach 001 and 002), so splitting them would add a needless inter-ticket dependency. The capstone owns no production logic and does not list the upstream tickets' implementation files — it exercises them.
2. No backwards-compatibility shims: the doc refresh replaces the stale workflow description rather than layering a parallel one; the spec is archived (not duplicated) per the canonical workflow.

## Verification Layers

1. Full green gate (SPEC-020 §Verification) -> command: `npm run lint && npm run typecheck && npm test && npm run build` all pass.
2. Retained SPEC-011 regressions hold (§10 / §29.4) -> existing component tests: export-all emits every segment in `sequence ASC` under an active filter and with all segments collapsed; no "use as prompt context" / "include in prompt" control exists; empty state renders; no persistent durable-change banner.
3. End-to-end UX (SPEC-020 §Verification manual smoke) -> manual runbook: dev server + a project with ≥3 accepted segments, click-path with expected observable results per step.
4. User guide reflects the new workflow -> grep-proof: `docs/user-guide.md` §"Accepted Segments" names landing on latest, expanding older segments, expand-all for full reading, and the jump controls.
5. Spec archived -> `test -f archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` and `test ! -f specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md`.

## What to Change

### 1. CI-runnable verification

Confirm the four-command gate is green and the targeted suite `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` passes, including the retained SPEC-011 regression cases (export-under-filter/collapse, no-prompt-context, empty state, no durable-change banner) and the new disclosure / landing / navigation cases from 001-003.

### 2. Manual UI smoke runbook

Document and run (by hand) the SPEC-020 §Verification smoke against the dev server and a project with ≥3 accepted segments:
- open `/accepted-segments` → the view lands on the latest segment, expanded and focused, without scrolling through the archive;
- older segments show as summary rows; expanding one shows full prose + metadata + delete;
- "Expand all" then Ctrl+F finds prose in an older segment;
- "Back to top" and "Jump to latest" move both viewport and focus;
- visiting `/accepted-segments#segment-<sequence>` of an older segment lands there expanded;
- filtering shows matched segments expanded with stable "Segment N" numbering;
- export with a filter active and everything collapsed still downloads the full archive;
- delete still requires expansion plus the two-step confirmation.

### 3. User-guide refresh (D7)

Update `docs/user-guide.md` §"Accepted Segments" to describe the new local loop: the view lands on the latest segment; older segments are collapsed summary rows expandable in one interaction; "Expand all" restores whole-story reading and in-page find; "Jump to latest" / "Back to top" aid navigation. Preserve the existing "readable output, not canon" framing and the "no include-in-prompt action" statement.

### 4. Spec archival (D7)

After Verification passes, archive the spec per `docs/archival-workflow.md`: `git mv specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md archive/specs/` and correct any active-doc reference if one is found by the pre-move grep (none expected — `docs/ACTIVE-DOCS.md` uses directory authority).

## Files to Touch

- `docs/user-guide.md` (modify)
- `specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` → `archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` (move, per `docs/archival-workflow.md`)

## Out of Scope

- All implementation of the disclosure unit, landing/deep-links, and navigation controls — `archive/tickets/SPEC020ACCSEGBRO-001.md` / `archive/tickets/SPEC020ACCSEGBRO-002.md` / `archive/tickets/SPEC020ACCSEGBRO-003.md` (this ticket exercises them, it does not modify them).
- Any `@loom/core` / `@loom/server` / schema / storage change.
- Editing `docs/ACTIVE-DOCS.md` — it carries no static active-spec list (directory is the authority).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint && npm run typecheck && npm test && npm run build` all green.
2. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` passes, including the retained export-under-filter/collapse and no-prompt-context regression cases.
3. (Runbook, implementer-checked) Every SPEC-020 §Verification manual-smoke step observes its expected result.

### Invariants

1. No production behavior is changed by this ticket; it is verification + docs + archival only.
2. The accepted archive remains read-only with no prompt-context affordance after the redesign (the no-prompt-context regression test stays green) (§10 / §29.4).

## Test Plan

### New/Modified Tests

1. None — verification + documentation + archival ticket; the disclosure / landing / navigation behavior is covered by the tests added in `archive/tickets/SPEC020ACCSEGBRO-001.md` / `archive/tickets/SPEC020ACCSEGBRO-002.md` / `archive/tickets/SPEC020ACCSEGBRO-003.md`, and the retained SPEC-011 regressions already exist in `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`. Verification here is command-based plus a manual UI-smoke runbook.

### Commands

1. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. `test -f archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md && test ! -f specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` (archival boundary; run after the `git mv`)
