# Story Pressure Review — PRD-Ready Determination

Status: PRD-ready determination only; no tracker publication, product implementation, active-authority mutation, provider request, or project-data mutation

Source: `reports/continuity-loom-premise-audit-and-intended-changes.md`, selected
sections "Change 2 — Add a pre-generation Causally Due Developments workflow,"
"P1 — The product lacks a dedicated 'causally due' assistance workflow," "P1 —
Open-ended scope requires more than 'active set' or 'whole set'," and "Phase 3 —
Causally Due Developments," together with the repository owner's 27 July 2026
design grill.

Source durability: durable. `reports/continuity-loom-premise-audit-and-intended-changes.md`
is tracked, clean in the worktree, present on `origin/main`, and byte-identical
to that ref. The two prior determinations relied on for custody
(`reports/accepted-segment-change-review-determination.md`,
`reports/cast-possibilities-prd-ready-determination.md`) and
`docs/principles/FOUNDATIONS.md` are likewise tracked, clean, and identical to
`origin/main`. `docs/specs/compiler-contract.md` is tracked and clean at `HEAD`
but its latest revision sits in one commit not yet on `origin/main`; cite it at
`HEAD`, not as an `origin/main` ref.

Authored artifact status: new and untracked on branch `main`. Not a stable
publication citation until committed and pushed.

