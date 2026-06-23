# SPEC031MULSECREV-001: Per-secret `Secret N` label in the shared secrets/reveal-constraints renderer (prose + ideation)

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — modifies the deterministic prompt compiler (the `<secrets_and_reveal_constraints>` renderer, shared by the prose and grounded-ideation prompts), bumps `compiler`/`contract` (and conditionally `templates`) versions, updates `docs/compiler-contract.md` + both prompt templates + the template rationale, regenerates the prose/ideation goldens, and adds multi-secret test coverage. Production behavior change: each secret lane line gains a deterministic `Secret N` prefix.
**Deps**: None

## Problem

`<secrets_and_reveal_constraints>` renders its six sub-labels (`Writer-visible hidden truths`, `Secret holders`, `Characters who must not know yet`, `Allowed clues and surface cues now`, `Forbidden reveals now`, `Reveal permission`) as six independent bullet lists, each mapping over all active secrets (`compile-prompt.ts:290-304`, `front.ts:138-159`). Cross-lane correlation is **positional only**, so with ≥2 active secrets the external LLM cannot tell which holders/clues/forbidden-reveals/reveal-permission belong to which hidden truth. Worse, `bulletRecords` drops empty projections (`front.ts:250`) and SECRETLINE-001 omits empty value-lines, so a secret absent from one lane shifts every later bullet — positional correlation silently misaligns. The grounded-ideation prompt shares the exact renderer (`compile-prompt.ts:192-194`), so it has the identical defect. `docs/compiler-contract.md:273-277` already mandates a per-lane "secret label or compact identifier"; the implementation never emitted one. This is a contract conformance gap, fixed by prefixing each lane line with a deterministic `Secret N` label.

## Assumption Reassessment (2026-06-23)

<!-- Items 1-3 always required. Items 4+ selected from the menu and renumbered from 4. -->

1. **Renderer + ordinal source (codebase).** `renderSecretsAndRevealConstraintsSection` (`packages/core/src/compiler/compile-prompt.ts:290-304`) iterates `secretsAndRevealConstraintBlocks` (`compile-prompt.ts:88-98`); each lane resolver in `frontResolvers` (`packages/core/src/compiler/sections/front.ts:138-159`) maps active secrets via `bulletRecords` (`front.ts:239-252`), attaching per-record text through `keyedText` (`front.ts:326-329`). The deterministic SECRET ordinal already exists: `citationKeysFor` (`packages/core/src/compiler/ideation/citation-keys.ts:8-32`) numbers `[SECRET-n]` over **all** selected SECRET records sorted by `(type,label,id)`, with **no** active-status filter. `N` must reuse that ordinal (SPEC-031 SD-2), not a fresh active-only re-index.
2. **Contract clause + version pins (specs/docs).** `docs/compiler-contract.md:273-277` already requires the per-lane compact identifier (unimplemented). `§8` empty-state rule at `compiler-contract.md:434`. Version pins are `templates 1.4.0 / compiler 1.6.0 / contract 1.7.0` (`packages/core/src/version.ts:25-36`; pin restated at `compiler-contract.md:5` and `docs/ACTIVE-DOCS.md:161`). `§10` change-control requires compiler-contract + prompt-template(.md/rationale) to move in the same revision as the rendering change.
3. **Shared boundary under audit.** The single render site of all six secret placeholders is `renderSecretsAndRevealConstraintsSection`; it feeds **both** the prose prompt and the grounded-ideation prompt via `renderSection` (`compile-prompt.ts:192-194`) → one change covers both surfaces. The shared contracts under audit are: the compiler↔template↔contract triad (`§8`/`§10`), the goldens (`golden-first-segment.prompt.txt`, `golden-ideation.prompt.txt`), and `prompt-template-doc-conformance.test.ts` (template↔output conformance), all of which must move atomically with the renderer.
4. **FOUNDATIONS principle restated (§29.6 / §15, §8).** §29.6 forbids omitting secret holders/non-holders/clues/forbidden-reveals/reveal-permission and forbids leaking a writer-visible secret into the wrong mind; §15 is the secret firewall. The label *strengthens* §29.6 (unambiguous per-secret attribution) and is pure metadata — it carries no `secret_claim` content. §8 requires deterministic output for identical inputs+versions.
5. **Determinism / secret-firewall surface.** Enforcement surfaces touched: deterministic prompt compilation (`§8`) and the secret firewall (`§15`/`§29.6`). The `Secret N` ordinal is derived from the existing deterministic `(type,label,id)` sort — no wall-clock, no LLM, no new source — so determinism holds. The label never restates `secret_claim` outside the writer-visible lane (SD-3), so no firewall path is opened: an ordinal index reveals nothing about the hidden truth and cannot leak it into a non-holder lane or the narrator.
6. **Adjacent consequence — version-bump blast radius (classified: required consequence).** Bumping `versionInfo` ripples to **produced-assertion** sites that stamp `versionInfo` (not echoed input): `packages/server/src/snapshot-builder.ts:74-77` feeds server route/e2e tests (`compile-routes.test.ts:160,189`, `ideate.e2e.test.ts:97`); the record-hygiene compiler reads `versionInfo` (`compile-record-hygiene-prompt.ts:41-43`) feeding `record-hygiene-golden.test.ts:24`; and `compiler-front-sections.test.ts:436-438` asserts `versionInfo` directly. These co-land here (cross-package vertical, no compliant intermediate). **Inert** sites that echo a hand-built `snapshot.versions` (`compile-prompt.ts:113`) — e.g. `compiler-ideation-golden.test.ts:178` — stay green and are updated only for representativeness, not correctness.

