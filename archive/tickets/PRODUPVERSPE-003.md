# PRODUPVERSPE-003: Salience-duplicate doctrine prose — template, rationale, and change-control

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — modifies the `@loom/core` `active_working_set` static template text in `packages/core/src/compiler/template-constants.ts` (production prompt output changes; golden baseline regenerates) and the governing docs `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/compiler-contract.md` §10; no compiler logic change.
**Deps**: PRODUPVERSPE-002

## Problem

The universal template and its rationale must state the doctrine the predicate tickets (001, 002) implement: the active working set is a *current-pressure summary*, not a duplicate archive, and a record may appear both there and in its detail section only when the two renderings do different jobs. Without this prose, a future reader (or a token-budget pass) could mistake the deliberate salience duplicates — voice pins especially — for redundancy and delete them. Per the spec verdict (`specs/prompt-duplication-verdict-and-spec.md` §7.5/§7.6/§7.4.8), the template gets pressure-summary framing, the rationale gets a "salience duplicates vs redundant restatement" subsection plus a voice-pin-protection note, and the compiler-contract change-control list gains the pressure-predicate/affordance entry.

## Assumption Reassessment (2026-06-09)

1. `packages/core/src/compiler/template-constants.ts:172-192` holds the `active_working_set` template literal: bare sub-block labels (`Action pressure:`, `Knowledge pressure:`, `Material pressure:` at :182-183, `Voice pressure:`), and the voice-pins note at :191. The Material-pressure sub-block carries **no** note today — confirmed by direct read this session. This static text compiles into every prompt, so editing it moves the golden baseline.
2. Spec §7.5 supplies the three `prompt-template.md` edits (its `active_working_set` is at `docs/prompt-template.md:199-221`), §7.6 the two `prompt-template-rationale.md` subsections (§7 = "Why causal pressure now appears before full cast dossiers"; §10 = "Why durable voice anchors are separate from current voice pressure pins" — confirmed this session), §7.4.8 the `docs/compiler-contract.md` §10 change-control bullet (§10 exists at `:289`). §7.8 requires `template-constants.ts` to mirror the `prompt-template.md` prose.
3. **Shared boundary under audit**: the template prose lives in two synchronized places — the compiled mirror (`template-constants.ts`) and the human doc (`prompt-template.md`). FOUNDATIONS §8 names drift between template, schema, rationale, example, and compiler contract a continuity bug, so both carry the same three notes and must land in one ticket. `Deps: PRODUPVERSPE-002`: the golden after 002 reflects the 001+002 dynamic changes; this ticket's static-text additions land on top, so it serializes after 002 to keep the golden update single-headed.
4. **FOUNDATIONS §8 deterministic compilation**: the additions are static prose assembled verbatim by the compiler — no logic, no LLM, no nondeterminism. The Material-pressure note is an **add** (no existing note to replace), per the reassessment's finding I3 already corrected into the spec.
5. **Deterministic-compilation enforcement surface**: `compilePrompt` concatenates the `template-constants.ts` section literals verbatim; inserting static notes keeps identical inputs+versions → byte-identical output, proven by regenerating and committing the golden baseline.
6. **Adjacent contradiction (required consequence)**: spec §7.5's middle edit historically read "replace any language that implies affordance action text is part of material pressure," but neither `template-constants.ts:182-183` nor `prompt-template.md:209-210` contains such language (bare `{material_pressure}` placeholder). The reassessment corrected the spec to an **add** (finding I3); implement it as an add in both files. Not a separate bug.
7. **Mismatch + correction**: none; the spec was reassessed this session and §7.5/§7.6/§7.4.8 carry the corrected text, including the I3 replace→add fix and the M3 note that the rationale doc is flat `## N` (no `###`).

## Architecture Check

1. Co-locating the human doc (`prompt-template.md`) and its compiled mirror (`template-constants.ts`) in one ticket is the only way to prevent template↔doc drift, which FOUNDATIONS §8 classifies as a continuity bug. Splitting them risks the two carrying different prose across revisions. The rationale and change-control edits ride along because they document the same doctrine atomically.
2. No backwards-compatibility aliasing or shims: prose is added in place; no parallel or legacy wording is retained.

## Verification Layers

1. Template↔doc sync invariant -> codebase grep-proof: the three new note strings (pressure-summary preface, material-pressure note, voice dual-frame sentence) appear in **both** `template-constants.ts` and `prompt-template.md`.
2. Determinism invariant -> golden regression proves identical inputs → byte-identical output after the static-text change (`compiler-golden.test.ts`).
3. No-rail-terms invariant -> the existing "keeps pressure sections free of plot-structure rail terms" test stays green (the added prose contains no `act structure|beat|arc|chapter`).
4. Docs-landed invariant -> grep-proof: the rationale's salience-duplicate and voice-pin subsections and the `compiler-contract.md` §10 change-control bullet are present.

