# SPEC025SCHAUDPAS-002: Remove IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note + correct continuation readiness

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — generation-brief schema (strict/draft/readiness), compiler placeholder + immediate-handoff section, completeness readiness rule, contamination scan, server draft migration, web brief editor, authority docs, goldens
**Deps**: SPEC025SCHAUDPAS-001

> **Same revision; never merge standalone (§1.1).** This ticket must land in the *same revision* as the §10 amendment (ticket 001). If §10 sign-off is declined, **drop both 001 and 002**; the other SPEC-025 changes ship without them.

## Problem

`prior_accepted_prose_status_or_handoff_note` is a fourth IMMEDIATE HANDOFF lane named after accepted prose (`packages/core/src/records/generation-brief.ts:54`). Its plausible content is already owned by `recent_causal_context` (the causal bridge) and `last_visible_moment` / `begin_after` (the cutpoints). Field guidance calls it optional/`None`, yet the completeness rule requires **all four** handoff strings for every continuation (`packages/core/src/validation/rules/universal-completeness.ts:112-118`), contradicting `docs/story-record-schema.md` §3.3 (bridge **plus either** cutpoint). The lane is mandatory clerical boilerplate that keeps the forbidden accepted-prose source cognitively salient. Removing it requires the §10 amendment (ticket 001), which this ticket co-lands with.

## Assumption Reassessment (2026-06-20)

1. The lane exists in all three brief schemas — `generation-brief.ts:54` (strict, required), `generation-brief-draft.ts:59` (optional), `generation-brief-readiness.ts:63` (optional) — confirmed by grep. The compiler placeholder/resolver lives in `compiler/placeholder-map.ts`, `compiler/template-constants.ts`, `compiler/empty-states.ts`, `compiler/compile-prompt.ts`, and `compiler/sections/front.ts`; field guidance in `records/field-guidance-brief-config.ts`; field paths in `records/field-paths.ts` / `records/field-path-enumeration.ts`.
2. `docs/story-record-schema.md` §3.3 already documents the correct continuation rule ("recent causal bridge and either a last visible moment or a begin-after point"); the code is what drifted. The compiler-contract placeholder table row (`docs/compiler-contract.md:192`), first-segment line (`:266`), and immediate-handoff "always renders" statement (`:364`) all name the field and must be updated.
3. Cross-artifact boundary under audit: the generation-time brief schema (`docs/story-record-schema.md` §3.3) ↔ the compiler immediate-handoff section (`docs/compiler-contract.md`) ↔ the readiness rule. All three must move together so the universal prompt contract's `<immediate_handoff>` section still renders deterministically with the remaining three lanes.
4. FOUNDATIONS principles motivating this ticket: §10 (no accepted prose; the amendment in 001 authorizes the removal) and §11 / §29.5 (fail-closed validation must be *accurate* — the all-four rule over-blocks). Restated: continuation readiness blocks only on the documented minimum (bridge + either cutpoint); warnings never gate; structurally-saveable drafts still save.
5. Enforcement-surface check (§8/§15/§29.4): `<immediate_handoff>` stays a rendered universal-prompt-contract section (no §29.4 section omission) — it renders `recent_causal_context`, the cutpoints, and the fixed accepted-prose firewall instruction after this change. The contamination scan in `universal-blockers.ts` (`isCleanNoAcceptedProseNote` and the prompt-facing handoff-lane inspection) must keep inspecting the remaining genuinely prompt-facing lanes (`recent_causal_context`, `last_visible_moment`, `begin_after`) plus manual directive and stop guidance; only the retired lane's inspection is dropped. Compilation stays deterministic; the migration strips the key before strict parse (no nondeterminism, no leakage).
6. Output-schema change: this modifies the generation-time brief (strict + draft + readiness). It is **breaking** for any payload carrying the key; consumers are the three schemas, the compiler, the completeness rule, the contamination scan, the demo fixture, the web editor, and ~20 tests. The server draft migration removes the stored key so legacy drafts parse.
7. Schema-field removal blast radius (grep `prior_accepted_prose_status_or_handoff_note`): src/docs surfaces in Files to Touch; the field name also appears in `docs/FOUNDATIONS.md:409` (owned by ticket 001) and `packages/core/test/schema-audit-cleanup-capstone.test.ts` (the retired-key assertion is owned by ticket 008). Test consumers are enumerated in Test Plan. This removal is one vertical (schema tighten + migration + cross-package consumers co-land) — a per-layer split would leave a typecheck-broken or legacy-unopenable intermediate that CLAUDE.md forbids shimming.

