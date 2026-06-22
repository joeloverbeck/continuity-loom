# SPEC029PRINOTUSA-005: Isolation + compiler-context firewall tests

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new/modified test surfaces in `packages/server/src/story-notes-isolation.test.ts` and `packages/core/test/compiler-context-firewall.test.ts`; no production behavior change
**Deps**: SPEC029PRINOTUSA-004

## Problem

SPEC-029 adds scene-prep notes, clips, FTS rows, and derived material — all of which §29.12
requires stay out of every prompt, validation, working-set, compiler, OpenRouter, and prompt-
inspection surface. The existing firewall proofs only know about flat scratch notes. This
ticket expands the canary suite so the new data classes are proven inert **before** the UI
makes them easy to create (firewall-first, per SPEC-029 Deliverable 7 and proposal §11.1 step 5).

## Assumption Reassessment (2026-06-22)

1. Verified the firewall proofs exist and are the surfaces under audit:
   `packages/server/src/story-notes-isolation.test.ts` (sentinel
   `NOTE_SENTINEL_DO_NOT_PROMPT_*` absent from prompts/logs/validation) and
   `packages/core/test/compiler-context-firewall.test.ts` (note canary never reaches a prompt;
   compiler modules do not import `story-notes`). The route/repository surfaces that create the
   new data classes land in SPEC029PRINOTUSA-001…-004.
2. Spec authority: `archive/specs/SPEC-029-private-notes-usability.md` Deliverable 7 + Verification
   ("every new canary … absent from every compiled prose/ideation/assistance prompt,
   validation/readiness diagnostic, compiler fingerprint input+output, prompt-inspection
   payload, OpenRouter request body, log, working set, record-reference graph, and
   accepted-segment store — only `/api/notes…` returns them").
3. Boundary under audit: the author-private firewall (FOUNDATIONS §6.6 / §29.12) is a
   cross-package invariant spanning `@loom/core` compilation and `@loom/server` request/validation
   surfaces; this ticket maps each new data class to a canary on every prompt path.
4. FOUNDATIONS restated (§29.12 + §8, test-armoring): this is a **test-only** ticket pinning an
   existing enforcement surface — the secret/author-private firewall and the deterministic
   compiler's no-`story-notes`-import boundary. The tests create scene-prep notes, whole/excerpt
   clips, FTS-indexed canaries, and edited/deleted clip states in a sandbox store and assert
   absence across every surface; they change **no** production behavior and add no new compiler
   input. If a canary appears anywhere but `/api/notes…`, the test fails closed.

## Architecture Check

1. Extending the two existing canary suites (rather than adding a third) keeps one firewall-proof
   locus per layer: core compiler-context vs. server request/validation. Each new data class
   (scene-prep title/body/tag, `mode`, whole-note/excerpt clip content, source-title snapshot,
   source timestamp, synthetic snippet/highlight/rank/source-status) gets its own sentinel so a
   leak names the exact class.
2. No backwards-compatibility shim introduced — test-only ticket; production firewall code is
   exercised, not modified.

## Verification Layers

1. Core compiler-context isolation -> `compiler-context-firewall.test.ts` (new sentinels absent
   from compiled prose/ideation/assistance prompts, validation/readiness diagnostics, compiler
   fingerprint input+output, prompt inspection; import-level check compiler modules do not import
   `story-notes`).
2. Server cross-surface isolation -> `story-notes-isolation.test.ts` (scratch+prep notes,
   whole+excerpt clips, FTS canaries, edited/deleted clip states absent from validation,
   readiness, prose compile/preview/generate, ideation, record-hygiene assistance, OpenRouter
   request capture, prompt inspection, logs, working set, record references, accepted segments;
   only `/api/notes…` returns them).

## What to Change

### 1. Core compiler-context canaries

- Add sentinels for scene-prep title/body/tag, `mode`, whole-note/excerpt clip content,
  source-title snapshot, source timestamp, and synthetic snippet/highlight/rank/source-status;
  assert each absent from every compiled prompt + fingerprint input/output + inspection payload;
  keep the import-level compiler↮`story-notes` check.

### 2. Server isolation canaries

- Create scratch+prep notes, whole+excerpt clips, FTS-indexed canaries, and edited/deleted clip
  states, then assert none appear in validation, readiness, prose compile/preview/generate,
  ideation, record-hygiene assistance, OpenRouter request capture, prompt inspection, logs,
  working set, record references, or accepted segments — only `/api/notes…` returns them.

## Files to Touch

- `packages/server/src/story-notes-isolation.test.ts` (modify)
- `packages/core/test/compiler-context-firewall.test.ts` (modify)

## Out of Scope

- Any production code change (the firewall is exercised, not altered).
- UI rendering / highlighting (SPEC029PRINOTUSA-006).
- End-to-end UI smoke + user-guide (SPEC029PRINOTUSA-007).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- compiler-context-firewall` — every new sentinel absent
   from all compiled prompts, fingerprint inputs+output, and inspection; compiler imports no
   `story-notes`.
2. `npm test --workspace @loom/server -- story-notes-isolation` — no scene-prep note, clip,
   FTS row, or derived value reaches any validation/readiness/prompt/OpenRouter/inspection/log/
   working-set/reference/accepted-segment surface; only `/api/notes…` returns them.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The firewall fails closed: any new canary surfacing outside `/api/notes…` fails the suite.
2. The suite adds no compiler input and no production behavior change.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-context-firewall.test.ts` — new author-private sentinels across every compiled-prompt path.
2. `packages/server/src/story-notes-isolation.test.ts` — prep/clip/FTS/edited/deleted canaries across every server surface.

### Commands

1. `npm test --workspace @loom/core -- compiler-context-firewall && npm test --workspace @loom/server -- story-notes-isolation`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-22

Changed:
- Expanded the core compiler-context firewall canary set with scene-prep-note and clip-shaped author-private inputs, including clip content, source-title snapshot, and source timestamp canaries.
- Expanded the server isolation capstone to create real scratch notes, scene-prep notes, whole-note clips, excerpt clips, FTS-searchable note content, edited source state, and deleted source state.
- Asserted all new canaries remain absent from validation, readiness, prose compile, ideation compile, generation, ideation, OpenRouter request capture, and logs, while remaining visible through `/api/notes…` surfaces.

Deviations:
- No production code changed, as intended.
- The existing server capstone covers prompt/validation/OpenRouter/log/record/working-set/accepted-segment surfaces already present in this repo; no separate prompt-inspection endpoint was introduced.

Verification:
- `npm test --workspace @loom/core -- compiler-context-firewall && npm test --workspace @loom/server -- story-notes-isolation` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 158 files / 1689 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk warning.
