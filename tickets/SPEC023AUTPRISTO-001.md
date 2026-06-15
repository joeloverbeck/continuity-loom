# SPEC023AUTPRISTO-001: FOUNDATIONS amendment — author-private notes as the sixth project surface

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — amends `docs/FOUNDATIONS.md` §2, §6, §27, §29; no production behavior change (constitutional doc only)
**Deps**: None

## Problem

`docs/FOUNDATIONS.md` §6 currently names exactly **five continuity surfaces** and treats that taxonomy as closed. SPEC-023 introduces author-private Story Notes as a **sixth, inert project surface** — local scratch that is never prompt-facing or continuity-bearing. Per FOUNDATIONS §1.1, a feature that conflicts with the constitution is wrong unless the constitution is deliberately amended first, with the exact wording signed off and landed in the same revision as the dependent behavior. This ticket lands that amendment. No Notes code may merge to `main` without it.

## Assumption Reassessment (2026-06-15)

1. §6's heading is literally `## 6. The five continuity surfaces` (`docs/FOUNDATIONS.md:180`) and its opening is `Continuity Loom must keep these surfaces distinct.` (`:182`); sub-sections are `### 6.1`–`### 6.5` (`:184`–`:216`). The amendment replaces the heading/opening, keeps 6.1–6.5 unchanged, and adds `### 6.6`.
2. SPEC-023 §"FOUNDATIONS Alignment & Required Amendment" carries the exact, reassess-corrected wording for all five edits (§2 paragraph, §6 heading+opening+§6.6, §27 bullet replacement + new bullet, §29.12 group, §29.11 sync). This ticket applies that spec text verbatim; it does not re-author it.
3. **Cross-artifact boundary under audit**: `docs/FOUNDATIONS.md` is the doc-governed contract. The only active-doc occurrences of the phrase being changed are `docs/FOUNDATIONS.md:180` (§6 heading) and `:1059` (§29.11 bullet) — confirmed by `grep -rn "five continuity surfaces" docs/` returning exactly these two lines (archive/ and reports/ excluded as historical per CLAUDE.md). `docs/ACTIVE-DOCS.md` requires no new registry entry (SPEC-023 adds a file under `specs/`, not `docs/`).
4. **FOUNDATIONS principle under audit (§1.1, §6, §27, §29)**: §1.1.4 requires the §29 alignment checklist to be updated in the same amendment when it changes what proposals must clear — this ticket satisfies it by adding §29.12 and syncing the §29.11 quality-check bullet. The amendment is the intended deliverable, not a violation (constitutional-amendment carve-out).
5. **Enforcement-surface confirmation (§8/§15)**: the amendment does not weaken any §29 hard-fail — it *adds* §29.12 hard-fails forbidding note titles/bodies/tags/metadata/previews/derived material from entering validation, readiness, working set, compiler input, any prompt, any OpenRouter request, prompt inspection, or assistance output, and forbids treating a note as a record/brief field/reference target/working-set member/accepted-prose source/promote-to-record item. Deterministic compilation (§8), the secret firewall (§15), no-accepted-prose-in-prompts (§10), and human gatekeeping (§20) are preserved in spirit; the enforcement is implemented by the feature tickets (002–009) and proven by the capstone sentinel (009).
6. **Rename/blast-radius (§6 count change)**: changing "five continuity surfaces" → "six project surfaces" is a doc-contract wording change. Repo-wide grep shows active-doc occurrences only at `docs/FOUNDATIONS.md:180` and `:1059`; both are in this ticket's Files to Touch. Sibling specs and tickets that reference "five continuity surfaces" live under `archive/` (historical evidence, not active) and are intentionally left unchanged.
7. **Adjacent contradiction classification**: the orphaned §29.11 bullet (`:1059`, still asserting "five continuity surfaces") is a **required consequence** of this ticket — its sync is part of the amendment, not a separate bug or follow-up. No other active-doc contradiction was exposed.
8. **Mismatch + correction**: none outstanding — `/reassess-spec` (this session) already corrected the spec's amendment plan to include the §29.12 grouping and the §29.11 sync; this ticket applies the corrected plan.

## Architecture Check

