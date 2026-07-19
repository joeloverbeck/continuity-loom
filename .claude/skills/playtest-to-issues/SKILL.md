---
name: playtest-to-issues
description: Take custody of a validated playtest PRD-prep portfolio before PRD publication by resolving every non-PRD follow-up to a verified issue, existing owner, routed workflow, or explicit no-create disposition, then returning only the unconsumed PRD queue. Use after playtest-prd-prep produces a *-prd-prep.md report, when asked to create that report's individual issues, or when to-prd detects a playtest prep without a current custody receipt.
---

# Playtest To Issues

Own the missing middle between `playtest-prd-prep` and `/to-prd`. Treat every row in
`## Non-PRD Follow-Up` as held in **custody** until it has a verified owner or an explicit,
evidence-backed no-create disposition. Do not draft or publish a PRD.

## 1. Freeze the portfolio

Require one exact `reports/*-prd-prep.md` path. Reject source playtest reports and ambiguous globs.
Run:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs intake <prep-artifact>
```

The intake command runs the current final-mode producer validator and the custody inspector. Use
its exact `sourceReport`, `nonPrdFollowUps`, `ticketPackets`, `prdCandidates`, prep SHA-256,
publication package, first operational action, contract identity, and contract diagnostics as the
inventory frontier. `current` and `legacy-compatible` are the only passing intake states. The
latter accepts only versioned, additive, evidence-preserving omissions from an otherwise complete
historical artifact; it never waives source, inventory, privacy, or semantic errors.
`migration-required` means a legacy field changed meaning: stop and surface the exact
`migration.invocation` returned by intake. `invalid` covers malformed current artifacts, unsupported
future versions, and non-compatibility failures. Both block custody. Never repair, rewrite, or
reinterpret the producer artifact here; only `$playtest-prd-prep` migrates the same-stem artifact.

Capture `git status --short --untracked-files=all`, branch, HEAD, and the publication ref. Read
`AGENTS.md`, `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md`,
`docs/agents/issue-tracker.md`, and `docs/agents/triage-labels.md`, plus the active authorities for
the affected surfaces. Enumerate every repo-relative evidence asset linked from the source report,
including screenshot and image links. Classify the source report, each linked evidence dependency,
and the prep artifact separately for durability; do not assume report durability covers its links.

This step is complete only when the exact prep bytes, complete downstream inventory, live
authority set, tracker vocabulary, and baseline dirt are known.

## 2. Reconcile every non-PRD row

For each inspector row, read its matching Evidence Disposition Ledger and Authority And
Change-Surface Map entries. Refresh current code/test evidence and search open and relevant closed
tracker work with exact report IDs, scoped terms, and exact-title guards. Fetch likely owners by
number; never treat an empty or failed tracker read as proof of no owner.

For each `ticket - <name>` destination in a current artifact, read the matching named ticket packet
as the proposed problem, product rule, affected surfaces, scope, acceptance, preservation, testing,
exclusion, and browser-guidance contract. Verify it against live authority and evidence rather than
silently widening it. For a `legacy-compatible` artifact without the newer packet fields, use the
existing disposition, authority-map, and follow-up evidence and record the missing modern packet as
an intake limitation.

Assign exactly one custody disposition:

- `published` — a newly approved issue was created and exact-read;
- `existing-owner` — a current issue already owns the complete live work and was exact-read;
- `routed` — a non-tracker workflow such as `$skill-audit` or a research commission owns it, with
  the exact next invocation surfaced;
- `no-create` — current evidence proves covered, rejected, superseded, or genuinely unnecessary;
  or
- `blocked` — evidence, durability, tracker access, or a user decision prevents truthful custody.

When `routed` names another `$<skill>`, resolve one current `SKILL.md`, read it completely, and
confirm that the proposed invocation satisfies its trigger, input, and current state constraints.
Record that contract check in the route evidence without executing the routed skill. An absent,
ambiguous, or incompatible destination is `blocked`, not an informal future reminder.

Ticket, coverage, doc-correction, and verification/reopen rows are issue candidates by default.
Do not discard a coverage row because it is not yet a product bug; publish it as verification work
without a false bug/enhancement label when it is bounded and actionable. Do not reopen, relabel,
comment on, or close an existing issue without explicit approval for that mutation.

Build the temporary custody ledger defined by
[Custody ledger and receipt contract](references/custody-contract.md). Keep one entry per source
row in source order. A grouped issue may own several rows only when its body and acceptance proof
name every grouped item; record the same verified issue on each covered ledger row.

This step is complete only when every non-PRD row has one proposed disposition, concrete evidence,
and either a proposed issue contract, exact owner, exact route, no-create rationale, or blocker.

## 3. Reconcile the PRD queue and first action

Classify every inspector PRD candidate as:

- `remaining` — still-live PRD-scale scope for a later `/to-prd` pass;
- `consumed` — an exact-read PRD already owns it;
- `rejected` — current authority or evidence removes it from PRD scope; or
- `blocked` — its PRD status cannot yet be determined truthfully.

Classify the exact substantive `First operational action` as `satisfied`, `owned`, `not-required`,
or `blocked`. The producer and inspector reject the mandatory `$playtest-to-issues` or `/to-prd`
handoff as circular first actions. Preserve candidate order and role. Do not promote a non-PRD row
into a PRD merely to avoid creating an individual issue, and do not bundle deferred candidates into
the first PRD.

This step is complete only when every PRD candidate and the first operational action have one
evidence-backed current disposition.

## 4. Present one custody checkpoint

Read [`../to-issues/SKILL.md`](../to-issues/SKILL.md) completely before presenting this checkpoint.
Its Step 4 owns the approval-safe issue breakdown and checklist-to-final-acceptance mapping shape.
Apply that preapproval contract here without staging bodies or reading the approval-only publication
protocol early. In particular, resolve every named component of a composite checklist item in the
proposed final acceptance criteria before asking for publication approval.

Before any tracker mutation, present:

1. one row per non-PRD item with its disposition, proposed title or owner/route, labels, blockers,
   and evidence;
2. the first operational action and its status;
3. the ordered remaining PRD queue, including consumed/rejected candidates for contrast; and
4. the eight publication posture lines required by `to-issues`: decision scan, source
   relationship, parent disposition, source/target, prerequisites, publication, artifacts, and
   coverage.

Use artifact-source mode when the canonical playtest report is durable at the publication ref and
every linked evidence dependency is durable at that same ref, and there is no truthful tracker
parent. Name the report and complete dependency set in the artifact posture. If any required path
is untracked, dirty, ref-invisible, or ref-different, obtain explicit source-publication
authorization and publish those exact paths before requesting issue-publication approval; otherwise
artifact-source mode is blocked. Each proposed issue must carry `## Source and coordination`, the
durable report token, and exact wording that it is a standalone non-PRD follow-up which neither
ratifies nor implements the remaining PRD candidates. Parent disposition and parent ledger are
N/A. Never cite an untracked prep path as durable source.

