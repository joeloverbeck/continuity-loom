# SPEC-031 — Per-Secret Disambiguation in `<secrets_and_reveal_constraints>`

**Status**: COMPLETED
Phase: post-v1 correctness/conformance spec; closes a compiler-contract conformance gap in the shared `<secrets_and_reveal_constraints>` renderer so multi-secret prompts attribute each reveal-constraint lane to its secret. No new product behavior, no FOUNDATIONS amendment.
Depends on: the SPEC-007 deterministic prompt compiler (`compilePrompt`, the front-section resolvers), the SPEC-021/022 grounded-ideation prompt (shared `renderSection` path + ideation citation keys), and SECRETLINE-001 (archived — empty value-line omission in this section, which this spec composes with)
Governing authority: `docs/FOUNDATIONS.md` (constitutional); `docs/compiler-contract.md` (domain authority for the prompt compiler — this spec implements an already-written clause and bumps the contract version)
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/ideation-prompt-template.md`, `docs/ACTIVE-DOCS.md`
Supporting authorities: `docs/story-record-schema.md`, `docs/prompt-template-rationale.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It mirrors the SPEC-030 hand-authored
> preamble style (status/phase/authority blocks, premise-verification +
> scope-decisions blocks) and deliberately omits any external-generator
> evidence-ledger scaffolding — this spec was authored locally against the
> working tree (HEAD `ce15705`).

---

## Brainstorm Context

- **Original request:** the prose-generation prompt's `<secrets_and_reveal_constraints>`
  section "doesn't work right when there's more than one secret" — the sub-sections
  (`Secret holders:`, `Characters who must not know yet:`, `Allowed clues…`,
  `Forbidden reveals now:`, `Reveal permission:`) render as parallel lists that
  "can't identify what's the original secret they refer to." The user proposed
  "the secrets should be separated by sections, or something similar, so that …
  [each lane is] clearly grouped for the LLM for each secret," asked to "find a
  solution aligned with `docs/**`," to check whether "the same thing is happening
  for the Ideate prompt generation," and to "test thoroughly."

- **Diagnosis (no source report; root cause pinned statically from compiler + contract).**
  `renderSecretsAndRevealConstraintsSection` renders the six sub-labels as six
  independent lane-lists; each lane resolver maps over *all* active secrets via
  `bulletRecords`. The result is "lane → bullets," correlated across lanes only by
  list position. With one secret it is unambiguous; with ≥2 it is unreadable, and
  because `bulletRecords` drops empty projections (and SECRETLINE-001 deliberately
  omits empty value-lines), a secret absent from one lane shifts every later bullet
  — so positional correlation does not merely degrade, it silently misaligns.

- **The contract already mandates the fix.** Every secret-lane row in
  `docs/compiler-contract.md` §4 already says: *"Use the secret label or compact
  identifier plus the lane-specific rule. Do not restate the full `secret_claim`
  in this lane unless omission would make the lane ambiguous."* The renderer emits
  bare bullets with no identifier — this is a **conformance gap against the contract
  as written**, not a contract change of intent.

- **Ideation has the identical defect; one fix covers both.** The ideation prompt
  routes through the *same* shared `renderSection` → `renderSecretsAndRevealConstraintsSection`,
  so a single renderer change fixes the prose prompt and the grounded-ideation
  prompt together. Confirmed: the user's suspicion about the Ideate prompt is correct.

- **Considered "secret-grouped blocks" (the user's literal "separate by sections"),
  rejected in favor of per-lane labels.** Restructuring to one block per secret
  would rewrite the contract's per-lane placeholder model (§3.1/§3.2 section order,
  §4 per-placeholder mapping, §8 per-lane empty-state rules), `prompt-template.md`,
  and the goldens, for no correctness gain once each line is labeled. The per-lane
  compact-identifier approach implements the contract's existing clause with the
  smallest, lowest-risk diff. **(Decision confirmed via AskUserQuestion, 2026-06-23:
  Approach A — per-secret label prefix; deliverable class — Spec first.)**

- **FOUNDATIONS-amendment determination: none warranted.** The change strengthens
  §29.6 (it makes holder/non-holder/clue/forbidden-reveal/permission data
  unambiguously attributable per secret) and stays within deterministic compilation;
  no constitutional principle is tensioned.

### Premise verification (operator-verified by Read/grep at HEAD `ce15705`)

