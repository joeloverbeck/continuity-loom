# SPEC-026 — Mutation-Driven Robustness Hardening for Prompt Compilation and Validation

**Status**: ✅ COMPLETED
Phase: post-v1 development-assurance spec; test-tooling + property/metamorphic/golden suite hardening for the three locked `@loom/core` pillars (no runtime behavior change)
Depends on: the existing deterministic prose compiler, the ideation prompt compiler, the deterministic validation engine, the established `lint` / `typecheck` / `test` / `build` CI gates, and the core import-boundary rule
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/ideation-prompt-template.md`, `docs/validation-rule-inventory.md`
Supporting authorities: `docs/prompt-template-rationale.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the
> external-generator evidence-ledger preamble (`Target commit:` /
> fetch-provenance / raw-URL ledger) carried by the source change proposal,
> because this spec was authored locally against the working tree, not fetched
> at an exact commit — matching the SPEC-024 / SPEC-025 precedent.

---

## Brainstorm Context

- **Original request:** Analyze `reports/prompt-and-validation-robustness-hardening.md`,
  determine the actionable work, and create as many specs in `specs/*` aligned
  with `docs/**` as necessary.
- **Source report:** `reports/prompt-and-validation-robustness-hardening.md` — a
  19-section change proposal ("spec-precursor hand-off artifact") recommending a
  staged mutation-driven robustness regime for the three locked `@loom/core`
  pillars. StrykerJS mutation testing is the adequacy anchor, complemented by
  fast-check property tests, named metamorphic relations, focused goldens, and
  diagnostic-exact fixtures; it adds scoped V8 coverage as a reachability floor,
  one new operational doc, and a PR/scheduled CI gate model with floors and a
  ratchet. The proposal explicitly prescribes its own decomposition into a single
  SPEC-026 with a 23-ticket / 5-phase work breakdown and **no** FOUNDATIONS
  amendment.
- **Spec number:** `SPEC-026` — highest existing across `specs/` (empty) and
  `archive/specs/` is `SPEC-025-schema-audit-pass-2-authority-deduplication.md`.
- **Deliverable-count decision:** **one spec.** The request delegated the count
  ("as many as you believe necessary"); the proposal's three pillars share one
  toolchain, one baseline file, one CI model, and one new doc, and the
  enforcement floors (Phase E) depend on all three pillar baselines, so splitting
  would manufacture cross-spec dependencies. The repo's spec→tickets workflow
  already decomposes the 23-ticket breakdown. The **secondary criticality audit**
  (report §4: snapshot-builder, record/reference integrity, server security,
  SQLite durability, OpenRouter helpers) is **deferred to future specs**, not
  included here — the report itself sequences it after SPEC-026, and the final
  deliverable only *queues* it.
- **Deliverable-class decision:** the request pre-authorized a spec; this work
  touches the deterministic-prompt-compilation and validation-gate surfaces that
  `docs/ACTIVE-DOCS.md` ("When a change needs a spec") routes to a spec, so the
  pre-authorized class is correct.

### Premise verification (operator-verified by Read/grep against the working tree)

The source report disclaims that its target commit
(`2526f3ca96ca1146a8e163a3f0fdc4f3866515ef`) is current `main`. It is:
`git rev-parse HEAD` returns exactly that commit, so the report audited current
state and its freshness caveat is mooted. Every load-bearing premise was verified
directly, not relayed:

| Premise | Evidence (path) | Status |
|---|---|---|
| P1 prose-compiler sources exist as cited | `packages/core/src/compiler/{compile-prompt,placeholder-map,ordering,fingerprint,empty-states,template-constants}.ts`, `packages/core/src/compiler/sections/{front,cast,pressure,records-tail}.ts` | confirmed |
| P2 ideation-compiler sources exist as cited | `packages/core/src/compiler/ideation/{operators,slot-assignment,citation-keys,types}.ts`, `packages/core/src/compiler/sections/ideation.ts` | confirmed |
| P3 validation sources exist as cited | `packages/core/src/validation/{engine,snapshot,readiness,kind-applicability,reference-classification}.ts` and `packages/core/src/validation/rules/*.ts` (incl. `cast-band.ts`, `onstage-cast-band.ts` beyond the families the report enumerated) | confirmed |
| No mutation/coverage/property tooling installed | `grep stryker\|fast-check` across `package.json` + all `packages/*/package.json` → none | confirmed (greenfield) |
| `vitest.config.ts` has no coverage block | `grep coverage vitest.config.ts` → none | confirmed |
| `packages/core/src/version.ts` exists and must stay untouched | path present | confirmed |
| No `docs/robustness-testing.md` and no ACTIVE-DOCS entry yet | `grep -i robustness docs/ACTIVE-DOCS.md` → none | confirmed (new doc) |