Map the browser-visible guidance checklist to final acceptance criteria for every affected issue.
Show specific N/A reasons for unaffected verification or process work. Include exact-title
duplicate results and the source/prep durability disposition.

If no mutation is proposed because every row already has custody, finish read-only without asking
for publication approval. Otherwise ask one approval question covering every proposed issue and
all eight postures, then stop. Approval authorizes only the listed issue creations and explicitly
named existing-issue mutations.

## 5. Publish approved issues

After approval, read
[`../to-issues/references/publication-protocol.md`](../to-issues/references/publication-protocol.md)
completely and follow it in artifact-source mode. Do not duplicate its staging, run-sheet,
working-publication-ledger, serial-create, exact-read, recovery, family-verification, or cleanup
rules here.

Declare the report path as `artifactSource.path` and the complete linked evidence set as
`artifactSource.dependencies` in the family manifest. The dependency array is required even when
empty.

Freeze the approved custody ledger before staging. After each issue verifies, update both the
publication ledger and the corresponding custody entries. If a mutation fails ambiguously, stop
and reconcile the exact title before retrying. Never continue past a failed per-issue verifier.

This step is complete only when the shared family verifier passes for the approved issue count and
artifact source, and every published custody entry records the verified number, URL, state, and
exact labels.

## 6. Close custody and return the PRD queue

Read the [Custody ledger and receipt contract](references/custody-contract.md) completely before
closeout. Run:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs validate <prep-artifact> <custody-ledger.json>
```

Fix structural mismatches and rerun. A `blocked` row or blocked first action is valid evidence but
fails custody completion. In that branch, capture the final branch and exact full-worktree status,
then use the contract's `render-blocked-receipt` command. Remove every temporary artifact, prove
absence, and rerun branch plus full worktree status. Emit the captured blocked receipt verbatim
only when cleanup succeeded and those final values still match the renderer inputs, then stop.
The renderer preserves every blocker and both inventory tables and states that `/to-prd` must not
proceed from this artifact; do not hand-format or abbreviate that closeout.

For a passing ledger, capture the final branch and exact full-worktree status, then use the
contract's `render-receipt` command to capture the exact `## Playtest Follow-Up Custody Receipt`.
Do not hand-format or abbreviate its paths, evidence, routes, inventory rows, or separators. If
PRDs remain, the renderer names the first candidate and emits the exact next invocation:

```text
$to-prd "<prep-artifact> - create <exact first remaining PRD candidate>"
```

List deferred candidates without ratifying them. If none remain, the renderer states
`PRD queue: exhausted` and does not recommend `/to-prd`. Remove every temporary ledger, body, run
sheet, manifest, and snapshot, prove absence, and rerun branch plus full worktree status. Emit the
captured renderer output verbatim only when cleanup succeeded and those final values still match
the renderer inputs; otherwise do not claim a passing receipt.

The run is complete only when the prep hash still matches, every non-PRD row and PRD candidate is
accounted for, every claimed tracker owner is exact-read, every approved creation is family-
verified, the custody validator passes, the receipt names the next PRD action or exhaustion, and
temporary artifacts are absent.