## What to Change

### 1. `template-constants.ts` `active_working_set` template

- Insert the pressure-summary preface (spec §7.5 first block) immediately after `<active_working_set>` and before `Action pressure:`.
- Insert the material-pressure note (spec §7.5 second block) immediately after `{material_pressure}` — an **add**, since no note exists there.
- Append the dual-frame sentence (spec §7.5 third block) to the existing voice-pins note at `:191`.

### 2. `docs/prompt-template.md` `active_working_set`

Mirror the same three insertions in the doc's `active_working_set` block (`:199-221`), keeping the doc byte-aligned with the compiled template.

### 3. `docs/prompt-template-rationale.md`

Add the §7.x "Salience duplicates vs redundant restatement" subsection after §7 and the voice-pin-protection subsection after §10 (spec §7.6). The doc is flat `## N` with no `###`; per the reassessment's M3 note, either add as new flat top-level sections or accept the first `###` subsection level — implementer's choice, applied consistently.

### 4. `docs/compiler-contract.md` §10 change-control

Add the change-control bullet (spec §7.4.8): changes to pressure-predicate inclusion, pressure-summary field precedence, or VISIBLE AFFORDANCE placement must update compiler tests, the golden baseline, `prompt-template.md`, and `prompt-template-rationale.md` in the same revision.

### 5. `golden-first-segment.prompt.txt`

Regenerate: the three static notes now render inside `<active_working_set>` in every compiled prompt. Commit the regenerated baseline.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)

## Out of Scope

- `active_knowledge_pressure` and `material_pressure` resolver logic (PRODUPVERSPE-001, PRODUPVERSPE-002).
- Stress-suite Case 32 + coverage-matrix row (PRODUPVERSPE-004).
- Any schema change and any FOUNDATIONS amendment (spec §7.7).
- The optional FACT/backstory warning (spec §7.9, deferred).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-golden` — golden regression passes against the regenerated baseline carrying the new static notes.
2. `npm test` — full `@loom/core` suite green, including the no-rail-terms and empty-state pressure tests.
3. `grep -c` proves each of the three new note strings appears in both `packages/core/src/compiler/template-constants.ts` and `docs/prompt-template.md`, and the rationale subsections + `compiler-contract.md` §10 bullet resolve.

### Invariants

1. The pressure-summary preface, material-pressure note, and voice dual-frame sentence are byte-identical between `template-constants.ts` and `prompt-template.md` (no template↔doc drift, §8).
2. Identical inputs + template/compiler/contract versions produce a byte-identical prompt (§8 determinism).

## Test Plan

### New/Modified Tests

1. `None — template-prose + documentation ticket; no new test logic. Verification is the golden regression (`compiler-golden.test.ts`, unchanged) plus the grep-proofs in Acceptance Criteria; existing pressure-section coverage is named in Assumption Reassessment.`
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated baseline (the golden verification artifact reflecting the new static notes).

### Commands

1. `npm test -- compiler-golden`
2. `npm test`
3. `grep -Fc "These are current-pressure summaries" packages/core/src/compiler/template-constants.ts docs/prompt-template.md` — template↔doc sync proof (extend to the material-pressure and dual-frame strings).

## Outcome

Completed: 2026-06-09

What changed:

- Added current-pressure summary framing to the compiled active working-set template and `docs/prompt-template.md`.
- Added the Material-pressure note clarifying that affordance action possibilities belong under Action pressure and the affordance/location detail sections.
- Extended the voice-pin salience note with the explicit dual-frame doctrine in both template surfaces.
- Added rationale coverage for salience duplicates versus redundant restatement and protected voice-pin salience duplicates.
- Added the compiler-contract change-control rule for pressure predicates, pressure-summary field precedence, and VISIBLE AFFORDANCE placement.
- Updated the frozen first-segment golden baseline for the new static template prose.

Deviations from original plan:

- None.

Verification:

- `npm test -- compiler-golden` — passed.
- `npm test` — passed, 99 files / 734 tests.
- `grep -Fc "These are current-pressure summaries" packages/core/src/compiler/template-constants.ts docs/prompt-template.md` — one match in each file.
- `grep -Fc "Material pressure covers location, object, and entity-status constraints" packages/core/src/compiler/template-constants.ts docs/prompt-template.md` — one match in each file.
- `grep -Fc "This is a legitimate dual-frame duplicate: current scene voice pressure here, durable cast authority later." packages/core/src/compiler/template-constants.ts docs/prompt-template.md` — one match in each file.
- `grep -F "Salience duplicates vs redundant restatement" docs/prompt-template-rationale.md`, `grep -F "Voice pins remain protected salience duplicates" docs/prompt-template-rationale.md`, and `grep -F "Changes to pressure-predicate inclusion" docs/compiler-contract.md` — all passed.
