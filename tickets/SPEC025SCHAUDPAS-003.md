# SPEC025SCHAUDPAS-003: Remove UNIVERSAL CONTENT POLICY.governing_policy_note

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — UCP schema, compiler placeholder + content-policy line, completeness rule, server global-config migration, web story-config editor, authority docs, goldens
**Deps**: None

## Problem

`governing_policy_note` is a required, prompt-facing free-prose UCP field (`packages/core/src/records/global-config.ts:23`) restating an immutable external invariant (provider/platform policy) the user cannot truthfully define. The universal template already states the fixed external-policy boundary statically, and the authority hierarchy (FOUNDATIONS §5) already ranks external policy above story pressure. No deterministic rule can verify that user prose matches the actual selected provider policy. This is the same field-economy class as the already-removed `STORY CONTRACT.continuity_philosophy` (pass-1): a constitutional literal presented as editable project data.

## Assumption Reassessment (2026-06-20)

1. `universalContentPolicySchema` has exactly five fields — `rating_label`, `allowed_content_scope`, `tonal_handling`, `governing_policy_note`, `character_bias_handling` (`global-config.ts:18-26`); removing `governing_policy_note` leaves **four**. Confirmed by reading the schema during reassessment. Compiler placeholder at `docs/prompt-template.md:46` (`Governing policy note: {governing_policy_note}`) and contract row at `docs/compiler-contract.md:167`.
2. `docs/story-record-schema.md` §2.2 (UNIVERSAL CONTENT POLICY) is the schema authority for these fields; the static external-policy boundary doctrine belongs there and in the template. The completeness rule that currently treats the note as needed lives in `packages/core/src/validation/rules/universal-completeness.ts`.
3. Cross-artifact boundary under audit: the UCP schema (`docs/story-record-schema.md` §2.2) ↔ the content-policy template line (`docs/prompt-template.md`) ↔ the compiler contract row (`docs/compiler-contract.md`). They must move together; the content-policy *section* stays (only the user-note line is removed).
4. FOUNDATIONS principles motivating this ticket: §13 (field economy — the field earns no deterministic compilation/validation/continuity/voice/authorial-control function) and §11 (the completeness rule must stop requiring an unverifiable user-entered provider note). Restated: external policy is a fixed template literal, not editable project data; removing it reduces no expressivity.
5. Enforcement-surface check (§8/§29.4): the content-policy section remains a rendered universal-prompt-contract section (no §29.4 omission); only one user-authored line is deleted while the static external-policy sentence is retained. Compilation stays deterministic; the migration strips the key before strict parse. No secret-firewall surface is touched. **Amendment: not required** (R1 is not constitutionally gated).
6. Output-schema change: this modifies UCP (story configuration). It is **breaking** for any global-config payload carrying the key; consumers are the schema, story-config field guidance, field paths, the compiler placeholder/empty-state, the completeness rule, the demo fixture, the web `StoryConfigEditor`, and tests. The server global-config migration removes the stored key so legacy/orphan configs parse.
7. Schema-field removal blast radius (grep `governing_policy_note`): src/docs/golden surfaces in Files to Touch; test consumers enumerated in Test Plan; the retired-key capstone assertion is owned by ticket 008. One vertical (schema tighten + migration + cross-package consumers co-land); no shim-free per-layer split exists.

## Architecture Check

1. Deleting the field and retaining the static external-policy sentence is cleaner than keeping an unverifiable editable note: it removes a misleading control, ends a fake requiredness in the completeness rule, and leaves the authority boundary stated where it is actually fixed (the template). No alias, fallback, or provider-policy cache is introduced.
2. No backwards-compatibility aliasing or shims: the migration deletes the key and never manufactures replacement policy prose; the web editor drops the input rather than disabling it.

## Verification Layers

