---
name: spec-to-tickets
description: "Use when decomposing a Continuity Loom spec into actionable implementation tickets aligned with docs/FOUNDATIONS.md. Reads the spec, validates its assumptions against the codebase, then writes one ticket per reviewable diff to tickets/<PREFIX>-NNN.md. Produces: ticket files. Mutates: only tickets/ (never specs/, docs/, or .claude/skills/)."
user-invocable: true
arguments:
  - name: spec_path
    description: "Path to the spec file (e.g., specs/SPEC-001-prompt-compiler.md)"
    required: true
  - name: namespace
    description: "Ticket namespace prefix, used as <PREFIX>-<NNN>.md (e.g., SPEC001PROMPT). If omitted, the skill derives one from the spec number and title and asks the user to confirm."
    required: false
---

# Spec to Tickets

Break a Continuity Loom spec into small, actionable implementation tickets a reviewer can merge one at a time, each validated against the current codebase and aligned with `docs/FOUNDATIONS.md`.

<HARD-GATE>
Do NOT Write any ticket file at `tickets/<PREFIX>-<NNN>.md` until ALL of the following hold:

(a) Pre-flight has verified `docs/FOUNDATIONS.md`, `tickets/_TEMPLATE.md`, `tickets/README.md`, and `<spec_path>` are all readable; if any is missing the skill aborts before Step 1.