1. Keeping the amendment as its own reviewable diff isolates the constitutional wording — a distinct sign-off/review surface — from the implementation diffs, while the feature DAG roots at this ticket (002 and 003 declare `Deps: 001`) so no Notes code can be reviewed or merged before the constitution permits it.
2. No backwards-compatibility aliasing/shims: the five surface definitions (6.1–6.5) are preserved verbatim; only the heading/opening and the additive §6.6 / §29.12 / §29.11-sync change. No duplicate or parallel doctrine path is introduced.
3. **Same revision; never merge standalone ahead of the feature (§1.1.3)** — this amendment must land in the same revision/PR as the Notes feature implementation; merging it to `main` standalone ahead of the feature is forbidden.

## Verification Layers

1. §6 names six project surfaces; no active-doc orphan of "five continuity surfaces" remains in a normative bullet -> codebase grep-proof (`grep -rn "five continuity surfaces" docs/`).
2. §29.12 "Author-private notes hard fails" group is present with both note-isolation hard-fail items -> codebase grep-proof.
3. The amendment strengthens (does not weaken) §8/§10/§15/§20 hard-fail intent -> FOUNDATIONS alignment check (compare §29.12 wording against §8/§10/§15 firewall intent).
4. Cross-artifact: amendment co-lands in the same revision as the feature, never standalone ahead -> manual review against §1.1.3 (PR composition).

## What to Change

### 1. Apply the SPEC-023 amendment text to `docs/FOUNDATIONS.md`

Apply, verbatim, the five edits drafted in SPEC-023 §"FOUNDATIONS Alignment & Required Amendment":

- **§2 App identity** — append the author-private-notes paragraph at the end of §2, immediately after the loom/shuttle/cloth mental-model blockquote that currently closes the section.
- **§6 heading + opening** — replace `## 6. The five continuity surfaces` and its opening line with the `## 6. The six project surfaces` heading + opening (first five are the only continuity-facing surfaces; the sixth, author-private story notes, is inert). Keep `### 6.1`–`### 6.5` unchanged.
- **§6.6** — add `### 6.6 Author-private story notes` with the inert-scratch definition and the never-enter-validation/prompt/working-set/reference-graph prohibition.
- **§27 UI principles** — replace the surface-separation bullet (live wording opens "clear distinction between **all records**, …") with the six-surface bullet (renaming "all records" → "story records" and inserting "author-private story notes"); add the new bullet requiring notes to be labeled/arranged as inert scratch.
- **§29.12** — add the `### 29.12 Author-private notes hard fails` group (both hard-fail items) after §29.11.
- **§29.11 sync** — replace the existing `- Does it make the five continuity surfaces more distinct rather than more blurred?` bullet with the project-surfaces wording that keeps notes visibly separate from the five continuity surfaces.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Any production code (core schemas, storage, routes, web UI) — those are tickets 002–009.
- `docs/user-guide.md` Private Notes section — ticket 010.
- Any `archive/**` doc that references "five continuity surfaces" — historical evidence, intentionally unchanged.
- `docs/ACTIVE-DOCS.md` registry entry — not required (SPEC-023 is a `specs/` file, and no new `docs/*.md` is created).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "## 6. The six project surfaces" docs/FOUNDATIONS.md` returns one match; `grep -n "### 6.6 Author-private story notes" docs/FOUNDATIONS.md` returns one match.
2. `grep -n "### 29.12 Author-private notes hard fails" docs/FOUNDATIONS.md` returns one match; the two §29.12 hard-fail items are present beneath it.
3. `grep -rn "five continuity surfaces" docs/FOUNDATIONS.md` returns only non-normative/contrastive uses (e.g. the synced §29.11 bullet phrasing "separate from the five continuity surfaces"); no heading or standalone normative bullet asserts a five-surface taxonomy.

### Invariants

1. §6.1–§6.5 surface definitions are byte-unchanged except for the heading/opening replacement; no continuity surface definition is removed or reworded.
2. No §29 hard-fail is weakened: §29.12 is additive and the §8/§10/§15/§20 hard-fails retain their pre-amendment intent.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (grep-proofs above) and no automated test suite asserts FOUNDATIONS prose.`

### Commands

1. `grep -n "## 6. The six project surfaces" docs/FOUNDATIONS.md && grep -n "### 6.6" docs/FOUNDATIONS.md && grep -n "### 29.12" docs/FOUNDATIONS.md`
2. `grep -rn "five continuity surfaces" docs/FOUNDATIONS.md`
3. A narrower command is correct here: this ticket changes only constitutional prose, so `npm run lint` / `npm run typecheck` are unaffected; verification is the grep-proof set, not the code pipeline.