### Scope decisions

1. **One spec, not several** — see Deliverable-count decision above.
2. **Secondary criticality audit deferred** — report §4 (S1/S2/S3 candidates) is
   out of scope; the closing deliverable queues it for a future spec only.
3. **No FOUNDATIONS amendment** — assurance evidence only; no new runtime
   doctrine (report §13.2, confirmed against §29).
4. **Exact version locks for the assurance toolchain** are intentional even
   though other deps use ranges; upgrades must be explicit baseline-regeneration
   tickets (report §9.1).
5. **Full mutation matrix is scheduled, not per-PR** — PRs run scoped coverage
   plus forced changed-file mutation only (report §11).

---

## Problem Statement

The three locked `@loom/core` pillars — the deterministic prose prompt compiler
(P1), the ideation prompt compiler (P2), and the deterministic validation engine
(P3) — are the surfaces `docs/FOUNDATIONS.md` most tightly constrains: §4.4/§8
require deterministic, ordered, explicit, hidden-state-free compilation; §9.1
defines the distinct ideation-prompt contract; §10 forbids accepted/rejected/
superseded/auto-derived prose from becoming prompt context; §11 and §28.8 make
fail-closed validate-and-block the product differentiator.

The baseline is well-tested in the ordinary sense (frozen goldens, section
assertions, document conformance, accepted-prose exclusion, diagnostic inventory
drift, rule-family suites, readiness/gating tests). The unanswered question is
**assertion strength**: *would the existing suite detect a plausible small defect
in the implementation?* The recurrent risk is systematic, not gross — `>` vs
`>=` at contract boundaries, `&&` vs `||` in eligibility/blocker predicates,
negated optional-section conditions, omitted empty-state branches, swapped
severity or diagnostic code, weakened tie-breaks, dropped output lines a broad
snapshot doesn't localize, warning/blocker gate conflation, and tests that check
only a count or substring. A weak assertion lets such an edit change generation
or gating semantics while all tests stay green.

There is currently **no** mutation testing, property-based testing, or coverage
instrumentation in the repo (verified greenfield). This spec introduces a
mutation-anchored robustness regime that measures and ratchets assertion strength
on the three pillars, **without changing any runtime behavior, stored data,
prompt text, diagnostic verdict, schema, or contract version**. Full detailed
rationale, mutant-class catalogs, and per-pillar technique tables live in
`reports/prompt-and-validation-robustness-hardening.md` (kept as provenance); this
spec carries the load-bearing decisions, deliverables, thresholds, and acceptance
criteria needed for decomposition.

### Considered and chosen

- **Mutation testing as the adequacy anchor, not coverage.** Chosen because
  mutant detection correlates with real-fault detection independent of coverage;
  ordinary line/branch coverage is admitted only as a reachability floor, never as
  evidence of assertion strength.
- **Schema-aware property generators, not arbitrary JSON fuzz.** Loom consumes
  typed normalized story state; unconstrained fuzzing spends executions on
  invalid noise and rewards "does not crash". Generators encode the domain and
  bias boundaries, empty states, ties, and optional branches.
- **Named metamorphic relations as first-class tests**, not anonymous loops —
  permutation invariance, one-defect→one-diagnostic, repair removes exactly that
  diagnostic, warning-only never closes a gate, accepted-prose canary never
  enters a prompt.