| Premise | Evidence (file:line) | Verified |
|---|---|---|
| Six sub-labels rendered as parallel lanes | `packages/core/src/compiler/compile-prompt.ts:88-98` (`secretsAndRevealConstraintBlocks`) | ✅ |
| Section renderer iterates labels, each resolving over all secrets | `packages/core/src/compiler/compile-prompt.ts:290-304` (`renderSecretsAndRevealConstraintsSection`) | ✅ |
| Each lane resolver maps all active secrets via `bulletRecords` | `packages/core/src/compiler/sections/front.ts:138-159` | ✅ |
| `bulletRecords` drops empty projections (breaks positional alignment) | `packages/core/src/compiler/sections/front.ts:239-252` (`.filter(Boolean)`) | ✅ |
| Writer-visible lane + per-record citation key injection | `packages/core/src/compiler/sections/front.ts:318-329` (`renderWriterVisibleHiddenTruths`, `keyedText`) | ✅ |
| Ideation reuses the same shared renderer | `compile-prompt.ts:192-194` (dispatch) + `135-148` (`renderIdeationPrompt`) | ✅ |
| Contract already requires a per-lane compact identifier | `docs/compiler-contract.md:273-277` (secret-lane rows) | ✅ |
| §8 per-lane empty-state rule for this section | `docs/compiler-contract.md:434` | ✅ |
| Ideation citation key renders only at the writer-visible site; prose never renders ideation citation keys | `docs/compiler-contract.md:164, 181`; `docs/ideation-prompt-template.md:171` | ✅ |
| Citation-key ordinal uses a deterministic `(type, label, id)` sort | `packages/core/src/compiler/ideation/citation-keys.ts:8-32` | ✅ |
| SECRET schema fields available as the identifier source (no name field; `id`/`secret_kind`/`secret_claim` only) | `packages/core/src/records/knowledge.ts:61-82` | ✅ |
| Version pins to bump | `packages/core/src/version.ts:25-36` (template 1.4.0, compiler 1.6.0, contract 1.7.0) | ✅ |
| Goldens exercise only a single secret (coverage gap) | `packages/core/test/golden-first-segment.prompt.txt:158-173`; `packages/core/test/golden-ideation.prompt.txt:146-161` | ✅ |
| Prior triage touched this section for *different* findings (no reversal) | `triage/2026-06-12-ideation-prompt-issues-triage.md` (SECRETLINE-001 empty-line omission); `triage/2026-06-09-prompt-generation-issues-triage.md` | ✅ |

### Scope decisions

- **SD-1 — Identifier is a deterministic per-secret ordinal label, rendered as a
  line prefix on the writer-visible lane and every other secret lane.** The SECRET
  schema has no human name field, so the "compact identifier" the contract calls
  for is an ordinal (`Secret N`).
- **SD-2 — The ordinal reuses the existing citation-key SECRET ordinal** (the
  `(type, label, id)` sort in `citation-keys.ts`), so the prose `Secret N` label and
  the ideation `[SECRET-n]` citation key always share the same `N` and can never
  disagree. The label is computed per-record and attached per-line (as `keyedText`
  already does for the citation key), so correlation holds regardless of lane
  iteration order. Because `citationKeysFor` numbers `[SECRET-n]` over **all**
  selected SECRET records (no active-status filter), `N` is the secret's index in
  that full sort, so it may be **non-contiguous** in the rendered lanes when an
  inactive (revealed/disproven/abandoned) secret is also selected (e.g. `Secret 1`,
  `Secret 3`) — acceptable, since each line still self-identifies. `N` is never a
  fresh active-only re-index, which would diverge from `[SECRET-n]`.
- **SD-3 — Metadata only; the full `secret_claim` continues to appear solely in the
  writer-visible lane** (contract §4 secret-lane rows). The ordinal label carries no
  secret content and leaks nothing.
- **SD-4 — Composes with SECRETLINE-001:** empty value-lines still omit; the
  per-line labels make the *surviving* lines self-identifying, which is precisely
  what fixes the positional-misalignment failure mode.
- **SD-5 — Applies to both prose and grounded-ideation prompts** via the shared
  renderer; no per-mode behavioral divergence beyond the ideation citation key that
  already renders at the writer-visible site.

---

## Problem Statement

`<secrets_and_reveal_constraints>` renders six sub-labels — `Writer-visible hidden
truths`, `Secret holders`, `Characters who must not know yet`, `Allowed clues and
surface cues now`, `Forbidden reveals now`, `Reveal permission` — as six independent
bullet lists, each produced by mapping over all active secrets
(`compile-prompt.ts:290-304`, `front.ts:138-159`). The only thing tying a holder
bullet to its hidden truth is **list position**.