## Architecture Check

1. Reusing the existing `citationKeysFor` SECRET ordinal (rather than inventing a parallel active-only index) guarantees the prose `Secret N` and the ideation `[SECRET-n]` can never disagree, and keeps a single deterministic numbering authority. Keeping the six-lane structure (rather than a secret-grouped restructure) implements the contract's already-written clause with the smallest diff and preserves the `§4`/`§8` per-placeholder empty-state model.
2. No backwards-compatibility aliasing or shims: the label is added uniformly to the live renderer; no second render path, no legacy-format branch, no version-compat fork is introduced.

## Verification Layers

1. Per-lane label present + cross-lane ordinal consistency -> `@loom/core` unit test (`compiler-front-sections.test.ts`) asserting every active secret's six lanes carry the same `Secret N`.
2. Prose `Secret N` == ideation `[SECRET-n]` for the same record -> unit test comparing the rendered label against `citationKeysFor`.
3. Label survives lane-specific empty-line omission (no positional misalignment) -> unit test with a secret absent from one lane.
4. Deterministic, byte-identical section for identical inputs+versions -> golden snapshot (`golden-first-segment.prompt.txt`, `golden-ideation.prompt.txt`) + existing fingerprint assertions.
5. Template↔output conformance holds after the label is documented -> `prompt-template-doc-conformance.test.ts`.
6. Secret firewall intact (no `secret_claim` leaks outside the writer-visible lane) -> manual review + the contract-emptystate test (`compiler-placeholder-emptystate.contract.test.ts`).
7. Version pins consistent across source + contract + produced assertions -> `npm run typecheck` + `npm test` (cross-package).

## What to Change

### 1. Renderer: deterministic per-secret label

In `packages/core/src/compiler/sections/front.ts`, compute each active secret's `Secret N` ordinal from the `citationKeysFor` SECRET index (the numeric `n` in `[SECRET-n]`, the `(type,label,id)` sort over all selected SECRET records — **no** active-status filter), and prefix it onto the writer-visible line and the five value-lanes. Render the label only on active secrets that appear in the lanes; `N` may be non-contiguous (e.g. `Secret 1`, `Secret 3`) when an inactive secret is selected — acceptable, each line self-identifies. Format per SPEC-031 OQ-2 (writer-visible legend `Secret N [kind] <claim>`, value-lanes `Secret N: <value>`); do **not** restate `secret_claim` outside the writer-visible lane. Per SPEC-031 OQ-1, suppress the redundant `Secret n` on the ideation writer-visible line where `[SECRET-n]` already serves as the legend (value-lanes still carry `Secret N:`). Keep the six-lane structure and the `§8` empty-state behavior in `renderSecretsAndRevealConstraintsSection` (`compile-prompt.ts:290-304`): empty value-lines still omit; the section tag and the static reveal-permission rule still always render; the affirmative `forbidden_reveals: "none"` sentence still renders, now prefixed with its label.

