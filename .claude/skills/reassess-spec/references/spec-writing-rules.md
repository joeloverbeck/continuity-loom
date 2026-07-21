# Writing the Updated Spec (Step 7)

After all findings are resolved and approved.

## Pre-Apply Verification

Run targeted checks to confirm each finding still holds, and **emit the verification table in chat before any Write/Edit call** — a vague "I checked the findings" is not sufficient and is treated as no verification. For each finding (by its Step 6 key — `I1`, `M1`, `A1`…), record both the command and the result.

Example:

| Finding | Check | Result |
|---------|-------|--------|
| I1 | `grep -n "deterministic" specs/SPEC-001-prompt-compiler.md` | 2 matches in §Approach — confirms compilation scope |
| I2 | `test -f docs/specs/compiler-contract.md` | file exists — dependency path valid |
| M3 | Judgment — §11 warnings-vs-blockers reasoning; Q2 delegated | selected (a): missing-field check is a blocker, not a warning, per §11 |

**Row shapes**:
- **Command-backed** (default): `Finding | <grep / test / file-read command> | <result>`. Use whenever a symbol can be grepped, a path `test`-ed, or a line read.
- **Judgment-only**: `Finding | Judgment — <restated rationale> | <result>`. For purely analytical recommendations, or when the user delegates ("you decide") — append `; Q<N> delegated`. Use sparingly; a bare `Judgment` without rationale is a skipped check.
- **User-answered**: `Finding | User answer Q<N> = (<option>): <one-line paraphrase> | Apply as: <edit description>`. Expand terse replies ("go with (a)") into the canonical form. When the answer confirms existing text and no edit follows, the Result reads `no edit — confirms existing §<section>`.

**Multi-section pre-edit grep**: when a finding's Result names multiple sections to edit, run an exact-string grep for the changed terminology across the entire spec before the first Edit AND before drafting the Result, and record the actual count + line numbers (e.g. `3 instances at lines L1, L2, L3 — apply at all`). Do not estimate ahead of the grep — the grep is authoritative. Cross-section restatements drift silently because the deliverable's number is unchanged.

**Syntax-variant + `replace_all` discipline**: when the changed terminology may appear with different surrounding syntax (parens vs none, capitalization, list markers, trailing punctuation), grep for the BARE token plus `-i` — not the surrounding context. `replace_all: true` matches only the exact `old_string`; it cannot catch sibling sites with different surrounding syntax, so the pre-edit grep is still required to enumerate the variants needing separate Edit calls.

