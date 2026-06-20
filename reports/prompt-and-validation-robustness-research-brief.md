# Research brief — Mutation-driven robustness hardening for the prose compiler, ideation compiler, and validation engine

> **For ChatGPT-Pro Session 2. This is a locked, no-questions brief.** Everything you need is in
> this prompt plus the uploaded manifest. Do not interview, do not ask clarifying questions — the
> requirements below are final. Produce the deliverable directly as downloadable markdown.

---

## 1. Context

The uploaded manifest (`reports/manifest_2026-06-20_2526f3c.txt`) is the path inventory of the
`joeloverbeck/continuity-loom` repo — a **local-first story-state operating system**: a Node process
serves a React UI and a **localhost-only** API that tracks story records, compiles them into a
**deterministic** prose-generation prompt, and handles segment acceptance. No account, no cloud; data
stays on the user's machine. It is an npm-workspaces ESM monorepo (Node ≥ 24, strict TypeScript) with
three packages: **`@loom/core`** (pure continuity/compiler/validation logic, framework- and
platform-free — a lint rule and a boundary test forbid `fastify`/`react`/`vite`/`node:*` imports),
**`@loom/server`** (serves the built UI + the localhost API), **`@loom/web`** (React + Vite front end).

Governing docs: `docs/FOUNDATIONS.md` is the **constitution** (its **§29** is the alignment / hard-fail
checklist every change must clear; **§4.4 / §8** state the determinism doctrine; **§9–§11** state the
universal prose prompt contract, the no-accepted-prose rule, and the validation / fail-closed doctrine;
**§28.8** records the research-grounded conclusion that **validate-and-block before generation is the
product differentiator**). `docs/ACTIVE-DOCS.md` maps the active authority hierarchy and the
active-vs-archive boundary.

**Fetch every file from commit `2526f3c`
(`2526f3ca96ca1146a8e163a3f0fdc4f3866515ef`)** — the uploaded manifest reflects exactly that tree. Read
repository files from that commit only. (No referenced report cites a divergent "commit of record" for
this target; if you encounter one, prefer this baseline.)

**This is a cold-start target, not a continuation.** No prior research brief addressed test-suite
robustness, mutation testing, or coverage tooling. Several other briefs exist in `reports/`
(`continuity-loom-schema-audit-pass-2-research-brief.md`,
`prompt-duplication-cross-segment-research-brief.md`,
`author-private-story-notes-research-brief.md`, `schema-field-and-taxonomy-audit-research-brief.md`).
They address **different** targets (schema/field economy, prompt duplication, author-private notes) and
are named here only so you do not conflate them with this one. They are not scope you must extend.

**Greenfield tooling baseline.** As of `2526f3c` the repo has **no mutation-testing tooling** (no
Stryker / StrykerJS) and **no coverage tooling** (no `@vitest/coverage-*` dependency, no coverage block
in `vitest.config.ts`). The test runner is Vitest 4 (`vitest run`), invoked through root `npm test`
which first builds `@loom/core`. There are ~55 test files in `@loom/core`, ~46 in `@loom/server`, ~33
in `@loom/web`. So this target **introduces** a robustness regime, it does not tune an existing one.

---

## 2. Read in full (authority order)

Read these from commit `2526f3c`, in this order. **[primary]** = a load-bearing target you must reason
against. **[boundary]** = read to bound scope and learn what behavior the tests must pin — not something
to redesign in its own right.

**Constitution & authority map**
- `docs/ACTIVE-DOCS.md` — **[primary]** the authority registry, the active-vs-archive boundary, and the
  "when a change needs a spec / ticket / doc-correction / ADR" intake rules. Tells you which doc owns
  which surface so your recommendations and any new doc land in the right place and get registered.
- `docs/FOUNDATIONS.md` — **[primary]** the constitution; read it all. Load-bearing sections for this
  target: **§4.4** (deterministic compilation) and **§8** (deterministic prompt compilation — the
  property a mutation/metamorphic regime most directly protects); **§9–§9.1** (universal prose prompt
  contract + assistance prompt class); **§10** (no accepted prose / rejected / superseded / auto-summary
  in prompts — a contamination property worth pinning with tests); **§11** (validation and hard fails —
  fail-closed); **§28.8** (validate-and-block before generation is the differentiator — why the
  validation engine is a co-equal third pillar); **§29.1–29.12** (the hard-fail checklist every
  recommendation must clear). FOUNDATIONS amendment is **not expected** for dev-only test tooling
  (see §3 and §6); propose one only with explicit justification.