(b) Step 2 (codebase validation) has completed, and every surfaced Issue has an explicit user disposition — one of: fix-before-decomposition, defer-to-follow-up-ticket (named dependency), reject-with-rationale (route back to `/reassess-spec`), expand-scope-in-place (decompose against the wider surface the codebase requires; the spec text is not edited), or drop-as-moot (named target doesn't exist AND intent is covered by sibling deliverables or is a structural no-op).

(c) Step 4 has emitted the decomposition summary table in chat (numbered tickets with Title, Scope, Effort, Deps, FND, Notes) AND the user has explicitly approved it, OR the auto-mode carve-out has fired (auto mode active AND Step 2 surfaced no Issues AND no `/reassess-spec` findings were deferred by the user).

(d) Every `Deps` reference resolves to a ticket produced in this run, or to a pre-existing `tickets/` / `specs/` / `archive/specs/` path verified at Pre-flight or at Step 4's cross-spec Deps check before approval.

This gate is authoritative under auto mode and any autonomous-execution context. Invoking the skill does not constitute approval of the decomposition.
</HARD-GATE>

## Process Flow

```
Pre-flight: verify required files readable; derive + confirm <namespace> if omitted
       |
       v
Step 1: mandatory reads (spec, tickets/_TEMPLATE.md, tickets/README.md, docs/FOUNDATIONS.md)
       |
       v
Step 2: codebase validation (load references/codebase-validation.md); surface Issues; await per-Issue disposition
       |
       v
Step 3: decompose the spec (load references/decomposition-patterns.md)
       |
       v
Step 4: present decomposition summary table; await user approval
       |
       +-- [HARD-GATE fires here]
       |
       v
Step 5: batched ticket writes (one or a few messages, parallel Write calls, one per ticket)
       |
       v
Step 6: final summary (cross-ticket Deps check, deliverable coverage, dependency graph, suggested order). Do NOT commit.
```

## Inputs / Output

**Input**: `spec_path` (required); `namespace` (optional, derived + confirmed if omitted). Plan-mode and worktree-root resolution are auto-detected.

**Output**:
- **Ticket files at `tickets/<PREFIX>-<NNN>.md`** — one per reviewable diff, each following `tickets/_TEMPLATE.md` exactly.
- **Decomposition summary table** — emitted in chat at Step 4 before any Write.
- **Final summary** — emitted at Step 6 (cross-ticket Deps verification, deliverable coverage mapping, dependency graph, suggested implementation order).

This skill emits markdown tickets only — no structured YAML records. It operates at pipeline scope: it produces tickets that feed implementation, so FOUNDATIONS alignment applies even though it writes no story-record content itself.

## Prerequisites

Before acting, this skill MUST read:

- `<spec_path>` — the target spec, entire contents (Step 1).
- `tickets/_TEMPLATE.md` — the canonical ticket structure; every ticket must follow it exactly (Step 1).
- `tickets/README.md` — the ticket authoring contract (Step 1).
- `docs/FOUNDATIONS.md` — the non-negotiable design contract. Skip only if read earlier this session and unmodified (Step 1).
- Every file path, skill directory, type, schema field, and spec reference extracted from the spec — read on demand at Step 2.

Reading scope: anything under `specs/`, `archive/specs/`, `.claude/skills/`, `docs/`, `reports/`, and `tickets/`. This skill does not author story-record data and does not read story-record files.

## Reference Files

- **Step 2** — `references/codebase-validation.md`
- **Step 3** — `references/decomposition-patterns.md`

Load each before the corresponding step. Loading both right after Step 1 is the simplest path; on-demand is also fine.

## Worktree & Plan-Mode Awareness

Inside a git worktree, ALL paths (reads, writes, globs, greps) resolve from the worktree root. If plan mode is active, present the decomposition in the plan file and call `ExitPlanMode` in lieu of the Step 4 chat-table approval; write tickets only after approval.

## Pre-flight Check

Before Step 1, verify:
1. `docs/FOUNDATIONS.md` exists and is readable.
2. `tickets/_TEMPLATE.md` exists and is readable.
3. `tickets/README.md` exists and is readable.
4. `<spec_path>` exists and is readable. If it is a glob (e.g. `specs/SPEC-01*`), resolve first: exactly one match → use it (note the resolution); zero or many → abort or ask to disambiguate.
5. `<namespace>` is provided, OR derive one from the spec ID and abbreviated title (e.g. `specs/SPEC-001-prompt-compiler.md` → `SPEC001PROMPT`) and ask the user to confirm or override before Step 1.

If any of checks 1–4 fails, abort with a clear missing-file error. If check 5's spec-ID parsing is ambiguous, ask the user for the namespace directly.

## Step 1: Mandatory Reads

Read ALL of: the spec file (entire), `tickets/_TEMPLATE.md`, `tickets/README.md`, and `docs/FOUNDATIONS.md` (skip the last only if read earlier this session and unmodified).

Parse the spec's metadata (Status, `Depends on:` / `Predecessors:` / `Blocks:` / `Related:`) and its sections (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification — or its equivalently-named carrier: Testing / Acceptance / Acceptance Criteria / Coverage rules / Definition of Done, Out of Scope, Risks & Open Questions, and any deliverable sections).

**Non-numbered deliverables**: many specs lack a numbered `§Deliverables` section. Anchor the deliverable enumeration in this precedence order: (1) a numbered `§Deliverables`; (2) absent that, a `§Implementation sequencing guidance` / `§Sequencing` ordered list when present — its steps are already work-ordered units and usually map close to one-per-ticket; (3) else the items of a `§Scope` / `§In scope` list, or each distinct named implementation section. Whichever enumeration you anchor on, **cross-check its coverage** against the spec's `§Acceptance` / `§Coverage` / `§Verification` (or equivalent) so no testable rule is left unmapped to a ticket, and reconcile divergent counts (one spec may carry, for the same work, a 4-surface `§Scope`, a 9-step `§Implementation sequencing guidance`, and 13 acceptance criteria) rather than treating any single list as exhaustive.

## Step 2: Codebase Validation

**Load `references/codebase-validation.md`.** Validate the spec's assumptions against the current codebase, surface Issues, and obtain a per-Issue disposition before Step 3. A spec that was reassessed via `/reassess-spec` earlier this session with all findings resolved qualifies for the abbreviated spot-check path documented in the reference.

**The reference load is required on both paths — including the abbreviated one.** The abbreviated path is not a license to skip the load and drive the spot-check from `/reassess-spec` memory: the path's required sub-checks (a)–(g) and its output contract live only in `references/codebase-validation.md`. After running the spot-checks, emit the compact inline evidence line the reference prescribes — `Spot-checks: (a) ✓, (b) ✓, (c) skipped — …, (d) ✓, (e) N/A — …, (f) N/A — …, (g) N/A — …` — as Step 2's audit-trail output before Step 3. Prose like "abbreviated spot-check passes" without that enumerated line is an incomplete Step 2.

## Step 3: Decompose the Spec

**Load `references/decomposition-patterns.md`.** Identify discrete work units — each a reviewable diff — map dependencies into each ticket's `Deps`, order by dependency graph and criticality, and ensure every spec deliverable is covered (no silent skipping). The reference documents the deliverable-coverage categories, the merge/split rules, and the recurring ticket-shape patterns (capstone integration ticket, cross-cutting docs ticket).

## Step 4: Present Summary for Approval

Before writing any ticket files, present a numbered summary table:

| # | Ticket ID | Title | Scope | Effort | Pri | Deps | FND | Notes |
|---|-----------|-------|-------|--------|-----|------|-----|-------|
| 1 | <NS>-001  | …     | <5-10 word scope> | Small  | HIGH | None | — | — |
| 2 | <NS>-002  | …     | <5-10 word scope> | Medium | MED  | 001  | §11 | shared file set |

Column roles: **Title** matches the ticket's first line; **Scope** is the deliverable mapping (`D1+D6`) or acceptance surface — must not duplicate the Title; **Effort** Small/Medium/Large (Small ≈ one file + its test; Medium ≈ a new module/route with tests; Large ≈ a multi-component UI surface); **Pri** the ticket's Priority (HIGH/MED/LOW), surfaced here because every ticket carries a `Priority` field the user should see before approving — HIGH when the ticket unblocks ≥2 downstream tickets or gates the dependency chain, LOW for trailing docs/bookkeeping, MED otherwise; **Deps** other tickets in this batch or pre-existing tickets/specs (state once if all independent); **FND** a FOUNDATIONS section only when notable (e.g. §11 validation, §15 secrets), `—` otherwise; **Notes** merged/split deliverables, shared files, multi-dependency validation tickets.

**Cross-spec Deps verification (before HARD-GATE fires)**: run `test -f` (or equivalent) on every cross-spec `Deps` path introduced during Step 3 that was not verified at Pre-flight (typically `specs/<sibling>.md`, `archive/specs/<archived>.md`, or `tickets/<PREFIX>-NNN.md` from a prior batch). Abort with a missing-Deps error if any fails. Cite the result alongside the table (e.g. `Cross-spec Deps verification: N/A — all Deps resolve to tickets produced in this run`).

**Wait for user approval or adjustments.** Do not write files until the user confirms. **Auto-mode / no-stopping carve-out**: when auto mode (or an in-session "work without stopping" directive) is active AND Step 2 surfaced no Issues AND no `/reassess-spec` findings were deferred, auto-approve and proceed; announce it inline and cite the directive. Any open Issue or deferred finding holds the wait-gate per HARD-GATE clause (c). When every Issue carries an explicit recommended disposition under a no-stopping directive, the operator MAY proceed by applying the named dispositions, citing each before the writes; the user can redirect.

## Step 5: Batched Ticket Writes

**Post-approval refinement (mechanical only)**: while composing, you MAY apply a *mechanical tightening* to the approved Step-4 table without re-approval — specifically, removing a `Deps` entry that composition shows is unnecessary, relocating a sub-feature between already-approved sibling tickets of the same deliverable, or adding a `(modify)` of an **already-existing** file that an already-approved deliverable's stated behavior requires (e.g. a navigation deep-link target the deliverable's described behavior implies but the Step-4 table did not enumerate) — provided it adds no ticket, creates no new file, crosses no deliverable boundary, and does not change the ticket count. Disclose every such tightening in the Step 6 summary (original table entry → applied change). Anything beyond that — adding/removing a ticket, changing the count, moving work across deliverables, or introducing a `(new)` file / new deliverable — must round-trip to the user for re-approval per HARD-GATE clause (c). (Touching an additional pre-existing file to fulfil approved behavior is mechanical; creating a new file is not.)