**Mismatch classification** — if a check reveals a finding/codebase mismatch:
- **Recommendation-changing**: the check invalidates the finding's recommendation (the fix no longer applies, the target moved, a different fix is warranted). Re-present the corrected finding and wait for confirmation before applying that finding's edit. A pure retraction (no substitute) needs a transparent `retracted: <reason>` note but not fresh re-approval.
- **Evidence-refining**: the check refines supporting evidence but the recommendation holds. Note the refinement inline in the Result column and proceed.
- **Scope-extending**: the recommendation still applies but fulfilling it requires a new deliverable or change not discussed at question time. Note it inline in the Result column, proceed, and surface it in the Step 8 summary under a dedicated line. (If a Step 6 option already named the consequence, cite the question — it's a confirmation, not fresh approval.)

When in doubt, treat the mismatch as recommendation-changing and re-present — cheaper to ask than to apply the wrong fix.

## Apply Changes

- Incorporate corrections from the user's question responses. Preserve existing structure and voice; change only what was agreed upon.
- **Construct each Edit `old_string` from verbatim file content**, not from reassessment-phase memory — whitespace, list markers, and parentheticals are easily misremembered, and an invented fragment fails the Edit match and forces a re-read/retry. The spec read at Step 1 satisfies this when its content is still verbatim in context; re-read (targeted `offset`/`limit`) the edit region if it was summarized or compacted away, or if the file changed since Step 1. For a long spec (roughly >800 lines) or one first read many tool-calls earlier, do not trust the early full-file read for exact `old_string` text — re-read each edit region immediately before its Edit; a single mismatched trailing word (e.g. `golden` vs `golden prompt`) forces a failed-Edit round-trip.
- Prefer `Edit` for ≤3 localized changes; prefer full `Write` when insertions cause **cascading renumbering** or the change is a **diffuse rewrite** of contiguous prose. The decision keys on the *shape* of the change, not the count of sections touched — many independent surgical edits across many sections are well-served by targeted Edits.
- **Inserting deliverables**: renumber all subsequent deliverables and update intra-spec cross-references to deliverable numbers. **Removing deliverables**: grep the spec for all references to the removed number (Approach, Verification, FOUNDATIONS Alignment, Out of Scope, Risks, cross-references) and update or remove them. Exclude citations to OTHER specs' phases/deliverables (e.g. `SPEC-004 §C`) from renumbering — those are external and preserved verbatim.
- **Material mechanism modification (number unchanged)**: grep the spec for the deliverable's old key concepts (function/type/command names the modification eliminates) and scan Problem Statement, Approach, Dependencies, FOUNDATIONS Alignment, Verification, Risks for restatements.
- **Material mechanism redirect** (one approach rejected for another): consider a brief "Why X and not Y" rationale paragraph in the affected §Approach section, recording the schema/semantic/FOUNDATIONS reason the rejected approach was insufficient. This authors the spec-level audit trail so future readers don't re-propose it; the §Post-Apply Confirmation audit-trail retention exception then recognizes the rejected token's appearance there as acceptable retention.
- **Risks & Open Questions resolution**: if a finding resolves an entry in the spec's §Risks & Open Questions, update or remove that entry alongside the primary edit. A "still open" risk the reassessment actually closed is a misleading audit trail.
- **New deliverable vs. amendment**: when a finding introduces substantial new logic (new mechanism, new type, new surface), consider a new numbered deliverable rather than expanding an existing one — criteria: distinct implementation site, independently testable, would make the existing deliverable unwieldy if inlined.
- **Late-discovered findings**: if writing reveals minor factual errors not in the plan (wrong symbol names, typos, outdated constraints), fix them and note in Step 8 as "Also fixed:". If a late finding would be HIGH/CRITICAL, re-present before applying. If discovered during edit *planning*, key it `LD-N` in the pre-apply table; if during application or post-apply, Step 8 "Also fixed:" alone suffices.

## Retroactive Branch (classification (d))

If Step 3 concluded all deliverables already landed, Step 7's output is NOT deliverable refinement. Instead:

1. Flip the spec's **Status** to `COMPLETED` (or the repo's done marker).
2. Populate an **Outcome** section with: completion date (absolute); landed changes (cite file paths + line numbers); delivering commit(s) or sibling spec(s); deviations from the original plan; verification commands **re-run at reassessment time** with pass/fail status (do not copy from memory — rerun each to catch post-delivery regressions).
3. Mark the historical **Problem Statement / Motivating Evidence** as such — a short parenthetical noting the drift it describes was resolved by the landed implementation, so a future reader doesn't treat a stale condition as live.
4. Cross-reference any later specs/skills that extended or absorbed the original scope.
5. Do NOT apply structural refinements to deliverables that already shipped — the spec is now a historical record; editing deliverable sections to match current code would confuse the causal narrative.

(Continuity Loom archives completed specs under `archive/specs/` per `docs/archival-workflow.md`: flip Status, add the Outcome section, then `git mv specs/<ID>.md archive/specs/<ID>.md` and correct any active-doc references — `docs/ACTIVE-DOCS.md` lists current active specs. Preserve the filename unless it collides; ordering-rationale docs may be suffixed with the completion date on move.)

## Post-Apply Confirmation

Grep the updated spec for:

1. **Eliminated stale references** — should return zero matches. For phrase-elimination, use literal-string `grep` without `-E`; when regex is necessary, prefer `[^.;]*` over `.*` to avoid greedy cross-sentence false positives.
2. **Corrected references** — should return the expected matches.
3. **File path references in newly added deliverables** — should resolve to existing files.
4. **Re-runnable commands** — if a finding added or edited a §Verification command or an embedded completeness-sweep/gate command, confirm the command text resolves; for an edited gate-command, re-run it to confirm sane output.

**Audit-trail retention exception**: when an eliminated reference appears in a deliberate "this was removed and why" rejection paragraph, check 1's grep shows N≥1 for the term. Matches inside an explanatory rejection paragraph are acceptable retentions; matches in an active config block, instruction, or normative statement indicate incomplete elimination. Cite the retention site explicitly in Step 8 so a future reader can distinguish acceptable retention from unfinished elimination.

For classification (d), additionally: grep every concrete artifact named in the spec's Problem Statement / Motivating Evidence (symbols, paths, type names) and prove its absence or corrected form in the current codebase.

Record results for Step 8.