**Product / user-facing (boundary-awareness)**
- `README.md` — **[boundary]** product identity and the local loop; grounds what "robust" must protect.
- `docs/user-guide.md` — **[boundary]** the user-facing install/run/verify/author workflow.

**Pillar 1 — the deterministic prose prompt compiler**
- `docs/compiler-contract.md` — **[primary]** the deterministic placeholder mapping, prompt section
  order, requiredness, empty-state rendering, validation-focus matrix, and blocker/warning taxonomy.
  This is the behavioral contract the prose-compiler tests must pin mutation-tight; a surviving mutant
  here is a way the compiler could silently violate this contract without a test noticing.
- `docs/prompt-template.md` — **[primary]** the universal **prose** prompt template text and placeholder
  structure — the exact output shape the compiler emits.
- `docs/prompt-template-rationale.md` — **[boundary]** why the template is ordered as it is; helps you
  tell a behavior worth pinning from an incidental formatting choice.

**Pillar 2 — the ideation prompt compiler**
- `docs/ideation-prompt-template.md` — **[primary]** the grounded ideation prompt template text, request
  shape, slot rules, citation-key rules, and output contract — the behavioral contract the ideation
  tests must pin.

**Pillar 3 — the deterministic validation engine, + shared schema**
- `docs/story-record-schema.md` — **[primary]** the conceptual story-record schema, generation-time
  brief schema, prompt-compilation behavior, validation requirements, and record taxonomy — the inputs
  all three pillars consume.
- `docs/validation-rule-inventory.md` — **[primary]** the implemented validation diagnostic-code
  inventory, severity audit, and same-change drift rule. This is the enumerated set of behaviors the
  validation-engine tests must pin **diagnostic-code-exactly** — the most consequential place for a
  surviving mutant, because §28.8 makes the fail-closed gate the differentiator.

**Existing regression / stress coverage (so new techniques complement, not duplicate)**
- `docs/stress-suite.md` — **[primary]** the canonical stress cases for validation, compiler, prompt,
  and demo regression. Read so your proposal **extends** rather than restates this coverage.
- `docs/stress-coverage-matrix.md` — **[boundary]** the matrix tying stress cases to rules/compiler
  behavior/regression surfaces; shows where coverage is already asserted vs. thin.
- `docs/demo-blocker-recipes.md` — **[boundary]** demo-fixture smoke recipes for blockers/warnings.

**Agent / process / downstream-shape**
- `tickets/README.md` and `tickets/_TEMPLATE.md` — **[primary]** the ticket shape and "one reviewable
  diff per ticket" rule. Your work breakdown must decompose cleanly into tickets of this shape.
- `AGENTS.md` and `CLAUDE.md` — **[primary]** the repo commands (`npm run lint` / `typecheck` / `test` /
  `build`), the CI gates on every push/PR, the `@loom/core` purity boundary, and completion standards.
  Any enforcement model you propose must integrate with these gates, and any mutation runner must
  respect the purity boundary (it operates on `@loom/core` source, which must stay `node:*`-free).
- `vitest.config.ts` — **[primary]** the current runner configuration (include globs, no coverage, no
  mutation) — the literal integration point for whatever tooling you recommend.
- `archive/specs/SPEC-007-deterministic-prompt-compiler.md` — **[boundary]** what established the prose
  compiler's current behavior (provenance for "what is contract vs. incidental").
- `archive/specs/SPEC-022-ideation-native-prompt-template.md` — **[boundary]** what established the
  ideation prompt's current behavior.
- `archive/specs/SPEC-014-polish-regression-hardening-and-documentation.md` — **[boundary]** the closest
  existing **regression-hardening** precedent; mirror its alignment discipline and house framing.

### Inspect, not read in full

Inspect these source seams directly (read excerpts; do not read every line, and do not paste them into
the deliverable) to ground the technique recommendations and the survivor analysis:

- **Pillar 1:** `packages/core/src/compiler/**` *except* `compiler/ideation/**` — notably
  `compile-prompt.ts`, `placeholder-map.ts`, `ordering.ts`, `fingerprint.ts`, `empty-states.ts`,
  `sections/**`, and their co-located `*.test.ts`.
- **Pillar 2:** `packages/core/src/compiler/ideation/**` (`slot-assignment.ts`, `operators.ts`,
  `citation-keys.ts`, `types.ts`), `packages/core/src/compiler/sections/ideation.ts`, and their tests.
- **Pillar 3:** `packages/core/src/validation/**` — `engine.ts`, `snapshot.ts`, `readiness.ts`,
  `kind-applicability.ts`, `reference-classification.ts`, `rules/**`, and their tests.
- **Secondary-tier audit candidates (for §3 item 2):** `packages/core/src/project-storage.ts`,
  `packages/core/src/records/**` (record construction/identity, `uuidv7.ts`, `registry.ts`),
  `packages/server/**` (OpenRouter transport, localhost binding, logging discipline), and any other
  surface your criticality audit surfaces.
- Root `package.json` and `packages/*/package.json` scripts, and `scripts/*.mjs`, to see how `lint` /
  `typecheck` / `test` / `build` actually run and where a mutation/coverage step would attach.

---

## 3. Settled intentions

These decisions were resolved before this brief was written. Treat them as final; do not reopen them.

1. **Three locked pillars.** The hardening targets, pre-committed, are exactly:
   - **(P1)** the deterministic **prose prompt compiler** — `packages/core/src/compiler/**` excluding
     `ideation/**`;
   - **(P2)** the **ideation prompt compiler** — `packages/core/src/compiler/ideation/**` and
     `compiler/sections/ideation.ts`;
   - **(P3)** the deterministic **validation engine** — `packages/core/src/validation/**`, the
     fail-closed gate FOUNDATIONS §28.8 names as the product differentiator.
   All three live in `@loom/core`, which is pure — the ideal substrate for mutation, property-based, and
   metamorphic testing. These three are in scope unconditionally.

2. **Determination element — audit and prioritize the rest (always produced).** Beyond the three
   pillars, you must perform a **repo criticality audit** and produce a **prioritized secondary tier**
   of hardening candidates — for each, evidence for *why it does or does not* warrant the same robustness
   care (e.g. `project-storage` durability, `validation/snapshot`, `compiler/fingerprint` stability,
   OpenRouter transport / secret-logging discipline, record identity). This audit section is **always
   produced** regardless of its conclusions (determination mode (i): the verdict is embedded as a
   section, not gated on a positive finding). It is a recommendation tier for downstream sequencing — it
   does not silently expand the three locked pillars.

3. **Technique mix is yours to recommend, with mutation testing the named anchor.** The user explicitly
   asked for "mutation testing and similar ways." Mutation testing (StrykerJS is the standard JS/TS
   tool; confirm and justify the choice) is the **named spine** — quantify and attack surviving mutants
   in the pillar suites. Beyond it, research prior art (papers, similar implementations, OSS regimes) and
   recommend a **per-pillar technique mix** justified by what Loom's determinism + purity actually
   support — candidates include property-based testing (e.g. fast-check: idempotence of compilation,
   reorder-invariance of the active working set, "valid record set ⇒ no internal compiler crash"),
   metamorphic / differential testing, and golden/snapshot corpora — but the selection and the rationale
   are yours. Do not propose techniques the code shape cannot support; say why where you decline one.

4. **Enforcement model is yours to recommend.** Decide gate-vs-advisory, per-package mutation-score
   thresholds (and whether `@loom/core` warrants a stricter bar than server/web), incremental /
   changed-files strategy to keep runtime tolerable, and how it integrates with the existing
   `lint` / `typecheck` / `test` CI gates. Name the CI cost trade-off explicitly. A recommendation that
   leaves the gate question unresolved is incomplete.

5. **Deliverable = change-proposal hand-off document(s), not a `SPEC-NNN`.** Follow Loom's pipeline:
   research-brief → ChatGPT-Pro **change-proposal document** → SPEC → tickets. You author the
   change-proposal stage. You **may split into more than one document** — and recommend more than one
   downstream spec — **only if dependencies genuinely require it** (e.g. a tooling-foundation document
   that must land before per-pillar hardening). Otherwise prefer a single document. The next spec number
   is **SPEC-026** (highest existing is SPEC-025 across `specs/` + `archive/specs/`); name it only as
   *downstream context* so the coding agent knows where it will land — **do not** assign it to your
   document or author in spec form. See §7 for exact form.

