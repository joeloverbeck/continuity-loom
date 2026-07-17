<!-- workflow-id: skill-audit-workflow-v1 -->

# Skill Audit Workflow

This is the sole procedural authority for the Claude and Codex `skill-audit`
adapters. The audit phase is report-only. Editing is permitted only during the
follow-up implementation phase after the user asks for it.

## Contents

- [Operating contract](#operating-contract)
- [Audit workflow](#audit-workflow-steps-1-7)
- [Report contract](#report-contract)
- [Follow-up implementation](#follow-up-implementation-step-8)
- [Cross-skill checks](#cross-skill-checks)
- [Auxiliary investigation](#auxiliary-investigation-and-announcements)
- [Guardrails](#guardrails)

## Operating contract

### Inputs

- A target skill directory or `SKILL.md` path.
- Current-session evidence from the conversation, tool calls, verification
  results, friction, workarounds, and outputs produced while using the target.

Resolve the input in this order:

1. Accept an exact `SKILL.md` path.
2. Accept a directory containing `SKILL.md`.
3. For an unresolved directory-like input, search `<input>*/SKILL.md`, then
   `<input>**/SKILL.md`.
4. Continue only on one unique match. On zero or multiple matches, stop and
   report the ambiguity.

### Audit and implementation boundary

Steps 1-7 are report-only. Do not write a report file, modify the target, stage
changes, or mutate external state. Step 8 begins only after the user requests
implementation of findings.

## Audit workflow (Steps 1-7)

### Step 1: Read and identify the target

Read the target `SKILL.md` completely and parse its name, description,
frontmatter, and body. List its `references/`, `templates/`, `assets/`,
`scripts/`, and `agents/` paths, when present, before making file-specific
suggestions. In-context content is sufficient only when it is exact, has not
been compacted away, and the file has not changed since it was loaded.

Record a target identity receipt before using session evidence:

- requested target path;
- resolved target path (and real path when symlinks are involved);
- active auditor entrypoint, when known;
- current target content SHA-256;
- committed blob identity when the path is tracked, plus current target status;
- canonical workflow ID and workflow content SHA-256, when declared; and
- authority posture: canonical implementation, host adapter, symlink mirror,
  byte-identical mirror, or independent implementation.

Do not call two paths mirrors unless their symlink destinations or current bytes
prove it. When same-name `.agents` and `.claude` skills differ, require an
explicit shared-workflow/host-adapter relationship or report the authority as
ambiguous.

### Step 2: Read alignment authorities

Read the repository entrypoint and active authorities before assessing
alignment:

- `AGENTS.md`, when present;
- `docs/ACTIVE-DOCS.md`, when present, then the active documents it selects for
  the target's domain;
- `docs/FOUNDATIONS.md` for any skill that emits or modifies product code,
  stored data, prompts, validation, generation behavior, accepted segments,
  OpenRouter behavior, local-first ownership, or LLM-assistance surfaces;
- root `CLAUDE.md`, when present, for Claude host conventions; and
- current Codex skill conventions and `agents/openai.yaml` requirements when a
  Codex adapter or metadata surface is in scope.

For a purely process/tooling skill, product alignment may be recorded as
`N/A - meta-tooling skill`; this does not waive `AGENTS.md`, active-doc, or host
convention checks. Governance skills that enforce FOUNDATIONS remain responsible
for preserving those enforcement guardrails. Treat `archive/**` as historical
evidence unless an active authority explicitly points to it.

### Step 3: Qualify session evidence

Review the session for:

- unclear, ambiguous, or missing instructions;
- steps skipped, reordered, or worked around;
- unexpected input or repository state;
- places the operator had to improvise;
- outcomes that diverged from the skill's intent; and
- unexercised branches, which must be marked `not exercised` rather than treated
  as defects.

For self-audit, inventory every earlier `skill-audit` invocation and its
follow-up implementation, which is often the richest evidence. For each
invocation, record the entrypoint, canonical workflow ID, and wrapper/workflow
hash when available.

Evidence is directly attributable to the current target only when either:

- the resolved implementation bytes match; or
- both invocations use the same canonical workflow ID and the workflow hashes
  match.

If the workflow ID matches but its bytes changed, use the evidence only as
qualified historical evidence and state the version difference. Evidence from
a different or unidentified implementation may describe ecosystem friction but
must not be used to claim that the current target contained, omitted, or caused
a rule. If no eligible prior self-audit evidence exists, report
`No eligible session evidence available - self-audit with no matching prior invocation`
and skip finding generation.

### Step 4: Cross-check alignment

For each potential finding, verify it against the authorities selected in Step
2. Report deviations by exact source and section when possible. Check:

- `AGENTS.md` instructions;
- active documents selected through `docs/ACTIVE-DOCS.md`;
- `docs/FOUNDATIONS.md` principles and hard-fail checklist when applicable;
- `CLAUDE.md` conventions when present; and
- Codex skill conventions, including supported `SKILL.md` frontmatter, concise
  progressive disclosure, and accurate `agents/openai.yaml` metadata.

### Step 5: Classify findings

- **Issue**: broken, misleading, contradictory, or likely to produce wrong
  output.
- **Improvement**: a refinement that makes existing behavior more reliable or
  easier to apply.
- **Feature**: a new capability that fits the stated intent but is absent.

Every Issue and Improvement needs concrete eligible session evidence. Purely
hypothetical gaps belong under Features.

### Step 6: Assign severity

- **CRITICAL**: produces wrong output, corrupts state, or violates
  `FOUNDATIONS.md`; fix before the next use.
- **HIGH**: a missing guardrail or instruction caused rework or wrong output in
  eligible session evidence, or is likely to fail on the next similar use.
- **MEDIUM**: non-trivial friction required non-obvious judgment while the
  correct outcome still emerged.
- **LOW**: wording, coverage, or polish that did not block progress.

A structurally bypassed or attentionally missed guardrail defaults to MEDIUM
when no harm occurred; raise it to HIGH only when the bypass is the common path.
For an attentionally missed existing rule, improve placement or salience rather
than duplicating its content.

When a defect affects a specific input class, tag it CRITICAL if that class is
common or the failure is silent/corrupting; otherwise tag it HIGH and name the
triggering input.

### Step 7: Verify premises and report

Before finalizing any MEDIUM-or-higher finding that claims content or output is
absent, missing, undocumented, or mislocated, verify the exact file, section, or
artifact after the last relevant change or compaction. A LOW finding may use
best-effort verification, but check whenever uncertain.

Present the report in the conversation using the contract below. Make no edits.

## Report contract

```markdown
# Skill Audit: <skill-name>

**Requested target**: <user-supplied path>
**Resolved target**: <resolved SKILL.md path>
**Target identity**: <active entrypoint; wrapper/workflow IDs and hashes>
**Target state**: <branch; clean/modified/untracked status at audit time>
**Session date**: YYYY-MM-DD
**Session summary**: <1-2 sentences on eligible evidence>

## Alignment Check

- **AGENTS.md**: <aligned / N deviations found / skipped - not present>
- **ACTIVE-DOCS.md and selected authorities**: <aligned / N deviations found / skipped - not present>
- **FOUNDATIONS.md**: <aligned / N violations found / N/A - meta-tooling skill>
- **CLAUDE.md**: <aligned / N deviations found / skipped - not present>
- **Codex skill conventions**: <aligned / N deviations found / N/A - no Codex surface>
[If deviations: bullets naming the exact source and conflict]

## Issues

[If none: "No issues identified."]

1. **[SEVERITY]** <title>
   - **What happened**: <eligible session evidence>
   - **Skill gap**: <what caused it>
   - **Suggestion**: <specific fix and exact path>

## Improvements

[If none: "No improvements identified."]

1. **[SEVERITY]** <title>
   - **Current behavior**: <current rule>
   - **Why improve**: <eligible evidence or reasoning>
   - **Suggestion**: <specific refinement and exact path>

## Features

[If none: "No features identified."]

1. **[SEVERITY]** <title>
   - **What's missing**: <gap>
   - **Why it fits**: <fit with stated intent>
   - **Suggestion**: <specific addition and exact path>

## Not Exercised This Session

[Omit when every branch was exercised. Otherwise list one-line bullets.]

## Summary

**Total**: N issues, N improvements, N features (N findings) - N CRITICAL, N HIGH, N MEDIUM, N LOW
```

Report rules:

- Cite the exact destination for every suggested change.
- Double-check severity and category totals before presenting.
- `implement all`, `implement recommended`, and `implement suggestions` mean
  every numbered finding except titles marked `- informational` or `- skip`, or
  suggestions ending `- no change needed`.
- Make this the final human-facing sentence:
  `Say implement all or name findings (Issue 1, Improvement 2) to apply them.`
  Mandatory machine-readable trailers required by active instructions may
  follow it.
- If memory files were used, obey the active memory citation requirements.

## Follow-up implementation (Step 8)

### 8.1 Confirm scope and baseline ownership

Map the user's request to concrete section-prefixed findings. A bare number is
an Issue number unless ambiguous; ask only when it cannot be resolved safely.

Before editing, capture the current branch and `git status --short`. Classify
paths as:

- covered target files;
- finding-cited artifacts;
- mechanically required shared contract surfaces; or
- pre-existing unrelated worktree changes.

Covered files are the first three groups only. Preserve unrelated changes and
do not adopt opportunistic cleanup. Record this baseline for final comparison.

### 8.2 Re-evaluate findings

Obtain the current exact bytes of every covered file through the host's
filesystem read capability. Re-check each premise. If a covered file changed
since the report or a premise is false, discard moot findings, adapt shifted
ones, and announce each outcome before editing. A mid-run change to a
non-covered file is acknowledged but does not broaden scope.

### 8.3 Plan primary and cascade edits

Plan the narrowest edits that implement every requested finding. Scan all files
inside the target skill and the actual `.agents/skills/` and `.claude/skills/`
inventories for related paths, terminology, counts, or conventions that would
become stale. Include mechanically required shared surfaces only. Key cascades
as `N.cascade`; use `N.a` and `N.b` for co-equal edits.

Complete the [Cross-skill checks](#cross-skill-checks) gate before finalizing
the plan; that section owns the live-inventory and disposition requirements.

### 8.4 Apply edits safely

Use the host's patch mechanism (`apply_patch` when available). Apply manual
edits in document order and construct replacements from exact current reads.
Do not overwrite unrelated user changes. Host adapters may translate tool names
but must not change the workflow's behavioral contract.

### 8.5 Re-read every edited region

Enumerate every edited `file:line` region. Re-read the full file when short; for
long files, read the containing paragraph/list item or at least ten lines of
flanking context for every non-contiguous edit. Confirm frontmatter, numbering,
cross-references, paths, and end-to-end coherence. A presence-only grep or patch
success is not a substitute. Fix defects and repeat the pass.

### 8.6 Execute applicable verification

Run every applicable verification surface introduced or affected by the edit:

- skill scripts, unit tests, helpers, and fixtures;
- the current host's skill/frontmatter validator;
- host-adapter parity or symlink/byte-mirror checks;
- targeted searches for stale cascade terminology; and
- `git diff --check`.

Report exact commands and results. If a check cannot run, say why and describe
the remaining risk. Do not claim completion from structural rereads alone.

### 8.7 Reconcile and summarize

Compare final branch/status with the Step 8.1 baseline. Enumerate paths changed
by this implementation and confirm pre-existing unrelated changes were
preserved.

Before writing the final response, prepare a closeout run sheet containing:

- a Step 8.6 command/result table with every executed command written exactly;
- one status row for every selected finding; and
- the required `Cross-skill check: <result>` disposition.

Mechanically compare the selected finding keys with the status-row keys. The
sets must have zero missing, extra, or duplicate keys. Do not collapse multiple
findings into one prose bullet. Use one of these statuses per finding:

- `implemented`;
- `implemented with relocation - <new location>`;
- `cascade from finding(s) N[+M] - <reason>`; or
- `skipped - <reason>`.

If verification exposes a real gap, repair it, rerun the affected checks, and
record the corrected result rather than describing the first pass as clean.

## Cross-skill checks

Before a cross-skill check, enumerate current sibling skills under both
`.agents/skills/` and `.claude/skills/`; never use a hardcoded inventory. Run a
check only when an edit changes terminology, a convention, an output path, or a
shared contract that a sibling may consume. Search relevant siblings and record
the result. When no shared surface changed, record
`Cross-skill check: omitted - no shared surface touched`.

## Auxiliary investigation and announcements

Every audit-phase read, list, grep, or diff beyond the target read must test a
specific hypothesis. Immediately before it, tell the user:
`Investigating <hypothesis>: <operation> <target> to verify.`
During implementation, continue concise progress updates and explicitly note
when another selected skill causes an action or pause.

## Guardrails

- Audit report only in Steps 1-7; Step 8 is the only editing exception.
- No false positives: unexercised behavior is coverage, not a finding.
- Do not weaken deterministic compilation, validation, API-key secrecy,
  localhost binding, local-first ownership, accepted-prose exclusion, or any
  applicable FOUNDATIONS guardrail.
- Keep findings and implementation within the target's stated purpose.
- Preserve user-owned worktree changes and avoid duplicate authority paths.
- Prefer concise host adapters and progressive disclosure over copied workflow
  bodies.
- If the same skill was audited at least twice, the latest audit had no findings,
  and neither target nor workflow changed, report
  `Skill stable - no new session evidence since last audit` and stop.