Live checkout: the checkout moved during this session and this block states the
end state, re-verified after the artifact was written. Branch `main`, `HEAD`
`1f28e10` ("Redesign the Ideate scratch slate onto the shared scratch-card
contract (#210)"), zero commits behind and two ahead of `origin/main`. At intake
the session began on branch `fix/ideate-slate-redesign` at `e590f72` with
uncommitted Ideate surface work; that work landed as `1f28e10` mid-session, so
every intake-time observation about in-flight Ideate changes is now historical.
Pre-existing worktree dirt at close, none of it authored by this determination:
eight modified `reports/skill-evidence/**` ledger files.

Tracker freshness: `gh issue list --state open` on 27 July 2026 returned exactly
one open item, `#206` (Record Hygiene response-envelope trap; `bug`,
`ready-for-agent`). No open tracker item overlaps this determination.

Deliverable status: PRD-ready determination only. No issue was created, no PRD
was published, no specification or code was changed.

---

## Reassessment Verdict

**The report does suggest a line of development, and it is the one phase of its
own plan that was never built.**

Phases 1 and 2 of the report's implementation plan shipped as Accepted-Segment
Change Review. Phase 5 shipped as the cast-identity and dossier-assistance work.
Change 3's retention guidance shipped as ASCR's four-value retention horizon.
Change 4 shipped as `Create linked CAST MEMBER` plus the §26.2 unknown-preserving
import contract. Phase 3 — Causally Due Developments — was formally deferred
twice, partially consumed once, and its remainder has never been built.

The remainder is not a wish list. It maps onto a checkable structural hole:

> Every shipped assistance surface is anchored to *now*. Ideate and Cast
> Possibilities read only the active working set and the saved Generation Brief.
> Accepted-Segment Change Review reads exactly one accepted segment. Record
> Hygiene reads the whole project but asks exactly one question — do these
> records overlap? Nothing in the product answers **what has this story
> accumulated that has come due, gone slack, or been left unexplained.**

That hole sits directly under the single decision `FOUNDATIONS.md` §7 calls "a
first-class authorial decision": active working set curation. Because all four
surfaces are downstream of curation, a curation omission is invisible to every
one of them. In a two-segment story this costs nothing. In the open-ended serial
the product exists to support, it is the failure mode.

**Recommended first PRD seam:** a new whole-project, records-only assistance
surface — **Story Pressure Review** — that reports undischarged pressure and
unexplained state as a cited diagnostic ledger, with no possibility generation,
no apply path, and no working-set mutation. It names the debt; Ideate proposes
the move; the author decides.

**Follow-on candidates:** Unsupported-Novelty Review (constitutional, blocked);
brief-anchored temporal debt (constitutional, deferred); Ideate operator
extension (subsumed or superseded, see below).

**Coverage-only:** the Causal-Premise Validation lane, partially consumed by this
determination as PRD completion evidence and otherwise still deferred method work.

**Supporting-skill result:** see [Supporting Skill Result](#supporting-skill-result).

**External research:** skipped. The user did not authorize online or deep
research, and every claim in this determination is checkable against repository
files at `HEAD`.

---

## Ratified Decision Ledger

`Decision: RATIFIED Which line of development should this determination pursue? -> a story-pressure review surface: a new whole-project project-review assistance workflow; rationale: it is the only substantially unbuilt phase of the report's own plan, it fills the hole every shipped surface sits downstream of, and it needs no constitutional amendment.`

`Decision: RATIFIED What should the surface assert about the project? -> a diagnostic pressure ledger reporting record-state facts and gaps only, never story moves; rationale: Ideate already owns possibility generation, a debt ledger is self-extinguishing as the author discharges it so it cannot degrade into the repetitive plot advice the source report warns about, and it carries no §12 plot-rail exposure.`

`Decision: RATIFIED Which source profile should the surface declare? -> records-only, whole project by default, inside the existing project-review class; rationale: no FOUNDATIONS amendment, Record Hygiene is the shipped precedent, and record-internal consistency claims preserve every strong debt signal without a Generation Brief time anchor.`

`Decision: RATIFIED Which record types enter the projection? -> all sixteen types in Record Hygiene's hygiene-active predicate, split into two finding families; rationale: §18's twelve pressure types carry pressure debt, while FACT, LOCATION, OBJECT, and ENTITY STATUS carry unexplained state, and dropping the latter four would silently delete the causal-questions mode that nothing else in the repository covers.`

`Decision: RATIFIED How should this determination treat the prior deferral's evidence gate? -> ratify on the contract-level mechanism argument, on the same standard Cast Possibilities used, and fold the open-causal continuation run into the PRD as required completion evidence rather than a prerequisite; rationale: the mechanism gap is checkable from live contracts today, and making validation part of the build keeps the report's central premise claim under test without blocking delivery.`

`Decision: RATIFIED Where should the determination land? -> this file, as a PRD-ready determination with no tracker publication; rationale: a later /to-prd pass must not have to reconstruct the mechanism argument, the two-artifact custody chain, or the gate ratification from conversation context.`

---

## Evidence Checked

### Source-recommendation disposition

| Source recommendation | Status | PRD impact |
|---|---|---|
| Change 1 — staged Consequence Review | Fixed | Shipped as Accepted-Segment Change Review, output identity `accepted_segment_change_review.v2`, template `2.1.0`, compiler `2.0.0`. Stages A–C and the six reasoned coverage dimensions landed; Stage D was deliberately refused by `FOUNDATIONS.md` §9.1; Stage F was excluded from the role prompt. None |
| Change 2 — Causally Due Developments | **Fresh product scope** | Entity-responses slice consumed by Cast Possibilities. Remainder is this PRD |
| Change 3 — record-retention guidance | Fixed | ASCR requires one of `durable record candidate`, `next-brief-only`, `no storage`, `author decision required` per item. None |
| Change 4 — progressive character assistance | Fixed | `Create linked CAST MEMBER` on person ENTITY detail (`docs/user-guide.md:71`, `packages/web/src/records/RecordBrowser.test.tsx:1029`); §26.2 governs unknown-preserving import with filled/skipped/uncertain/invented provenance. None |
| Change 5 — acceptance-time unsupported-novelty review | Follow-on, constitutionally blocked | Requires a declared candidate-reading source profile; §9.1, §10, and §29.4 exclude candidates by name. Out of scope |
| Playtest redesign — Test families B/D/E/G | Coverage-only, partially consumed | Test family B enters this PRD as completion evidence; the rest stays deferred method work |
| Phase 0 gold consequence fixtures | Coverage-only | Already owned by the ASCR determination's Coverage Follow-Up. Out of scope |

### Change 2 mode coverage against live contracts

| Report mode | Live coverage | Mechanism |
|---|---|---|
| Entity responses | Covered | Cast Possibilities, `cast_possibilities.v1`. Eligible characters are all and only non-POV CAST MEMBER records named by `active_onstage_cast_full` |
| Focused question | Covered | Ideate Author focus, optional, 500 Unicode code points, non-canonical request context |
| Clock consequences | Partial | Ideate operator `clock_advances`, feeding type `CLOCK`, active-working-set records only |
| Due now | Partial | Ideate operator `debt_comes_due`, feeding types `OBLIGATION`, `CONSEQUENCE`, same scope limit |
| Promise opportunities | Thin | `OPEN THREAD` — the constitutional home for promises per §12 and §18 — has **no dedicated Ideate operator**. It appears only inside `commit_at_a_cost`'s fifteen-type feeding list |
| Offstage ripples | **Absent** | Cast Possibilities is onstage-only by contract; Ideate has no offstage operator |
| Second-order consequences | **Absent** | No operator and no surface |
| Causal questions | **Absent** | Ideate's `questions` mode produces generic author-facing questions, not "which change lacks a recorded cause" |

Verified against `packages/core/src/compiler/ideation/operators.ts` (nine
operators, complete), `docs/specs/cast-possibilities-prompt-template.md` §3, and
`docs/specs/ideation-prompt-template.md` "Request Shape".

### The mechanism argument

Three contract-level facts, each checkable at `HEAD`, establish that no existing
surface can be extended to close the hole:

1. **Ideate cannot see an unselected record.** Its declared profile is
   `prose-aligned`: story configuration, the active working set, and the
   generation-time fields the purpose needs. A pressure record the author did not
   select cannot ground an operator slot, and Author focus explicitly "never
   changes operator eligibility, slot assignment, grounding bundles, citation
   keys, order, dormant selection, or intentional shrinkage."
2. **Record Hygiene's finding contract cannot express single-record debt.** Every
   finding requires two or more distinct citations, exactly one relation from
   `EXACT_DUPLICATE`…`CONFLICT_OR_UNCERTAIN`, and exactly one action from
   `KEEP_DISTINCT`…`HUMAN_REVIEW`, with `MERGE` and `REMOVE` same-type-only and
   survivor-bearing. "This OPEN THREAD is referenced by nothing" has one citation,
   no relation, and no survivor. The shape is wrong, not merely unused.
3. **Accepted-Segment Change Review is bounded to one segment by construction.**
   `latest` is the sole permitted selection, and the role prompt directs the model
   not to draft future possibilities.

This is the same class of argument Cast Possibilities used to clear the same
deferral gate: not "the current surface produces weak output," but "the current
surface's declared contract structurally cannot carry the question."

### Premise-evidence state

The source report's horizon complaint has partly aged out and partly not.
`reports/playtest-the-winter-letter-2026-07-22T160327Z.md` reaches
`accepted_segment_sequence: 5`, past the "no project advances beyond segment 2"
finding. But that run recorded `counterfactual_probes: 0` and
`openrouter_send_controls_clicked: 0`, and its intended segment was prescribed in
advance ("render Clara's deliberation and Tomás's powerless waiting, ending at a
reversible point"). Directed rendering, not open causal continuation.

Repository-wide search at `HEAD` across `docs/`, `packages/`, and `.claude/`
returns zero matches for "causal premise", "premise validation", "counterfactual
fork", "open causal continuation", "offstage ripple", "causal debt", and
"unsupported novelty".

---

## Existing Prep Artifact Status

Two durable prior determinations own this lineage, and this artifact consumes a
documented remainder rather than opening new ground.

`reports/accepted-segment-change-review-determination.md` — durable, partially
consumed, **left untouched**. It is the custody record for the deferred Causally
Due Developments candidate family. Its rule at line 247 reads: *"Evaluate only
after open-causal playtests establish that focused Ideate leaves a material
gap."* Its Coverage Follow-Up also owns the deferred Causal-Premise Validation
lane and the gold consequence fixtures.

`reports/cast-possibilities-prd-ready-determination.md` — durable, partially
consumed, **left untouched**. It consumed only the Entity-responses slice, listed
"the broader Causally Due Developments modes: due-now, clock consequences,
offstage ripples, second-order consequences, promise opportunities, causal
questions, or a broad focused-question mode" as out of scope, rejected
"publish the entire Causally Due Developments program now," and recorded that
"the remaining Causally Due Developments modes stay with the earlier deferred
candidate family. Cast Possibilities neither consumes nor sequences them."

**This determination becomes the local prep owner for Story Pressure Review and
consumes the deferred family's remainder**, with one exception recorded honestly:
the broad focused-question mode was independently satisfied by Ideate's Author
focus and needs no further work. The Unsupported-Novelty Review candidate stays
with the ASCR determination, unconsumed.

**Gate ratification, recorded explicitly.** The prior gate asked for open-causal
playtest evidence, which does not exist. This determination ratifies on the
mechanism argument above instead, and moves the open-causal continuation run into
the PRD as required completion evidence. That is a user-owned decision taken in
the 27 July 2026 grill, not an inference from the prior artifacts. A reader who
disagrees with the substitution should treat the first PRD as blocked until one
open-causal run exists.

`reports/continuity-loom-premise-audit-and-intended-changes.md` remains the
durable upstream evidence source and was not edited.

---

## Authority Findings

**No `FOUNDATIONS.md` amendment is required.** The surface conforms to the
existing assistance class:

- §9.1 already defines `project-review` generically as "a deterministic
  records-only projection of explicitly named story-record types, drawn from an
  explicit, user-selected, disclosed scope — the whole project by default, or a
  narrower scope the user has explicitly chosen — with explicit archive and
  per-type status predicates applied identically to every record within that
  scope." Story Pressure Review is a second instance of that class, not a fourth
  profile.
- §9.1 further permits an assistance prompt to "request non-prose alternatives,
  questions, comparisons, review findings, or structured advisory deltas," and
  requires that "a diagnostic assistance prompt must not be blocked merely
  because it detects the contradiction, overlap, redundancy, staleness, missing
  field, or durable change it exists to inspect."
- §7 explicitly permits the behavior the ledger's scope-visibility disposition
  depends on: "The app may warn when the active working set is risky." The same
  paragraph's prohibition is on the app "silently adding, removing, compressing,
  rewriting, or reprioritizing records" — an advisory finding the author acts on
  by hand in the curation UI does none of those.
- §29.4's constraint is that a project-review prompt must not "cause its source
  records or output to enter a prose prompt or alter active-working-set
  membership." The ledger has no apply path and no membership control.
- §12 is the live risk, and the diagnostic-ledger decision is the mitigation: the
  surface reports record-state facts and gaps and never proposes a story move,
  future action, sequence, or structure.
- §18 supplies the pressure vocabulary and the twelve debt-bearing types.
- §26.1 supplies pull-based invocation, inspected provenance, output quarantine,
  ephemeral handling, and the no-automatic-write rule.

**One compiler-contract correction is owed through the PRD.**
`docs/specs/compiler-contract.md:346` currently states: "The record-hygiene
prompt **is** the project-review assistance source profile." That sentence
identifies the profile *class* with its single shipped *instance*. It is accurate
today and wrong the moment a second instance exists. The implementing revision
must separate the class from the instance rather than adding a parallel claim
beside it.

The future implementation must add one active domain authority,
`docs/specs/story-pressure-review-prompt-template.md`, and register it in
`docs/ACTIVE-DOCS.md` in the same change. The same revision must update:

- `docs/specs/compiler-contract.md` with the class/instance correction plus the
  exact source profile, active predicate, section order, request shape, citation
  map, readiness boundary, output envelope, quarantine rules, and fingerprint
  contract;
- `docs/specs/story-record-schema.md` if and only if the projection needs a
  schema-visible field the hygiene snapshot does not already carry;
- `docs/user-guide.md` with the entry point, source disclosure, no-write
  boundary, stale behavior, and recovery;
- `docs/ACTIVE-DOCS.md`'s version note with the new template, compiler, contract
  versions and output identity;
- stress, robustness, golden, parser, server, component, browser, and privacy
  evidence as required by the touched authorities' maintenance rules.

No stored project schema, migration, export field, accepted-segment metadata,
prompt archive, or provider setting is required. No ADR is owed: the workflow's
spec, compiler contract, and PRD are the appropriate durable owners, matching the
Cast Possibilities precedent.

---

## Recommended First PRD

### Story Pressure Review — Whole-Project Undischarged-Pressure Ledger

**Purpose.** Let an author see, in one deterministic, cited, quarantined pass,
which canonical pressures across the whole project have come due, gone slack, or
been left unexplained — including the ones currently outside the active working
set, where no other surface can see them.

**Sources.** `reports/continuity-loom-premise-audit-and-intended-changes.md`
(Change 2, P1 assistance-workflow finding, P1 scope-layering finding, Phase 3);
`reports/accepted-segment-change-review-determination.md` (deferred candidate
family and its gate); `reports/cast-possibilities-prd-ready-determination.md`
(consumed Entity-responses slice and explicit remainder).

**Problem.** Ideate and Cast Possibilities cannot reason about a record the
author has not selected. Record Hygiene sees the whole project but its finding
contract requires two-or-more citations, a duplication relation, and a survivor,
so it cannot express single-record debt. Accepted-Segment Change Review is bounded
to one accepted segment. `OPEN THREAD`, the constitutional home for promises, has
no dedicated Ideate operator. The result is that undischarged pressure accumulates
invisibly, and the invisibility grows with story length — precisely the regime the
product's premise depends on and has never been tested in.

**Recommended product rule.** Story Pressure Review is a diagnostic ledger, not a
possibility generator. It reports record-state facts and gaps with citations, and
it never proposes a story move, a future action, a sequence, or an outcome.
Possibility generation stays with Ideate and Cast Possibilities. The seam is
strict and load-bearing: **this surface names the debt; Ideate proposes the move;
the author decides and writes canon by hand.**

#### Declared source profile

`story-pressure-review`, a second instance of the §9.1 `project-review` class.

- Records-only. No Generation Brief field, no accepted segment, no candidate, no
  Private Note, no prompt archive, no prior assistance output.
- Whole project by default; one explicit user-selectable narrowing to the active
  working set, mirroring Record Hygiene's two request modes. The active scope
  renders in the compiled prompt and in inspection.
- Adopt Record Hygiene's hygiene-active predicate verbatim. Its per-type status
  table already excludes exactly the discharged lifecycle states a debt ledger
  must ignore — `resolved`, `abandoned`, `fulfilled`, `satisfied`, `closed`,
  `answered`, `superseded`, `settled` — and already retains the states that carry
  debt, including `paused` CLOCK, `blocked` and `suspended` PLAN, `escalated`
  OBLIGATION and OPEN THREAD, and `pending` CONSEQUENCE.
- Sixteen types in scope. `ENTITY` and `CAST MEMBER` appear only as resolved
  complete payload-derived labels in reference summaries, matching Hygiene.
- Complete rendering is mandatory. No ranking, summarization, trimming, batching,
  semantic retrieval, or token-budget eviction. An oversize source fails visibly.
- Each record renders its complete payload-derived label, projected status, full
  escaped payload JSON, outgoing and incoming reference summaries, and one
  deterministic flag stating whether it is currently in the active working set.
  That flag is read-only project data; it mutates nothing and is what makes
  out-of-scope debt visible at all.
- Citation keys are compiler-generated `[TYPE-n]`, one-based per type after
  deterministic ordering, rendering the real `record_id` — reusing the shipped
  hygiene citation-key and record-renderer plumbing.

#### Output contract

Two finding families over one shared envelope.

**Pressure debt** — subjects are §18's twelve pressure types (`PLAN`,
`INTENTION`, `CLOCK`, `OBLIGATION`, `CONSEQUENCE`, `OPEN THREAD`,
`RELATIONSHIP`, `EMOTION`, `VISIBLE AFFORDANCE`, `EVENT`, `SECRET`, `BELIEF`).
Gap kinds:

- `UNREFERENCED` — no other in-scope record references the pressure's subject;
- `DEPENDENCY_STALLED` — depends on a record whose current status cannot discharge it;
- `CONDITION_UNACCOUNTED` — states a threshold, deadline, or trigger condition that no in-scope record asserts has been met or not met;
- `COUNTERPART_MISSING` — a directional pressure names a counterpart with no corresponding in-scope record;
- `HOLDER_UNAVAILABLE` — the holder's or subject's status makes the pressure inoperable as written.

**Unexplained state** — subjects are `FACT`, `LOCATION`, `OBJECT`,
`ENTITY STATUS`. Gap kinds:

- `UNCAUSED_STATE` — asserts a state no `EVENT`, `PLAN`, `CONSEQUENCE`, or `OBLIGATION` accounts for;
- `ORPHANED_STATE` — references a holder, owner, or location record that is absent, archived, or lifecycle-excluded.

Every finding carries a sequential local identifier, its family, exactly one gap
kind, one or more resolvable citation keys (two or more for the cross-record gap
kinds `DEPENDENCY_STALLED`, `COUNTERPART_MISSING`, `ORPHANED_STATE`,
`UNCAUSED_STATE`), a plain-language observation stated as record fact, the
working-set visibility flag, exactly one disposition, and one confidence value.

Dispositions are deliberately non-generative: `HUMAN_REVIEW` (default),
`LIKELY_STILL_CURRENT`, `LIKELY_DISCHARGED`, `MISSING_CAUSE_RECORD`,
`SCOPE_VISIBILITY`. None of them names a story move.

**Reasoned coverage is mandatory**, adopting the anti-false-no-op design ASCR
proved against exactly the P0 failure this report documented. Exactly one reasoned
row for each of seven families:

1. plans and intentions;
2. clocks and scheduled pressure;
3. obligations and consequences;
4. open threads and promises;
5. secrets, beliefs, and knowledge;
6. relationships and emotions;
7. physical, material, and unexplained state.

Each row uses exactly one status — `debt found`, `checked - no debt`, or
`uncertain` — and a nonblank reason. An empty findings list is valid only when
all seven reasoned rows are present, and the result stays visibly labeled as
unverified advisory output rather than proof the project carries no debt.

Whole-response quarantine on: malformed envelope, stale fingerprint, unknown or
duplicate gap kind or disposition, missing or duplicate coverage family,
duplicate finding identifier, unresolvable citation, a cross-record gap kind with
fewer than two citations, or a missing end marker.

**Honest limit, stated in the spec.** The no-story-move discipline is prompt-led
and observed through playtest, not enforced by parser keyword heuristics. ASCR
already established that such heuristics false-positive on ordinary advisory
modals and epistemic hedging; repeating that mistake here would buy false
confidence.

#### Browser-visible guidance mapping

- `entry point and availability`: primary navigation entry; enabled whenever the open project has at least one predicate-qualifying record; disabled with a truthful empty state otherwise — see Entry Point in the PRD body.
- `user-visible states, actions, and outcomes`: scope selector, prompt inspector, copy prompt, explicit Analyze confirmation, finding cards grouped by family, record navigation, session keepers, copy findings, clear.
- `validation, warning, error, and recovery behavior`: purpose-limited readiness only; the surface is never blocked by the debt it exists to detect; oversize source fails visibly; quarantine shows a sanitized receipt and no partial provider output.
- `prompt preview contents and freshness`: active scope, full record count, counts by type, SECRET inclusion, prompt length or token estimate, versions, and fingerprint disclosed before send; any request or project change invalidates the preview and blocks send until recompiled.
- `user-initiated external LLM boundary`: only an explicit Analyze action after inspection sends; opening, scope changes, inspection, keeper manipulation, navigation, and clear make no provider call.
- `canon and prose boundary visibility`: quarantine banner; findings are labeled unverified advisory scratch; no apply, prefill, merge, deactivate, archive, or working-set control exists anywhere on the surface.
- `persistence, migration, export, and provenance`: session-scoped keepers only; no project-store write on any interaction including clear; no prompt archive, no analytics, no migration.
- `browser and accessibility regression scenario`: browser-seam scenario covering scope selection, inspection, explicit send confirmation, finding navigation to a cited record, and keyboard/accessible-name behavior for the finding cards.

#### Acceptance

Deterministic floors, ratified as product gates. The source report's 100%, 90%,
and 85% figures are **not** ratified, on the same reasoning the ASCR
determination applied to them.

1. Identical declared source, request, and versions recompile to identical prompt bytes and fingerprint.
2. Every qualifying record in the selected scope renders completely; none hidden, ranked, summarized, batched, trimmed, or evicted; oversize fails visibly.
3. The server rebuilds the declared source and fingerprint rather than trusting client-supplied bytes.
4. A response missing any of the seven reasoned coverage rows is quarantined whole.
5. Every finding's citations resolve; cross-record gap kinds carry two or more.
6. Zero project-store writes across open, scope change, inspect, keep, copy, clear, and navigate. Proven by server-side assertion, not UI inspection alone.
7. No apply, prefill, insert, merge, deactivate, archive, or active-working-set control exists on the surface. Proven by grep over the surface's components plus a browser scenario.
8. API keys appear in no prompt, output, log, fixture, or artifact.
9. Golden fixtures covering at least one instance of every gap kind, plus one genuinely debt-free project that must produce zero findings with seven reasoned rows.
10. **Open-causal completion evidence:** one playtest continuation run at segment 6 or later of an existing project, using a deliberately sparse `must_render`, in which Story Pressure Review, Ideate, and Cast Possibilities are the author's means of choosing the next unit. The run records directive density, which beats were discovered versus prescribed, which ledger findings were acted on, and whether any finding was out of the active working set at the time. A named steward records the explicit go/no-go; the run does not silently manufacture a numerical product rule.

#### Likely implementation slices

1. Compiler-contract class/instance correction plus the new domain authority spec and `ACTIVE-DOCS.md` registration.
2. Core compiler: snapshot type, predicate reuse, record renderer and citation-key reuse, section order, fingerprint.
3. Core parser: envelope, two finding families, gap-kind and disposition enums, coverage validation, whole-response quarantine, golden fixtures.
4. Server route: source rebuild, fingerprint check, explicit-send boundary, sanitized diagnostics.
5. Web surface: navigation entry, scope selector, inspector, confirmation, finding cards, record navigation, session keepers, clear.
6. Browser and privacy scenarios, user-guide section, version-note update.
7. Open-causal playtest run and steward go/no-go record.

#### Out of scope

- Any possibility, suggestion, next-move, future-action, or outcome text. The ledger reports state and gaps only.
- Generation Brief fields as source, and therefore any wall-clock or brief-anchored temporal claim.
- Accepted prose, candidates, regenerations, Private Notes, prompt archives, and other assistance surfaces' scratch as source.
- Apply, prefill, insert, stage, merge, deactivate, archive, or auto-save of any finding.
- Any active-working-set mutation, cast-band change, record creation, or record mutation.
- Extending Ideate's operator taxonomy, slot assignment, Author focus, or output contract.
- Extending Cast Possibilities to offstage or present-minor cast.
- Persistent finding status, project-store output, durable browser storage, backup or export fields, prompt archives, analytics, telemetry.
- Automatic retry, response repair, provider fallback, model switching, provider-specific prompt forks, hidden source transforms.
- Stored-data migrations and compatibility aliases.
- Act, arc, beat, scene-structure, milestone, or any other §12-prohibited vocabulary in prompt, parser, UI, or spec.

---

## Follow-On Candidates

No follow-on is ratified for publication.

### Unsupported-Novelty Review

**Purpose.** Flag candidate assertions exceeding current canon before acceptance —
new named entities, new biographical or relationship claims, new custody, new
abilities or injuries or causes, narration-only objective facts, and categorical
claims stronger than the records.

**Sources.** Source report Change 5; `reports/accepted-segment-change-review-determination.md:251`.

**Problem.** The source report documents three concrete instances across the
playtests. ASCR catches most of the harm one step later, post-acceptance.

**Open design point.** This requires a declared candidate-reading assistance
source profile, which §9.1, §10, and §29.4 exclude by name. It is a §1.1 verbatim
FOUNDATIONS amendment before any code. Custody stays with the ASCR determination;
this determination does not consume it.

**Evidence gate.** Unchanged from the prior determination: establish precision and
ordinary-texture false-positive rates before proposing product scope.

### Brief-anchored temporal debt

**Purpose.** Let the ledger assert genuine temporal debt — "this deadline is past
and nothing consumed it" — rather than record-internal claims only.

**Problem.** The current time lives in the Generation Brief, and §9.1 defines
`project-review` as records-only. Adding a narrow declared brief projection makes
this a fourth source profile requiring a §1.1 amendment.

**Open design point.** Do not open this until field evidence shows that
record-internal debt claims are too blunt in practice. The first PRD's open-causal
run is the natural place to find out.

### Ideate operator extension

**Purpose.** Add an `OPEN THREAD`-dedicated operator, and possibly offstage and
second-order operators, to Ideate.

**Open design point.** Partly superseded. Once the ledger names thread debt, an
Ideate operator that grounds on a selected `OPEN THREAD` becomes the natural
consumer of that finding — but only the `OPEN THREAD` operator survives that
reasoning cleanly. Offstage and second-order operators remain unratified and
would need their own determination. Note that Ideate's surface was reworked
mid-session and landed as `1f28e10`, moving the scratch slate onto the shared
scratch-card contract; any Ideate operator work should be re-baselined against
that commit rather than against the contract as this determination first read it.

---

## Coverage Follow-Up

**Causal-Premise Validation lane — partially consumed.** One of the ASCR
determination's eight candidate instruments, "open causal continuations with
sparse directives," is consumed by this PRD as completion evidence. The remaining
seven — single-cause counterfactual forks, gold consequence audits, real in-app
provider and result-card execution, directive-density and discovered-versus-
prescribed beat disclosure, longitudinal projects growing toward 12–20 accepted
segments, state-dimension and retrieval coverage, and human authors before
long-form usability or literary-value claims — stay deferred method work owned by
that determination. A later method-design determination must still choose whether
that lane belongs in a new skill, an explicit playtest mode, or a bounded evidence
campaign.

**What would turn it into product work.** If the open-causal run in this PRD shows
that the ledger's findings are acted on but the resulting segments still fail to
feel causally discovered, the bottleneck is upstream of assistance and the lane
becomes product scope on record retrieval or dossier burden, not on more
assistance surfaces.

**Gold consequence fixtures** remain owned by the ASCR determination and are not
consumed here.

---

## Rejected Or No-Op Alternatives

- **Build Change 2 as the report wrote it — a possibility generator with due-now, clock, offstage, second-order, and promise modes:** rejected. It overlaps Ideate's nine operators heavily, carries real §12 exposure once it reasons several steps ahead, and recurs forever rather than extinguishing, which is the report's own stated failure test for causal possibilities.
- **Ledger with a bounded "what this makes available" tail per finding:** rejected. The tail is exactly where plot advice re-enters, and it makes the output contract materially harder to validate deterministically.
- **Add a third mode to Record Hygiene instead of a new surface:** rejected. Hygiene's finding contract — two-or-more citations, duplication relation, survivor, same-type merge and remove — cannot carry single-record debt without being rewritten into a different contract wearing the same name.
- **Restrict the projection to §18's twelve pressure types:** rejected. It drops `FACT`, `LOCATION`, `OBJECT`, and `ENTITY STATUS`, which silently deletes the causal-questions mode that nothing else in the repository covers.
- **Include a narrow Generation Brief projection for a time anchor:** rejected for the first version. It converts a contained build into a §1.1 constitutional amendment, and the strongest debt signals are record-internal.
- **Extend Ideate's source profile to reach unselected records:** rejected. It would break `prose-aligned` source parity with the prose prompt and violate the §7 principle that the author decides what is material.
- **Give findings an apply, prefill, or activate-in-working-set control:** rejected. §29.4 forbids project-review output altering working-set membership, and §26.2's dossier import is the sole prefill exception.
- **Order findings by salience, urgency, or a model-assigned score:** rejected. Deterministic type-then-label-then-id ordering only, matching Hygiene.
- **Enforce the no-story-move rule with parser keyword heuristics:** rejected. ASCR already established these false-positive on ordinary advisory modals and epistemic hedging.
- **Persist findings or track which were acted on:** rejected. The source report is explicit that no persistent dismissed/deferred/watched state should exist, and a debt ledger's recurrence is itself the signal.
- **Publish the Unsupported-Novelty Review alongside this PRD:** rejected. It needs a constitutional amendment first and belongs to a separate determination.
- **Amend `FOUNDATIONS.md` §9.1 to bless a second project-review instance:** no-op. §9.1's profile definition is already generic; only `docs/specs/compiler-contract.md`'s class/instance sentence needs correcting.
- **Create a glossary entry or ADR:** no-op. See [Supporting Skill Result](#supporting-skill-result).

---

## PRD Publication Inputs

**Suggested title:** PRD: Story Pressure Review — Whole-Project Undischarged-Pressure Ledger

**Publication package:** one PRD. The gap kinds, both finding families, the
coverage contract, and the surface share one active route, one decision point,
one seam, and one acceptance proof. A multi-PRD program is not warranted; the
follow-ons above are independently gated and must not be pre-authorized as a
bundle.

**Recommended testing seam:** the core compiler-plus-parser boundary, where a
declared snapshot compiles to fixed prompt bytes and a fixture response either
parses into a validated ledger or quarantines whole. That seam carries the
determinism, completeness, coverage, and quarantine gates without a browser. The
no-write and no-apply gates need the server and browser seams in addition.
**The `/to-prd` seam checkpoint remains owed** — this determination did not
discharge it, and the seam above is a recommendation for that pass to confirm,
not a substitute for it.

**`/to-prd` consulted:** not invoked. House style was taken from the two prior
determinations in `reports/`, which are the stronger repo-local prior art.

**Likely label:** `needs-triage` on publication as a PRD. It stays at
`needs-triage` until every applicable browser-visible checklist item has a
concrete home in the published body; `ready-for-agent` only after decomposition
into implementation issues. **What would downgrade it:** an unhomed applicable
checklist item; a decision to honor the original gate literally and require the
open-causal run first; or discovery during drafting that the compiler-contract
class/instance correction is broader than one sentence.

**Issue-tracker and triage-label docs consulted:** `docs/agents/issue-tracker.md`
(checklist-gating rule and the eight canonical items) and
`docs/agents/triage-labels.md` (five canonical roles; all five labels already
exist in the tracker, so no `gh label create` operation is anticipated).

**Authorities to cite:** `docs/principles/FOUNDATIONS.md` §7, §8, §9.1, §12, §18,
§26.1, §27, §29.3, §29.4; `docs/specs/compiler-contract.md`;
`docs/specs/story-record-hygiene-prompt-template.md`;
`docs/specs/story-record-schema.md`; `docs/ACTIVE-DOCS.md`.

**Prior PRDs and tracker IDs to cite:** PRD #145 and issues #146, #147, #148,
#149 as the ASCR governing record; the Cast Possibilities PRD as the
Entity-responses consumption record. Open tracker overlap: none. `#206` is the
only open issue and is unrelated, though its subject — Record Hygiene's
response-envelope handling — touches plumbing this surface will reuse, so
sequence after it lands.

**Canonical gates:** `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`.

**Focused gates:** core compiler and parser golden fixtures for every gap kind
plus the debt-free project; server no-write and fingerprint-rebuild assertions;
web component and browser scenarios for scope selection, inspection, explicit
send, finding navigation, and keyboard behavior; the privacy assertion that no
key or unsanitized payload reaches the browser or any artifact.

**Field replay expectations:** one bounded real-model evaluation recording
fixtures, prompt and compiler identities, configured model identity, source
disclosure, quarantine disposition, and human rubric results, plus the open-causal
continuation run described in Acceptance item 10. Provider output must not be
committed with project secrets or unsanitized story payloads.

**Source durability warnings:** this determination is new and untracked on a
feature branch. Do not cite it as a stable published reference until it is
committed and pushed. `docs/specs/compiler-contract.md` should be cited at `HEAD`
rather than `origin/main` until the one unpushed commit lands.

---

## Supporting Skill Result

Domain model unchanged — no new app-layer terms, no ADR-worthy decisions.

`docs/agents/domain.md` routes this repository's single-context glossary, and no
`CONTEXT.md` exists at the repository root. "Story Pressure Review" is a product
surface name, not a domain concept: it composes existing constitutional terms
(current pressure, open thread, active working set, project-review assistance)
without introducing or redefining any. The architectural decisions taken here —
second `project-review` instance, records-only sourcing, diagnostic-ledger output
— are owned by the future spec, compiler contract, and PRD, matching the Cast
Possibilities precedent that explicitly recorded "create a glossary entry or ADR"
as a no-op for the same reasons.

---

## Completion Self-Check

- `/to-prd` consulted for house style only: not invoked; repo-local prior art used instead.
- Source artifact posture: durable, tracked, clean, identical to `origin/main`. No temporary paths cited.
- Authored artifact posture: new and untracked on `main` at `1f28e10`, re-verified after writing.
- Tracker freshness: `gh issue list --state open` on 27 July 2026; one open issue, `#206`, unrelated but sequencing-relevant.
- Selected first PRD: Story Pressure Review — Whole-Project Undischarged-Pressure Ledger.
- Follow-on candidates and coverage-only work: recorded, none ratified for publication.
- Recommended testing seam recorded; the `/to-prd` seam checkpoint is explicitly still owed.
- Likely label and downgrade conditions: recorded.
- Issue-tracker and triage-label docs consulted: recorded.
- Canonical and focused gates: recorded.
- Durability warnings: recorded for both the authored artifact and `docs/specs/compiler-contract.md`.
- Path and phrasing sweep: no machine-local paths and no pending-verification phrasing remain in this document.

---

## Freshness And Boundaries

**Refreshed this session.** The source report read end to end; `FOUNDATIONS.md`
§§7–12, 18, 26, 27, 29.3, 29.4 read directly; `docs/ACTIVE-DOCS.md` read in full;
the four assistance specs outlined and their contract-bearing sections read;
`packages/core/src/compiler/ideation/operators.ts` read in full; the
`packages/core/src/compiler/` surface enumerated; `docs/agents/issue-tracker.md`
and `docs/agents/triage-labels.md` read; both prior determinations read for
custody; the most recent playtest report's frontmatter and executive assessment
read; open tracker state queried; git branch, `HEAD`, divergence, and per-file
`origin/main` parity verified.

**Not done.** No PRD published, no issue created, no label applied, no
specification or code changed, no `/to-prd` invocation, no `/to-issues`
invocation, no ADR or glossary entry written. The two prior determinations were
read and cited but not edited.

**Product tests and app runs skipped, with reason.** `npm run lint`,
`npm run typecheck`, `npm test`, and `npm run build` were not run: this
determination changed no source. No app run and no provider request were made;
nothing here required runtime behavior beyond what the contracts state.

**Checkout movement during the session.** The session began on
`fix/ideate-slate-redesign` at `e590f72` and ended on `main` at `1f28e10` after
that branch's Ideate work was committed and merged by a process outside this
determination. All freshness and parity claims in the header were re-verified
against the end state. Source parity against `origin/main` was unaffected: the
source report, both prior determinations, and `FOUNDATIONS.md` remain identical to
`origin/main`, and `docs/specs/compiler-contract.md` remains ahead of it.

**Pre-existing worktree dirt.** Recorded in the header. None of it was authored,
staged, committed, or reverted by this determination.

**Files intentionally added or changed.** Exactly one file added:
`reports/story-pressure-review-prd-ready-determination.md`. Nothing else.
