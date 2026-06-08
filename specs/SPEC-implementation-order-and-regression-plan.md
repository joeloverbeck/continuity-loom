# SPEC — Implementation Order and Regression Plan

Status: proposed active implementation spec  
Repository: `joeloverbeck/continuity-loom`  
Target commit: `e1df2d032c7ae7976108f70cafa5802a7398ce39`

## Executive decision

Fix the data contract first, then validation semantics, then readiness UX. Do not start by polishing the UI around bad blockers. The current save model and validation taxonomy are the root defects.

This is still a spec-level plan. No tickets are included.

## Phase 0 — Lock regression fixtures

Before changing behavior, add characterization tests that prove the current failure and prevent accidental reintroduction.

Required failing-first tests:

1. Blank generation brief draft can be submitted by the UI without a generated fallback directive.
2. Server draft save currently rejects blank nested surfaces; the new expected behavior is `ok: true`.
3. UI local `first_segment` default does not repair persisted validation today; new expected behavior uses server/core default.
4. Blank `soft_unit_guidance` currently blocks; new expected behavior is no blocker.
5. Missing current cast voice pressure currently blocks active speaker; new expected behavior is warning or no diagnostic when durable voice anchor exists.

## Phase 1 — Core draft schema and normalizer

Implement in core:

- `generationSessionDraftSchema`
- `normalizeGenerationSessionDraft`
- `deriveGenerationContextDefault`
- `normalizeGenerationSessionForReadiness`
- `GenerationSessionReadyCandidate` type

Regression coverage:

- blank strings allowed in draft
- invalid enum/ID rejected
- missing generation context defaulted from accepted segment count
- blank stop guidance normalized to deterministic empty state
- blank launch directive remains absent and blocks readiness
- first-segment blank handoff normalizes to empty state
- continuation blank handoff blocks readiness

Risk:

- Too-permissive draft schema could hide real malformed input.

Mitigation:

- Permit incompleteness, not unknown shapes. Keep strict object keys and enum/ID validation.

## Phase 2 — Server persistence and snapshot fixes

Update:

- `packages/server/src/generation-brief-routes.ts`
- `packages/server/src/record-repository.ts`
- `packages/server/src/snapshot-builder.ts`
- route tests

Required behavior:

- `PUT /api/generation-brief` parses with draft schema.
- Save never runs readiness blockers.
- Save returns structured draft-shape errors only.
- Snapshot builder uses normalized ready candidate and accepted-segment count.
- Accepted prose text remains excluded from prompt inputs.

Regression coverage:

- save partial blank draft
- save malformed enum fails with `malformed-draft`
- missing context defaults to first segment with no accepted segments
- missing context defaults to continuation with accepted segments
- compile and generate still fail closed when true blockers exist
- secret/API/prompt/candidate/accepted-prose logging boundaries preserved

Rollback note:

- If a draft normalization bug appears, revert only the route-to-draft-schema change after preserving the characterization tests. Do not revert the doctrine that draft saving must be possible.

## Phase 3 — Compiler empty states

Update:

- `packages/core/src/compiler/empty-states.ts`
- `packages/core/src/compiler/placeholder-map.ts` only if required by the implementation
- compiler golden/scaffold tests

Required compiler behavior:

- Blank stop guidance renders: `No additional user narrowing; use the universal local stop rule above.`
- First segment with no handoff renders: `No prior accepted prose. Begin from current authoritative state and the launch directive.`
- No accepted prose text is ever included.
- Missing launch directive still cannot be treated as valid at readiness boundaries.

Regression coverage:

- golden prompt for first segment with blank stop guidance and no handoff
- golden prompt for continuation handoff without accepted prose text
- no `None specified` for stop guidance if that phrasing is kept from sounding like missing instructions
- prompt fingerprint changes intentionally and snapshots are updated once

Risk:

- Fingerprints/golden files will change.

Mitigation:

- Treat this as intentional contract version change. Increment contract/template version if the repo uses explicit version strings.

## Phase 4 — Validation taxonomy correction

Update:

- `packages/core/src/validation/rules/universal-completeness.ts`
- `packages/core/src/validation/rules/universal-blockers.ts`
- `packages/core/src/validation/rules/matrix-voice.ts`
- `packages/core/src/validation/rules/matrix-physical.ts`
- `packages/core/src/validation/rules/matrix-durable.ts`
- `packages/core/src/validation/rules/matrix-knowledge.ts`
- `packages/core/src/validation/rules/warnings.ts`
- validation diagnostic types if needed

