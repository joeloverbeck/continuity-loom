---
name: to-prd
description: Turn the current conversation into a PRD and publish it to the project issue tracker — no requirements interview, just synthesis of what you've already discussed; the seam confirmation is the sole checkpoint.
---

Synthesize the current conversation and codebase understanding into one PRD, or
one PRD per entry when the user explicitly ratified a multi-PRD program. Do not
run a requirements interview. Step 2 is the sole user checkpoint.

Use the tracker and label vocabulary configured by the repository. If they are
not configured, run `/setup-matt-pocock-skills`. Before publication, follow the
repo entrypoint and its issue-tracker and triage-label authorities.

## House-style-only consultation

When another skill asks only for `to-prd` house style, do not draft, stage,
publish, label, or verify an issue. Load only the relevant parts of the
[body contract](references/prd-body.md), [durability rules](references/source-durability.md),
and [publication rules](references/publication.md), then return the requested
shape, source posture, package/label inputs, checklist mapping, seam inputs, and
a note that the later `to-prd` checkpoint remains owed.

## Process

### 1. Establish intake and scope

Run `git status --short --untracked-files=all`, then complete the [intake and
scope rules](references/intake.md). Establish the active authorities, trustworthy
source bytes, same-kind house style, decision state, and intended package before
drafting. If indispensable exact authority is unavailable, stop with
`needs-info`; never reconstruct required exact wording.

### 2. Ratify testing seams and publication package

Sketch external-behavior tests at the highest useful existing seam. Prefer fewer
existing seams over new internal-only interfaces. For non-code deliverables,
name review or conformance checks and test only the implementation surface. For
a behavior-preserving refactor, reuse current tests as the specification and say
that behavior preservation is the acceptance bar.

Classify the package as one intended PRD, a ratified multi-PRD program, or a
first PRD with deferred follow-ons. A source that selects a first PRD does not
ratify its follow-ons; publish those only when the user explicitly asks for the
whole program.

An explicit create/publish request after a same-session determination ratifies
the selected product scope unless the user asks only for a draft, keeps a named
decision open, or revises the recommendation. It does not silently ratify seams
or open decision-ledger rows.

Ask one combined checkpoint confirming:

- the exact seams and publication package;
- every still-open decision that user ratification can close, with its proposed
  resolution and label consequence; and
- any missing label's canonical name, color, description, and creation command.

Skip the question only when the same session already contains an explicit
receipt naming those seams, package, and decision dispositions, or an upstream
handoff says this `to-prd` checkpoint was satisfied and records the ratification.
A recommendation or handoff that says the checkpoint is owed is not a receipt.

If the question times out, publish only when all seams are unchanged existing
seams; record them as open to veto and use `needs-triage`. Any unratified new seam
stops publication. A supported resolved default remains synthesis; an unresolved
decision remains in Further Notes and forces `needs-triage`.

### 3. Draft, validate, publish, and verify

For each intended PRD, read these references in full:

1. [PRD body contract](references/prd-body.md)
2. [Source durability](references/source-durability.md)
3. [Publication package and labels](references/publication.md)
4. [Validation and closeout](references/validation-and-closeout.md)

Then, in order: finalize the title and exact-title guard; draft the body; resolve
decisions and sources; choose labels and apply any browser checklist; validate
with one reusable policy; create the issue; exact-read metadata and body; repeat
durability proof; resolve program links; clean temporary artifacts; and complete
the closeout ledger. Apply the full sequence independently to every PRD.

## Completion blocker

Step 2 may end with a checkpoint question or an unratified-new-seam stop; state
that publication has not begun. Once Step 3 begins, do not claim completion until
the closeout ledger proves issue number, URL, exact title, state, labels,
staged/published body identity, validator result, source and ADR durability,
seam/checklist outcome, program/deferred-work disposition, temporary cleanup,
branch, publication ref, and final worktree state. Rerun evidence lost across an
interruption or compaction.