With a single active secret this is unambiguous. With two or more — e.g. the
motivating case of two `[body_state]` secrets about the same character — every lane
is a multi-item list with no key back to the truth it constrains, and the external
LLM cannot reliably tell which holders / non-holders / clues / forbidden reveals /
reveal permission belong to which secret. Worse, positional correlation is not even
stable: `bulletRecords` filters out empty projections (`front.ts:250`) and
SECRETLINE-001 omits empty value-lines, so a secret that has no allowed clue (or an
affirmative-vs-omitted lane difference) drops its bullet from that lane and shifts
every later bullet — silently misaligning the columns.

This is a **conformance gap**: `compiler-contract.md` §4 already requires each secret
lane to "Use the secret label or compact identifier plus the lane-specific rule"
(lines 273-277). The implementation never emitted an identifier.

The grounded-ideation prompt shares the exact renderer (`compile-prompt.ts:192-194`),
so it has the identical defect. The bug shipped uncaught because every test and both
golden baselines use a single secret (`golden-first-segment.prompt.txt:158-173`,
`golden-ideation.prompt.txt:146-161`).

## Approach

Add a deterministic per-secret **correlation label** and render it as a prefix on
every secret lane line, in both the prose and ideation prompts (one shared renderer).

1. **Compute a per-secret ordinal** `N` as the SECRET's index in the `citationKeysFor`
   map — the deterministic `(type, label, id)` sort over **all** selected SECRET
   records (the same source as the ideation `[SECRET-n]` citation key), with **no**
   active-status filter. Render the label only on the active secrets that appear in
   the lanes; `N` is their citation-sort index, so it may be non-contiguous (see
   SD-2) but always equals the secret's `[SECRET-n]`. Do **not** re-index over active
   secrets only — that would diverge from `[SECRET-n]` whenever an inactive secret is
   selected.
2. **Prefix the label on each lane line.** The writer-visible line becomes the legend
   (`Secret 1 [body_state] <claim>`); each other lane line becomes
   `Secret 1: <value>`. The label is attached per record/line (mirroring
   `keyedText`), so correlation survives lane-specific empty-line omission (SD-4).
3. **Do not restate `secret_claim`** outside the writer-visible lane (SD-3); the
   label is the only added token.
4. **Preserve the six-lane structure** and the §8 per-lane empty-state rules: a lane
   with no value for a given secret still omits that bullet; the section tag and the
   static reveal-permission rule still always render; the affirmative
   `forbidden_reveals: "none"` sentence still renders, now prefixed with its label.
5. **Update the authority docs and version pins** so the contract, both prompt
   templates, and the rendered example outputs document the label format, and the
   change is deterministic and contract-pinned.

The ideation writer-visible line already carries `[SECRET-n]`; whether it *also*
renders the redundant `Secret n` prefix or treats the citation key as the legend
there is a bounded open question (see Risks) — the value-lanes carry `Secret n:`
regardless, since they render no citation key.

## Deliverables

Each is intended to be one reviewable diff / ticket:

1. **Core renderer change** — introduce the deterministic per-secret ordinal (the
   `citationKeysFor` SECRET index over all selected SECRET records, reused so it
   equals `[SECRET-n]`) and apply the `Secret N` prefix across the six lanes in
   `renderSecretsAndRevealConstraintsSection` / the front-section secret resolvers
   (`compile-prompt.ts`, `front.ts`, reusing/extending `citation-keys.ts` ordinal
   logic). Prose and ideation both inherit it via the shared path.
2. **Compiler-contract update** — in `docs/compiler-contract.md`, make the
   already-present "secret label or compact identifier" clause concrete: specify the
   `Secret N` ordinal format, that `N` aligns with the SECRET citation-key ordinal,
   that the label prefixes every secret lane (writer-visible + the five value-lanes),
   and that it is metadata that never restates `secret_claim`. Update the §8 secrets
   empty-state bullet to note the label rides on each rendered value-line and is
   absent from omitted lines. Bump `contract.version`.