Required changes:

- Remove `missing-stop-guidance` blocker.
- Replace nonblank invalid stop guidance with specific local-scope blockers.
- Gate immediate handoff by generation context.
- Split universal current state into minimal universal blockers and matrix-gated blockers.
- Remove universal current-cast pressure blocker.
- Make current voice pressure optional unless supplied contradictory pressure creates a hard conflict.
- Deduplicate/group long dossier and prompt salience warnings.

Regression coverage:

- every blocker taxonomy category has at least one positive and one negative test
- every focus tag maps to deterministic required fields
- selected records alone do not over-trigger unrelated blockers
- warnings never set `isBlocked`
- warnings never enter compiled prompt

Risk:

- Some current tests assert bad blockers.

Mitigation:

- Update tests to encode doctrine, not historical implementation. Preserve a compatibility note in the evidence appendix.

## Phase 5 — Diagnostic model and readiness API

Update:

- `packages/core/src/validation/types.ts`
- server readiness adapter or new `/api/readiness`
- `packages/web/src/api.ts`
- route tests

Required behavior:

- Diagnostics include title, group, fastest fix, affected display labels, dedupe key, and technical metadata.
- Readiness model distinguishes validation blockers, provider blockers, warnings, and unsaved draft state.
- Raw IDs and codes move to technical expanders.

Regression coverage:

- grouped warning has multiple affected records
- display label resolution works
- missing display label falls back to record type + short ID in technical details
- no secrets/full payloads in readiness responses

## Phase 6 — Three-page UX implementation

Update:

- `GenerationBriefView.tsx`
- `ValidationPanel.tsx`
- `ReadinessChecklist.tsx`
- `PromptPreviewView.tsx`
- `GenerateView.tsx`
- web tests

`ValidationResultView.tsx` was retired by the completed readiness capstone; do not treat it as an active update target.

Required behavior:

- Save draft is independent of readiness.
- Same readiness checklist appears on all three pages.
- Preview disabled only by validation blockers.
- Generate disabled by validation blockers or provider blockers.
- Warning-only state remains actionable but non-blocking.
- Technical details collapsed by default.
- Field/record/settings actions navigate or focus correctly.

Regression coverage:

- blank draft save succeeds from UI
- missing launch directive blocks Preview/Generate but not Save
- warning-only state compiles prompt and enables Generate with provider configured
- provider missing key disables Generate but not Preview
- unsaved changes show stale readiness notice
- accessibility checks for headings, alerts, focus, disclosure controls

## Phase 7 — Active docs and user guide update

Replace the active docs included in this bundle:

- `docs/FOUNDATIONS.md`
- `docs/story-record-schema.md`
- `docs/compiler-contract.md`
- `docs/prompt-template-rationale.md`
- `docs/prompt-template.md`
- `docs/user-guide.md`
- `docs/demo-blocker-recipes.md`
- `docs/stress-coverage-matrix.md`
- `docs/stress-suite.md`

Regression coverage:

- guidance coverage tests updated for new field labels and doctrine
- docs no longer claim blank stop guidance blocks
- docs no longer claim current cast voice pressure is universal gate
- docs state draft saving is independent of readiness

## Phase 8 — Demo project smoke path

Run a full demo project path:

1. Create/open demo project.
2. Open Generation Brief.
3. Save blank/partial draft.
4. Observe readiness blockers for missing launch directive and minimum current state only.
5. Add minimal first-segment state and launch directive.
6. Leave stop guidance blank.
7. Leave current voice pressure blank when durable voice anchor exists.
8. Preview prompt successfully.
9. Configure provider.
10. Generate candidate.
11. Accept candidate.
12. Confirm durable-change reminder appears and accepted prose is not added to prompt context.

## Final acceptance checklist

- Draft saving is separated from generation readiness.
- `generation_context` default is deterministic and server-visible.
- Blank `soft_unit_guidance` is settled and tested.
- `manual_moment_directive.must_render` remains a true generation blocker.
- First-segment handoff can be empty.
- Continuation handoff is required and accepted prose remains excluded.
- Current authoritative state has a minimal universal blocker set plus context-gated requirements.
- Current cast voice pressure is optional salience, not a universal blocker.
- Warning copy is actionable and deduplicated.
- Preview/Generate are blocked only by true blockers and provider configuration.
- No implementation introduces branch/beat/act/drama-manager logic.
- No LLM validation or semantic inference is added.