### 2. Authority docs (§8/§10 same-revision co-land)

- `docs/compiler-contract.md`: make the §4 secret-lane "compact identifier" clause (lines 273-277) concrete — specify the `Secret N` ordinal format, that `N` equals the SECRET citation-key ordinal, that the label prefixes every secret lane, and that it never restates `secret_claim`. Update the §8 secrets empty-state bullet (line 434) to note the label rides on each rendered value-line and is absent from omitted lines. Update the version-pin line (line 5).
- `docs/prompt-template.md` and `docs/ideation-prompt-template.md`: show the labeled multi-secret rendering; add the normative note documenting the `Secret N` label (so output stays documented for §4.9 transparency and the doc-conformance test stays green).
- `docs/prompt-template-rationale.md`: explain the per-secret correlation rationale where the secrets section is discussed.

### 3. Version bumps + produced-assertion sites

Bump `compiler.version` and `contract.version` in `packages/core/src/version.ts` (the rendering + contract change); bump `templates.version` only if `prompt-template.md`'s normative template text gains the label note (recommended — confirm against the doc-conformance test). Update the contract version-pin (`compiler-contract.md:5`). Update every **produced** version assertion the bump breaks: `compiler-front-sections.test.ts:436-438`, `record-hygiene-golden.test.ts:24`, `compile-routes.test.ts:160,189`, `ideate.e2e.test.ts:97`, and any further server route test surfaced by `npm test`. Inert echo-fixtures (`compiler-ideation-golden.test.ts` and core golden fixtures) may be updated for representativeness.

### 4. Tests + goldens

Add multi-secret coverage to `compiler-front-sections.test.ts` (per-line label, cross-lane ordinal consistency, label-based correlation when a secret is absent from a lane, prose↔ideation ordinal equality, single-secret + affirmative-`none` still labeled). Regenerate `golden-first-segment.prompt.txt` and `golden-ideation.prompt.txt` so the labeled section is pinned. Re-verify the coupled consumer tests pass: `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `compiler-placeholder-emptystate.contract.test.ts`, `compiler-scaffold.test.ts`, `prompt-template-doc-conformance.test.ts`.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/ideation/citation-keys.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/core/test/compiler-placeholder-emptystate.contract.test.ts` (modify)
- `packages/core/test/compiler-scaffold.test.ts` (modify)
- `packages/core/test/prompt-template-doc-conformance.test.ts` (modify)
- `packages/core/test/record-hygiene-golden.test.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (modify)
- `packages/server/src/ideate.e2e.test.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)

## Out of Scope

- **No secret-grouped block restructure** (SPEC-031 rejected Approach B): the six-lane per-placeholder structure, section order, and §8 empty-state model are retained.
- **No new product behavior, no new secret schema fields, no validation-rule changes.** Holder/non-holder/clue/reveal-permission data, blockers, and §29.6 gating are unchanged in substance.
- **No lane-render-reordering** (SPEC-031 OQ-3 ascending-ordinal rendering) beyond what the ordinal requires.
- **`docs/ACTIVE-DOCS.md` version note and the multi-secret stress case** — owned by SPEC031MULSECREV-002 (non-§8 trailing docs).
- **No change to the record-hygiene prompt** (does not render this section); its golden test is touched only for the version-pin assertion.

## Acceptance Criteria

### Tests That Must Pass