**Pre-write rehearsal (mandatory)**: in the turn immediately before the writes, state the exact number of Write calls the next response will contain. **Pick the cadence by ticket size.** Full `_TEMPLATE.md` tickets in this repo run ~100–150 lines each; at that size, emitting **one Write per turn is the expected, first-class cadence** — announce `1 Write: NNN` and emit exactly that ticket. It is NOT a divergence and carries no penalty; it is the normal path for full-template decompositions. Reserve **multi-Write batches (up to ~3 parallel Writes)** for short tickets (bookkeeping, capstone-only, near-stub) or once a larger parallel batch has already succeeded this session. You MAY state the full cadence plan once upfront (e.g. `one Write per turn, 001…011` or `2 batches: [001,002,003], [004,005,006]`); each subsequent write turn then needs only a one-line restatement (`1 Write: 004` or `Batch 2 — 3 Writes: 004, 005, 006`), not a fresh standalone rehearsal turn. The Write turn that follows must contain exactly that count of Write calls plus at most the one-line restatement — no other tool calls and no other prose. Worked example for a one-per-turn cold run: **Turn A** — state the plan and run the pre-write existence checks (zero Writes); **Turns B…L** — each the line `1 Write: NNN` then exactly that one Write call. (Multi-Write worked example, short tickets / warm session: **Turn B** `Batch 1 — 3 Writes: 001, 002, 003` then those 3 Writes; etc.) **Divergence handling is for *over*-emission only**: if a turn emits MORE Writes than rehearsed, or you are tempted to emit a single catch-up Write "to keep momentum," the next turn is a zero-Write acknowledgment that restates the remaining count and resumes. **Under-emission is not a divergence** — if you announced a multi-Write batch but emitted fewer (e.g. a large ticket consumed the turn), simply continue the next turn with the remaining tickets at whatever cadence fits; do not ratchet the cap down and do not insert a recovery turn.

