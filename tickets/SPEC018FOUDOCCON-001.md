# SPEC018FOUDOCCON-001: FOUNDATIONS amendments — §1.1 amendment procedure, §28.8 differentiator, §30 source anchors

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `docs/FOUNDATIONS.md` (constitutional doc, three additive amendments); no production behavior change
**Deps**: None (first ticket of the SPEC-018 batch). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D9a/D9b/D9c).

> **SIGN-OFF GATE (per SPEC-018 D9):** the exact amendment wording below requires explicit user sign-off before implementation. Record the sign-off decision (date + any wording revisions) on this ticket before editing `docs/FOUNDATIONS.md`. If the user revises wording, SPEC-018 must be updated to match first (§1.1 item 4 discipline applies to itself).

> USER SIGN-OFF DECISION (06-10-2026): I approve your wording as is.

## Problem

FOUNDATIONS has no amendment procedure or precedence ladder despite both being load-bearing in practice, and the project's central differentiation (deterministic validate-and-block before generation, unique among surveyed story-AI tools) is undocumented. SPEC-018 D9 amends the constitution with: §1.1 (amendment procedure + doc precedence), §28.8 (the validate-and-block differentiator and named rejected anti-patterns), and §30 additions (the similar-tools survey anchors backing §28.8).

## Assumption Reassessment (2026-06-10)

1. `docs/FOUNDATIONS.md` §1 (`## 1. Purpose`) currently has no subsections — `### 1.1` is a clean additive insertion before `## 2. App identity`. §28 ends at `### 28.7` (line ~871), so `### 28.8` is the next free slot. `## 30. Source notes` exists at line ~984 with a "Selected reference anchors" URL list matching the D9c insertion pattern. All verified against the working tree 2026-06-10.
2. SPEC-018 D9 wording was reassessed against the codebase 2026-06-10 (`/reassess-spec`): the D9a precedence ladder is doc-precedence, distinct from §5 story-state authority (no conflict); D9b's §28.8 claims restate existing doctrine (§7 working-set supremacy, §17 no token-budget compression) as a research-grounded conclusion — no new rules, no relaxations.
3. Cross-artifact boundary under audit: the D9a precedence-ladder wording is mirrored by `docs/ACTIVE-DOCS.md` in SPEC018FOUDOCCON-002. The signed-off wording on THIS ticket is canonical; 002 must copy it, not paraphrase it.
4. FOUNDATIONS principle restated before trusting the spec narrative: §1 permits deliberate amendment ("the feature is wrong unless this document is deliberately amended first"). These amendments are additive — they introduce the procedure §1 implies and a §28-form conclusion; they relax nothing and change no doctrine. Each §29 hard-fail's intent (deterministic compilation, no accepted prose in prompts, secret firewall, warnings never gating, human gatekeeping) is untouched.
5. Mismatch + correction: none — spec wording verified against current FOUNDATIONS structure during the 2026-06-10 reassessment.

## Architecture Check

1. Additive subsections in the constitution's own established heading form (`### N.N` under `## N.`) are cleaner than a standalone amendment-procedure doc: the procedure governs FOUNDATIONS, so it lives in FOUNDATIONS, discoverable exactly where an amendment author already is. §28.8 follows the settled §28 research-grounded-conclusion form rather than inventing a new section genre.
2. No backwards-compatibility aliasing/shims introduced — pure additive doc amendments.

## Verification Layers

1. Amendment wording in `docs/FOUNDATIONS.md` matches the signed-off wording exactly → manual review (diff the inserted blocks against this ticket's What to Change, which carries the spec's exact text).
2. §1.1 / §28.8 / §30 anchors exist post-edit → codebase grep-proof (`grep -n "### 1.1 Amendment procedure" docs/FOUNDATIONS.md`, `grep -n "### 28.8" docs/FOUNDATIONS.md`).
3. No §29 hard-fail intent weakened → FOUNDATIONS alignment check (constitutional-amendment carve-out: amendments are additive; §29 checklist text unchanged by this ticket).
4. Sign-off recorded before implementation → manual review of this ticket's gate block.

