# SPEC007DETPROCOM-008: Phase-7 capstone — manual smoke, governing-doc updates, §4 contract reconciliation, archival

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes (docs only) — reconciles `docs/compiler-contract.md` §4 wording, flips the Phase-7 status in `IMPLEMENTATION-ORDER.md`, adds a Phase-7 note to `PROMPT-COMPILER.md`, and archives the spec. No production code.
**Deps**: SPEC007DETPROCOM-007

## Problem

With the compiler (002–006) and the `/api/compile` route (007) landed, Phase 7 needs its
completion bookkeeping: reconcile the known template↔contract drift the spec flagged
(`compiler-contract.md` §4 rows for `<invention_permissions>` / `<contradiction_prohibitions>`
/ `<prose_craft>`), record Phase-7 completion in the sequencing and compiler docs, archive
the spec, and run the end-to-end manual smoke from the spec's §Verification (no browser/CLI
automation harness exists for it). This ticket introduces no production logic — it exercises
and documents what the earlier tickets built.

## Assumption Reassessment (2026-06-05)

1. `docs/compiler-contract.md` §4 rows 150–152 describe `<invention_permissions>`
   ("Template constant + configured durable-change permissions"),
   `<contradiction_prohibitions>` ("+ selected current locks"), and `<prose_craft>`
   ("+ story/prose preferences + cast voice fields") as having dynamic sources, yet the
   literal `docs/prompt-template.md` renders all three as placeholder-free constant prose
   (verified during reassessment; their dynamic content already renders elsewhere — e.g.
   selected current locks via `{current_locks}` under `<current_authoritative_state>`).
   002 renders these as constants accordingly; this ticket reconciles the §4 **wording**
   only.
2. `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 7 (lines 120–134) carries a
   gate bullet list and no status line; `docs/requirements-version-1/PROMPT-COMPILER.md`
   has no Phase-7 implementation note. `docs/archival-workflow.md` is the canonical
   archival process; `archive/specs/` already holds SPEC-001…006.
3. **Cross-artifact boundary under audit**: this is the trailing docs/bookkeeping boundary
   — the docs annotate *aggregate completion* of surfaces that 002–007 built and that 007's
   capstone-head `Deps` transitively gate, so `Deps: 007` is sufficient (no per-symbol
   staleness; the §4 reconciliation is a wording fix, not a new symbol reference).
4. **FOUNDATIONS principle restated**: §8 anti-drift / `compiler-contract.md` §10 change
   control — "Drift between template, schema, rationale, example, and compiler contract is
   a continuity bug"; any change to a placeholder/section/requiredness/empty-state must
   update the contract in the same change. The §4 reconciliation closes the one known drift
   instance so the contract matches the rendered behavior (constants).
5. **Deterministic-compilation surface confirmed unchanged**: the §4 wording reconciliation
   changes **no** compiler behavior — 002 already renders the three sections as constants;
   this ticket only aligns the doc so a future reader does not re-introduce a phantom second
   render site. It weakens no secret firewall and breaks no determinism (docs-only). The
   manual smoke re-confirms the running endpoint's behavior; the CI gate (`npm test`)
   already covers the automated assertions via 002–007.

## Architecture Check

1. Merging the manual smoke with the docs/bookkeeping is cleaner than separate tickets:
   both depend on the same upstream head (007), the docs/status flip is gated on the smoke
   passing, and there is no CI-runnable verification here distinct from 002–007's own tests.
2. No backwards-compatibility aliasing/shims: docs edits and an archival move only.

## Verification Layers

1. §4 drift closed → codebase grep-proof: the reconciled `compiler-contract.md` §4 rows no
   longer imply a second render site for the three constant sections (manual review of the
   diff + grep that the rows were edited).
2. Phase-7 completion recorded → codebase grep-proof: `IMPLEMENTATION-ORDER.md` Phase 7
   carries `Status: ✅ Implemented via SPEC-007 (2026-06-05).`; `PROMPT-COMPILER.md` carries
   a Phase-7 implementation note.
3. Spec archived → `test -f archive/specs/SPEC-007-deterministic-prompt-compiler.md` and
   `test ! -f specs/SPEC-007-deterministic-prompt-compiler.md`.
4. End-to-end behavior (§Verification manual smoke) → manual runbook (below): real
   `/api/compile` against a real project; observed prompt completeness, fingerprint
   stability, blocked-refusal, and no-key-in-logs.

## What to Change

### 1. §4 contract reconciliation (`docs/compiler-contract.md`)

Reword the §4 rows for `<invention_permissions>`, `<contradiction_prohibitions>`, and
`<prose_craft>` so the "Deterministic source" column reflects that these render as template
constants (their dynamic content renders in its own placeholder elsewhere), removing the
implication of a second render site. Bump the contract version per §10 if the wording change
is material.

### 2. Governing-doc completion notes

- `IMPLEMENTATION-ORDER.md` Phase 7: add `Status: ✅ Implemented via SPEC-007 (2026-06-05).`
  and confirm each Phase-7 gate bullet is satisfied. Do not alter ordering rationale or
  later phases.
- `PROMPT-COMPILER.md`: add a short "Phase 7 implementation note" recording that the
  deterministic renderer, the §4 placeholder mapping, the version triple, and `/api/compile`
  are realized via SPEC-007, leaving prompt preview (Phase 8) and OpenRouter transport
  (Phase 9) open.

### 3. Manual smoke runbook (implementer checklist)

1. `npm start`; open a project; fill a blocker-free brief + working set.
2. `POST /api/compile` → confirm a complete, ordered, accepted-prose-free prompt with a
   stable fingerprint across two calls.
3. Introduce a blocker (e.g. remove the manual directive) → confirm the endpoint refuses
   with a structured blocked response and **no** prompt.
4. Inspect server logs → confirm no prompt/brief/directive/key text.

### 4. Archive the spec

Move `specs/SPEC-007-deterministic-prompt-compiler.md` →
`archive/specs/SPEC-007-deterministic-prompt-compiler.md` per `docs/archival-workflow.md`.

## Files to Touch

- `docs/compiler-contract.md` (modify)
- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/PROMPT-COMPILER.md` (modify)
- `archive/specs/SPEC-007-deterministic-prompt-compiler.md` (new — archival destination;
  source `specs/SPEC-007-deterministic-prompt-compiler.md` removed per archival-workflow)