**Pre-write existence checks** (same rehearsal turn): for every `(modify)` Files-to-Touch entry across the composed tickets, run `test -f` against the working tree; correct or reclassify any path that doesn't resolve. A `(modify)` entry pointing to a file another ticket creates `(new)` in this batch is valid only when the modifying ticket declares `Deps:` on the creator (per `references/decomposition-patterns.md` §Intra-batch create-then-modify chains). **Symmetrically, run `test ! -f` on every `(new)` Files-to-Touch entry** (excluding files an earlier ticket in this batch creates): a `(new)` path that already resolves is a collision — reclassify it to `(modify)` (or rename the planned file) before writing, so a ticket never instructs the implementer to create a file that already exists. New-vs-modify misclassification of test files (a sibling `*.test.tsx`/`*.test.ts` for a surface that already has one is the common case) is cheaper to catch here than at Step 6. For every command in a ticket's Test Plan, confirm it resolves against the repo. Enumerate `(modify)` entries individually, not as a collapsed "all new" claim. Also run a **section-presence self-check** on every composed ticket before emitting its write — assert each `_TEMPLATE.md` `## ` header (Problem, Assumption Reassessment, Architecture Check, Verification Layers, What to Change, Files to Touch, Out of Scope, Acceptance Criteria, Test Plan) **and** each required metadata line (`**Status**`, `**Priority**`, `**Effort**`, `**Engine Changes**`, `**Deps**`) is present in the draft; a missing section (e.g. an omitted `## Verification Layers`) or a dropped metadata field (e.g. `**Engine Changes**`) is cheaper to fix pre-write than to catch at Step 6. (The `## ` headers and the `**bold**` metadata block are distinct grep targets — a `## `-only check cannot see the metadata lines.)

**Cadence-matched timing of the self-check.** "Before emitting its write" binds to *each ticket's own write*, not to a single batch barrier — so the self-check matches whatever cadence you picked: in a **one-Write-per-turn** run, self-check the ticket you are about to write *within its own write turn* (the rehearsal turn covers only the cross-ticket existence / `(modify)` / Test-Plan-command checks, which are greppable before any draft exists); in a **multi-Write batch**, self-check every ticket in that batch immediately before the batch's writes. The composed draft you check is the content you are about to pass to `Write`, not a separate buffer. Step 6's grep loops re-run the same section/metadata/numbering checks against the written files and are the **authoritative** full-batch verification — the Step 5 self-check is the cheap early catch, Step 6 is the backstop. The within-write-turn self-check is **silent** — it inspects the draft you are about to pass to `Write` and needs no narration; its evidence lives in the ticket's Assumption Reassessment. Keep the write turn to the one-line restatement only (per the rehearsal rule above); put any per-ticket fact recap in the rehearsal turn or a seam-confirmation turn, never the write turn.

**Flow**: settle the full decomposition (all ticket designs, Deps, and Files-to-Touch) before the first Write, then emit the Write calls at the cadence chosen above — one Write per turn for full-template tickets, or a multi-Write batch for short tickets / a warm session. The prohibition is on **re-deriving** per ticket: do NOT re-run Step 2/Step 3 validation, re-read references, or re-plan the table between writes. Writing one composed ticket per turn is fine and expected for large tickets; what is not fine is interleaving fresh design/validation work with each write.

