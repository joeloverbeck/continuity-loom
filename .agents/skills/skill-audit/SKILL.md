---
name: skill-audit
description: Use after a Codex skill was exercised in the current session to evaluate the skill against the actual work, report issues or improvements, and optionally implement user-requested skill edits under .agents/skills.
---

# Skill Audit

Audit a Codex skill against the work done in the current session. The audit
phase is report-only: do not edit the target skill until the user asks for a
follow-up implementation.

## Inputs

- Target skill directory or `SKILL.md` path, usually under `.agents/skills/`.
- Current-session evidence from the conversation, tool calls, verification
  results, friction, and any workaround used while applying the target skill.

If the path is ambiguous, resolve it with `rg --files` or `find`:

1. Accept an exact `SKILL.md` path.
2. Accept a directory containing `SKILL.md`.
3. For an unresolved directory-like input, search `<input>*/SKILL.md` and then
   `<input>**/SKILL.md`.
4. Continue only on one unique match. On zero or multiple matches, stop and
   report the ambiguity.

## Audit Workflow

1. **Read the target skill.** Read `SKILL.md` and parse its `name`,
   `description`, and body. If it has `references/`, `templates/`, `assets/`,
   `scripts/`, or `agents/`, list those paths before making file-specific
   suggestions. Re-read after compaction or if the skill changed this session.

2. **Read Codex and repo alignment documents.**
   - Read `AGENTS.md` when present.
   - Read `docs/ACTIVE-DOCS.md` and use it to choose any relevant active repo
     authority.
   - Read `docs/FOUNDATIONS.md` for skills that could affect Continuity Loom
     runtime behavior, stored data, prompt compilation, validation,
     generation, accepted segments, OpenRouter, local-first ownership, or
     LLM-assistance surfaces.
   - For purely process/tooling skills, product alignment may be marked
     `N/A - meta-tooling skill`, but do not skip `AGENTS.md` if it exists.
   - Treat `archive/**` as historical evidence unless an active doc, ticket, or
     skill explicitly names an archived file.

3. **Reflect on session evidence.** Review how the skill behaved in this
   session:
   - unclear, ambiguous, or missing instructions;
   - steps skipped, reordered, or worked around;
   - unexpected inputs or repository state the skill did not anticipate;
   - places Codex had to improvise because the skill gave no guidance;
   - outcomes that diverged from the skill's intent;
   - branches not exercised this session, marked as `not exercised` rather
     than treated as defects.

   For self-audit of `skill-audit`, use evidence from earlier invocations in
   the same session, including any follow-up implementation. If there is no
   prior invocation evidence, say so and skip finding generation.

4. **Cross-check alignment.** For each potential finding, verify whether the
   skill contradicts or fails to implement:
   - `AGENTS.md` instructions;
   - `docs/FOUNDATIONS.md` principles and hard-fail checklist when applicable;
   - active repo docs selected through `docs/ACTIVE-DOCS.md`;
   - Codex skill conventions, including required `SKILL.md` frontmatter,
     concise progressive disclosure, and accurate `agents/openai.yaml`
     metadata when present.

5. **Classify findings.**
   - **Issue**: broken, misleading, contradictory, or likely to produce wrong
     output.
   - **Improvement**: refinement to existing behavior that would make the skill
     more reliable or easier to apply.
   - **Feature**: new capability that fits the skill's stated intent but is
     missing.

6. **Assign severity.**
   - **CRITICAL**: produces wrong output, corrupts state, or violates
     `FOUNDATIONS.md`. Fix before next use.
   - **HIGH**: missing guardrail or instruction that caused rework or wrong
     output this session, or is likely to fail on the next similar use.
   - **MEDIUM**: friction that required non-obvious judgment or improvisation,
     while the correct outcome still emerged.
   - **LOW**: wording, coverage, or polish that did not block progress.

   When a defect only affects a specific input class, tag it CRITICAL if that
   class is common or the failure is silent/corrupting; otherwise tag it HIGH
   and name the triggering input.

7. **Verify premises before reporting.** Before finalizing any MEDIUM or higher
   finding that says content is absent, missing, undocumented, or mislocated,
   confirm with a fresh read or grep of the cited file or section. LOW findings
   may use best-effort verification, but check whenever uncertain.