- **One spec, not split tooling vs. suite** (see Deliverable-count decision).
- **Declined:** a second compiler/validator as a differential oracle (would
  duplicate authority and drift); a golden explosion (mass snapshots are
  review-hostile and poor at localizing failure); a raw "never crashes" fuzz
  campaign as the main technique; global mutator exclusions; a 100% global
  mutation-score doctrine (equivalent mutants are real and semantic equivalence is
  undecidable).

---

## Approach

Introduce a version-locked assurance toolchain (StrykerJS + `@vitest/coverage-v8`
+ fast-check + `@fast-check/vitest`) as **root devDependencies only**, leaving
shipped `packages/core/src/**` and its import boundary untouched. Express the
three locked pillar boundaries as three Stryker configs sharing one base factory.
For each pillar, add a technique mix that kills the high-value mutant classes:
focused contract goldens/examples for exact known outputs, schema-aware property
tests for broad valid input spaces, named metamorphic relations for oracle-hard
cases, and (P3) an implementation-independent diagnostic contract registry that
asserts exact code/severity/applicability/affected-target and the
defect→diagnostic→repair relation.

Every non-killed mutant in changed pillar source must be classified (test gap /
equivalent / product defect / contract ambiguity / NoCoverage / Timeout / tool
error); a compact, tool-independent `mutation-baseline.json` records reviewed
scores and ratchets each pillar upward, never down automatically. Enforcement
adds two required PR checks (scoped coverage; fail-safe forced changed-file
mutation) plus a scheduled/manual uncached full three-pillar matrix; the full
matrix is **not** run on every ordinary PR. A new `docs/robustness-testing.md`
owns commands, scopes, thresholds, seed policy, survivor disposition, and CI
cadence, registered in `docs/ACTIVE-DOCS.md` as development-assurance authority
subordinate to FOUNDATIONS and the domain contracts.

Recommended mutation-score floors after calibration (floors, not targets):

| Scope | Green (`high`) | Warning (`low`) | Required break floor |
|---|---:|---:|---:|
| P1 prose compiler | 95 | 92 | 90 |
| P2 ideation compiler | 95 | 92 | 90 |
| P3 validation engine | 98 | 96 | 95 |

Version-locked toolchain (root devDependencies, exact pins):

```text
@stryker-mutator/core               9.6.1
@stryker-mutator/vitest-runner      9.6.1
@stryker-mutator/typescript-checker 9.6.1
@vitest/coverage-v8                 4.1.9
fast-check                          4.8.0
@fast-check/vitest                  0.4.1
```

Pillar mutation globs:

```text
P1 prose:   packages/core/src/compiler/**/*.ts
            !packages/core/src/compiler/ideation/**/*.ts
            !packages/core/src/compiler/sections/ideation.ts
P2 ideation: packages/core/src/compiler/ideation/**/*.ts
             packages/core/src/compiler/sections/ideation.ts
P3 validation: packages/core/src/validation/**/*.ts
```

---

## Deliverables

Each item below is sized to one reviewable diff and maps to the report's §12
work breakdown. `spec-to-tickets` should produce one ticket per item under a
shared family prefix, preserving phase order (Phase A → E; B/C/D pillar phases
are internally ordered but mutually independent once Phase A lands).

### Phase A — tooling and measurement

- **A1. Assurance dependencies + Stryker dry-run configs.** Add the six exact-pinned
  devDependencies; a shared `scripts/robustness/stryker-base.mjs` config factory;
  `stryker.prose.config.mjs`, `stryker.ideation.config.mjs`,
  `stryker.validation.config.mjs` differing only in mutate globs, report/cache
  paths, and thresholds; narrow `.gitignore` entries (`coverage/`,
  `reports/mutation/`, `.stryker-tmp/`, `.cache/stryker/`). Validate each config's
  mutate boundary with a dry run. No score gate yet. Constraints: `testRunner:
  'vitest'`; start `vitest.related: true` but prove it vs `related: false` on
  representative files and disable per-pillar if indirect tests are missed; do
  **not** configure Vitest coverage inside Stryker; do **not** set
  `ignoreStatic: true` or global excluded mutators; use the accurate TypeScript
  checker mode; keep the Stryker sandbox (no in-place mutation); add a build
  command only if a dry run proves source tests otherwise run stale output.
