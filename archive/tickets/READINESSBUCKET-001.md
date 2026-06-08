# READINESSBUCKET-001: Route readiness blockers into "Required before prompt generation" and retire the dead "Technical diagnostics" bucket

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` readiness grouping (`packages/core/src/validation/readiness.ts`) and `@loom/web` readiness checklist (`packages/web/src/readiness/ReadinessChecklist.tsx`)
**Deps**: None

## Problem

On the Generation Brief readiness panel, blockers do not appear under **"Required before prompt generation."** They are dumped into a collapsed **"Technical diagnostics"** disclosure, while the summary still counts them by severity. The author sees the self-contradicting state:

> Blockers: 2. Warnings: 3.
> Required before prompt generation (0) — No required readiness items.

with the two real blockers (`missing-current-authoritative-state`, `prompt-facing-prose-contamination`) hidden inside "Technical diagnostics (2)", framed by raw `LEGACY CODE` / `RULE ID` / `RAW PATHS` rather than as author-actionable required items.

Root cause: `fallbackCopy()` assigns every blocker that lacks an explicit `COPY_TABLE` entry to the `technical-diagnostics` group. Only 3 blocker codes have `COPY_TABLE` entries; ~40 others fall through to the fallback and disappear from the required bucket. This breaks the FOUNDATIONS §27 promise that author-facing diagnostics are a readiness checklist (raw codes belong in per-card details, not as the primary surface) and trips the §29.5 hard-fail "treats validation warnings and blockers as the same thing" at the UI surface.

## Assumption Reassessment (2026-06-08)

1. **Fallback misroute, confirmed.** `packages/core/src/validation/readiness.ts:433` — `fallbackCopy()` returns `group: diagnostic.severity === "warning" ? "recommended-for-stronger-output" : "technical-diagnostics"`. Every blocker without a `COPY_TABLE` entry lands in `technical-diagnostics`. `COPY_TABLE` (`readiness.ts:92-192`) maps exactly three blocker codes to `required-before-prompt-generation` (`missingManualDirective:96`, `missingImmediateHandoff:105`, `localProseScopeViolation:112`); all other blocker codes use the fallback.
2. **`technical-diagnostics` has no other producer.** Repo-wide grep for `technical-diagnostics` returns only: the type-union member `readiness.ts:9`, the fallback assignment `readiness.ts:433`, the `groupSortIndex` switch case `readiness.ts:467`, the UI group definition `ReadinessChecklist.tsx:43`, the `<details>` special-casing `ReadinessChecklist.tsx:78`, the `technicalGroup` prop wiring `ReadinessChecklist.tsx:114`, and one synthetic test fixture `ReadinessChecklist.test.tsx:168`. No `COPY_TABLE` entry uses it. Therefore once the blocker fallback stops emitting it, the group is unreachable and should be removed, not left rendering an always-empty "Technical diagnostics (0)" collapsible.
3. **Cross-artifact boundary under audit:** the `ReadinessDiagnosticGroup` union exported from `@loom/core` (`readiness.ts:5-9`) and consumed by `@loom/web` `ReadinessChecklist.tsx`. Removing a union member is a breaking type change across this boundary; the web `groups` array, the `<details>` branch, and the `technicalGroup`-driven `TechnicalDetails open` behavior all key off that member and must be updated in the same change.
4. **FOUNDATIONS principle under audit (fail-closed legibility):** §11 "Readiness diagnostics must be author-actionable. Raw technical codes may appear in details, logs, or developer-facing audit output, but they must not be the primary author-facing message." §27 "Author-facing generation diagnostics should be presented as a readiness checklist, not as raw validation codes. The same readiness model must drive Generation Brief, Prompt Preview, and Generate." §29.5 hard-fail: a proposal must not "treat validation warnings and blockers as the same thing." A blocker rendered only inside a collapsed, code-framed "Technical diagnostics" disclosure violates all three at the UI surface.
5. **Enforcement surface confirmation (no firewall/determinism impact):** this ticket changes only the *presentational grouping* of already-computed diagnostics. It does not alter which diagnostics are blockers vs warnings, does not touch the secret firewall (§15), and does not affect deterministic compilation (§8). `deriveReadiness()` still derives blockers/warnings by severity exactly as before; only the `group` label on the fallback path changes.
6. **Per-card raw-code path preserved.** Each diagnostic card already renders its own `TechnicalDetails` disclosure (`ReadinessChecklist.tsx:203-242`: Legacy code, Rule ID, Severity, Raw paths, Raw record IDs, Copy technical JSON). Removing the *group* loses no technical information; the only behavioral change is that the per-card "Technical details" disclosure defaults to closed (it was force-opened only for cards in the technical-diagnostics group).
7. **Adjacent finding classification.** The summary headline (`readiness.ts:405`, counts `blockerCount + providerBlockerCount`) and the muted line (`ReadinessChecklist.tsx:58`) are already correct — they count blockers by severity. They were never wrong; they only *looked* wrong next to the empty required bucket. They are out of scope and need no change.

## Architecture Check

1. Defaulting blockers to `required-before-prompt-generation` encodes the actual invariant — a blocker is, by FOUNDATIONS §11 definition, something required before prompt generation — instead of relying on a hand-maintained `COPY_TABLE` that must enumerate every blocker code to avoid leaking it into a developer bucket. The alternative (add ~40 `COPY_TABLE` entries) is strictly more code, must be re-extended for every new blocker code, and still leaves the dead `technical-diagnostics` bucket in place; it is the inferior path. Curated author copy for individual codes can still be added incrementally via `COPY_TABLE` later, but is not required for correctness because `fallbackCopy()` already derives a readable title, summary, why-it-matters, and fastest-fix from the diagnostic.
2. No backwards-compatibility aliasing or shims. The `technical-diagnostics` union member is removed outright (no deprecated alias retained), consistent with the repo rule against duplicate/legacy paths.

## Verification Layers

1. Unmapped blocker codes group as `required-before-prompt-generation` -> schema validation (core unit test on `deriveReadiness()` / `fallbackCopy()` with a synthetic blocker diagnostic whose code is absent from `COPY_TABLE`).
2. `ReadinessDiagnosticGroup` no longer contains `technical-diagnostics` and the union is exhaustively handled -> codebase grep-proof (`technical-diagnostics` absent from `packages/**/src`) + `npm run typecheck` (exhaustive `groupSortIndex` switch compiles with no missing/extra case).
3. The Generation Brief readiness panel shows blockers under "Required before prompt generation" and no "Technical diagnostics" group renders -> manual review (browser: open a project with ≥1 blocker; confirm the required bucket count matches `Blockers: N` and no Technical-diagnostics section exists).
4. Blocker/warning *classification* is unchanged (only grouping changed) -> FOUNDATIONS alignment check (§11/§29.5: counts and severities identical before/after; only `group` on the fallback path differs).

## What to Change

### 1. Core: blockers default to the required bucket (`packages/core/src/validation/readiness.ts`)

- In `fallbackCopy()` (line ~423-438), change the `group` expression so a `blocker` severity maps to `required-before-prompt-generation` (warnings keep `recommended-for-stronger-output`):
  ```ts
  group: diagnostic.severity === "warning" ? "recommended-for-stronger-output" : "required-before-prompt-generation",
  ```
- Remove `"technical-diagnostics"` from the `ReadinessDiagnosticGroup` union (line ~5-9) and remove its `case` from `groupSortIndex()` (line ~467). Confirm the switch remains exhaustive over the three surviving members.

### 2. Web: retire the dead group (`packages/web/src/readiness/ReadinessChecklist.tsx`)

- Remove the `technical-diagnostics` entry from the `groups` array (line ~42-46).
- Remove the `group.id === "technical-diagnostics"` `<details>`/`<summary>` branch (line ~78-82); render every remaining group as the plain `<section>` form.
- Drop the `technicalGroup` plumbing: `DiagnosticGroup` no longer needs to compute/pass it (line ~114), and `DiagnosticCard`'s `technicalGroup` prop and the `TechnicalDetails open={technicalGroup}` force-open (line ~121-160, 203-213) become `open={false}` / are removed, so per-card technical details default to closed.

### 3. Tests

- Update `packages/web/src/readiness/ReadinessChecklist.test.tsx` (the `group: "technical-diagnostics"` fixture at line ~168) to a surviving group, and add/adjust an assertion that a blocker renders under "Required before prompt generation."
- Add a core unit test (see Test Plan) proving fallback blockers group as required.

## Files to Touch

- `packages/core/src/validation/readiness.ts` (modify)
- `packages/web/src/readiness/ReadinessChecklist.tsx` (modify)
- `packages/web/src/readiness/ReadinessChecklist.test.tsx` (modify)
- `packages/core/src/validation/readiness.test.ts` or nearest existing readiness test file (modify — add fallback-grouping test)

## Out of Scope

- Authoring curated `COPY_TABLE` copy for the ~40 currently-fallback blocker codes (separate polish; fallback copy is already author-actionable).
- Changing which diagnostics are blockers vs warnings, or any validation-rule logic.
- The `fastestFix` wording for fallback diagnostics (e.g. "Use suggested action: add-current-state") — a separate copy-quality concern.
- The summary headline and muted blocker/warning counters (already correct).

## Acceptance Criteria

### Tests That Must Pass

1. New core test: a blocker `Diagnostic` whose `code` is not in `COPY_TABLE`, run through `deriveReadiness()`, produces a `ReadinessDiagnostic` with `group === "required-before-prompt-generation"`.
2. `packages/web/src/readiness/ReadinessChecklist.test.tsx` asserts a blocker appears under the "Required before prompt generation" group and that no element with text starting "Technical diagnostics (" is rendered.
3. `npm run typecheck` passes (exhaustive `groupSortIndex` switch over the reduced union; no dangling `technical-diagnostics` references).
4. `npm run lint && npm test` pass.

### Invariants

1. Every readiness diagnostic with `severity === "blocker"` is grouped `required-before-prompt-generation`; no blocker is ever grouped into a developer/technical bucket.
2. The author-facing summary count of blockers equals the number of cards rendered under "Required before prompt generation" (provider blockers included per existing summary math).
3. No `ReadinessDiagnosticGroup` value named `technical-diagnostics` exists anywhere in `packages/**/src`.

## Test Plan

### New/Modified Tests

1. `packages/core/src/validation/readiness.test.ts` (or the existing readiness spec) — assert fallback blockers group as `required-before-prompt-generation`; rationale: pins the root-cause line against regression.
2. `packages/web/src/readiness/ReadinessChecklist.test.tsx` — assert blocker under the required group and absence of the technical-diagnostics section; rationale: proves the UI contradiction is gone.

### Commands

1. `npm test --workspace @loom/core -- readiness` (targeted core grouping proof) — if the workspace test filter differs, run the core test file directly via the repo's Vitest invocation.
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate per CLAUDE.md).
3. Narrower command rationale: the core grouping unit test is the tightest boundary that proves the fix, because the bug is a pure data-mapping defect in `deriveReadiness()`/`fallbackCopy()`; the web test then proves the rendered surface consumes the corrected grouping.

## Outcome

Completed: 2026-06-08

What changed:

- `fallbackCopy()` now routes unmapped blocker diagnostics to `required-before-prompt-generation`; unmapped warnings continue to route to `recommended-for-stronger-output`.
- The `technical-diagnostics` readiness group was removed from the exported core union, group sort logic, and web checklist rendering.
- `ReadinessChecklist` now renders only the three active author-facing groups and keeps per-card technical details available but closed by default.
- Core and web tests now pin fallback blocker grouping, fallback warning grouping, required-bucket rendering, and absence of the retired technical diagnostics bucket.

Deviations from original plan:

- None. Diagnostic severity, validation-rule logic, provider gating, deterministic compilation, and secret-firewall behavior were not changed.

Verification results:

- `npm test --workspace @loom/core -- readiness` — passed.
- `npm test --workspace @loom/web -- ReadinessChecklist` — passed.
- `rg -n "technical-diagnostics" packages` — no matches.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed.
