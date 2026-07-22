# Structure and provenance classification

Run: `dec_562970aa-fce6-4d11-b7ba-51d27ef41e8c`

The classification covers every substantive runtime instruction or coherent
instruction group in the baseline Markdown. Executable helpers and their tests
are classified as one group because their contracts are exercised separately.

## Provenance summary

- The target was created in `6645191` on 2026-07-17 with the complete browser,
  setup, prompt, reporting, and helper surface already present.
- `a1508fe` added report/browser defenses after the first playtest.
- `d3dbe5f` added 1,098 lines and most of the method-pilot, evidence-taxonomy,
  challenge, paired-draw, report-schema, and validator machinery.
- `f057019` and `45160f9` added further provider-guard, browser-termination,
  report, and optional quantitative-ledger defenses after later runs.
- `e568f59` changed only validator code/tests. The current bounded-pilot table
  says every pilot is `awaiting-disposition`, so none may execute in an ordinary
  run.

This history is provenance only. Candidate treatment below is based on current
ownership, applicability, executable checks, and the frozen corpus.

## Classification

| Surface and coherent group | Category | Candidate treatment |
| --- | --- | --- |
| `SKILL.md` frontmatter trigger and output description | Core trigger or output contract | Preserve, shorten only if meaning is unchanged. |
| Invocation boundary: one sincere browser journey, one accepted segment or blocker, always report, never fix | Core trigger or output contract | Preserve prominently. |
| Source-and-doc-blind method and sealed new-story expectations | Necessary safety or state-integrity invariant | Preserve. |
| Continuation reads only the supplied report and reopens its `/tmp` project | Necessary safety or state-integrity invariant | Preserve. |
| Visible-UI-only mutation boundary | Necessary safety or state-integrity invariant | Preserve. |
| Blank credential, isolated app/config, pre-navigation provider guard, no send clicks | Necessary safety or state-integrity invariant | Preserve. |
| Exact visible-prompt extraction into a fresh no-parent-context executor | Domain knowledge unavailable to a general agent | Preserve with the exact isolation rule. |
| Human review, local paste, visible edit, explicit acceptance, manual continuity re-authoring | Necessary safety or state-integrity invariant | Preserve. |
| Naturalistic use/skip of Notes and assistance surfaces | Core trigger or output contract | Preserve. |
| `/tmp` custody for projects, prompts, responses, routine screenshots, and settings | Necessary safety or state-integrity invariant | Preserve. |
| Privacy-safe durable evidence restrictions | Necessary safety or state-integrity invariant | Preserve once, point to report rules. |
| Repository custody and allowed run deltas | Necessary safety or state-integrity invariant | Preserve once, remove repeated restatements. |
| `SKILL.md` Bounded method pilots prose | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove from runtime: every pilot is sunset-paused and cannot run. |
| `SKILL.md` Authoritative pilot state table and mutation algorithm | Stale empirical quantity or environment assertion | Remove from runtime; it is a dated count/state owner, not active playtest behavior. |
| Seven-step process and per-step `Done when` clauses | Duplicated instruction | Replace with a shorter orchestration spine pointing to the one canonical reference for each phase. |
| `run-setup.md` new-story/continuation selection | Core trigger or output contract | Preserve. |
| `prepare-run.mjs` path allocation and exact-path use | Current tool-specific requirement | Preserve as helper invocation plus trust-the-receipt rule. |
| Worktree baseline and allowed-delta comparison | Necessary safety or state-integrity invariant | Preserve once. |
| Pre-use intent, story boundary, cast/POV/knowledge/physical/content expectations | Domain knowledge unavailable to a general agent | Preserve in a concise checklist. |
| Prohibition on reading method register/reconstructing pilot counts | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove with the inactive pilots. |
| Optional quantitative action/field ledger | Correct but disproportionately costly rare-case rule | Keep only behind an explicit quantitative-request trigger and point to its template. |
| One-segment run boundary and blocked-report requirement | Core trigger or output contract | Preserve. |
| `author-journey.md` Cold First-View Witness procedure | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove: the sole table owner says the pilot cannot run. |
| Initial-screen source-blind observation and visible project creation | Core trigger or output contract | Preserve without the witness ceremony. |
| Continuation open/archive review and accepted-prose non-authority rule | Necessary safety or state-integrity invariant | Preserve. |
| Story Configuration, Records, Notes, Working Set, Brief, readiness loop | Domain knowledge unavailable to a general agent | Preserve as the core author journey. |
| Natural assistance-surface triggers | Domain knowledge unavailable to a general agent | Preserve once; prompt-specific evaluation remains in prompt reference. |
| Candidate intervention scale, quality blocker, acceptance, post-acceptance manual updates | Domain knowledge unavailable to a general agent | Preserve. |
| Light accessibility/layout observations | Correct but disproportionately costly rare-case rule | Preserve as one short safe-point instruction. |
| `browser-driver.md` repository-pinned helper choice | Current tool-specific requirement | Preserve. |
| Build and safe app-holder commands | Current tool-specific requirement | Preserve exact commands and receipt use. |
| Guarded browser start, loopback origin, endpoint guard, termination semantics | Necessary safety or state-integrity invariant | Preserve; endpoint detail may be delegated to the executable helper. |
| Host loopback permission recovery | Current tool-specific requirement | Preserve conditionally. |
| Unexpected browser-holder recovery | Necessary safety or state-integrity invariant | Preserve conditionally through blocker reference. |
| Full `browser-act.mjs` verb catalogue | Current tool-specific requirement | Replace with `--help` as executable owner plus the few privacy-critical verbs. |
| Semantic locator and no-evaluate/source-selector rules | Necessary safety or state-integrity invariant | Preserve. |
| Inspect-after-action, `/tmp` routine shots, tightly scoped durable evidence | Necessary safety or state-integrity invariant | Preserve once. |
| Browser/app orderly shutdown and session-artifact cleanup | Necessary safety or state-integrity invariant | Preserve. |
| `observation-log.md` opening scratchpad template | Duplicated instruction | Reduce to the fields not already created by `prepare-run.mjs`; common setup remains in `run-setup.md`. |
| Per-observation exhaustive field template | Correct but disproportionately costly rare-case rule | Distill to fact, expectation, impact, evidence, recovery, confidence, and correction without losing observation/interpretation separation. |
| Quantitative journey ledger | Correct but disproportionately costly rare-case rule | Preserve only when the user explicitly requests counts or comparisons. |
| First-view, paired-draw, and claim-challenge scratchpad checkpoints | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove. |
| Evidence-basis, classification, category, and severity vocabularies duplicated in scratchpad/report | Duplicated instruction | Keep one compact canonical vocabulary in report format. |
| Append-only corrections to observations | Necessary safety or state-integrity invariant | Preserve. |
| `prompt-evaluation.md` exact visible exchange and fresh-context protocol | Necessary safety or state-integrity invariant | Preserve. |
| Universal response-usefulness assessment | Domain knowledge unavailable to a general agent | Preserve in a compact rubric. |
| Paired-draw pilot | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove. |
| One prose attempt plus one unchanged-prompt retry | Domain knowledge unavailable to a general agent | Preserve. |
| Per-field Generation Brief influence ledger | Domain knowledge unavailable to a general agent | Preserve. |
| Single-field counterfactual | Correct but disproportionately costly rare-case rule | Preserve conditionally and concisely. |
| Ideate, Record Hygiene, and Segment Reconciliation evaluation criteria | Domain knowledge unavailable to a general agent | Preserve. |
| Prompt/response temporary-artifact cleanup | Necessary safety or state-integrity invariant | Preserve. |
| `blockers-and-diagnostics.md` blocker taxonomy | Core trigger or output contract | Preserve, shorten examples where the governing rule is clear. |
| Bounded recovery sequence | Necessary safety or state-integrity invariant | Preserve exactly in substance. |
| Diagnostics/source/privacy boundary | Necessary safety or state-integrity invariant | Preserve. |
| Provider-attempt terminal handling | Necessary safety or state-integrity invariant | Preserve. |
| Full blocked-report rule | Core trigger or output contract | Preserve. |
| `report-format.md` schema-v2 frontmatter and validator compatibility | Core trigger or output contract | Preserve the exact keys and allowed values; executable validator is canonical for details. |
| Counter and intervention definitions | Current repository convention with a canonical owner | Distill and point to `validate-report.mjs`; method counters remain zero because no method pilot runs. |
| Sixteen-section order and required table shapes | Current repository convention with a canonical owner | Preserve exactly because the validator enforces them. |
| Detailed finding anatomy and evidence-basis vocabulary | Domain knowledge unavailable to a general agent | Preserve compactly in report format only. |
| Cumulative finding ledger and inherited-ID/status rules | Necessary safety or state-integrity invariant | Preserve for continuation custody. |
| Cold First-View, Independent Claim Challenge, and Paired-Draw report subsections | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove from instructions; new reports set the still-required compatibility counters to zero and omit their optional subsections. |
| Continuation handoff fields | Core trigger or output contract | Preserve. |
| Evidence index and privacy rules | Necessary safety or state-integrity invariant | Preserve. |
| Validate, clean temporary evidence, and revalidate | Necessary safety or state-integrity invariant | Preserve. |
| Post-validation method-register and skill-state mutation | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove; ordinary playtests no longer edit the target skill or method register. |
| Executable helpers and tests | Current repository convention with a canonical owner | Preserve byte-for-byte; they own mechanics and backward-compatible report validation. |