- **A2. Scoped Vitest V8 coverage.** Add a `coverage` block to `vitest.config.ts`,
  `provider: 'v8'`, `enabled: false`, scoped `include` for
  `compiler/**` + `validation/**`, reviewed thresholds (95/95/95/90 global; 97/97/
  97/95 for `validation/**`), `autoUpdate: false`, no global `perFile`. Add
  `test:coverage:core` script. Make coverage a required CI check **without**
  changing default `npm test`. Exclude only files a report proves type-only.
- **A3. Robustness policy doc.** Add `docs/robustness-testing.md` (enrolled scopes,
  commands + tool versions, coverage + mutation floors, changed-source rule,
  full-run cadence, baseline + ratchet process, survivor classifications,
  equivalent-mutant disable rules, seed/replay policy, artifact retention +
  no-dashboard decision, behavior-defect escalation) and register it in
  `docs/ACTIVE-DOCS.md` as development-assurance authority that does **not** define
  prompt/validation behavior.
- **A4. Mutation report summarizer + compact baseline format.** Parse Stryker JSON
  into stable counts and gate decisions; add the initial **advisory**
  `tools/robustness/mutation-baseline.json` (tool versions, pillar, status totals,
  reviewed score, ignored count, timestamp + commit). Do not commit Stryker's full
  incremental report.

### Phase B — P1 prose compiler

- **B1. Ordering.** Named tie cases + properties: precedence dominance,
  permutation invariance, label-then-ID exact tie resolution, no input mutation,
  comparator antisymmetry/transitivity. Classify all `ordering.ts` survivors.
- **B2. Fingerprint + token estimate.** Independent fixed FNV-1a vectors; exact
  token-estimate boundaries (lengths 0,1,4,5 + a non-ASCII case); same/known
  prompt→fingerprint; metadata derived from the emitted prompt. Do **not** assert
  universal collision-freedom. Any algorithm defect found → separate behavior-fix
  ticket.
- **B3. Empty states + placeholder mapping.** Independent placeholder/empty-state
  contract table (not generated from the resolver under test); each placeholder
  resolves exactly once; no known token survives; required sections in documented
  order; optional sections present iff source non-empty; documented empty-state vs
  omission, never accidental blank.
- **B4. Section renderers.** Front/cast/pressure/records-tail branches incl.
  cast-band distinctions and sample boundaries. Preserve all existing output.
- **B5. P1 metamorphic + contamination properties + full campaign.** Snapshot
  permutation, repeatability, deep-freeze, optional-section, and real-boundary
  context-firewall canaries for accepted prose / rejected / superseded /
  auto-summaries / author-private notes. Run and classify the full P1 campaign.

### Phase C — P2 ideation compiler

- **C1. Operator eligibility.** Independent operator truth table (required types,
  minimum records per type, conjunctions, reveal-permission, dormant eligibility)
  derived from `docs/ideation-prompt-template.md`, not from `operators.ts`;
  presence-vector properties; minimal per-operator and per-boundary examples.
- **C2. Slot assignment.** Count boundaries (2/3/6/7 + default omission),
  no-padding, `shrunk` ⇔ assigned<requested, dormant-only-when-requested/eligible/
  available, dormant-last, oldest-by-`updatedAt` with ID tie-break, ineligible-add
  no-op, permutation invariance.
- **C3. Citation keys + ideation rendering + full campaign.** Citation bijection/
  contiguous-ordinals/uniqueness/permutation-stable properties; exact request-field
  rendering (mode, count + shrink disclosure, avoid-list, reveal permission,
  operator labels, slot grounds; absence of prose-only sections / hidden clock).
  Retain the ideation golden unchanged. Run and classify the full P2 campaign.

### Phase D — P3 validation engine

- **D1. Diagnostic contract harness.** Independent fixture schema
  (`code, severity, promptKinds, buildValidBaseline, introduceMinimalDefect,
  repairDefect, expectedAffected`); inventory-completeness check vs the exported
  diagnostic-code inventory (fails when a code lacks a case) **without** deriving
  expected values from the production rule table; first cases for engine/readiness/
  universal diagnostics.
