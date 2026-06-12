# SPEC022IDENATPRO-003: Ideation-framed contract variants + distinctness instruction

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds ideation-framed variants of `<authority_hierarchy>`, `<content_policy>`, `<immediate_handoff>`, and `<manual_directive>` to the ideation prompt, adds a mutual-distinctness block to `<ideation_quality>`, refreshes the ideation golden, and co-lands the contract/template docs; the prose prompt is unchanged.
**Deps**: SPEC022IDENATPRO-002

## Problem

The ideation prompt reuses prose-contract sections whose instructions contradict the ideation contract: `<authority_hierarchy>` item 2 commands "prose only" while `<ideation_role>` forbids prose; `<immediate_handoff>` says "Begin prose exactly after this point"; `<manual_directive>` says "Must render:" (SPEC-022 §Problem Statement #3). Separately, LLM idea pools homogenize by default (SPEC-022 §D research). This ticket replaces the prose-contract residue with ideation-framed variants (D3) and adds an evidence-backed mutual-distinctness instruction to `<ideation_quality>` (D4). Merged per the spec's decomposition hint; both are small, deterministic-text changes that refresh the same golden.

## Assumption Reassessment (2026-06-12)

1. `<authority_hierarchy>` is a fully-static `SECTION_TEMPLATES` entry (`packages/core/src/compiler/template-constants.ts:106-122`, item 2 = "prose only, no commentary or record updates"). `<content_policy>` is a `SECTION_TEMPLATES` entry **carrying placeholders** (`{rating_label}` …, `template-constants.ts:123+`). `<immediate_handoff>` and `<manual_directive>` are **function-rendered** with hardcoded labels (`compile-prompt.ts:59` "Begin prose exactly after this point", `:67` "Must render", `:221` trailer) via `renderImmediateHandoffSection`/`renderManualDirectiveSection`, which take only `snapshot`. `<ideation_quality>` is a static `IDEATION_SECTION_TEMPLATES` entry (`template-constants.ts:428-434`).
2. SPEC-022 §C/§D fix the exact strings above and confirm all variant text is enumerated in `docs/ideation-prompt-template.md` + the compiler contract in the same revision (§8 drift rule).
3. Cross-artifact boundary under audit: the variant text lives in three places that must agree — the compiler templates/renderers, `docs/compiler-contract.md`, and `docs/ideation-prompt-template.md`. §8 binds them in one revision.
4. §9.1 assistance prompt class (the FOUNDATIONS principle motivating this ticket): the variants resolve the prose/ideation contract contradiction so the assistance prompt never commands prose and never frames its output as the next segment — keeping it non-prose, deterministic, and inspectable. The handoff/directive content (recent-causal-context, last-visible-moment, directive bodies) is unchanged; only the prose-implying labels/trailers change.
5. Deterministic-compilation render mechanism (§8): per SPEC-022 §C, only `ideation_authority_hierarchy` is a clean static `IDEATION_SECTION_TEMPLATES` swap. `<content_policy>` carries placeholders, so its ideation variant must route through `renderTemplate` (a raw static entry returns `{rating_label}` unresolved — `renderSection` returns static ideation templates without placeholder substitution, `compile-prompt.ts:195-197`); `<immediate_handoff>`/`<manual_directive>` need the prose/ideation signal threaded into their render functions. No nondeterminism or LLM intermediary is introduced.

## Architecture Check

1. Each variant uses the mechanism that fits the section's existing render path — a static swap for the placeholder-free `authority_hierarchy`, a `renderTemplate`-routed ideation variant for the placeholder-bearing `content_policy`, and a promptKind-conditioned label in the function-rendered handoff/directive — rather than forcing all four into one mechanism. This avoids the literal-`{rating_label}` trap and keeps the prose path's labels untouched.
2. No backwards-compatibility aliasing: the ideation order references the ideation variant directly; the prose `SECTION_ORDER` keeps the prose templates. There is no shared mutable template toggled at runtime — the prose and ideation variants are distinct constants/branches.

## Verification Layers

1. Contract-contradiction removal -> `compiler-ideation-golden.test.ts`: the ideation prompt contains no "prose only" authority line, no "Begin prose exactly after this point", and no "Must render".
2. Placeholder resolution (§8) -> golden assertion: the ideation `<content_policy>` shows the resolved rating (no literal `{rating_label}`) with the "into the output" trailer.
3. Distinctness instruction present -> golden/grep assertion: `<ideation_quality>` contains the mutual-distinctness block; the existing eventfulness/reveal/SKIPPED rules are unchanged.
4. Prose untouched -> `compiler-golden.test.ts` byte-identical (the prose labels "prose only"/"Begin prose exactly after this point"/"Must render" remain in the prose golden).

## What to Change

### 1. Ideation-framed variants (D3)

In `template-constants.ts`: add `ideation_authority_hierarchy` (static `IDEATION_SECTION_TEMPLATES` entry per SPEC-022 §C — item 2 "premise-level ideas or questions only, no prose, no record updates", manual-directive reframed as authored context, voice-pin/prose-craft refs dropped, closing line "Do not mention this hierarchy in the output") and reference it from `IDEATION_SECTION_ORDER` in place of `authority_hierarchy`; add an ideation `content_policy` variant template (trailer "into the output"). In `compile-prompt.ts`: route the ideation `content_policy` through `renderTemplate`; thread the prose/ideation signal into `renderImmediateHandoffSection` (label → "The next prose segment will begin after this point"; ideation trailer) and `renderManualDirectiveSection` (label → "The author's directive for the next segment (binding context: ideas must be compatible with it)").

### 2. Distinctness instruction (D4)

In `template-constants.ts`: append the mutual-distinctness block to `ideation_quality` per SPEC-022 §D — no two ideas share the same dominant pressure source or dramatic move; each differs along ≥1 named axis (who acts / which pressure fires / what changes durably). Leave the eventfulness rubric, reveal-permission rules, and SKIPPED rule unchanged.

### 3. Golden + docs (same revision, §8)

Refresh `golden-ideation.prompt.txt`; update `compiler-ideation-golden.test.ts`. Enumerate the variant text and the distinctness block in `docs/compiler-contract.md` and `docs/ideation-prompt-template.md`.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/ideation-prompt-template.md` (modify)

## Out of Scope

- The section restructure (SPEC022IDENATPRO-001) and short keys / keyed render sites (SPEC022IDENATPRO-002).
- UI grounds provenance (SPEC022IDENATPRO-004).
- Any change to the prose `<authority_hierarchy>`, `<content_policy>`, `<immediate_handoff>`, `<manual_directive>` templates/labels, or to the eventfulness/reveal/SKIPPED rules inside `<ideation_quality>`.

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-ideation-golden.test.ts`: ideation prompt has no "prose only" authority line, no "Begin prose exactly after this point", no "Must render"; ideation `<content_policy>` resolves placeholders with the "into the output" trailer (no literal `{rating_label}`); `<ideation_quality>` contains the distinctness block.
2. `compiler-golden.test.ts` (prose golden) byte-identical.
3. `npm test`, `npm run lint`, `npm run typecheck` pass.

### Invariants

1. The ideation prompt never instructs the model to write prose or treats its output as the next segment (§9.1); the prose prompt's labels are unchanged.
2. All variant text is deterministic and placeholder-resolved; identical inputs ⇒ identical prompt (§8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ideation-golden.test.ts` — negative assertions for the removed prose labels, positive assertions for the ideation variants + distinctness block; golden refreshed.
2. `packages/core/test/golden-ideation.prompt.txt` — regenerate against the ideation-framed prompt.

### Commands

1. `npx vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test`
3. Core-only Vitest is the correct boundary while iterating (no server/web surface changes); `npm test` is the merge gate.
