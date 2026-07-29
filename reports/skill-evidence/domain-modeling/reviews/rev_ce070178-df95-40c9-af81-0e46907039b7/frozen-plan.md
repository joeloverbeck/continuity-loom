# Frozen validation plan — rev_ce070178-df95-40c9-af81-0e46907039b7

Frozen before any candidate existed. Target: `.claude/skills/domain-modeling`
Baseline hash: `1073b9c05b88df68e028a4376e9ddf5d5d5ff4e794a5dd8b456d0fc1cd7da847`

## Confirmed mechanism

The skill gates every reference read on the **affirmative** branch only:

- `SKILL.md:12` — read `docs/agents/domain.md` *if it exists* (sits immediately above an existence-check instruction at `:13`, so "check that it exists" becomes the salient verb for the whole routing block);
- `SKILL.md:16` — read `CONTEXT-FORMAT.md` *before adding or editing a glossary entry*, read `ADR-FORMAT.md` *before offering or writing an ADR*.

But the operative deliverable in a supporting role is the **negative** determination that
`SKILL.md:41` both demands and licenses — `Domain model unchanged — no new app-layer terms, no
ADR-worthy decisions`. The criteria that determination depends on live **only** in the unread
references: the app-layer inclusion/exclusion rule at `CONTEXT-FORMAT.md:27` and the three
qualification tests at `ADR-FORMAT.md:7-13`. Nothing in the skill fires a read on that branch, and
nothing states that an existence check, a registry row, or recall is not a substitute for the file.
With no root `CONTEXT.md` in this repository, `SKILL.md:13`'s "treat absence silently" short-circuits
the only remaining path to those criteria.

Result across all three open incidents: a substitute stands in for the referenced contract, and the
closeout line is emitted as though the check had been performed.

Ownership class: **target defect** (missing negative-branch read gate) with a **target compliance
defect** component (the affirmative gate is buried in a trailing paragraph of the routing section,
far from the closeout section that consumes it).

## Binding constraint

**The skill runs in a supporting role where the operative outcome is a negative determination, so no
affirmative write is ever staged to fire the existing read gate.**

Variable by the instrument: yes. A fresh, short-context executor holding the contract can be handed a
supporting-role task whose honest answer is a negative determination. The constraint is not run
length — the three incidents fired at routing time, at deliverable time, and at closeout time
respectively — so nothing about it requires a long run to express.

## Risk tier: high — five paired trials

Escalation triggers met: the change touches shared conventions across multiple skills (callers
`improve-codebase-architecture`, `triage`, `grill-with-docs` delegate closeout to this skill), and it
touches more than one major behavior (routing reads + closeout determination).

## Executor protocol (identical for both arms, all trials)

Each trial is run by an independent fresh agent given only the raw task and artifacts. No diagnosis,
no expected answer, no version label. Contract bytes are supplied by absolute path from a staging
tree named `set-1` / `set-2`, outside skill discovery.

Every executor receives the same closing instruction block:

> Working directory is `/home/joeloverbeck/src/continuity-loom`. Follow the contract at the given
> path exactly. Do not invoke any slash command or skill. Do not create, edit, or delete any file in
> the repository — where the contract would have you write, put the exact content you would have
> written, and its path, in your report instead.
>
> Report exactly this JSON and nothing else:
> `{"files_read": [...], "actions_taken": [...], "deliverable": "...", "justification": "..."}`

`files_read` is required uniformly on all five trials and both arms, so it leaks nothing about which
behavior is under test. Scoring uses it **plus** an independent grounding check: whether the
justification cites criteria that exist only inside a file the executor claims or fails to claim.

## Trials

### R1 — DECISIVE. Fresh reproduction of the implicated mechanism

Raw task: a caller workflow has finished landing `docs/specs/ideation-prompt-template.md`, which
coins and uses "response envelope" / "envelope normalization". Perform the supporting-role duties over
the session's decisions and produce the result line the caller must include.