- **D2. Engine/readiness/applicability/reference-classification properties.** Exact
  gate (every blocker ⇒ `isBlocked`; warning-only never blocks), preview/generate
  distinction, provider-config affects generation not preview, prompt-kind
  applicability matrix (built independently from the inventory + contracts),
  stable sort, dedupe across duplicate traversal paths, immutability, deterministic
  repeat-validation, exact reference classes (selected+correct / unselected /
  dangling / wrong-target-type / permutations / archive-remove). Classify survivors.
- **D3. Universal + referential + internal + structural diagnostic contracts.**
  Minimal-defect/repair fixtures + exact affected targets for those families.
- **D4. Durable + physical matrix diagnostic contracts.** Every code + predicate
  boundary in the two families; classify family mutants.
- **D5. Knowledge + voice matrix diagnostic contracts.** Every code + predicate
  boundary; classify family mutants.
- **D6. Security + warning + remaining taxonomy contracts + full campaign.** Pin
  severity and non-gating behavior; close inventory gaps; run and classify the full
  P3 campaign.
- **D7. Cross-pillar generated contracts.** Clean-prose-readiness snapshot compiles
  without internal error; blocker-producing defect prevents preview/send and is not
  converted to prompt text; warning-only transform leaves compilation available
  and out of the prompt; clean ideation-ready snapshot yields a deterministic
  grounded ideation prompt; compilation never mutates the validated snapshot.

### Phase E — enforcement

- **E1. Changed-file mutation scope + fail-safe cache.** Path classification;
  forced `mutate` of every changed P1/P2/P3 source file; config/dependency/support-
  generator/script changes force all three campaigns; cache-miss falls back to real
  forced-scope work rather than skipping; always reports a status; any new
  `Survived` / `NoCoverage` / `Timeout` / unclassified run error in changed source
  fails; baseline ratchet must not regress.
- **E2. Scheduled/manual full robustness workflow.** `robustness.yml` with a
  scheduled uncached three-job matrix (`--force`) + `workflow_dispatch`; artifact
  upload for HTML/JSON/coverage/seed/summary; **no** external dashboard.
- **E3. Activate floors + reviewed ratchets.** Only after every baseline survivor
  is classified: set Stryker break floors, commit the reviewed compact baseline,
  make the changed-source check required.
- **E4. Document + queue secondary-tier follow-ups.** Record the deferred §4 scope
  (snapshot/reference integrity first, then security/durability) as future spec
  scope. **No implementation change in this ticket.**

### Behavior-fix flag (applies to every deliverable)

No deliverable may change product behavior. If a mutation campaign reveals the
implementation violates an existing contract: (1) add/isolate a reproducing test
without weakening the documented expectation; (2) mark the hardening ticket
blocked on a separate behavior-correction ticket; (3) fix implementation + any
authority doc in that separate change; (4) rerun the affected campaign; (5) do not
touch `packages/core/src/version.ts` for test-only work.

---

## FOUNDATIONS Alignment

This is development-assurance work that strengthens evidence the implementation
keeps satisfying existing invariants; it adds no runtime doctrine. Every §29
hard-fail area stays `aligns`.

| Principle / hard-fail area | Stance | Mechanism + surface |
|---|---|---|
| §4.4 / §8 deterministic, ordered, hidden-state-free compilation | aligns | P1 ordering/repeatability/purity properties pin determinism at the prompt-compilation surface; tooling adds no runtime dependency or hidden state. |
| §9.1 distinct ideation-prompt contract | aligns | P2 operator/slot/citation properties pin the ideation contract at the ideation-compilation surface from the template, not the code. |
| §10 context firewall (accepted/rejected/superseded/auto-derived prose) | aligns | P1 contamination canaries assert forbidden sources never enter the prose prompt; canaries placed at the nearest real data boundary. |
| §11 / §28.8 fail-closed validate-and-block | aligns | P3 diagnostic-contract harness + gate properties pin exact severity/applicability/affected-target and the preview/generate distinction at the validation gate. |
| §29.1 identity / accepted-prose-as-canon | aligns | No identity/branch change; tests strengthen accepted-prose exclusion. |
| §29.4 prompt compilation | aligns | P1/P2 directly pin determinism, section/placeholder/ordering contracts, no hidden state, no accepted prose. |
| §29.5 validation + generation gating | aligns | P3 pins exact blocker/warning behavior, no override, destination applicability, provider readiness. |
| §29.8 accepted archive | aligns | No archive behavior change; context-firewall canaries keep archive prose out of prompts. |
| §29.9 prompt audit + secrets | aligns | No external mutation dashboard; reports stay in CI artifacts; server security remains a separate deferred target. |
| §29.10 data ownership | aligns | Tooling operates on source/tests only; no telemetry, account, or cloud storage. |
| §29.11 workflow quality | aligns | Default `npm test` unchanged; expensive full mutation is scheduled; failures produce replayable, localized evidence. |
| §29.12 author-private notes firewall | aligns | P1 canaries preserve note exclusion; no note field added to compiler authority. |

