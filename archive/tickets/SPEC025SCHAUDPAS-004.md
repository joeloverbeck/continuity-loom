# SPEC025SCHAUDPAS-004: Make CAST VOICE OVERRIDES[].reason author-only (non-prompt-facing)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — cast-override compiler serialization, field-guidance destination metadata, prompt-contamination enumeration, web label, authority docs, goldens; Zod shape unchanged
**Deps**: None

## Problem

`cast_voice_overrides[].reason` is rendered into every prompt-facing override block (`packages/core/src/compiler/sections/cast.ts:231`) and scanned as prompt-facing content (`universal-blockers.ts` `promptFacingUserInstructionText`). The external prose writer needs only `applies_to` (surface) and `override_text` (instruction); the *reason* ("because she is secretly the saboteur", "to fix a model tendency") leaks process notes, forbidden-source references, or facts that belong in records/current state. The fix keeps `reason` as an author-only field: structurally Zod-checked, editable, but never compiled and never scanned as prompt text.

## Assumption Reassessment (2026-06-20)

1. `reason` is rendered in the override block at `cast.ts:224-234` (`labelValue("reason", override.reason)` at `:231`) and enumerated as prompt-facing text in `universal-blockers.ts` `promptFacingUserInstructionText` (the `cast_voice_overrides` `overrideText` flatMap includes `entry.reason`). Its guidance lives in `field-guidance-brief-config.ts:90,388`. Confirmed by grep.
2. `docs/story-record-schema.md` §3.6 (CAST VOICE OVERRIDES) and `docs/compiler-contract.md` (override serialization) are the schema/contract authorities; `docs/prompt-template-rationale.md` §11 carries the override rationale.
3. Cross-artifact boundary under audit: the cast-override serializer (`cast.ts`) ↔ the prompt-contamination enumeration (`universal-blockers.ts`) ↔ the field-guidance destination metadata. All three must agree that `reason` is non-prompt-facing, or a scan would inspect a field that no longer compiles (or vice versa).
4. FOUNDATIONS principles motivating this ticket: §13 (field economy / destination truthfulness — every prompt-facing field must name a real destination) and §15/§29.6 (the secret firewall — process notes and forbidden-source references must not reach the writer). Restated: a field that should never reach the writer must be both un-compiled and excluded from the prompt-facing contamination scan, while staying available to the author.
5. Enforcement-surface check (§8/§15): removing `reason` from the override block and from `promptFacingUserInstructionText` *strengthens* the firewall (one fewer free-prose lane reaching the writer) and does not weaken any scan — the remaining override lanes (`applies_to`, `override_text`) stay compiled and scanned. Determinism is preserved: a draft differing only in `reason` must now produce byte-identical prose **and** ideation output. `reason` stays structurally Zod-checked (no semantic validation added). **Amendment: not required.**
6. Schema-metadata change (no shape change): the Zod schema for `cast_voice_overrides[].reason` is unchanged (field retained), so this is **not** a breaking schema change and needs **no migration**. What changes is the field's *destination metadata* (`promptFacing: "never"`, no prompt destinations) and its compile/scan treatment. The shared cast serializer feeds both the prose prompt and the ideation prompt, so both goldens must reflect `reason`'s removal where the demo fixture exercises an override.

## Architecture Check

1. Keeping `reason` in the Zod schema while flipping its destination to author-only is cleaner than deleting it: authors still record *why* an override exists (a legitimate authoring aid) without that rationale leaking to the writer. Removing it from both the serializer and the contamination enumeration keeps the "every prompt-facing field names a real destination" invariant exact.
2. No backwards-compatibility aliasing or shims: `reason` is not aliased or rerouted; it is simply no longer a prompt destination.

## Verification Layers

1. `reason` no longer compiled into the override block → codebase grep-proof: `grep -n "override.reason" packages/core/src/compiler/sections/cast.ts` returns nothing; golden diff shows the override block carries only `applies to` + `override_text`.
2. `reason` excluded from the prompt-facing contamination enumeration → codebase grep-proof on `universal-blockers.ts` `promptFacingUserInstructionText` (no `entry.reason`).
3. Changing only `reason` changes no compiled output → unit test: two drafts differing only in `reason` produce byte-identical prose **and** ideation prompts.
4. Destination truthfulness → schema validation against `docs/compiler-contract.md` (override serialization drops `reason`) + FOUNDATIONS §15 firewall review.

## What to Change

### 1. Drop `reason` from the override serializer

In `cast.ts`, render only `applies_to` + `override_text` in the override block (remove the `labelValue("reason", override.reason)` line at `:231`).