**Targeted seam-confirmation carve-out**: confirming a *single internal implementation fact* a ticket's What-to-Change must describe accurately — a function's branch directions, a route/call seam, an exact field set — is NOT "re-deriving" and is permitted in its own dedicated zero-Write turn immediately before that ticket's write. This is expected on the **Abbreviated Spot-Check Path**, where Step 2 confirms references, schema, and blast-radius but *not* the internal behavior a ticket narrates. "Settle the full decomposition before the first Write" binds the ticket **designs, Deps, and Files-to-Touch** — not every internal fact; a just-in-time confirmation Read that neither re-runs Step 2/3 validation nor re-plans the table keeps the ticket codebase-true (the Codebase-truth guardrail) without counting as a divergence. Keep such a Read in its own turn — never inside the Write turn, which still carries no tool calls but the one-line restatement.

For each approved ticket, compose its full content following `tickets/_TEMPLATE.md` exactly — every required section present (Status, Priority, Effort, Engine Changes, Deps, Problem, Assumption Reassessment, Architecture Check, Verification Layers, What to Change, Files to Touch, Out of Scope, Acceptance Criteria, Test Plan). For the **Assumption Reassessment** menu: items 1–3 are always required; for items 4+ **Select** the menu items matching this ticket's scope, **Rewrite** each selected item's number to its position in the surviving list (starting at 4), and **Verify** the final list reads `1, 2, 3, 4, …` with no gaps (a list like `1, 2, 3, 6` means the rewrite step was skipped). **Substrate-only tickets**: when a ticket builds the *inputs* to a FOUNDATIONS enforcement surface a later phase will implement (e.g. a record/brief schema that feeds future validation, deterministic compilation, or the secret firewall — but no validator/compiler exists yet), the secret-firewall / deterministic-compilation menu item still applies: satisfy it by naming the deferred enforcement surface and confirming the data-model change introduces no leakage or nondeterminism path the later surface would have to undo, citing the phase that will enforce it. Every ticket modifying existing behavior must cite the change rationale in Assumption Reassessment (no silent retcon — §20). **`Engine Changes` for non-behavioral tickets**: a test-only or docs-only ticket sets `Engine Changes: Yes — <new/modified test or doc surfaces>; no production behavior change`, naming the surfaces it adds while making explicit that runtime behavior is unchanged — do not mark it `None` (the field tracks surfaces touched, not only behavioral deltas). Apply this convention uniformly across a batch.

After the batch returns, verify every ticket file exists; retry any failed Write before Step 6. If a system-reminder shows a ticket was externally edited (e.g. a linter hook), treat the edit as authoritative and re-verify sibling references against the edited content before the final summary.

## Step 6: Final Summary

After writing all files:

1. **Cross-ticket dependency consistency**: for each `Deps`, confirm the depended-on ticket actually produces what the dependent needs; `test -f` every `Deps` path at emission time. If a `(modify)` Files-to-Touch entry names a file a sibling creates `(new)` in this batch without a declared `Deps` on the creator, flag it.
2. **Template fidelity**: confirm every required section is present and that each ticket's Assumption Reassessment uses gapless sequential numbering starting at 1. Section-presence check (run per ticket): `for s in "## Problem" "## Assumption Reassessment" "## Architecture Check" "## Verification Layers" "## What to Change" "## Files to Touch" "## Out of Scope" "## Acceptance Criteria" "## Test Plan"; do grep -qF "$s" tickets/<PREFIX>-NNN.md || echo "MISSING $s in <PREFIX>-NNN"; done` — must print nothing. Metadata-presence check (the `## `-only loop above cannot see these): `for m in "**Status**" "**Priority**" "**Effort**" "**Engine Changes**" "**Deps**"; do grep -qF "$m" tickets/<PREFIX>-NNN.md || echo "MISSING $m in <PREFIX>-NNN"; done` — must also print nothing. Numbering check: `awk '/^## Assumption Reassessment/,/^## Architecture Check/' tickets/<PREFIX>-NNN.md | grep -oE '^[0-9]+'` should be strictly sequential. Also confirm each applicable conditional menu item is present **by its content, not its position** (Step 5 renumbers selected menu items to gapless positions starting at 4, so a ticket's position number no longer maps to the original menu number): a FOUNDATIONS principle / Validation Rule motivated → the FOUNDATIONS-principle item; a fail-closed-validation / secret-firewall / deterministic-compilation surface touched (including substrate that feeds a deferred enforcement surface — see Step 5) → the secret-firewall/determinism item; an existing output schema extended → the schema-extension item; a skill/symbol renamed or removed → the rename/removal item.
3. **Deliverable coverage mapping**: list each spec deliverable and the ticket(s) covering it (`D1→001`, `D3→003+004` for a split), including the exempt categories from `references/decomposition-patterns.md`. Flag any uncovered deliverable.
4. List: all ticket files created, the dependency graph, the suggested implementation order, any **deferred `/reassess-spec` findings** ("may warrant separate tickets"), any **cross-spec follow-ups** surfaced by the spec's Risks section or discovered during decomposition, and any **post-approval mechanical refinements** applied during Step 5 (per §Step 5 Post-approval refinement — original table entry → applied change). **Discovered non-deliverable remediation** (dead code, an orphaned symbol, an adjacent cleanup that is *not* a deliverable of this spec) defaults to a listing here — do NOT auto-create a ticket for it. Create one only on explicit user request; when you do, author it under a **standalone non-spec namespace** (e.g. `CLEANUP-NNN`, distinct from the spec's `<PREFIX>`), mark it independent of the spec's approved decomposition and exempt from that run's HARD-GATE table, declare its real `Deps` (often `None`), and validate it for codebase-truth and template fidelity like any other ticket.
5. **Shared-file overlaps**: enumerate files that ≥2 mutually-independent tickets each modify — tickets with no `Deps` on each other, even when they share a common upstream `Deps` (parallel siblings off one foundation ticket still merge-conflict on a shared file), and whether the shared file is pre-existing or created in-batch by that foundation ticket — so implementers coordinate mechanical merges.