1. New multi-secret cases in `packages/core/test/compiler-front-sections.test.ts` prove: every active secret's six lanes carry the same `Secret N` prefix; the prose `Secret N` equals the record's ideation `[SECRET-n]`; a secret absent from one lane leaves surviving lines correctly labeled (no positional dependence); single-secret output and the affirmative `forbidden_reveals: "none"` sentence render with their label.
2. Regenerated `golden-first-segment.prompt.txt` and `golden-ideation.prompt.txt` pin the labeled section; `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `compiler-placeholder-emptystate.contract.test.ts`, `compiler-scaffold.test.ts`, and `prompt-template-doc-conformance.test.ts` pass against the new output.
3. `npm run lint && npm run typecheck && npm test` all green (cross-package — catches every produced version-assertion site).

### Invariants

1. The `<secrets_and_reveal_constraints>` section is deterministic and byte-identical for identical inputs+versions; `N` derives only from the `(type,label,id)` sort, never snapshot array order or wall-clock.
2. No `secret_claim` text appears outside the writer-visible lane; the `Secret N` label is metadata only and opens no leakage path into a non-holder lane or the narrator (§15/§29.6).
3. `version.ts`, `docs/compiler-contract.md` version-pin, and every produced `metadata.versions` assertion agree on the bumped triple (no version mismatch).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add the multi-secret label/ordinal/empty-lane/prose-vs-ideation assertions.
2. `packages/core/test/golden-first-segment.prompt.txt`, `packages/core/test/golden-ideation.prompt.txt` — regenerate to pin the labeled section.
3. `packages/core/test/compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `compiler-placeholder-emptystate.contract.test.ts`, `compiler-scaffold.test.ts`, `prompt-template-doc-conformance.test.ts`, `record-hygiene-golden.test.ts`, and `packages/server/src/compile-routes.test.ts`, `ideate.e2e.test.ts` — update produced version assertions / consumer expectations to the new output.

### Commands

1. `npm test -- compiler-front-sections` — targeted: the new multi-secret behavior.
2. `npm run lint && npm run typecheck && npm test` — full pipeline (builds `@loom/core` first; the cross-package run is the correct boundary because the version bump's produced assertions live in both `@loom/core` and `@loom/server`).

## Outcome

Completed: 2026-06-23

What changed:

- Added deterministic `Secret N` labels to the shared `<secrets_and_reveal_constraints>` SECRET lane renderer. Prose writer-visible lines now render `Secret N [kind] <claim>`, non-writer-visible lanes render `Secret N: <value>`, and ideation writer-visible lines keep `[SECRET-n]` as the legend while the value lanes use the matching `Secret N:`.
- Reused the existing `citationKeysFor` SECRET ordinal so prose `Secret N` and ideation `[SECRET-n]` cannot diverge, including selected inactive-secret cases where active rendered labels may be non-contiguous.
- Updated compiler contract, prose template, ideation template, and template rationale for the label rule; bumped versions to template `1.5.0`, compiler `1.7.0`, contract `1.8.0`.
- Regenerated prose and ideation goldens and updated produced-version/direct-renderer assertions, including `compiler-sections.contract.test.ts`, which full-suite verification exposed as an additional direct consumer.

Deviations from original plan:

- `packages/core/src/compiler/compile-prompt.ts` and `packages/core/src/compiler/ideation/citation-keys.ts` did not require edits; the shared behavior was implemented in `packages/core/src/compiler/sections/front.ts` using the existing citation-key helper.
- No browser or localhost smoke was run. This ticket changes deterministic compiler output, contract docs, and tests only; no browser-facing request shape or UI workflow changed.
- `docs/ACTIVE-DOCS.md` and stress-suite documentation remain intentionally active for SPEC031MULSECREV-002.

Verification results:

- `npm test -- compiler-front-sections` passed.
- Targeted coupled run passed: `npm test -- compiler-front-sections compiler-golden compiler-ideation-golden compiler-placeholder-emptystate.contract compiler-scaffold prompt-template-doc-conformance record-hygiene-golden compile-routes ideate.e2e generate-routes ideate-routes ideation-taxonomy-capstone`.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 158 files, 1703 tests.
- `npm run build` passed.