## What to Change

### 1. Insert §1.1 under §1 Purpose (before `## 2. App identity`)

Exact wording (from SPEC-018 D9a):

> ### 1.1 Amendment procedure and precedence
>
> A change to this document is constitutional work. An amendment must:
>
> 1. be proposed as an explicitly labeled FOUNDATIONS amendment in a spec or ticket, with the exact wording shown;
> 2. receive explicit user sign-off on that wording before implementation;
> 3. if coupled to a code or behavior change that depends on it, land in the same revision as that change — never standalone ahead of it;
> 4. update the §29 alignment checklist in the same amendment when it changes what proposals must clear.
>
> On conflict between active documents, precedence is: this document first, then the domain authority that `docs/ACTIVE-DOCS.md` names for the touched surface, then support docs and guides. `docs/ACTIVE-DOCS.md` is the registry of which document is the domain authority for each surface.

### 2. Insert §28.8 after §28.7 (before `## 29.`)

Exact wording (from SPEC-018 D9b):

> ### 28.8 Validate-and-block before generation is the differentiator
>
> Surveyed story-AI tools maintain story state, but none deterministically validate and block generation on inconsistent state; the field handles consistency probabilistically after generation, or not at all. Continuity Loom's fail-closed pre-generation gate is a deliberate inversion of the field's norm, not an implementation detail.
>
> The industry's recurring failure modes are rejected by name:
>
> - **state laundering** — AI-generated bible entries, automatic prose-derived summaries, or AI-updated profiles quietly becoming canon;
> - **keyword-triggered context activation** — record inclusion decided by string matching against recent text instead of explicit user selection;
> - **token-budget eviction** — silently trimming or dropping selected context to fit a budget;
> - **probabilistic inclusion** — records entering the prompt by chance.
>
> Compiled prompt size never causes silent eviction. Oversize and salience risks are warning surfaces; the user, not the compiler, decides what leaves the active working set.

### 3. Append the similar-tools survey anchors to §30 Source notes (D9c)

Add the survey sources backing §28.8 to the "Selected reference anchors" list in `## 30. Source notes`, matching its existing format (name + URL, one per line). Assemble the exact anchor list from SPEC-018's research provenance (similar-tools pass: novelcrafter, Sudowrite, RaptorWrite, Plottr/Campfire/World Anvil, SillyTavern World Info, NovelAI lorebook, AI Dungeon memory, waterverri/continuum) and show it for sign-off together with §1.1/§28.8 — it is covered by the same gate.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Any header normalization of `docs/FOUNDATIONS.md` (explicitly exempt from SPEC-018 D2; its header stays as-is).
- Any doctrine change, rule relaxation, or §29 checklist edit.
- The `docs/ACTIVE-DOCS.md` registry/ladder mirror (SPEC018FOUDOCCON-002).
- Implementing any validation rule, schema field, or runtime behavior.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "### 1.1 Amendment procedure and precedence" docs/FOUNDATIONS.md` — exactly one match, inside §1 before `## 2. App identity`.
2. `grep -n "### 28.8 Validate-and-block before generation is the differentiator" docs/FOUNDATIONS.md` — exactly one match, after §28.7 and before `## 29.`.
3. `npm run lint && npm run typecheck && npm test` — unaffected (docs-only change), all pass.

### Invariants

1. The inserted wording is byte-identical to the signed-off wording recorded on this ticket (modulo the blockquote markers, which are spec-carrier syntax, not doc content).
2. No existing FOUNDATIONS section is modified, renumbered, or removed; the amendments are purely additive.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -n "### 1.1 Amendment procedure\|### 28.8 Validate-and-block" docs/FOUNDATIONS.md`
2. `npm run lint && npm run typecheck && npm test`
3. Targeted greps are the correct verification boundary: the change is additive markdown in one doc; the full pipeline run only proves no collateral damage.