8. **Report only.** Present findings in the conversation. Do not write files,
   stage changes, or modify the target skill during the audit phase.

## Report Template

```markdown
# Skill Audit: <skill-name>

**Skill path**: <path>
**Session date**: YYYY-MM-DD
**Session summary**: <1-2 sentences on how the skill was exercised>

## Alignment Check

- **AGENTS.md**: <aligned / N deviations found / skipped - not present>
- **FOUNDATIONS.md**: <aligned / N violations found / N/A - meta-tooling skill>
- **Codex skill conventions**: <aligned / N deviations found>
[If deviations: bullets naming the specific source and conflict]

## Issues

[If none: "No issues identified."]

1. **[SEVERITY]** <title>
   - **What happened**: <session evidence>
   - **Skill gap**: <what the skill says or fails to say>
   - **Suggestion**: <specific fix and target path>

## Improvements

[If none: "No improvements identified."]

1. **[SEVERITY]** <title>
   - **Current behavior**: <what the skill currently says>
   - **Why improve**: <session evidence or reasoning>
   - **Suggestion**: <specific refinement and target path>

## Features

[If none: "No features identified."]

1. **[SEVERITY]** <title>
   - **What's missing**: <gap description>
   - **Why it fits**: <how this fits the skill's intent>
   - **Suggestion**: <specific addition and target path>

## Not Exercised This Session

[Omit if everything was exercised. Otherwise list one-line bullets.]

## Summary

**Total**: N issues, N improvements, N features (N findings) - N CRITICAL, N HIGH, N MEDIUM, N LOW
```

## Report Rules

- Every Issue and Improvement needs concrete session evidence. Purely
  hypothetical gaps belong under Features.
- A step not exercised this session is not a defect by itself.
- Suggestions must identify the exact destination when possible, such as
  `SKILL.md`, `references/foo.md`, or `agents/openai.yaml`.
- If a finding is intentionally not meant for later implementation, mark the
  title `- informational` or end the Suggestion with `- no change needed`.
- "Implement all", "implement recommended", and "implement suggestions" mean
  every numbered finding except those explicitly marked informational,
  skipped, or no-change.
- Double-check summary counts against the numbered findings before finalizing.
- If memory files were used during the audit, obey Codex's memory citation
  requirements in the final answer.

## Follow-Up Implementation

Only edit the target skill when the user asks to implement audit findings.

1. **Confirm scope.** Map requests such as "implement all" or "implement
   Improvement 2" to concrete findings. If a bare number is ambiguous across
   Issues, Improvements, and Features, ask for clarification.
2. **Re-read changed files.** Re-read every file you will edit and re-check
   whether each audit premise still holds. Discard moot findings and adapt
   shifted ones before editing.
3. **Plan cascades.** Search the rest of the target skill and sibling
   `.agents/skills/*` only for terms, paths, counts, or conventions that your
   edit could stale. Do not rely on a hardcoded sibling inventory.
4. **Edit with Codex tools.** Use `apply_patch` for manual edits. Preserve
   unrelated user changes, keep the diff narrow, and avoid extra documentation
   files unless they directly support the skill.
5. **Verify after edits.** Re-read touched files and confirm:
   - YAML frontmatter and `agents/openai.yaml` remain parseable;
   - step numbering, cross-references, and paths are coherent;
   - the skill still follows concise progressive disclosure;
   - any sibling terminology touched by cascades remains consistent.
6. **Summarize implementation.** Report one status line per finding:
   `implemented`, `implemented with relocation`, `cascade from finding N`, or
   `skipped - <reason>`.

## Guardrails

- Keep the audit scoped to the target skill's stated purpose.
- Do not propose changes that would weaken Continuity Loom's deterministic
  compilation, validation gates, API-key secrecy, localhost-only binding,
  local-first ownership, or accepted-prose exclusion.
- Do not adapt tests, docs, or audit criteria to hide a skill defect.
- Prefer concise skill instructions and references over long always-loaded
  bodies.
- When the audit requires auxiliary reads or greps beyond the target skill,
  state the hypothesis before the tool call in a short user-visible update.