3. **Prompt-template updates** — update `docs/prompt-template.md` and
   `docs/ideation-prompt-template.md` (and `docs/prompt-template-rationale.md` where
   the secrets section is discussed) to show the labeled multi-secret rendering and
   explain the correlation rationale. The `Secret N` label is compiler-injected into
   placeholder *values*; the placeholder structure itself is unchanged. Bump
   `templates.version` only if `prompt-template.md`'s **normative** template text
   gains the label note (recommended, so the rendered output stays documented for
   §4.9 transparency and `packages/core/test/prompt-template-doc-conformance.test.ts`
   stays green); a purely illustrative example/rationale update needs no
   `templates.version` bump. Confirm the outcome against the doc-conformance test.
4. **Version + registry bumps** — bump `templates`, `compiler`, and `contract`
   versions in `packages/core/src/version.ts`; update the version-pin lines in
   `docs/compiler-contract.md` and the version note in `docs/ACTIVE-DOCS.md`
   (currently template `1.4.0`, compiler `1.6.0`, contract `1.7.0`) in the same
   revision.
5. **Tests + goldens** — add multi-secret unit coverage in
   `compiler-front-sections.test.ts` asserting per-line labels, cross-lane ordinal
   consistency, robustness when a secret is absent from one lane (label-based, not
   positional, correlation), and ordinal alignment with the ideation citation key;
   regenerate `golden-first-segment.prompt.txt` and `golden-ideation.prompt.txt`
   (or add a dedicated multi-secret golden fixture) so the labeled output is pinned.
   Verify and update, as a coordinated set, every test that consumes the secrets
   section or its goldens: `compiler-golden.test.ts` and
   `compiler-ideation-golden.test.ts` (assert the regenerated `.txt` baselines),
   `compiler-placeholder-emptystate.contract.test.ts`, `compiler-scaffold.test.ts`,
   and `prompt-template-doc-conformance.test.ts` (template↔output conformance — must
   move with the Deliverable 3 template-text change). Update `docs/stress-suite.md` /
   `docs/stress-coverage-matrix.md` if a multi-secret case is added to the canonical
   stress set.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §29.6 POV/reveal hard fails (omit holders/non-holders/clues/forbidden-reveals/permission; leak into wrong mind) | aligns | Per-secret labels make each reveal-constraint lane unambiguously attributable to its hidden truth @ prompt-compilation, reducing the risk of mis-applying or leaking one secret's constraints onto another. |
| §8 / §29.4 Deterministic prompt compilation | aligns | Ordinal derived deterministically from the existing `(type,label,id)` sort; no LLM, no new source, identical output for identical inputs+versions @ compiler. |
| §9 Universal prose prompt contract / §3.2 ideation reuse | aligns | Change lives in the shared renderer; the six-lane structure, section tag, and static rule are preserved; ideation keeps its citation-key contract @ both prompt classes. |
| §4.9 / §22 Prompt transparency without hoarding | aligns | The inspected prompt becomes more legible without adding hidden state or hoarded context @ prompt inspection. |
| `compiler-contract.md` §4 secret-lane rows | aligns (closes conformance gap) | Implements the unimplemented "compact identifier per lane" clause @ compiler contract; version bumped in the same revision per §10 change-control. |

§29 hard-fail checklist: no hard fail is tripped. §29.4 (determinism, no LLM
intermediary, no accepted prose, no omitted contract section) — clear. §29.6 —
strengthened. No FOUNDATIONS amendment warranted.

## Verification

- **Unit:** multi-secret `compiler-front-sections.test.ts` cases proving (a) every
  lane line carries its `Secret N` prefix; (b) `N` is consistent for the same secret
  across all six lanes; (c) when a secret is absent from a lane (no clue / omitted
  line), surviving lines remain correctly labeled and unambiguous; (d) the prose
  `Secret N` ordinal equals the ideation `[SECRET-n]` ordinal for the same record;
  (e) single-secret output remains labeled and the affirmative `forbidden_reveals:
  "none"` sentence renders with its label.
- **Golden:** regenerated prose + ideation goldens (or a new multi-secret fixture)
  show the labeled section; a frozen baseline pins the rendering and guards against
  regression.
- **Determinism:** re-compiling identical snapshots yields byte-identical sections;
  ordinal does not depend on snapshot array order.
- **Contract drift:** `docs/compiler-contract.md`, `docs/prompt-template.md`,
  `docs/ideation-prompt-template.md`, `packages/core/src/version.ts`, and
  `docs/ACTIVE-DOCS.md` version notes are all updated in the same revision (§10
  change-control).
- **Gate:** `npm run lint`, `npm run typecheck`, `npm test` (which builds
  `@loom/core` first) all pass.

## Out of Scope