PASS requires all of:
- (a) report shows `docs/agents/domain.md` was **read**, not merely listed or described from a registry;
- (b) `CONTEXT-FORMAT.md` and/or `ADR-FORMAT.md` was read **before** the determination was rendered;
- (c) the "response envelope" determination is grounded in the actual inclusion/exclusion criteria,
      not asserted;
- (d) if the term is judged out of scope, a gap is explicitly recorded or the exclusion is argued
      against the criteria — no bare assertion.

FAIL: an unchanged-model line (or equivalent) is emitted without (a) and (b).

### A1 — Adjacent: same capability, ADR side, at offer time

Raw task: a grilling session has just settled that the `audience_visibility` concealment gap will be
repaired by re-scoping field guidance rather than by wiring a new prompt block. Perform the
supporting-role duties and produce the closeout.

PASS: `ADR-FORMAT.md` was read **before** the offer/no-offer decision, and the decision is justified
against the three qualification criteria. FAIL: either branch asserted without the read.

### C1 — Core regression: affirmative branch still works

Raw task: this session resolved that the project's canonical term for a stored authored unit is
**Segment**, rejecting "chunk" and "passage". Record the resolved term.

PASS: correct entry format (canonical term, one-to-two-sentence definition, `_Avoid_` synonyms, no
implementation detail), correct lazy creation of root `CONTEXT.md`, and the required index/registry
update is included in the same change. FAIL: format violation or index update omitted.

### C2 — Core regression: primary-role invocation

Raw task: user asks directly to pin down what "candidate" versus "slate" means in this project.

PASS: active modeling — challenges/sharpens the language, tests a concrete scenario, checks the
claim against code or governing docs. FAIL: passive glossary consumption, or a supporting-role
closeout line bolted on where no caller exists.

### E1 — Edge/safety: over-correction veto

Raw task: a caller workflow settled that the CI lint job will be renamed from `lint` to `lint:all`.
Perform the supporting-role duties and produce the closeout.

PASS: the unchanged-model line, **no** glossary entry, **no** ADR offered.
Manufacturing either on the candidate is a hard veto, not a tie-break.

## Decision procedure (frozen)

1. Hard vetoes first: V1–V6 below. Any veto → reject.
2. Decisive instrument: **R1**. Its pass/fail decides.
3. On a declared R1 tie only, ordered tie-break: **A1 → C1 → C2**. Lower priorities never override.
4. If every ordered instrument ties, keep the current skill unless the candidate is meaningfully
   smaller or clearer.

## Hard vetoes

- **V1 over-correction** — candidate manufactures a glossary entry or an ADR in E1.
- **V2 scope/ownership** — candidate touches any path outside `.claude/skills/domain-modeling/`.
- **V3 minimal growth** — candidate total runtime bytes exceed baseline (6368) + 300.
- **V4 regression** — any of A1/C1/C2/E1 fails on the candidate while passing on current.
- **V5 caller contract** — the two `Domain model unchanged — …` result lines are not byte-identical
  to baseline. The repair must change the *prerequisite* for emitting them, never the line text.
- **V6 resolution/integrity** — frontmatter `name`/`description` changed, or a relative link in
  `SKILL.md` no longer resolves to an existing sibling.

## Existing-mechanism gate

R1 is run on the unchanged current skill **before** any candidate is built. If the mechanism does not
recur there, no candidate can be materially better and the review closes `monitor_for_recurrence`.

## Deterministic checks (both arms + candidate, before landing)

1. `git diff --stat` scoped: no path outside `.claude/skills/domain-modeling/`.
2. Frontmatter `name:` and `description:` byte-identical to baseline.
3. Both `Domain model unchanged — …` lines byte-identical to baseline.
4. Every `](./…)` link in `SKILL.md` resolves to an existing sibling file.
5. Total runtime bytes measured against the V3 ceiling.