### 2. Mark `reason` author-only and de-scan it

In `field-guidance-brief-config.ts`, set the `cast_voice_overrides[].reason` guidance to `promptFacing: "never"` with no prompt destinations (entries at `:90` and `:388`). In `universal-blockers.ts`, remove `entry.reason` from the `cast_voice_overrides` flatMap in `promptFacingUserInstructionText` so `reason` is no longer scanned as prompt-facing content (`reason` stays structurally Zod-checked; no semantic validation is added).

### 3. Web label + docs + goldens

In the web brief editor (`GenerationBriefView.tsx`), keep the `reason` input but label it author-only (e.g. "Reason (not sent to the writer)."); the preview must show that changing only `reason` changes nothing. Update `docs/story-record-schema.md` §3.6, `docs/compiler-contract.md` (drop `reason` from override serialization), `docs/prompt-template-rationale.md` §11, and `docs/validation-rule-inventory.md`. Regenerate `golden-first-segment.prompt.txt` and `golden-ideation.prompt.txt` where the demo override block currently renders `reason`.

## Files to Touch

- `packages/core/src/compiler/sections/cast.ts` (modify)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/core/src/validation/rules/universal-blockers.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `docs/story-record-schema.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template-rationale.md` (modify)
- `docs/validation-rule-inventory.md` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)

## Out of Scope

- Removing or renaming the `reason` field (it is retained, author-only) — no schema migration.
- The other three retired fields and the effective-POV work — separate tickets.
- The retired-key capstone assertion (ticket 008); semantic validation of `reason` content.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-golden` (and cast-section tests) — the override block renders only `applies to` + `override_text`; regenerated goldens match.
2. A new prompt-inspection test — two drafts differing only in `cast_voice_overrides[].reason` produce byte-identical prose and ideation prompts.
3. A server round-trip regression test — a brief with a `reason` saves and reloads with `reason` intact (field retained) and `reason` absent from the compiled prompt.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. `cast_voice_overrides[].reason` appears in no compiled prose or ideation prompt and in no prompt-facing contamination scan.
2. `cast_voice_overrides[].reason` remains a valid, persisted Zod field (no migration, no data loss).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` / cast-section coverage — override block without `reason`; regenerated goldens.
2. New byte-stability assertion (in the compiler golden or a prompt-inspection test) — `reason`-only delta yields identical prose + ideation output.
3. `packages/server/src/compile-routes.test.ts` (or `generation-brief-routes.test.ts`) — round-trip persistence of `reason` + its absence from compiled output.
4. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — author-only label present; preview unaffected by `reason`.

### Commands

1. `npm test -- compiler-golden compiler-front-sections`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted compiler suites prove the serialization + byte-stability; the full pipeline is the correct final boundary because the change touches compiler, validation, web, docs, and two goldens.

## Outcome

Completed: 2026-06-20

Made `CAST VOICE OVERRIDES[].reason` author-only. The field remains in the generation-brief schema, draft/readiness parsing, UI, section-fill accounting, and server route persistence, but it is no longer rendered in current-generation voice override prompt blocks and no longer participates in prompt-facing contamination scans. Field guidance and the Generation Brief UI now label it as not sent to the writer.

Added compiler coverage proving override instructions still render while author-only reasons do not, and that changing only `reason` leaves both prose and ideation prompt bytes unchanged. Strengthened server route coverage so a non-default reason round-trips with the draft.

Deviations from plan: the demo goldens did not need content changes for `reason` because the demo fixture has no cast voice overrides; targeted compiler tests cover the behavior directly. `docs/validation-rule-inventory.md` required no edit because it did not describe `reason` as prompt-facing.

Verification:

- `npm test -- compiler-cast-sections compiler-golden compiler-ideation-golden GenerationBriefView generation-brief-routes field-guidance-brief-config validation-blockers` passed.
- `rg -n "override\\.reason|entry\\.reason|labelValue\\(\\\"reason\\\"" packages/core/src/compiler/sections/cast.ts packages/core/src/validation/rules/universal-blockers.ts` returned no matches.
- `rg -n "reason: z\\.union|cast_voice_overrides\\[\\]\\.reason|Reason \\(not sent to the writer\\)" packages/core/src/records packages/web/src/generation-brief docs/story-record-schema.md` confirmed the field remains schema/UI-visible.
- `git diff --check` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.

Browser smoke: not run. This is a compiler/validation/UI-form labeling change covered by targeted compiler, route, and React tests plus the full lint/typecheck/test/build gates. No live browser-only workflow or provider request shape was introduced.