- **No secret-grouped block restructure** (the rejected Approach B): the six-lane
  per-placeholder structure, section order, and §8 per-lane empty-state model are
  retained.
- **No new product behavior, no new secret schema fields, no validation-rule
  changes.** Holder/non-holder/clue/reveal-permission data, blockers, and §29.6
  gating are unchanged in substance.
- **No change to lane iteration ordering** beyond what is needed for the ordinal;
  rendering secrets in ascending-ordinal order is an optional readability follow-up,
  not part of this spec (see Risks).
- **No FOUNDATIONS amendment** (none warranted).
- **No change to the record-hygiene prompt**, which does not render this section.

## Risks & Open Questions

- **OQ-1 — Ideation writer-visible redundancy.** Because `N` is the shared
  citation-key ordinal (SD-2), the ideation writer-visible line's `[SECRET-n]` and a
  `Secret n` prefix would carry the *same* number — the choice is now purely
  cosmetic, not a correctness question. Either suppress the redundant `Secret n` on
  that line (let `[SECRET-n]` be the legend; value-lanes still carry `Secret n:`, a
  trivial same-number mapping) or render both uniformly. Recommendation: suppress the
  redundant `Secret n` on the ideation writer-visible line; settle at ticket time.
- **OQ-2 — Label punctuation/format.** The approved preview uses `Secret N ` (no
  colon) on the writer-visible legend line and `Secret N:` on value-lanes. A fully
  uniform `Secret N:` everywhere is a minor alternative; pick one at ticket time and
  pin it in the contract + goldens.
- **OQ-3 — Lane render order.** Lines remain self-identifying regardless of order,
  but rendering secrets in ascending-ordinal order would make the legend read
  naturally. Treated as out of scope; revisit if golden readability warrants it.
- **Risk — golden churn.** Both goldens change (added prefixes); the diff is
  mechanical and reviewable, but ensure no unrelated section drifts in the
  regeneration.
- **Risk — version-pin fan-out.** The change touches three version pins plus two doc
  version notes; the §10 change-control rule requires all in one revision — the
  ticket's acceptance criteria must enumerate them so none is missed.

## Outcome

Completed: 2026-06-23

What changed:

- Completed and archived `archive/tickets/SPEC031MULSECREV-001.md`, which added deterministic per-secret `Secret N` labels to the shared prose/ideation `<secrets_and_reveal_constraints>` renderer, updated contract/template/rationale docs, bumped template/compiler/contract versions to `1.5.0` / `1.7.0` / `1.8.0`, regenerated goldens, and added multi-secret regression coverage.
- Completed and archived `archive/tickets/SPEC031MULSECREV-002.md`, which updated the `docs/ACTIVE-DOCS.md` version note and added Case 40 to `docs/stress-suite.md` plus the matching row in `docs/stress-coverage-matrix.md`.
- Settled OQ-1 by suppressing redundant `Secret N` on the ideation writer-visible hidden-truth line; `[SECRET-n]` remains the legend there, while ideation value lanes use matching `Secret N:`.
- Settled OQ-2 with prose writer-visible format `Secret N [kind] <claim>` and value-lane format `Secret N: <value>`.
- Left OQ-3 out of scope: lane iteration order was not changed because labels make every rendered line self-identifying.

Deviations from original plan:

- `packages/core/src/compiler/compile-prompt.ts` and `packages/core/src/compiler/ideation/citation-keys.ts` did not need edits; the existing shared section renderer and citation-key helper were sufficient.
- No browser or localhost smoke was run. The series changed deterministic compiler output, contract/version docs, stress docs, and tests; no UI workflow or request-shape behavior changed.

Verification results:

- `npm test -- compiler-front-sections` passed.
- Coupled 001 verification passed: `npm test -- compiler-front-sections compiler-golden compiler-ideation-golden compiler-placeholder-emptystate.contract compiler-scaffold prompt-template-doc-conformance record-hygiene-golden compile-routes ideate.e2e generate-routes ideate-routes ideation-taxonomy-capstone`.
- 002 grep checks passed: `grep -n "compiler is" docs/ACTIVE-DOCS.md && grep -n "version" packages/core/src/version.ts`; `grep -n "Case 40" docs/stress-suite.md docs/stress-coverage-matrix.md`.
- `npm run lint` passed after the 002 documentation edits.
- Final post-002 root gates passed: `npm run typecheck`, `npm test` (158 files, 1703 tests), and `npm run build`.
- The build completed with Vite's pre-existing chunk-size warning for the web bundle; no build failure occurred.