Do NOT commit. Leave files for user review.

## Guardrails

- **FOUNDATIONS is authoritative**: never approve a decomposition that violates a FOUNDATIONS principle or trips a §29 hard-fail — flag it as a CRITICAL Issue at Step 2 and await disposition.
- **Template fidelity**: every ticket uses `tickets/_TEMPLATE.md` exactly — no ad-hoc sections, no missing fields, no "simplified" variants. Template evolution is a separate spec.
- **Ticket fidelity**: never silently skip a deliverable. If one seems wrong, use the 1-problem / 3-options / 1-recommendation format and ask.
- **Codebase truth**: file paths, skill names, types, and schema references in tickets must be validated against the actual codebase, not assumed from the spec. Stale references propagated spec → ticket are a skill failure.
- **Reviewable size**: each ticket should be reviewable as a single diff. When in doubt, split.
- **Explicit dependencies**: declare inter-ticket ordering in `Deps`; never leave it implicit. Every `Deps` entry resolves to a ticket produced this run or a verified pre-existing path.
- **No spec edits**: this skill never edits the source spec. If decomposition reveals a spec defect, flag it as an Issue and route the fix to `/reassess-spec`.
- **Worktree discipline**: inside a worktree, all paths resolve from the worktree root.
- **Do not `git commit`**: writes land in the working tree; the user reviews and commits.

## FOUNDATIONS Alignment

| Principle | Step | Mechanism |
|-----------|------|-----------|
| §4 Non-negotiable principles | Pre-flight + Step 1 | FOUNDATIONS.md, _TEMPLATE.md, README.md, and the spec are required reads; the skill refuses to decompose without them. |
| §8 Deterministic prompt compilation | Step 2 | Deliverables touching compilation are flagged if they introduce a nondeterministic input or an LLM intermediary in the compilation path. |
| §11 Validation and hard fails | Step 2 | Deliverables proposing validation rules must stay deterministic and blocking and distinguish warnings from blockers; deviations are flagged. |
| §15 POV, knowledge, secrets | Step 2 | Deliverables touching POV/secret handling that would weaken the secret firewall trigger a CRITICAL Issue. |
| §20 Durable change & human gatekeeping | Step 5 | Every ticket modifying existing behavior must cite the change rationale in Assumption Reassessment (no silent retcon). |
| §29 Alignment checklist | Step 2 | Any §29 hard-fail answered "yes" is a CRITICAL Issue blocking decomposition. |

## Final Rule

A decomposition is not complete until every spec deliverable maps to a ticket OR to an explicit non-goal OR to a documented exempt category, every `Deps` resolves to a real target, every ticket's Files to Touch matches the current codebase, and every FOUNDATIONS-impacting deliverable has been validated against `docs/FOUNDATIONS.md` before its ticket was written.