6. **FOUNDATIONS amendment is not expected.** Introducing dev-only test/robustness tooling changes no
   runtime behavior, stored data, prompt output, or non-negotiable invariant, so it should not require a
   constitutional amendment. If you nonetheless judge one warranted (e.g. recording a robustness
   conclusion in FOUNDATIONS §28, or adding a doctrine that thresholds must not be weakened), **flag it
   explicitly as a proposed amendment with justification** rather than designing around the constitution
   silently. A new `docs/` robustness doc plus its mandatory `docs/ACTIVE-DOCS.md` registry entry is
   permitted if you judge it warranted; say so and specify both.

---

## 4. The task

This is a **hardening** target whose deliverable is one (possibly more) **spec-precursor change-proposal
document(s)**. Achieve this: specify the work needed to make Continuity Loom's three most
correctness-critical subsystems — the prose prompt compiler, the ideation prompt compiler, and the
deterministic validation engine — **as robust as practical**, anchored on **mutation testing** and
complemented by whatever additional robustness techniques the prior art and the code shape justify;
introduce the supporting tooling (currently absent) and an enforcement model; and, because the user asked
"maybe more areas warrant the same care," deliver an evidence-based criticality audit that prioritizes a
secondary tier. The output must be detailed and sequenced enough to decompose directly into a SPEC-026
(and any dependent specs) and from there into one-reviewable-diff tickets.

---

## 5. Exploration + online-research mandate

Explore the repository as deeply as needed beyond the files listed in §2 — especially the source seams
and tests named in the "Inspect, not read in full" subsection — to ground every recommendation in the
actual code and to identify concrete surviving-mutant classes and high-value properties per pillar.

Research online as deeply as needed: mutation-testing theory and practice (mutation score, mutant
classes, equivalent-mutant problem, mutation-testing-cost mitigation, incremental mutation), StrykerJS
specifics and its Vitest runner, property-based testing (fast-check) and metamorphic/differential testing
applied to deterministic compilers and validators, and similar OSS implementations or research papers on
hardening rule engines / template compilers. **Cite sources** for any external claim that shapes a
decision (tool choice, threshold guidance, technique applicability). The user explicitly authorized deep
online research here — this is where it belongs, not in the original session.

---

## 6. Doctrine & constraints

Honor these; a proposal that violates one is wrong, not the authority:

- `docs/FOUNDATIONS.md` is the constitution — every decision must satisfy it and clear its **§29**
  hard-fail checklist. A genuine divergence requires amending FOUNDATIONS first (see §3 item 6), never
  designing against it silently.
- Authority order per `docs/ACTIVE-DOCS.md`: constitution above domain docs above implementation
  convenience. Any new `docs/` file must be registered in `docs/ACTIVE-DOCS.md` in the same change.
- **Dev-tooling boundary.** This work is test/CI infrastructure. It must **not** alter any runtime
  behavior, stored data shape, compiled prompt output, validation verdict, or contract version in
  `packages/core/src/version.ts`. Tests pin existing behavior; they do not change it. If a mutant
  reveals an actual bug, the fix is a separate, flagged correction — **never adapt a test to match a
  bug** (CLAUDE.md).
- **`@loom/core` purity is non-negotiable.** Any mutation/coverage tooling must operate on core's source
  without introducing `fastify`/`react`/`vite`/`node:*` imports into shipped core code; keep tooling in
  devDependencies and config, outside the import-boundary surface the lint rule and boundary test guard.
- **No backwards-compat shims or duplicate authority paths** in new work unless a spec explicitly
  justifies them.
- Loom non-negotiable invariants the tests should help *protect*, and must never weaken:
  - Records and user-authored generation-time fields are the continuity authority.
  - Accepted prose, rejected candidates, superseded candidates, and auto prose-derived summaries are
    **not** prompt context (a property worth pinning with tests).
  - The compiler is deterministic and queries no hidden state outside the validation snapshot.
  - Validation fails closed: blockers gate preview/send; warnings never become prompt instructions.
  - API keys are global local secrets; keys, full prompts, candidates, accepted prose, and full record
    payloads are not logged by default; every server binds `127.0.0.1` only. (Relevant if your secondary
    audit reaches `@loom/server`.)