## Architecture Check

1. Removing the lane (rather than re-labelling it) is the only fix that ends the accepted-prose salience and the over-blocking simultaneously; correcting the readiness rule to the already-documented minimum aligns code to `docs/story-record-schema.md` §3.3 instead of weakening it. The draft migration strips the key with no semantic-guess copy into `recent_causal_context` — cleaner than a fallback that would manufacture handoff prose.
2. No backwards-compatibility aliasing or shims: no alias, no auto-summary, no accepted-segment lookup, no inferred handoff. The migration deletes the key and does not preserve it under another name.

## Verification Layers

1. Lane gone from all schemas/compiler/guidance/web → codebase grep-proof: `grep -rn "prior_accepted_prose_status_or_handoff_note" packages/` returns only the ticket-008-owned capstone test (and zero in production src).
2. Continuation readiness = bridge + either cutpoint → schema validation + unit test: a draft with `recent_causal_context` + only `begin_after` is ready; missing the bridge or both cutpoints blocks (`missingImmediateHandoff`).
3. `<immediate_handoff>` still renders deterministically with three lanes + firewall text → schema validation against `docs/compiler-contract.md` + golden diff (`golden-first-segment.prompt.txt`).
4. Contamination firewall preserved on remaining lanes → FOUNDATIONS alignment check (§10/§15): `accepted-prose-exclusion.test.ts` still blocks pasted accepted prose in `recent_causal_context`.
5. Legacy draft carrying the retired key opens after migration, idempotently → server e2e: migrate twice, second run no-ops; no key copied into another field.

## What to Change

### 1. Remove the lane from the brief schemas and field metadata

Delete `prior_accepted_prose_status_or_handoff_note` from `generation-brief.ts`, `generation-brief-draft.ts`, `generation-brief-readiness.ts`, its guidance entry in `field-guidance-brief-config.ts`, and its field-path entries in `field-paths.ts` / `field-path-enumeration.ts`. Retain the three functional lanes.

### 2. Delete the compiler placeholder/resolver

Remove the placeholder from `placeholder-map.ts`, its constant from `template-constants.ts`, its empty state from `empty-states.ts`, its resolution in `compile-prompt.ts` and `sections/front.ts`, and the `{prior_accepted_prose_status_or_handoff_note}` label+placeholder line from `docs/prompt-template.md` — retaining the fixed no-accepted-prose instruction text. No replacement resolver, summary, cache, or fallback. Update `<immediate_handoff>` so it always renders the section tag, `recent_causal_context`, the cutpoints (label+value omitted when empty), and the firewall text.

### 3. Correct the continuation readiness rule

In `universal-completeness.ts` (the `continuation_after_accepted_segment` branch at lines 112-129): require `recent_causal_context` **and** at least one of `last_visible_moment` / `begin_after`; drop the `prior_accepted_prose_status_or_handoff_note` clause; update `whyItMatters` to name the bridge + one cutpoint (not the retired lane). First-segment continues to require no handoff. In `universal-blockers.ts`, drop the retired lane from the prompt-facing contamination enumeration while keeping the other lanes + manual directive + stop guidance inspected.

### 4. Server migration + web editor + docs

Extend `generation-session-draft-migration.ts` to strip the legacy key before strict parse (transactional, idempotent, sibling-preserving, rollback-safe; must not copy the value into `recent_causal_context`). In the web brief editor (`GenerationBriefView.tsx`, `section-fill.ts`), remove the row/help/requiredness/section-fill and surface readiness directly (causal context required; one cutpoint required; accepted prose must not be pasted/summarized). Update `docs/story-record-schema.md` §§3.3 and 10, `docs/compiler-contract.md` (placeholder table, first-segment/continuation matrix, omission + firewall wording), `docs/prompt-template-rationale.md` §§5-6, `docs/validation-rule-inventory.md`, and `docs/user-guide.md`. Regenerate `golden-first-segment.prompt.txt`; the ideation golden retains the fixed accepted-prose-is-not-context statement.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-readiness.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/records/field-paths.ts` (modify)
- `packages/core/src/records/field-path-enumeration.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/generation-session-draft-migration.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/section-fill.ts` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `docs/user-guide.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)

