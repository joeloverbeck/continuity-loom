# Change proposal: mutation-driven robustness hardening for prompt compilation and validation

**Status:** spec-precursor hand-off artifact  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `2526f3ca96ca1146a8e163a3f0fdc4f3866515ef`  
**Downstream context:** intended to decompose into **SPEC-026**, followed by one-reviewable-diff tickets  
**Document form:** change proposal, not a `SPEC-NNN`

> Produce the deliverables directly as downloadable markdown documents. Do not interview, do not ask
> clarifying questions — the requirements above are final. If a genuine contradiction makes a
> requirement impossible, state it in the deliverable and proceed with the most faithful
> interpretation.

## Executive decision

Adopt a single, staged robustness regime for the three locked `@loom/core` pillars:

1. the deterministic prose prompt compiler;
2. the ideation prompt compiler; and
3. the deterministic validation engine.

Mutation testing with StrykerJS is the adequacy anchor. It is complemented by schema-aware property-based tests, explicit metamorphic relations, focused contract goldens, and diagnostic-code-exact validation fixtures. Ordinary line or branch coverage is introduced only as a reachability floor; it is not treated as evidence that assertions are strong.

Use one downstream spec rather than splitting tooling from suite hardening. The tooling foundation is a first implementation slice, but it changes no product behavior and has no independent product value. Splitting it into a separate proposal or spec would create ceremony without reducing implementation risk.

The gate model is decisive:

- keep the existing `lint`, `typecheck`, `test`, and `build` checks;
- add required scoped coverage for the locked core surfaces;
- require mutation of every changed pillar source file on pull requests;
- prohibit new unreviewed `Survived`, `NoCoverage`, `Timeout`, or mutation-run error results in changed source;
- ratchet full-pillar mutation scores against an explicit reviewed baseline;
- run an uncached full three-pillar mutation matrix on a schedule and before release-scale compiler or validation changes;
- do **not** run the full mutation matrix on every ordinary pull request.

Recommended mutation-score floors after the calibration phase are:

| Scope | Green (`high`) | Warning (`low`) | Required break floor |
|---|---:|---:|---:|
| P1 prose compiler | 95 | 92 | 90 |
| P2 ideation compiler | 95 | 92 | 90 |
| P3 validation engine | 98 | 96 | 95 |

These are floors, not targets to game. A committed compact baseline ratchets each pillar upward when the reviewed score exceeds its floor. Lowering a ratchet requires an explicit, reviewable baseline-change ticket with survivor classifications; it must never happen automatically.

No FOUNDATIONS amendment is warranted. This proposal changes development assurance only: it does not change runtime behavior, stored data, prompt text, diagnostic verdicts, or `packages/core/src/version.ts`. Add one operational authority document, `docs/robustness-testing.md`, and register it in `docs/ACTIVE-DOCS.md` in the same change. That document owns tooling commands, thresholds, seed policy, survivor disposition, and CI cadence only; existing domain documents remain authoritative for compiler and validation behavior.

---

## 1. Provenance and evidence boundary

This proposal analyzes the user-supplied target commit only. It does **not** independently establish that the commit is the current `main`.

Repository-state claims below use only manifest-listed paths fetched from exact URLs containing the owner `joeloverbeck`, repository `continuity-loom`, full commit `2526f3ca96ca1146a8e163a3f0fdc4f3866515ef`, and exact manifest path. No clone, branch-name fetch, repository code search, repository metadata lookup, default-branch lookup, or snippet reconstruction was used.