**No FOUNDATIONS amendment.** The constitution already requires determinism,
fail-closed validation, context firewalls, secret safety, and local ownership;
this spec strengthens evidence those hold. A future amendment elevating "mutation
thresholds may never be weakened" to a product-level non-negotiable is judged
disproportionate now — the operational doc + reviewable baseline is sufficient
authority.

---

## Verification

- **Tooling:** six devDependencies installed at the exact pinned versions; three
  Stryker configs mutate exactly the locked globs (dry-run proven); dry runs do not
  exercise stale build output; `vitest.related` validated or disabled per pillar;
  coverage disabled by default, available via `test:coverage:core`; no production
  core import-boundary change (`npm run lint` + the boundary test pass unchanged);
  no external dashboard upload; only narrow generated dirs ignored.
- **P1:** ordering, optional sections, placeholder mapping, empty states, context
  firewalls, fingerprint, and token boundaries each have ≥1 independent exact or
  property oracle; the full prose golden is byte-for-byte unchanged; P1 meets floor
  and ratchet; every survivor classified.
- **P2:** all request boundaries, operator predicates, slot relations, dormant
  rules, citation-key relations, and request fields pinned; ideation golden
  unchanged; P2 meets floor and ratchet; every survivor classified.
- **P3:** every diagnostic code has an independent exact contract case or an
  explicitly justified non-rule classification; exact severity/applicability/
  affected-target/repair tested; warning-vs-blocker and preview-vs-generate
  property-tested; reference classes, stable order, dedupe, immutability pinned; P3
  meets the 95 break floor and ratchet; every survivor classified.
- **Enforcement:** scoped coverage is a required PR check; changed locked-pillar
  source triggers forced mutation of every changed file; robustness/config/
  dependency changes force all relevant campaigns; cache miss falls back to real
  work; full uncached campaigns run on schedule + manually; the reviewed compact
  baseline is committed and cannot auto-decrease; CI artifacts suffice to reproduce
  failures.
- **Governance:** `docs/robustness-testing.md` exists and is registered in
  `docs/ACTIVE-DOCS.md`; no FOUNDATIONS amendment; no runtime output, schema,
  diagnostic, or contract-version change (`packages/core/src/version.ts` untouched);
  any real defect found is routed to a separate correction ticket.
- **Gates:** existing `npm run lint`, `npm run typecheck`, `npm test`, `npm run
  build` continue to pass on every PR, unchanged.

---

## Out of Scope

- Any change to prompt wording, section order, placeholder semantics, diagnostic
  codes, severities, gate outcomes, schema, persistence shape, API behavior, or
  contract versions.
- Any runtime dependency in shipped `@loom/core` code.
- Redesign of the compiler, validator, record model, UI, storage, or OpenRouter
  transport.
- The secondary criticality audit (report §4): `snapshot-builder.ts`, record/
  reference/working-set integrity, server security envelope, SQLite/project
  durability, `uuidv7.ts`, core normalization helpers, OpenRouter request/error
  helpers, broad React-component mutation — **deferred to future spec(s)**;
  E4 only queues them.