## Out of Scope

- The §10 amendment wording itself (ticket 001) and the cross-spec retired-key capstone assertion (ticket 008).
- The other three retired fields (`governing_policy_note`, `FACT.status`, `PLAN.can_drive_prose`) and the effective-POV work — separate tickets.
- Any new handoff field (durable-change note rejected — SPEC-025 Out of Scope §13.5).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- generation-brief-readiness` (and `validation-completeness`) — continuation ready with bridge + one cutpoint; blocks when the bridge or both cutpoints are absent.
2. `npm test -- accepted-prose-exclusion` — pasted accepted prose still blocks in the remaining prompt-facing handoff lanes.
3. `npm test -- generation-session-draft-migration` — legacy draft with the retired key opens after migration; second migration is a no-op; key not copied elsewhere.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green (incl. regenerated `golden-first-segment.prompt.txt`).

### Invariants

1. No production source under `packages/` references `prior_accepted_prose_status_or_handoff_note` after this ticket.
2. `<immediate_handoff>` remains a rendered universal-prompt-contract section (§29.4) with the accepted-prose firewall text intact.

## Test Plan

### New/Modified Tests

1. `packages/core/test/generation-brief-readiness.test.ts` — re-anchor continuation readiness to bridge + either cutpoint.
2. `packages/core/test/validation-completeness.test.ts` — drop the all-four expectation; add the bridge + single-cutpoint cases.
3. `packages/server/src/generation-session-draft-migration.test.ts` — legacy-key strip, idempotence, no-copy assertion.
4. `packages/core/test/compiler-front-sections.test.ts`, `packages/core/test/compiler-golden.test.ts`, `packages/core/test/compiler-scaffold.test.ts` — `<immediate_handoff>` three-lane rendering + regenerated golden.
5. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — editor row removed; readiness surfaced.
6. Update remaining key-referencing tests enumerated by `grep -rln prior_accepted_prose_status_or_handoff_note packages/*/src packages/*/test` (excluding the ticket-008 capstone).

### Commands

1. `npm test -- generation-brief-readiness validation-completeness generation-session-draft-migration accepted-prose-exclusion`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted suites prove the readiness/migration/firewall behavior; the full pipeline is the correct final boundary because the change touches schema, compiler, validation, server, web, and a golden across all three packages.

## Outcome

Completed: 2026-06-20

Removed `IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note` from the strict, draft, and readiness generation-brief schemas; compiler placeholder registration and rendering; empty-state constants; field guidance; the generation brief UI; demo fixtures; route/test fixtures; and active docs. Continuation readiness now requires a user-authored recent causal bridge plus either `last_visible_moment` or `begin_after`, matching `docs/story-record-schema.md`. Prompt-facing contamination checks continue to scan the remaining handoff lanes, manual directive, and stop guidance. The server draft migration strips the retired legacy key before strict parsing, preserves sibling handoff fields, does not copy the removed value into another lane, and is idempotent.

Deviations from plan: none. The ticket co-landed with ticket 001 as required. The generated prompt and ideation goldens were regenerated to remove the retired handoff block while preserving the fixed accepted-prose firewall trailer.

Verification:

- `npm test -- generation-brief-readiness validation-completeness generation-session-draft-migration accepted-prose-exclusion compiler-front-sections compiler-scaffold field-guidance-brief-config GenerationBriefView FieldHelp compiler-golden compiler-ideation-golden` passed.
- `npm test -- generation-brief-routes` passed after updating the blank-draft normalization expectation.
- `rg -n "prior_accepted_prose_status_or_handoff_note|Prior accepted prose status|accepted-prose status" docs packages -g '!node_modules'` returned no matches.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.

Browser smoke: not run. The change affects deterministic schemas, compiler output, validation, server migration/route behavior, and the generation-brief form; those surfaces are covered by targeted unit/e2e tests plus full lint/typecheck/test/build gates. No live-provider request shape or browser-only interaction was introduced.