## Marked risk patterns and justification

1. **Sunset pilot machinery occupies the common path.** Three witness instruments,
   a method register, counters, state transitions, report subsections, and scratchpad
   schemas remain mandatory reading even though all pilot states prohibit execution.
2. **The same invariants are restated across files.** Provider safety, `/tmp`
   privacy, repository custody, accepted-prose non-authority, and report cleanup
   recur in the skill spine, setup, browser, prompt, blocker, and report references.
3. **Executable contracts are duplicated as prose inventories.** The browser verb
   list and most report validation details can drift from the scripts that enforce
   them; runtime prose should retain safety semantics and point to executable help.
4. **Evidence taxonomies dominate ordinary observation.** Large checkpoint tables
   and evidence labels teach pilot provenance rather than the core author journey.
5. **Rare quantitative instrumentation crowds normal runs.** It is useful only on
   explicit count/comparison requests and should load conditionally.
6. **Layered qualifications expand every baseline answer.** The frozen baseline
   packets repeat method states, report ceremony, and privacy/custody clauses even
   when a task does not trigger those branches.

## Candidate hypothesis

One candidate will remove sunset pilot/runtime bookkeeping, collapse duplicated
rules into canonical homes, make quantitative instrumentation conditional, and
replace executable inventories with narrow pointers. It will preserve every core
author-journey, provider-safety, privacy, local-first, prompt-isolation,
human-gatekeeping, blocker, report-validation, and continuation invariant, while
leaving all scripts and tests byte-identical.