- Package-wide mutation of `@loom/server` or `@loom/web`.
- Coverage percentage as a substitute for mutation adequacy.
- A full mutation campaign on every ordinary PR.
- A second compiler/validator as a differential oracle.
- Treating a survivor as permission to redefine expected behavior, or adapting a
  test to an implementation bug.
- Any `packages/core/src/version.ts` change.

---

## Risks & Open Questions

| Risk / question | Mitigation / resolution |
|---|---|
| Mutation runtime becomes unacceptable | Changed-file PR scope, three configs, per-test coverage, safe incremental reuse, scheduled full runs; measure (A1/A4 record mutant counts, dry/full-run time, memory, `related` true/false selection, cache behavior, slowest families) before tuning. |
| `vitest.related: true` misses indirect/API-style tests | A1 proves it per pillar against representative files vs `related: false`; disable per pillar where unsafe. |
| Team games the score with exclusions | No global mutator exclusions; narrow reasoned disable comments only; ignored mutants stay visible; baseline changes require a ticket. |
| Property tests become flaky | Fixed PR seed; `FC_SEED`/`FC_PATH` replay; logged rotating scheduled seeds; bounded generators; minimized counterexamples promoted to named regressions. |
| Generated tests duplicate the implementation | Independent contract tables + minimal defect transforms; never derive expected results from the production rule/operator map under test. |
| Incremental cache hides changes | Force config/dependency changes to full; force every changed source file; uncached scheduled runs; cache miss fails safe (Stryker incremental does not detect all env/config changes; Vitest reports changed tests at file granularity). |
| A campaign exposes a real product defect | Behavior-fix flag: reproducing test + separate behavior-correction ticket; never weaken the expectation; no version bump for test-only work. |
| Floor calibration | Floors above are post-calibration recommendations; E3 sets them only after baseline survivor classification, and the ratchet is `max(break floor, reviewed baseline)`. |
| Open: exact diagnostic-code inventory surface for D1's completeness check | Resolve at D1 implementation by reading the exported inventory used by the existing diagnostic-inventory drift tests; do not derive expected severities/applicability from it. |

---

## Outcome

**Completion date:** 2026-06-21 (merged via PR #66, commit `c10355e`).

**What actually changed.** All five phases / 23 deliverables landed under the
`SPEC026MUTDRIROB-001..023` ticket family:

- **Phase A (tooling):** the six exact-pinned assurance devDependencies
  (`@stryker-mutator/core|vitest-runner|typescript-checker` 9.6.1,
  `@vitest/coverage-v8` 4.1.9, `fast-check` 4.8.0, `@fast-check/vitest` 0.4.1);
  `scripts/robustness/stryker-base.mjs` factory plus the three root pillar configs
  (`stryker.{prose,ideation,validation}.config.mjs`); the scoped V8 `coverage`
  block in `vitest.config.ts`; `docs/robustness-testing.md` registered in
  `docs/ACTIVE-DOCS.md`; and the advisory `tools/robustness/mutation-baseline.json`.
- **Phases B/C/D (suites):** P1/P2/P3 property, metamorphic, and diagnostic-contract
  tests — including `packages/core/test/support/diagnostic-contract.ts`,
  `cross-pillar-contracts.test.ts`, `validation-blockers.test.ts`,
  `validation-completeness.test.ts`, `validation-matrix-voice.test.ts`, and the
  fast-check arbitraries under `test/support/arbitraries/`.
- **Phase E (enforcement):** `scripts/robustness/mutation-scope.mjs`,
  `mutation-gate.mjs`, `run-core-mutation.mjs`, and the scheduled/manual
  `.github/workflows/robustness.yml`; secondary-tier follow-ups queued (E4).

**Deviations from original plan.** None material. The baseline shipped in its
**advisory** state (`status: "advisory"`, `reviewedScore: null`) as designed for
the initial landing; Stryker break floors are activated on baseline-survivor
classification per E3, not at merge time.

**Verification results.** `npm run lint`, `npm run typecheck`, `npm test`, and
`npm run build` gates remained green; no `packages/core/src/version.ts` change; no
prompt/diagnostic/schema/contract change. Spec confirmed implemented by direct
inspection of the working tree before archival on 2026-06-21.