Acquisition result:

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: 2526f3ca96ca1146a8e163a3f0fdc4f3866515ef
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Target-repository code search used: no
Clone used: no
URL fetch method: web.run open(full exact raw.githubusercontent.com URL)
Requested file count: 151
Successfully verified file count: 151
Fetch-provenance contamination observed: no
Foreign-repository references inside fetched file contents: permitted; not a provenance check
Connector/tool namespace trusted as evidence: no
External research lane: separate from repository evidence
```

The complete append-only URL ledger accompanies this proposal as `exact-commit-acquisition-ledger.txt`.

---

## 2. Motivation and scope

### 2.1 Why the three pillars are locked

#### P1 — deterministic prose prompt compiler

The prose compiler is the final deterministic transformation from continuity authority into the generation prompt. `docs/FOUNDATIONS.md` §4.4 and §8 require compilation to be deterministic, ordered, explicit, and free of hidden state. `docs/compiler-contract.md` and `docs/prompt-template.md` define exact placeholder mapping, section order, requiredness, empty-state behavior, and output structure. `docs/FOUNDATIONS.md` §10 further prohibits accepted prose, rejected candidates, superseded candidates, and automatic prose-derived summaries from becoming prompt context.

A weak assertion can therefore allow a small code edit—an inverted optional-section condition, altered tie-break, dropped line, wrong empty state, or context-contamination path—to change generation semantics while all tests remain green. This is exactly the class of risk mutation testing exposes.

#### P2 — ideation prompt compiler

The ideation compiler is a distinct deterministic assistance-prompt class under `docs/FOUNDATIONS.md` §9.1. Its contract is not “the prose compiler with a different heading.” `docs/ideation-prompt-template.md` defines bounded request counts, fixed operator order, operator eligibility, dormant-record behavior, citation-key construction, grounding, and output shape.

The current implementation contains compact, mutation-sensitive logic: count boundaries, minimum-record predicates, conjunctions across record types, slot reservation, stable tie-breaks, and citation ordinals. Example tests already cover important cases, but systematic conditional and boundary mutation is the fastest way to find unpinned branches.

#### P3 — deterministic validation engine

The validation engine is co-equal with the compilers, not a support utility. `docs/FOUNDATIONS.md` §11 requires fail-closed validation and preserves the blocker/warning distinction. Section §28.8 identifies validate-and-block before generation as the product differentiator. `docs/validation-rule-inventory.md` enumerates diagnostic codes and severities, and requires same-change drift control.

A surviving severity flip, applicability inversion, reference-classification error, or boolean mutation can silently open a generation gate that should be closed—or block a valid user workflow. Because the product differentiator is the gate itself, P3 receives the strictest mutation floor and the most exact oracle design.

### 2.2 In scope

This proposal covers:

- StrykerJS mutation infrastructure for the three locked core pillars;
- Vitest V8 coverage as a scoped reachability floor;
- fast-check plus its Vitest connector for schema-aware property testing;
- per-pillar property, metamorphic, example, and golden strategy;
- mutation survivor classification and ratcheting;
- pull-request, scheduled, and manual CI enforcement;
- an evidence-backed secondary criticality audit;
- an implementation sequence sized for one-reviewable-diff tickets;
- one new operational documentation authority and its registry entry.

### 2.3 Explicitly out of scope

This work must not:

- change prompt wording, section order, placeholder semantics, diagnostic codes, severities, gate outcomes, schema, persistence shape, API behavior, or contract versions;
- introduce any runtime dependency into shipped `@loom/core` code;
- redesign the compiler, validator, record model, UI, storage, or OpenRouter transport;
- treat a survivor as permission to redefine expected behavior;
- adapt a test to an implementation bug;
- add backwards-compatibility aliases, duplicate authority paths, or hidden bypasses;
- mutate all of `@loom/server` or `@loom/web` in this first regime;
- use coverage percentage as a substitute for mutation adequacy;
- require a full mutation campaign on every ordinary pull request;
- create a second full compiler or validator as a differential oracle.

A real product defect discovered during hardening is a separate correction. It needs a reproducing contract test and its own behavior-fix ticket; any documentation or spec consequence follows the existing authority process.

---

## 3. Baseline at the target commit

### 3.1 Tooling baseline

The exact-commit tree confirms the research brief’s greenfield premise:

- root `npm test` builds `@loom/core` and then runs `vitest run`;
- `vitest.config.ts` supplies test globs, timeout, and `passWithNoTests`, but has no coverage block;
- no manifest path or package manifest introduces Stryker, a Vitest coverage provider, fast-check, or a mutation configuration;
- the repository contains 56 core test files, 46 server test files, and 33 web test files in the uploaded path inventory;
- `.github/workflows/ci.yml` runs the established lint, typecheck, test, and build gates;
- core purity is enforced by ESLint and a boundary test, including prohibition of `node:*`, React, Vite, and Fastify imports in `packages/core/src/**`.

Repository evidence: `package.json`, `packages/*/package.json`, `vitest.config.ts`, `.github/workflows/ci.yml`, `eslint.config.js`, `packages/core/test/boundary.test.ts`, `AGENTS.md`, and `CLAUDE.md` at the target commit.

### 3.2 Existing strengths to preserve

The baseline is not under-tested in the ordinary sense. It already has valuable layers:

- frozen prose and ideation golden prompts;
- section-level compiler assertions;
- prompt-template document conformance;
- explicit accepted-prose exclusion coverage;
- compiler destination tests;
- slot-assignment and citation-key tests;
- diagnostic inventory drift tests;
- rule-family validation suites;
- readiness and gating tests;
- demo and stress fixtures tied to documented scenarios;
- server secret-leakage and loopback tests;
- cross-page UI behavior and accessibility tests.

The proposal therefore does not replace or indiscriminately multiply examples. It adds techniques that answer a different question: **would the existing suite detect plausible small defects in the implementation?**

### 3.3 Recurrent weakness class

Across the three pillars, the main remaining risk is systematic rather than gross:

- `>` versus `>=` at contract boundaries;
- `&&` versus `||` in eligibility and blocker predicates;
- negated optional-section conditions;
- omitted fallback or empty-state branches;
- swapped severity or diagnostic code;
- weakened stable sort tie-breaks;
- dropped output lines that broad snapshots do not localize;
- warning/blocker gate conflation;
- a repair that removes the wrong diagnostic or leaves related fallout;
- a test that checks only a count, substring, or truthy result instead of the full contract.

Mutation testing is the correct anchor because these are precisely the edits it synthesizes. Property and metamorphic tests then provide broad input coverage and independent relations that kill whole classes of such mutants.

---

## 4. Determination: secondary criticality audit

The three locked pillars remain the only unconditional mutation targets in this proposal. The following audit prioritizes other surfaces for later sequencing; it does not silently add them to SPEC-026.

| Priority | Candidate | Repository evidence and failure consequence | Verdict | Recommended technique |
|---|---|---|---|---|
| S1 | `packages/server/src/snapshot-builder.ts` | It is the choke point from persisted project state to the snapshot consumed by validation and compilation. It filters archived records, resolves selected IDs, supplies generation context, constructs project indexes, and fails closed on dangling state. A mutation here can give perfectly tested core logic the wrong world. | **Harden next in a separate follow-up** | Selective mutation, schema-aware snapshot generators, archive/selection metamorphic relations, and end-to-end “clean snapshot validates then compiles” contracts. |
| S1 | Record/reference/working-set integrity: `packages/core/src/records/references.ts`, `working-set-integrity.ts`, registry/identity helpers, and server record repository seams | These surfaces preserve identity, type-correct references, inbound-reference behavior, and working-set coherence across create/update/archive/delete. Corruption can be durable and later manifest as misleading validation. | **Harden next in a separate follow-up** | Pure-function mutation in core; model-based command sequences and transaction/reopen tests in server; exact postcondition checks after archive/delete. |
| S1 | Server security envelope: loopback binding, log redaction, secret handling, prompt/candidate/record firewalls | FOUNDATIONS §29.9 and §29.10 make these hard failures. The target commit already contains explicit loopback constants, redaction configuration, and secret-leakage tests. The consequence of a regression is high even though the code is not all pure. | **Harden next, selectively** | Security canary tests, fault injection, explicit log-sink assertions, and mutation only for pure redaction/request helpers and binding constants. Do not mutate the whole Fastify stack. |
| S2 | SQLite/project durability: `project-storage.ts`, `project-store.ts`, record tables, migrations, recoverability | Local-first ownership depends on atomic persistence and recoverability. Failures are high impact but stateful I/O makes broad mutation expensive and noisy. Existing recoverability and migration tests are a good base. | **Harden later, high priority** | Model-based state-machine tests, transaction/fault injection, close/reopen invariants, migration idempotence, and narrowly scoped mutation of pure decision helpers. |
| S2 | Record identity and `uuidv7.ts` | Identity collisions, wrong version/variant bits, or broken temporal ordering would undermine references and archives. The seam is pure enough for strong properties. | **Harden later** | Injected time/randomness, fixed vectors, uniqueness campaigns, version/variant invariants, monotonic ordering checks, selective mutation. |
| S2 | Core normalization and interpretation helpers: effective POV, generation-brief readiness, field paths, compile destinations | These are compact semantic adapters used by multiple pillars. Several already have focused tests. They warrant mutation when a follow-up expands the core scope, but not before the locked pillars are stabilized. | **Harden later** | Small-file selective mutation and table/property tests; fold into the next core-hardening tranche. |
| S2 | OpenRouter request/error/model helpers | Request shaping, provider error mapping, and secret discipline are consequential. Network adapters themselves are integration-heavy, but the pure builders and classifiers are mutation-friendly. | **Harden later, selectively** | Contract tests over request bodies and error classes, simulated transport failures, and mutation of pure builders/classifiers only. |
| — | Compiler fingerprint and token estimate | These are already inside P1 and are contract-relevant metadata. Treating them as a separate secondary project would duplicate scope. | **Harden now inside P1** | Fixed independent hash vectors, token-boundary examples, repeatability, and mutation. |
| — | Validation snapshot/readiness logic under `packages/core/src/validation/**` | These are already inside P3. The server snapshot builder remains a separate boundary candidate, but core snapshot/readiness is part of the locked validator scope. | **Harden now inside P3** | Exact gate properties, mutation, and metamorphic checks. |
| S3 | Broad React component mutation | UI failures matter, but the current interaction, cross-page, and accessibility tests are a better fit. DOM/mocking mutations are expensive and produce lower-value noise; Stryker’s Vitest runner also does not support Vitest Browser Mode.[E2] | **Not worth broad mutation now** | Continue behavior-level Testing Library and accessibility tests. Consider mutation only for isolated pure UI helpers such as `section-fill.ts` or `requiredness-now.ts`. |
| S3 | Type-only modules, barrels, passive constants, generated inventories | They either have no executable mutation surface or are better guarded by drift/conformance tests. Mutating them inflates runtime or creates equivalent noise without improving confidence. | **Not worth it** | Keep compile-time, inventory, and document-conformance checks. Exclude only after the tool confirms a file is genuinely type-only or non-executable. |

### Secondary sequencing conclusion

After SPEC-026, the best next hardening target is **snapshot and reference integrity**, not “mutation everywhere.” It closes the largest remaining trust gap: the core pillars can be perfectly deterministic and still act on a wrongly assembled snapshot. Server security boundaries should be hardened in parallel or immediately after, using targeted security tests rather than package-wide mutation.

---

## 5. Robustness model

### 5.1 Mutation is the anchor, not the only oracle

Mutation score has empirical value beyond statement coverage: Just et al. found mutant detection correlated with real-fault detection even when controlling for coverage, while also finding a meaningful class of real faults not coupled to the studied mutants.[E11] That supports two decisions:

- use mutation as the principal measure of assertion strength;
- never use it alone.

The complementary layers are:

1. **Contract examples and focused goldens** for exact known outputs.
2. **Property-based tests** for broad valid input spaces and minimized counterexamples.[E8][E9][E10]
3. **Metamorphic tests** for relations such as permutation invariance, defect/repair behavior, and stable key assignment when a complete expected output would be cumbersome.[E13]
4. **Cross-pillar integration contracts** for validation-to-compilation behavior.
5. **Coverage** only to expose code that no test reaches.

### 5.2 Property generators must encode Loom’s domain

Do not generate arbitrary JSON and call it robustness. Loom consumes typed, normalized story state. Byte-level or unconstrained object fuzzing would spend most executions on structurally invalid noise and would encourage assertions no stronger than “does not crash.”

Add test-only builders under a coherent support location such as:

```text
packages/core/test/support/arbitraries/
  ids.ts
  records.ts
  working-set.ts
  generation-brief.ts
  snapshots.ts
  defects.ts
```

Rules for these generators:

- generate valid baselines by construction;
- generate invalid states through named, single-purpose defect transforms;
- preserve identity and reference constraints unless the property intentionally violates one;
- bias boundaries, empty states, ties, duplicates, and optional branches;
- shrink to small readable records;
- avoid calling the implementation helper being tested to construct the expected answer;
- log and replay seed plus shrink path on failure;
- promote important discovered counterexamples into ordinary named regression tests.

Use `@fast-check/vitest` rather than hand-wiring `fc.assert` everywhere. Its official connector integrates fast-check with Vitest lifecycle and timeout behavior and permits incremental adoption through Vitest-compatible test APIs.[E9]

### 5.3 Deterministic seed policy

Property testing must not make the core test suite flaky.

- Pull requests and local default runs use a committed fixed seed.
- `FC_SEED` and `FC_PATH` overrides allow exact replay.
- Scheduled robustness runs use explicit rotating seeds recorded in the job summary and artifacts.
- Every failure reports the seed and shrink path.
- A fixed regression example is added for any counterexample that exposes a meaningful bug or test gap; the property remains to guard the class.

This preserves reproducibility while still exploring more of the state space over time. fast-check explicitly supports deterministic fixed seeds and failure replay.[E8]

### 5.4 Metamorphic relations are first-class contracts

Metamorphic testing checks how output must change—or must not change—under a controlled input transformation. It is well suited to deterministic compilers and rule engines because many powerful relations are obvious even when a complete expected prompt or diagnostic list is large. Research surveys frame it as a practical answer to difficult test-oracle problems, and work on Datalog engines has found deep, previously unknown semantic bugs using such relations.[E13][E14]

Loom should encode relations as named tests, not as anonymous loops. The relation name is part of the documentation:

- storage order does not alter semantic output when explicit ordering fields are unchanged;
- adding an irrelevant record does not alter a slot or diagnostic;
- introducing one named defect adds one exact diagnostic;
- repairing it removes that diagnostic without erasing unrelated diagnostics;
- warning-only changes never close a generation gate;
- accepted-prose canaries never enter a compiled prompt.

### 5.5 Techniques deliberately declined

#### No second full compiler or validator

Differential compiler testing is powerful when multiple independent implementations exist.[E15] Loom has one normative implementation and one normative contract. Creating a second renderer or validator in tests would duplicate authority, drift, and risk tests agreeing with a shared misunderstanding. Independent micro-oracles are appropriate for narrow algorithms such as fixed FNV-1a vectors; a second Loom compiler is not.

#### No golden explosion

Keep the existing full goldens, but do not create a snapshot for every generated input. Mass snapshots are expensive to review, easy to update indiscriminately, and poor at explaining which invariant failed. Properties and section-level exact assertions should carry the combinatorial load.

#### No raw “never crashes” fuzz campaign as the main technique

“No crash” is a useful secondary invariant for valid generated snapshots. It is too weak for a compiler whose primary risks are silently wrong text and for a validator whose primary risks are silently wrong diagnostics.

#### No global mutator exclusions

Do not globally exclude `StringLiteral`, `ConditionalExpression`, `EqualityOperator`, or static mutants merely to improve runtime or score. Template strings, empty-state strings, boolean predicates, and module-level rule tables are contract-sensitive in Loom. Stryker itself describes global mutator exclusion as a shotgun approach; narrow, reasoned disable comments are preferable for proven equivalent mutants.[E5]

#### No 100% global mutation-score doctrine

Equivalent mutants are real and semantic equivalence is generally undecidable.[E16] A blanket 100% requirement would reward suppression and distort design. The stricter rule is more useful: every changed-source survivor must be classified, every killable contract-relevant survivor must be killed, and every ignored mutant must remain visible with a narrow reason.

---

## 6. P1 — prose compiler hardening

### 6.1 Observed implementation seams

The target implementation composes a fixed sequence of front, cast, pressure, and tail sections; conditionally emits hard-canon, present-minor, and offstage material; resolves a placeholder map; applies explicit empty-state text; orders records through multiple tie-breaks; and emits prompt metadata including fingerprint and token estimate.

Representative exact-commit paths:

- `packages/core/src/compiler/compile-prompt.ts`
- `packages/core/src/compiler/placeholder-map.ts`
- `packages/core/src/compiler/ordering.ts`
- `packages/core/src/compiler/fingerprint.ts`
- `packages/core/src/compiler/empty-states.ts`
- `packages/core/src/compiler/template-constants.ts`
- `packages/core/src/compiler/sections/front.ts`
- `packages/core/src/compiler/sections/cast.ts`
- `packages/core/src/compiler/sections/pressure.ts`
- `packages/core/src/compiler/sections/records-tail.ts`

Existing tests already cover full goldens, scaffold shape, document conformance, section rendering, compile destinations, and accepted-prose exclusion. The new work should attack the mutants those examples may leave alive.

### 6.2 High-value mutant classes

1. **Ordering mutations**
   - removing or reversing `userOrder` precedence;
   - swapping compile-family, salience, or urgency direction;
   - omitting label or ID tie-breaks;
   - returning equality too early.

2. **Optional-section mutations**
   - emitting hard canon, present-minor, or offstage sections when empty;
   - omitting them when populated;
   - swapping an empty-state branch with an omission branch.

3. **Mapping and rendering mutations**
   - dropping a placeholder line;
   - mapping a placeholder to the wrong field;
   - reusing the wrong empty-state string;
   - changing field labels or section order;
   - truncating a cast sample at the wrong boundary;
   - collapsing onstage, present-minor, and offstage bands.

4. **Contamination mutations**
   - allowing accepted, rejected, superseded, or automatic prose-derived text into the prompt;
   - confusing author-private notes with prompt-authoritative records;
   - leaking a warning as a prompt instruction.

5. **Fingerprint and estimate mutations**
   - wrong FNV initialization, multiplication, or unsigned conversion;
   - floor versus ceiling at token-estimate boundaries;
   - zero-token output for an empty prompt.

### 6.3 Required test mix

#### A. Mutation campaign

Mutate the prose compiler excluding `compiler/ideation/**` and `compiler/sections/ideation.ts`. Stage the campaign from compact deterministic helpers into section renderers and finally the orchestrator:

1. `ordering.ts`, `fingerprint.ts`, `empty-states.ts`;
2. `placeholder-map.ts`, labels/constants, and individual section renderers;
3. `compile-prompt.ts` and cross-section behavior.

Do not exclude long template strings by mutator category. Exact prompt text is part of the contract.

#### B. Ordering properties

Generate arrays of records with explicit ordering fields and assert:

- permuting storage order leaves prompt bytes and metadata unchanged;
- changing only a higher-priority sort key dominates every lower-priority key;
- complete ties resolve by label and then ID exactly;
- sorting does not mutate the input array or records;
- the comparator is antisymmetric and transitive over generated valid records.

Keep a small table of named tie cases alongside the property so failures remain easy to diagnose.

#### C. Repeatability and purity

For a deep-frozen valid snapshot:

- two compilations produce byte-identical prompt and metadata;
- compilation performs no input mutation;
- unrelated object allocation or source-array permutation cannot affect output;
- no environment, clock, random value, filesystem, or network state is consulted.

The last property should be supported by the existing core import boundary and by tests that run the same fixture under deliberately varied ambient values where applicable; it should not require adding hidden dependency hooks to production code.

#### D. Placeholder and section contract

Build an independent table from the documented template placeholders and assert:

- each registered placeholder resolves exactly once;
- no known placeholder token survives the final prompt;
- required sections appear in documented order;
- optional sections are present exactly when their documented source set is non-empty;
- every empty source renders its documented empty state or documented omission, never an accidental blank;
- adding one record to an empty category changes only the expected section plus prompt-derived metadata.

The expected table must not be generated from the same resolver map under test.

#### E. Context-firewall canaries

Strengthen the current accepted-prose exclusion coverage with unique canaries placed at the nearest real data boundary for:

- accepted prose;
- rejected candidates;
- superseded candidates;
- auto summaries or other prose-derived material;
- author-private story notes.

Assert that none appears in the prose prompt. Do not invent new compiler parameters merely to inject forbidden data. Where a forbidden source cannot reach core directly, pin the exclusion at the actual snapshot-construction boundary in the later S1 follow-up.

#### F. Fingerprint and estimate contract

Use fixed, independently calculated FNV-1a vectors and exact token-estimate boundaries, including lengths 0, 1, 4, 5, and a non-ASCII prompt case. Assert:

- same prompt, same fingerprint;
- known prompt, known fingerprint;
- token estimate follows the documented/current exact formula at boundaries;
- prompt metadata is derived from the emitted prompt, not from an intermediate representation.

Do **not** assert universal collision freedom or that every possible changed prompt must have a different hash; that would be mathematically false for a fixed-width hash.

### 6.4 P1 acceptance outcome

P1 is mutation-tight when:

- its full score is at least the configured break floor and at or above the reviewed ratchet;
- no changed-source mutant is unreviewed;
- ordering, optional sections, placeholder coverage, context firewalls, and metadata boundaries each have at least one independent property or exact contract fixture;
- the existing prose golden remains unchanged;
- no runtime source or contract version changes solely to accommodate the tests.

---

## 7. P2 — ideation compiler hardening

### 7.1 Observed implementation seams

The ideation path contains fixed operator definitions, request parsing, slot assignment, dormant-record selection, citation-key assignment, and final section rendering. The target implementation uses bounded counts, stable operator order, record-type eligibility, minimum-record requirements, and deterministic tie-breaks.

Representative exact-commit paths:

- `packages/core/src/compiler/ideation/operators.ts`
- `packages/core/src/compiler/ideation/slot-assignment.ts`
- `packages/core/src/compiler/ideation/citation-keys.ts`
- `packages/core/src/compiler/ideation/types.ts`
- `packages/core/src/compiler/sections/ideation.ts`

Existing tests already exercise defaults, count bounds, operator ordering, shrink behavior, falsification prerequisites, dormant ordering, ideas/questions mode sharing, citation ordinals, and reversed input. Mutation should now make those contracts exhaustive rather than anecdotal.

### 7.2 High-value mutant classes

1. lower or upper count boundary changed from inclusive to exclusive;
2. default count or mode changed;
3. dormant slot reserved without an eligible dormant record;
4. dormant slot placed anywhere but last;
5. oldest-record sort reversed or ID tie-break removed;
6. operator order changed;
7. `AND` requirements weakened to `OR`;
8. minimum record count reduced, especially collision-like operators requiring two records;
9. reveal permission fallback inverted;
10. short assignment padded despite the no-padding contract;
11. shrink flag omitted or emitted under the wrong condition;
12. citation type, label, ID, or ordinal tie-break changed;
13. grounds rendered without a resolvable citation key;
14. request fields such as mode or avoid-list silently dropped from the prompt.

### 7.3 Required test mix

#### A. Mutation campaign

Mutate exactly `packages/core/src/compiler/ideation/**` plus `packages/core/src/compiler/sections/ideation.ts`. Type-only files may be excluded only after the dry run confirms they have no executable semantics.

#### B. Request boundary table and properties

Assert exact behavior at 2, 3, 6, and 7 requested items, plus default omission. Pin both accepted and rejected cases. Mutation operators reliably target these comparisons; boundary tests must therefore assert the exact result or error, not merely that a call succeeds.

#### C. Operator eligibility truth table

Create an independent table for every fixed operator:

- required record types;
- minimum records per type;
- additional conjunctions;
- reveal permission requirement;
- whether it can consume the dormant slot.

For generated record-presence vectors, assert that the eligible operator set equals the independent table. Add named minimal examples for every operator and every multi-condition boundary.

This table is test authority derived from `docs/ideation-prompt-template.md`, not generated from `operators.ts`.

#### D. Slot-assignment metamorphic relations

For generated valid requests and record sets:

- storage-order permutation leaves slots unchanged;
- assigned count never exceeds requested count;
- `shrunk` is true exactly when assigned count is lower than requested count;
- no synthetic padding occurs;
- a dormant slot appears only when requested, eligible, and available;
- when present, the dormant slot is last;
- the dormant record is the oldest by `updatedAt`, with ID as the stable tie-break;
- adding an ineligible record cannot alter assignment;
- removing one prerequisite removes only operators that require it, subject to deterministic refill from the fixed sequence.

#### E. Citation-key bijection

For every assigned slate:

- every cited record has exactly one key;
- every key resolves to exactly one record;
- keys are unique;
- ordinals are contiguous within each record type;
- type, full display label, and ID determine stable order;
- input permutation does not change keys;
- every rendered grounding reference uses a key present in the citation table;
- no unused key is emitted unless the documented template explicitly requires a complete record index.

#### F. Prompt request representation

Use focused exact assertions to pin:

- ideas versus questions mode;
- requested count and shrink disclosure;
- avoid-list content;
- reveal permission;
- operator labels and slot grounds;
- absence of prose-only continuation sections or hidden current-clock instructions.

Retain the ideation golden as a high-level contract. Add properties around it rather than creating a large snapshot corpus.

### 7.4 P2 acceptance outcome

P2 is mutation-tight when all operator predicates, count boundaries, dormant semantics, citation ordering, and request fields are independently pinned; the reviewed score meets its floor and ratchet; changed-source survivors are fully classified; and the existing ideation golden remains byte-for-byte unchanged.

---

## 8. P3 — validation engine hardening

### 8.1 Observed implementation seams

The validation subsystem composes ordered rule families, classifies record references, filters by prompt kind, calculates readiness, splits blockers from warnings, sorts diagnostics, freezes results, and derives preview/generate gating.

Representative exact-commit paths:

- `packages/core/src/validation/engine.ts`
- `packages/core/src/validation/snapshot.ts`
- `packages/core/src/validation/readiness.ts`
- `packages/core/src/validation/kind-applicability.ts`
- `packages/core/src/validation/reference-classification.ts`
- `packages/core/src/validation/rules/index.ts`
- `packages/core/src/validation/rules/universal-blockers.ts`
- `packages/core/src/validation/rules/universal-completeness.ts`
- `packages/core/src/validation/rules/referential-brief.ts`
- `packages/core/src/validation/rules/record-internal.ts`
- `packages/core/src/validation/rules/structural-contradiction.ts`
- `packages/core/src/validation/rules/matrix-*.ts`
- `packages/core/src/validation/rules/security.ts`
- `packages/core/src/validation/rules/warnings.ts`

The current suite is broad and includes inventory drift, family-level cases, readiness, warning/security behavior, reference classification, stress mapping, and taxonomy capstones. The hardening target is oracle precision and systematic predicate coverage.

### 8.2 High-value mutant classes

1. `blocker` changed to `warning`, or vice versa;
2. exact diagnostic code substituted or omitted;
3. affected path or record ID dropped;
4. `>` / `>=`, equality, negation, and `AND` / `OR` mutations in field matrices;
5. prose-only blocker applied to ideation, or universal blocker omitted from ideation;
6. selected/unselected/dangling reference class confused;
7. expected target type check removed;
8. warning incorrectly closes preview or generate;
9. provider configuration incorrectly blocks preview as well as generate;
10. diagnostic deduplication or stable sorting weakened;
11. diagnostics returned mutable;
12. one repair removes the wrong diagnostic or erases unrelated diagnostics;
13. a rule emits multiple copies under record-order permutations.

### 8.3 Diagnostic contract harness

Create a manually curated registry of diagnostic contract cases. Each entry contains:

```ts
{
  code,
  severity,
  promptKinds,
  buildValidBaseline,
  introduceMinimalDefect,
  repairDefect,
  expectedAffected,
}
```

The registry must be independent of rule implementation. It may compare its keys with the exported diagnostic-code inventory to fail when a new code lacks a contract case, but it must not derive expected severity, applicability, or affected paths from the production rule table.

For each case:

1. validate the baseline and establish the relevant code is absent;
2. introduce one minimal defect;
3. assert the exact code, severity, prompt-kind applicability, and affected target;
4. repair the defect;
5. assert that exact diagnostic disappears;
6. assert unrelated pre-existing diagnostics are unchanged.

This “defect → exact diagnostic → repair” relation is more mutation-tight than checking a total blocker count or matching a message substring.

### 8.4 Engine and readiness properties

For generated snapshots within practical size limits:

- record storage-order permutation leaves the sorted diagnostic value unchanged;
- duplicate traversal paths do not create duplicate diagnostics;
- every blocker makes `isBlocked` true;
- warning-only results never make `isBlocked` true;
- preview and generate gates follow their documented distinction exactly;
- missing provider configuration affects generation where documented, not preview;
- diagnostic arrays and entries remain immutable to the documented depth;
- repeated validation yields deeply equal results;
- affected identifiers and paths are stably ordered;
- a valid generated snapshot does not cause an internal validator exception.

Do not make “no exception” the sole assertion. It is only a baseline property combined with exact diagnostics for intentionally invalid states.

### 8.5 Prompt-kind applicability matrix

Build an independent prose/ideation applicability table from `docs/validation-rule-inventory.md`, `docs/compiler-contract.md`, and `docs/ideation-prompt-template.md`. Assert:

- universal blockers apply to both kinds;
- prose-only continuation blockers do not block ideation;
- ideation readiness does not accidentally require prose-only generation fields;
- warnings remain warnings in both contexts unless the documented code itself differs;
- every diagnostic contract case declares and verifies its kind applicability.

This directly attacks mutants in `kind-applicability.ts` and prevents a future rule from being added without an explicit destination decision.

### 8.6 Reference-classification properties

Generate project indexes, selected working sets, and typed references. Assert exact classification for:

- selected and type-correct;
- existing but unselected;
- dangling;
- selected but wrong target type;
- same ID represented in different record-order permutations;
- archive/remove transforms.

A classification test must assert the exact class and downstream diagnostic code, not merely “invalid.”

### 8.7 Rule-family rollout

Run mutation by coherent family so survivor review remains comprehensible:

1. engine, readiness, snapshot, applicability, and reference classification;
2. universal blockers/completeness and referential brief rules;
3. internal-record and structural contradiction rules;
4. physical and durable matrices;
5. knowledge and voice matrices;
6. security and warning rules;
7. the full validation tree as an integration pass.

The diagnostic contract registry should grow in the same sequence. A family ticket is complete only when its survivors are classified and its exact contract cases are present.

### 8.8 Cross-pillar contracts

Add a small suite that crosses the locked pillars without duplicating server behavior:

- every generated snapshot that is clean for prose readiness compiles without an internal error;
- a blocker-producing defect prevents the documented preview/send action and is not converted into prompt text;
- a warning-only transform leaves prompt compilation available and does not insert the warning into the prompt;
- a clean ideation-ready snapshot produces a deterministic grounded ideation prompt;
- compilation never mutates the snapshot that validation just evaluated.

### 8.9 P3 acceptance outcome

P3 is mutation-tight when every diagnostic code has an independent exact contract case or an explicitly justified non-rule classification; all gate, applicability, reference, ordering, dedupe, and immutability properties pass; the full score meets the 95 break floor and reviewed ratchet; and no changed-source survivor remains unclassified.

---

## 9. Tooling introduction

### 9.1 Tool choices

Install the following root development dependencies as a version-locked assurance toolchain:

```text
@stryker-mutator/core              9.6.1
@stryker-mutator/vitest-runner     9.6.1
@stryker-mutator/typescript-checker 9.6.1
@vitest/coverage-v8                4.1.9
fast-check                         4.8.0
@fast-check/vitest                 0.4.1
```

Rationale:

- StrykerJS is the standard maintained mutation framework for JS/TS and has an official Vitest runner.[E1][E2]
- StrykerJS 9.6.1 specifically fixed mutant hit-count and coverage behavior for Vitest 4.1, matching Loom’s Vitest 4.1.x line.[E17]
- all Stryker packages should use the same exact version to avoid plugin/core skew;
- `@vitest/coverage-v8` must match the installed Vitest version; Vitest recommends V8 and reports AST-remapped accuracy equivalent to Istanbul since Vitest 3.2.[E6]
- fast-check provides shrinking and deterministic replay; its Vitest connector is the supported low-friction integration.[E8][E9]

Exact version locks are intentional even though other repository dependencies may use ranges. Mutation operator sets and property-generation behavior affect baselines. Upgrades must be explicit tickets that regenerate and review reports. `package-lock.json` remains the installation authority.

### 9.2 Proposed files

```text
stryker.prose.config.mjs
stryker.ideation.config.mjs
stryker.validation.config.mjs
scripts/robustness/stryker-base.mjs
scripts/robustness/mutation-scope.mjs
scripts/robustness/mutation-gate.mjs
scripts/robustness/property-seed.mjs
tools/robustness/mutation-baseline.json
docs/robustness-testing.md
```

The three configs import one base to avoid duplicated policy. They differ only in mutation globs, report paths, incremental cache paths, and thresholds.

### 9.3 Base Stryker configuration

The implementation should be equivalent to:

```js
export function createCoreMutationConfig({ mutate, name, thresholds }) {
  return {
    testRunner: 'vitest',
    vitest: {
      configFile: 'vitest.config.ts',
      dir: 'packages/core',
      related: true,
    },
    mutate,
    checkers: ['typescript'],
    tsconfigFile: 'packages/core/tsconfig.test.json',
    typescriptChecker: {
      prioritizePerformanceOverAccuracy: false,
    },
    reporters: ['clear-text', 'progress', 'html', 'json'],
    htmlReporter: {
      fileName: `reports/mutation/${name}/index.html`,
    },
    jsonReporter: {
      fileName: `reports/mutation/${name}/mutation.json`,
    },
    incremental: true,
    incrementalFile: `.cache/stryker/${name}.json`,
    cleanTempDir: 'always',
    thresholds,
  };
}
```

Important constraints:

- Start with `vitest.related: true`, but prove it during tooling acceptance. Compare representative dry runs with `related: false`. If package or barrel imports cause relevant tests to be missed, turn it off for that pillar. The official runner documentation explicitly warns that indirect/API-style tests can require disabling related selection.[E2]
- Do not configure Vitest coverage inside Stryker. The runner forcibly disables Vitest coverage and uses per-test mutation coverage itself.[E2]
- Do not set `ignoreStatic: true`; module-level rule arrays and template constants are high-value targets.
- Do not set global excluded mutators.
- Do not add a build command unless the dry run proves source tests otherwise execute stale output. Mutation must exercise mutated source, not a previously built distribution.
- Use the accurate TypeScript checker mode for the correctness-critical scopes despite its cost. The checker documentation states that its faster default can misclassify mutants that should be compile errors.[E4]
- Keep Stryker’s temporary sandbox behavior; do not mutate source in place.

### 9.4 Mutation globs

The configs should mechanically express the locked boundaries:

**P1 prose**

```text
packages/core/src/compiler/**/*.ts
!packages/core/src/compiler/ideation/**/*.ts
!packages/core/src/compiler/sections/ideation.ts
```

**P2 ideation**

```text
packages/core/src/compiler/ideation/**/*.ts
packages/core/src/compiler/sections/ideation.ts
```

**P3 validation**

```text
packages/core/src/validation/**/*.ts
```

Test files are excluded by Stryker’s normal mutation selection. Type-only files may be explicitly excluded after the first report proves they produce no executable semantics; exclusions must name files, not broad categories.

### 9.5 Vitest coverage

Add a disabled-by-default coverage block to `vitest.config.ts`:

```ts
coverage: {
  provider: 'v8',
  enabled: false,
  include: [
    'packages/core/src/compiler/**/*.ts',
    'packages/core/src/validation/**/*.ts',
  ],
  exclude: [
    '**/*.test.ts',
    '**/*.test.tsx',
    // Add only verified type-only files here.
  ],
  reporter: ['text', 'text-summary', 'html', 'json-summary', 'lcov'],
  thresholds: {
    lines: 95,
    statements: 95,
    functions: 95,
    branches: 90,
    'packages/core/src/validation/**': {
      lines: 97,
      statements: 97,
      functions: 97,
      branches: 95,
    },
    autoUpdate: false,
  },
}
```

Vitest supports global, per-file, and glob-scoped thresholds, including automatic threshold updates.[E7] Loom should explicitly keep `autoUpdate` off. Assurance thresholds are reviewed policy, not generated edits.

Do not enable `perFile` globally in the first tranche. Several small renderer files can produce misleading percentages from a single synthetic branch. Mutation and changed-source survivor rules provide the stronger local guarantee. Revisit per-file coverage only after the baseline identifies a genuine reachability blind spot.

### 9.6 Package scripts

Add root scripts with stable names:

```json
{
  "test:coverage:core": "npm run build --workspace @loom/core && vitest run --coverage packages/core",
  "mutation:prose": "stryker run stryker.prose.config.mjs",
  "mutation:ideation": "stryker run stryker.ideation.config.mjs",
  "mutation:validation": "stryker run stryker.validation.config.mjs",
  "mutation:core": "node scripts/robustness/run-core-mutation.mjs",
  "mutation:changed": "node scripts/robustness/mutation-scope.mjs",
  "robustness:core": "npm run test:coverage:core && npm run mutation:core"
}
```

`run-core-mutation.mjs` should execute the three configurations sequentially for local use and return a non-zero status if any fails. CI can run them as separate matrix jobs for parallelism.

### 9.7 Generated artifacts and repository hygiene

Add narrow ignores only:

```text
coverage/
reports/mutation/
.stryker-tmp/
.cache/stryker/
```

Do **not** ignore the repository’s entire `reports/` directory; it contains committed hand-off material. Do not upload mutation reports to an external dashboard by default. Store HTML, JSON, and coverage output as short-lived CI artifacts. This keeps source snippets and assurance data inside the repository’s existing development boundary and avoids introducing an unnecessary hosted dependency.

### 9.8 Core purity

All new packages are root devDependencies. All configuration, runners, baselines, and generators live outside shipped `packages/core/src/**`, except normal test imports and any narrowly reasoned Stryker-disable comments. No test tool import may enter production core source. The existing ESLint and boundary tests remain authoritative and must pass unchanged.

---

## 10. Survivor protocol and baseline governance

### 10.1 Every non-killed result needs a disposition

Classify each result into one of these states:

| Classification | Required action |
|---|---|
| Test gap | Add or strengthen a contract/property test that kills it. |
| Equivalent mutant | Add a narrowly scoped Stryker disable for the specific mutator/line, with a reason that names the equivalence. Keep it visible as `Ignored`.[E5] |
| Product defect exposed | Open a separate behavior-fix ticket. Add a reproducing contract test; fix implementation in that ticket. Never change the expectation to match the defect. |
| Contract ambiguity | Stop classification and resolve the authority ambiguity through the existing doc/spec process. Do not guess. |
| `NoCoverage` | Fix test discovery, mutation scope, or missing test. It is not an acceptable steady-state status in a locked pillar. |
| Timeout | Determine whether the mutant creates a meaningful infinite/slow path. Add a terminating contract test or classify a tool limitation explicitly; do not simply raise timeouts until green. |
| Compile/runtime mutation error | Confirm whether it is an invalid mutant, tool defect, or real unsupported code shape. Keep it visible in the report and avoid score manipulation. |

### 10.2 Baseline file

Commit a compact, tool-independent `tools/robustness/mutation-baseline.json` containing:

- tool versions;
- target pillar;
- mutant totals by status;
- reviewed mutation score;
- reviewed ignored-mutant count;
- timestamp and commit that established the baseline;
- optional links to the ticket that classified survivors.

Do not commit Stryker’s full incremental report. Incremental data is a cache, not authority, and Stryker’s Vitest integration currently has an open report about unstable test IDs producing large no-op diffs in version-controlled incremental files.[E18] Keep incremental files in CI cache/artifacts and keep the compact ratchet stable.

### 10.3 Ratchet rule

For full pillar runs, the effective required score is:

```text
max(configured break floor, reviewed baseline score rounded down to two decimals)
```

A score increase updates the compact baseline only through an explicit ticket after survivor review. A score decrease fails. Changing tool versions invalidates comparability and requires a deliberate baseline-regeneration ticket.

For changed-source runs, aggregate score is secondary. The primary gate is **zero unreviewed adverse statuses in the forced changed-file scope**.

---

## 11. Enforcement model and CI cost

### 11.1 Pull-request gates

Every pull request continues to run the existing checks. Add two required checks:

#### `core-coverage`

Runs `npm run test:coverage:core` and enforces the scoped coverage thresholds. It runs on every pull request because it is predictable and provides a stable reachability signal.

#### `mutation-changed`

This job always reports a status so branch protection is reliable. It exits successfully with an explicit “no locked-pillar source or robustness-infrastructure changes” message when out of scope.

When in scope:

- a changed P1, P2, or P3 source file is passed as a forced `mutate` target so every mutant in the changed file runs;
- a changed pillar test file invalidates the relevant file-level incremental test result and runs the associated pillar campaign incrementally;
- a change to Stryker config, Vitest config, TypeScript config, package manifests/lockfile, test support generators, or robustness scripts forces all three pillar campaigns, because Stryker incremental mode does not detect all environment and configuration changes.[E3]
- any new `Survived`, `NoCoverage`, `Timeout`, or unclassified run error in changed source fails;
- the compact baseline ratchet must not regress.

Stryker incremental mode can reuse prior results and supports forced custom mutation scopes, but still requires a dry run. Its own documentation also notes that it does not detect changes outside mutated and test files, and that Vitest reports changed tests at file rather than exact-location granularity.[E3] The job must therefore fail safe: if a compatible cache cannot be restored, run the forced changed-file scope without reuse rather than skip mutation.

### 11.2 Scheduled full gate

Add a separate `robustness.yml` workflow with:

- a scheduled uncached full matrix for P1, P2, and P3;
- `workflow_dispatch` for manual full runs;
- artifact upload for HTML, JSON, coverage summaries, seed data, and compact gate summaries;
- no external dashboard upload.

The scheduled run uses `--force` and ignores incremental reuse for the score of record. It detects stale caches, indirect test/config drift, and survivors outside recently touched files.

### 11.3 Release-scale changes

A full uncached matrix is required before merging changes that intentionally alter:

- compiler contract or template text;
- validation rule inventory, severity, or applicability;
- story-record schema consumed by the pillars;
- Stryker/Vitest/fast-check versions;
- mutation globs, threshold policy, or baseline semantics.

This can be triggered manually and linked in the change record. It is not necessary for documentation-only edits unrelated to those contracts.

### 11.4 Package-level policy

| Package/scope | Mutation policy in this proposal |
|---|---|
| `@loom/core` P1/P2/P3 | Required changed-source gate; scheduled full gate; floors and ratchets above. |
| Other `@loom/core` | Not yet gated; selected later through the secondary audit. |
| `@loom/server` | No package-wide mutation score. A follow-up may enroll selected pure/security/durability seams with an initial 85/80/75 high/low/break profile and the same zero-new-survivor rule. |
| `@loom/web` | No mutation score. Continue interaction/a11y tests; consider only pure helper files later. |

This is a deliberate asymmetry. Core’s pure deterministic logic yields high-value mutants and reliable tests. Server and web contain I/O, framework, and DOM behavior where package-wide mutation would cost more and say less.

### 11.5 Runtime and cost control

Mutation testing executes tests across many code variants, so full runs can cost multiples of an ordinary suite. Research on mutation cost reduction identifies selective mutation and other reduction strategies across a large body of studies.[E12] Loom should control cost through:

- three independent pillar configurations;
- per-test coverage provided by the Stryker Vitest runner;
- related-test selection only after correctness validation;
- forced changed-file mutation on pull requests;
- incremental cache reuse where safe;
- separate CI runners for the three full pillar jobs;
- scheduled rather than per-PR full campaigns;
- schema-aware generators with bounded sizes and run counts;
- no global mutator suppression for speed.

Do not invent a runtime promise before measuring. The tooling-foundation ticket must record, per pillar:

- mutant count by status;
- dry-run time;
- full-run time;
- peak memory if available;
- tests selected with `related: true` and `false` for representative files;
- cache hit/miss behavior;
- the slowest mutant families.

Then set concurrency and timeouts from evidence. Runtime optimization must not reduce mutation scope or silently weaken thresholds.

---

## 12. Work breakdown into one-reviewable-diff tickets

The sequence below is sized to match `tickets/README.md` and `_TEMPLATE.md`: each ticket has one coherent outcome, explicit validation, and no unrelated cleanup.

### Phase A — tooling and measurement

1. **Add locked assurance dependencies and Stryker dry-run configuration**  
   Add the six devDependencies, shared config factory, three pillar configs, narrow ignores, and dry-run scripts. Validate each config against the exact mutation boundary. No score gate yet.

2. **Add scoped Vitest V8 coverage**  
   Add the coverage block and `test:coverage:core`; collect the initial report; exclude only verified type-only files; make coverage a required CI check without changing default `npm test`.

3. **Add robustness policy documentation**  
   Add `docs/robustness-testing.md` and its `docs/ACTIVE-DOCS.md` registry entry. Record commands, scope, survivor states, seed replay, artifacts, floors, ratchet, and baseline-update rules.

4. **Add mutation report summarizer and compact baseline format**  
   Parse Stryker JSON into stable counts and gate decisions. Add the initial advisory baseline with tool versions. Do not commit the full incremental report.

### Phase B — P1

5. **Mutation-tighten ordering**  
   Add named tie cases and property tests for precedence, permutation invariance, comparator laws, and no input mutation. Classify all `ordering.ts` survivors.

6. **Mutation-tighten fingerprint and token estimate**  
   Add independent fixed vectors and exact boundary tests. Classify all survivors. Any discovered algorithm defect is a separate behavior-fix ticket.

7. **Mutation-tighten empty states and placeholder mapping**  
   Add independent placeholder/empty-state contract tables, no-unresolved-placeholder assertions, and exact omission/render behavior.

8. **Mutation-tighten prose section renderers**  
   Cover front, cast, pressure, and record-tail branches, including cast-band distinctions and sample boundaries. Preserve all existing output.

9. **Add prose compiler metamorphic and contamination properties**  
   Add snapshot permutation, repeatability, deep-freeze, optional-section, and real-boundary context-firewall canaries. Run and classify the full P1 campaign.

### Phase C — P2

10. **Mutation-tighten ideation operator eligibility**  
    Add the independent operator truth table, minimal prerequisite cases, and generated presence-vector properties.

11. **Mutation-tighten slot assignment**  
    Add count boundaries, no-padding, shrink equivalence, dormant-last, oldest/tie-break, and permutation properties.

12. **Mutation-tighten citation keys and ideation rendering**  
    Add citation bijection/ordinal properties and exact request-field rendering assertions. Run and classify the full P2 campaign.

### Phase D — P3

13. **Introduce diagnostic contract harness**  
    Add the independent fixture schema, inventory completeness check, and first cases for engine/readiness/universal diagnostics.

14. **Mutation-tighten engine, readiness, applicability, and reference classification**  
    Add exact gate, warning, provider, kind, sorting, dedupe, immutability, and typed-reference properties. Classify survivors.

15. **Add universal, referential, internal, and structural diagnostic contracts**  
    Add minimal-defect/repair fixtures and exact affected targets for those rule families.

16. **Add durable and physical matrix diagnostic contracts**  
    Cover every code and predicate boundary in the two families; classify family mutants.

17. **Add knowledge and voice matrix diagnostic contracts**  
    Cover every code and predicate boundary in the two families; classify family mutants.

18. **Add security, warning, and remaining taxonomy contracts**  
    Pin severity and non-gating behavior; close inventory gaps; run and classify the full P3 campaign.

19. **Add cross-pillar generated contracts**  
    Add clean-validation-to-compilation, blocker-gate, warning-non-instruction, ideation determinism, and snapshot non-mutation properties.

### Phase E — enforcement

20. **Add changed-file mutation scope and fail-safe cache behavior**  
    Implement path classification, forced changed-source mutation, config/dependency full-run triggers, and cache-miss fallback.

21. **Add scheduled/manual full robustness workflow**  
    Add the three-job uncached matrix and short-lived artifacts. Keep external dashboards disabled.

22. **Activate mutation floors and reviewed ratchets**  
    Only after every baseline survivor is classified, set Stryker break floors, commit the reviewed compact baseline, and make the changed-source check required.

23. **Document and queue secondary-tier follow-ups**  
    Create separate downstream scope for snapshot/reference integrity first, then security/durability. Do not include implementation changes in this ticket.

### Behavior-fix flag

None of the tickets above is authorized to change product behavior. If any mutation campaign reveals that the target commit violates an existing contract:

1. add or isolate the reproducing test without weakening the documented expectation;
2. mark the hardening ticket blocked on a separate behavior-correction ticket;
3. correct implementation and any required authority document in that separate change;
4. rerun the affected mutation campaign;
5. do not change `packages/core/src/version.ts` for test-only work.

---

## 13. Documentation and authority placement

### 13.1 New active document

Add `docs/robustness-testing.md` because the following policies outlive one spec and must not be rediscovered from CI YAML:

- enrolled source scopes;
- commands and tool versions;
- coverage and mutation floors;
- changed-source rule;
- full-run cadence;
- baseline and ratchet process;
- survivor classifications;
- equivalent-mutant disable rules;
- property seed and replay policy;
- artifact retention and no-dashboard decision;
- escalation when a test exposes a behavior defect.

Register it in `docs/ACTIVE-DOCS.md` in the same change. The registry entry must describe it as development-assurance authority, subordinate to FOUNDATIONS and domain contracts. It must explicitly say it does not define prompt or validation behavior.

### 13.2 No FOUNDATIONS amendment

No constitutional amendment is recommended. The existing constitution already requires determinism, fail-closed validation, context firewalls, secret safety, local ownership, and the §29 hard-fail checks. This proposal strengthens evidence that implementation continues to satisfy those rules; it adds no new runtime doctrine.

A future amendment should be considered only if the project wants to elevate “mutation thresholds may never be weakened” into a product-level non-negotiable. That would be disproportionate now. The operational document plus reviewable baseline is sufficient authority.

---

## 14. FOUNDATIONS §29 alignment

| Checklist area | Alignment |
|---|---|
| §29.1 identity, branches, accepted prose as canon | No identity or branch model changes. Tests strengthen exclusion of accepted/rejected/superseded prose from prompt context. |
| §29.2 continuity authority | Generated properties use records and user-authored generation fields as the authority; no prose-derived substitute is introduced. |
| §29.3 active working set | Ordering and snapshot properties preserve explicit selection and test storage-order invariance without erasing working-set semantics. |
| §29.4 prompt compilation | P1/P2 directly pin determinism, section contracts, placeholder mapping, ordering, no hidden state, and no accepted prose. |
| §29.5 validation and generation gating | P3 pins exact blocker/warning behavior, no override, destination applicability, and provider-specific readiness. |
| §29.6 POV and reveal | Ideation operator/reveal properties and validation applicability cases preserve existing POV/reveal rules. |
| §29.7 physical continuity | Physical-matrix diagnostic contracts and mutation campaigns strengthen existing blockers without changing them. |
| §29.8 accepted archive | No archive behavior changes; context-firewall canaries ensure archive prose stays out of prompts. |
| §29.9 prompt audit and secrets | No external mutation dashboard; generated reports stay in CI artifacts; server security remains a prioritized separate hardening target. |
| §29.10 data ownership | Tooling operates on source/tests only and introduces no product telemetry, account, or cloud storage. |
| §29.11 workflow quality | Fast local tests remain unchanged; expensive full mutation is scheduled; failures produce replayable, localized evidence. |
| §29.12 notes firewall | P1 canaries preserve author-private note exclusion; no note field is added to compiler authority. |

The proposal also clears the broader authority hierarchy in `docs/ACTIVE-DOCS.md`: FOUNDATIONS and domain contracts supply expected behavior; implementation and test tooling must conform to them, not redefine them.

---

## 15. Acceptance criteria for downstream SPEC-026

The downstream spec should be considered complete only when all of the following are true:

### Tooling

- all six development dependencies are installed at reviewed compatible versions;
- the three Stryker configs mutate exactly the locked scopes;
- dry runs pass without exercising stale build output;
- `vitest.related` has been validated against representative files or disabled where unsafe;
- coverage is disabled by default and available through the dedicated script;
- no production core import boundary changes;
- no external mutation dashboard upload;
- generated directories are narrowly ignored.

### P1

- ordering, optional sections, placeholder mapping, empty states, context firewalls, fingerprint, and token boundaries have independent exact or property-based oracles;
- the full prose golden is unchanged;
- P1 meets floor and ratchet;
- every survivor is classified.

### P2

- all request boundaries, operator predicates, slot relations, dormant rules, citation key relations, and request fields are pinned;
- the ideation golden is unchanged;
- P2 meets floor and ratchet;
- every survivor is classified.

### P3

- every diagnostic code is covered by an independent exact contract case or explicitly justified classification;
- exact severity, applicability, affected targets, and repair behavior are tested;
- warning/blocker and preview/generate distinctions are property-tested;
- reference classes, stable order, dedupe, and immutability are pinned;
- P3 meets floor and ratchet;
- every survivor is classified.

### Enforcement

- scoped coverage is a required PR check;
- changed locked-pillar source triggers forced mutation of every changed file;
- robustness/config/dependency changes force all relevant campaigns;
- cache miss falls back to real work rather than skipping;
- full uncached campaigns run on schedule and manually;
- the reviewed compact baseline is committed and cannot auto-decrease;
- CI artifacts expose enough detail to reproduce failures.

### Governance

- `docs/robustness-testing.md` exists and is registered in `docs/ACTIVE-DOCS.md`;
- no FOUNDATIONS amendment is made;
- no runtime output, schema, diagnostic, or contract version changes;
- any real defect found is handled through a separate correction ticket.

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Mutation runtime becomes unacceptable | Changed-file PR scope, three configs, per-test coverage, safe incremental reuse, scheduled full runs, measurement before tuning. |
| Team games the score with exclusions | No global mutator exclusions; narrow reasoned comments only; ignored mutants remain visible; baseline changes require a ticket. |
| Property tests become flaky | Fixed PR seed, logged scheduled seeds, seed/path replay, bounded generators, minimized counterexamples. |
| Generated tests duplicate implementation | Independent contract tables and minimal defect transforms; never derive expected results from the production rule/operator map under test. |
| Goldens become update buttons | Retain few high-value goldens; use local exact assertions and properties for combinatorial behavior. |
| Incremental cache hides changes | Force config/dependency changes to full; force every changed source file; uncached scheduled runs; cache miss fails safe. |
| Coverage becomes a vanity metric | Mutation is the adequacy gate; coverage only proves reachability. |
| Equivalent mutants prevent arbitrary score targets | Reviewed narrow ignores and a ratchet, not a 100% doctrine. |
| Test work changes product behavior | Explicit dev-tooling boundary, unchanged goldens/contracts, separate behavior-fix tickets, no version bump. |
| Broad server/web mutation consumes effort | Keep them out of the first regime; follow the criticality audit with selective techniques. |

---

## 17. Repository evidence map

### Read in full, authority order

- `docs/ACTIVE-DOCS.md`
- `docs/FOUNDATIONS.md`
- `README.md`
- `docs/user-guide.md`
- `docs/compiler-contract.md`
- `docs/prompt-template.md`
- `docs/prompt-template-rationale.md`
- `docs/ideation-prompt-template.md`
- `docs/story-record-schema.md`
- `docs/validation-rule-inventory.md`
- `docs/stress-suite.md`
- `docs/stress-coverage-matrix.md`
- `docs/demo-blocker-recipes.md`
- `tickets/README.md`
- `tickets/_TEMPLATE.md`
- `AGENTS.md`
- `CLAUDE.md`
- `vitest.config.ts`
- `archive/specs/SPEC-007-deterministic-prompt-compiler.md`
- `archive/specs/SPEC-022-ideation-native-prompt-template.md`
- `archive/specs/SPEC-014-polish-regression-hardening-and-documentation.md`

### Inspected implementation and tests

The acquisition set included the relevant compiler, ideation, validation, record, storage, server, package/script, and test paths named in the research brief. The complete exact URL list is in `exact-commit-acquisition-ledger.txt`. Repository findings in this proposal do not depend on paths outside that ledger.

---

## 18. External research references

External sources inform tool choice and testing technique only. They are not evidence of what exists in the target repository.

- **[E1]** StrykerJS documentation, configuration and thresholds: <https://stryker-mutator.io/docs/stryker-js/configuration/>
- **[E2]** Official StrykerJS Vitest runner documentation: <https://stryker-mutator.io/docs/stryker-js/vitest-runner/>
- **[E3]** Official StrykerJS incremental-mode documentation and limitations: <https://stryker-mutator.io/docs/stryker-js/incremental/>
- **[E4]** Official StrykerJS TypeScript checker documentation: <https://stryker-mutator.io/docs/stryker-js/typescript-checker/>
- **[E5]** Official StrykerJS equivalent/ignored-mutant guidance: <https://stryker-mutator.io/docs/stryker-js/disable-mutants/>
- **[E6]** Vitest coverage guide: <https://vitest.dev/guide/coverage.html>
- **[E7]** Vitest coverage threshold configuration: <https://vitest.dev/config/coverage>
- **[E8]** fast-check, “Why Property-Based Testing?”: <https://fast-check.dev/docs/introduction/why-property-based/>
- **[E9]** fast-check’s Vitest integration guide: <https://fast-check.dev/docs/tutorials/setting-up-your-test-environment/property-based-testing-with-vitest/>
- **[E10]** Koen Claessen and John Hughes, “QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs,” ICFP 2000: <https://doi.org/10.1145/351240.351266>
- **[E11]** René Just et al., “Are Mutants a Valid Substitute for Real Faults in Software Testing?”, FSE 2014: <https://doi.org/10.1145/2635868.2635929>
- **[E12]** A. V. Pizzoleto et al., systematic review of mutation-testing cost reduction: <https://www.albany.edu/faculty/offutt/research/papers/SLR-CostReductionMutation.pdf>
- **[E13]** Sergio Segura et al., “A Survey on Metamorphic Testing,” IEEE TSE 2016: <https://doi.org/10.1109/TSE.2016.2532875>
- **[E14]** Muhammad Numair Mansur, Valentin Wüstholz, and Maria Christakis, “Metamorphic Testing of Datalog Engines,” ESEC/FSE 2021: <https://doi.org/10.1145/3468264.3468573>
- **[E15]** Junjie Chen et al., “A Survey of Compiler Testing,” ACM Computing Surveys: <https://doi.org/10.1145/3363562>
- **[E16]** Lech Madeyski et al., “Overcoming the Equivalent Mutant Problem,” IEEE TSE: <https://madeyski.e-informatyka.pl/download/Madeyski13TSE.pdf>
- **[E17]** StrykerJS 9.6.1 changelog, including the Vitest 4.1 hit-count/coverage fix: <https://github.com/stryker-mutator/stryker-js/blob/master/CHANGELOG.md>
- **[E18]** StrykerJS issue on non-deterministic Vitest test IDs in version-controlled incremental reports: <https://github.com/stryker-mutator/stryker-js/issues/6004>

Package-version references consulted on 2026-06-20:

- Stryker Vitest runner package: <https://github.com/stryker-mutator/stryker-js/blob/master/packages/vitest-runner/package.json>
- `@vitest/coverage-v8`: <https://www.npmjs.com/package/@vitest/coverage-v8>
- fast-check releases: <https://github.com/dubzzz/fast-check/releases>
- `@fast-check/vitest`: <https://www.npmjs.com/package/@fast-check/vitest>

---

## 19. Self-check

- [x] Every read-in-full path required by the research brief was acquired from the target commit and read.
- [x] The absence of mutation and coverage tooling was re-verified against the manifest, root/package manifests, scripts, and `vitest.config.ts`.
- [x] P1, P2, and P3 each have a concrete mutation-survivor analysis and complementary technique mix.
- [x] The secondary criticality audit is present with an evidence-backed verdict for every candidate.
- [x] Mutation testing is the explicit anchor; property, metamorphic, golden, and coverage roles are separately justified.
- [x] The enforcement question is resolved, including floors, changed-source policy, scheduled full runs, and CI-cost trade-offs.
- [x] This is a change proposal, not a `SPEC-NNN`; SPEC-026 appears only as downstream context.
- [x] No recommendation weakens a FOUNDATIONS invariant or alters runtime behavior.
- [x] No FOUNDATIONS amendment is proposed; the new operational doc and mandatory registry entry are explicit.
- [x] Behavior defects discovered by hardening are separated from test/tooling changes.
- [x] `packages/core/src/version.ts` remains untouched.
- [x] Work is decomposed into one-reviewable-diff ticket candidates.
- [x] Every cited Loom `§N` anchor was checked against the exact-commit document.
- [x] The final complete exact-URL acquisition ledger accompanies the deliverable.