1. Field gone from schema/compiler/guidance/web → codebase grep-proof: `grep -rn "governing_policy_note" packages/` returns only the ticket-008 capstone test (zero in production src).
2. Completeness requires the four remaining UCP fields, not the note → unit test: a config with the four fields is ready; none of them being the retired note.
3. Content-policy section still renders the static external-policy boundary → schema validation against `docs/compiler-contract.md` + golden diff (`golden-first-segment.prompt.txt`).
4. Legacy/orphan global-config carrying the key opens after migration, idempotently → server e2e (`global-config-migration.test.ts`): migrate twice, second run no-ops; no replacement prose synthesized.

## What to Change

### 1. Strip the key from the UCP schema and field metadata

Remove `governing_policy_note` from `universalContentPolicySchema` (`global-config.ts`) and the draft story-config shape, its guidance entry in `field-guidance-brief-config.ts`, and its field-path entries in `field-paths.ts` / `field-path-enumeration.ts`.

### 2. Delete the compiler placeholder; keep the static sentence

Remove the placeholder from `placeholder-map.ts`, its constant from `template-constants.ts`, its empty state from `empty-states.ts`, and its resolution in `sections/front.ts`. Delete the `Governing policy note: {governing_policy_note}` line from `docs/prompt-template.md` while retaining the static external-policy sentence in the content-policy section. In `universal-completeness.ts`, require the four remaining policy fields and stop claiming a user-entered provider-policy note is needed.

### 3. Server migration + web editor + docs

Extend `global-config-migration.ts` to idempotently strip `universalContentPolicy.governing_policy_note` from live and legacy/orphan global-config payloads before strict parse (transactional, sibling-preserving, rollback-safe; never manufacture replacement policy prose). In `StoryConfigEditor.tsx`, remove the input/label/help/requiredness while preserving clear UI language that story settings cannot override provider policy. Update `docs/story-record-schema.md` §2.2 (four fields; external policy = fixed template doctrine), `docs/compiler-contract.md` (delete the `{governing_policy_note}` row + its completeness/empty-state rule), `docs/prompt-template-rationale.md` §3, `docs/validation-rule-inventory.md`, and `docs/ideation-prompt-template.md` only where the field is exposed. Regenerate `golden-first-segment.prompt.txt` and `golden-ideation.prompt.txt` where the line appears.

## Files to Touch

- `packages/core/src/records/global-config.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/records/field-paths.ts` (modify)
- `packages/core/src/records/field-path-enumeration.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/empty-states.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify)
- `packages/server/src/global-config-migration.ts` (modify)
- `packages/web/src/config/StoryConfigEditor.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)

## Out of Scope

- The other three retired fields and the effective-POV work — separate tickets.
- The retired-key capstone assertion (ticket 008).
- Any new UCP field; provider-policy caching or auto-population (explicitly rejected — no alias/fallback/cache).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- validation-completeness` — UCP readiness requires the four remaining fields; the retired note is neither required nor referenced.
2. `npm test -- global-config-migration` — legacy/orphan config with the key opens after migration; second run no-ops; no replacement prose written.
3. `npm test -- compiler-golden` — content-policy section renders the static boundary; regenerated golden matches.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. No production source under `packages/` references `governing_policy_note` after this ticket.
2. The content-policy section remains a rendered universal-prompt-contract section with the fixed external-policy boundary text (§29.4).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-completeness.test.ts` — drop the governing-policy-note requirement; assert the four-field UCP readiness.
2. `packages/server/src/global-config-migration.test.ts` — key-strip, idempotence, no-synthesis assertions on live + orphan payloads.
3. `packages/core/test/compiler-front-sections.test.ts`, `packages/core/test/compiler-golden.test.ts` — content-policy rendering + regenerated goldens.
4. `packages/web/src/config/StoryConfigEditor.test.tsx` — input removed; provider-policy language retained.
5. Update remaining key-referencing tests from `grep -rln governing_policy_note packages/*/src packages/*/test` (excluding the ticket-008 capstone).

### Commands

1. `npm test -- validation-completeness global-config-migration compiler-golden`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted suites prove the readiness/migration/render behavior; the full pipeline is the correct final boundary because the change spans schema, compiler, validation, server, web, and goldens.