---

## 7. Deliverable specification

Produce **one or more downloadable markdown change-proposal documents**. Default to a single document; add
a second (or third) **only** if a hard dependency requires staged delivery (e.g. tooling foundation before
per-pillar hardening) — and if you split, state the dependency and the intended downstream spec sequence.

- Name each as a **hand-off artifact filename, not a repo path** — e.g.
  `prompt-and-validation-robustness-hardening.md` (and, if split, e.g.
  `robustness-tooling-foundation.md` + `pillar-suite-hardening.md`). Do **not** assign a `SPEC-NNN`,
  do **not** write the document in spec template form. `SPEC-026` may be named inside the document **only
  as downstream context** (where it will land), per §3 item 5.
- Each document must contain, at minimum:
  1. **Motivation & scope** — the three locked pillars, why each is correctness-critical (tie P3 to
     §28.8), and an explicit out-of-scope note.
  2. **Determination / criticality audit** (always present, mode (i)) — the prioritized secondary tier
     with per-candidate evidence and an explicit verdict for each (harden now / later / not worth it).
  3. **Recommended technique mix per pillar** — mutation testing as the anchor plus the additional
     techniques you justify, each with cited prior art and a per-pillar rationale; note any technique you
     deliberately decline and why.
  4. **Tooling introduction** — concrete tool choice(s) (e.g. StrykerJS + Vitest runner; coverage tool if
     you recommend one), how they attach to `vitest.config.ts` and the npm scripts, and the
     `@loom/core`-purity-safe integration.
  5. **Enforcement model** — gate-vs-advisory decision, per-package thresholds, incremental strategy, CI
     cost, and integration with the existing gates.
  6. **Work breakdown** — sequenced, sized to decompose into one-reviewable-diff tickets per
     `tickets/README.md`; flag any item that is a behavior-fix rather than a test addition.
  7. **FOUNDATIONS / §29 alignment** — how the proposal clears the checklist, plus any flagged proposed
     amendment or new-doc-with-registry-entry per §3 item 6.
- Include the **locked / no-questions** instruction, verbatim intent:

  > Produce the deliverables directly as downloadable markdown documents. Do not interview, do not ask
  > clarifying questions — the requirements above are final. If a genuine contradiction makes a
  > requirement impossible, state it in the deliverable and proceed with the most faithful
  > interpretation.

---

## 8. Self-check

Before returning, confirm against your own output:

- [ ] Every file in the §2 read-in-full list was read, and every recommendation is grounded in the
  actual code at commit `2526f3c` (not assumed) — including the §2 claim that no Stryker/coverage tooling
  exists today, re-verified against the manifest and `vitest.config.ts` / `package.json`.
- [ ] The three locked pillars (P1 prose compiler, P2 ideation compiler, P3 validation engine) are each
  addressed with a concrete technique mix and survivor analysis; none was silently dropped or expanded.
- [ ] The determination/criticality audit is present with a per-candidate evidence-backed verdict, even
  where the verdict is "not worth hardening now."
- [ ] Mutation testing is the explicit anchor; every additional technique and the enforcement/threshold
  model is justified with **cited** external sources.
- [ ] The deliverable is change-proposal document(s) — **not** authored as `SPEC-NNN` and not in spec
  template form; `SPEC-026` appears only as downstream context; any document split is dependency-justified.
- [ ] No proposal weakens a FOUNDATIONS invariant or trips a §29 hard-fail; any FOUNDATIONS amendment or
  new `docs/` doc is flagged explicitly with its required `docs/ACTIVE-DOCS.md` registry entry.
- [ ] No proposed test adapts to a bug; behavior-fixes (if any mutant reveals one) are flagged as
  separate corrections, and contract versions in `packages/core/src/version.ts` are untouched.
- [ ] The work breakdown decomposes cleanly into one-reviewable-diff tickets per `tickets/README.md`.
- [ ] Every `§N` anchor cited into a Loom doc was confirmed against that doc at the baseline commit.