## Out of Scope

- Any production code (compiler, route) — owned by 002–007; this ticket only documents and
  exercises them.
- The web preview UI (Phase 8), OpenRouter transport (Phase 9).
- Adding new placeholders or template text — the reconciliation only aligns existing §4
  wording with the rendered constants.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "Status: ✅ Implemented via SPEC-007" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
   returns the Phase-7 status line.
2. `grep -niF "Phase 7 implementation note" docs/requirements-version-1/PROMPT-COMPILER.md`
   returns the note.
3. `test -f archive/specs/SPEC-007-deterministic-prompt-compiler.md && test ! -f specs/SPEC-007-deterministic-prompt-compiler.md`.
4. `npm run typecheck && npm test && npm run lint && npm run build` — green (002–007 coverage
   unchanged by docs edits).
5. Manual smoke runbook steps 1–4 observed and recorded by the implementer.

### Invariants

1. The compiler contract, template, and rendered behavior agree — no remaining §4 drift for
   the three constant sections (§8 anti-drift).
2. The docs edits change no runtime behavior; the full pipeline stays green.

## Test Plan

### New/Modified Tests

1. `None — capstone/docs ticket; automated verification is command-based (grep-proofs +
   `test -f`/`test ! -f` + the existing 002–007 pipeline coverage named in Assumption
   Reassessment), plus the manual smoke runbook.`

### Commands

1. `grep -n "Status: ✅ Implemented via SPEC-007" docs/requirements-version-1/IMPLEMENTATION-ORDER.md && test -f archive/specs/SPEC-007-deterministic-prompt-compiler.md && test ! -f specs/SPEC-007-deterministic-prompt-compiler.md`
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.
3. A narrower CI command is not the verification boundary here: the end-to-end behavior is a
   manual smoke (no browser/transport automation harness in v1), so steps 1–4 of the runbook
   are an implementer checklist rather than a CI assertion.

## Outcome

Completed: 2026-06-05

What changed:
- Reconciled `docs/compiler-contract.md` §4 so `<invention_permissions>`,
  `<contradiction_prohibitions>`, and `<prose_craft>` are documented as template
  constants, with dynamic content rendered in its own placeholders.
- Marked Phase 7 implemented in `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`.
- Added a Phase 7 implementation note to
  `docs/requirements-version-1/PROMPT-COMPILER.md`.
- Ran the local HTTP smoke against `npm start` and archived SPEC-007.

Deviations from original plan:
- The smoke was run through direct local HTTP requests rather than browser clicks,
  because the ticket's behavior under test is the `/api/compile` endpoint.

Verification:
- Manual smoke via `npm start` and `POST /api/compile` passed: complete prompt edges
  present, accepted-prose contamination absent from the clean prompt, prompt and
  fingerprint stable across two calls, version triple `1.0.0` present, blocked state
  returned `validation-blocked` with no prompt, and server console output contained no
  prompt/brief/directive/key text.
- `grep -n "Status: ✅ Implemented via SPEC-007" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
  passed.
- `grep -niF "Phase 7 implementation note" docs/requirements-version-1/PROMPT-COMPILER.md`
  passed.
- `test -f archive/specs/SPEC-007-deterministic-prompt-compiler.md && test ! -f specs/SPEC-007-deterministic-prompt-compiler.md`
  passed after archival.
- `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` passed, with
  Vite's large-chunk warning only.
