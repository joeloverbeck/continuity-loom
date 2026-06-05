# SPEC007DETPROCOM-003: Front-section resolvers (content_policy → secrets_and_reveal_constraints)

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds dynamic resolvers for `compiler-contract.md` §3 sections 3–12 into the `@loom/core` compiler placeholder map.
**Deps**: SPEC007DETPROCOM-002

## Problem

The scaffold (002) renders sections 3–12 as empty-state constants. This ticket fills
in their deterministic resolvers from the snapshot: content policy, story contract,
prose mode, hard canon, current authoritative state, immediate handoff, manual
directive, and the POV / audience / secret lanes. These are the hard-state and
knowledge-boundary sections that must render correctly for the prompt to be safe —
especially the secret firewall (§15) and the accepted-prose exclusion (§10).

## Assumption Reassessment (2026-06-05)

1. The scaffold's `placeholder-map.ts`, section-order array, and empty-state constant
   table exist after 002 (`packages/core/src/compiler/`). This ticket registers
   resolvers for sections 3–12; it does not change the section order or the constant
   table.
2. The placeholder names, sources, requiredness, and empty-state constants for these
   sections are fixed by `docs/compiler-contract.md` §4 rows (e.g. `{rating_label}`,
   `{title}`, `{premise}`, `{hard_canon_bullets}` → `None selected for this generation`,
   `{current_location}`, `{prior_accepted_prose_status_or_handoff_note}` →
   `None. No accepted prose is included.`, `{pov_knows}`, `{writer_visible_hidden_truths}`
   → `No active secrets or reveal locks selected`, `{audience_knows}` →
   `No audience knowledge distinct from POV specified`). Field names must be verified
   against `docs/story-record-schema.md` and the snapshot's `storyConfig`
   (STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE) and `generationSession`
   surfaces (`current_authoritative_state`, `immediate_handoff`,
   `manual_moment_directive`) at implementation time, not assumed from FOUNDATIONS prose.
3. **Cross-artifact boundary under audit**: each resolver reads only the immutable
   `ValidationSnapshot` and emits prompt text per the §4 contract row — the boundary
   under audit is "snapshot field → §4 placeholder → prompt string", with the exact
   empty-state constant when the optional source is absent.
4. **FOUNDATIONS principle restated**: §9 (all these conceptual sections preserved,
   in order); §15/§29.6 (secret firewall — `{pov_does_not_know}`,
   `{secret_non_holders_to_protect}`, `{forbidden_reveals}` must render so writer-visible
   hidden truths in `{writer_visible_hidden_truths}` never leak into POV-knowledge
   output); §10/§28.1/§29.1 (`{prior_accepted_prose_status_or_handoff_note}` renders
   only the user note or the exact `None. No accepted prose is included.` constant —
   never accepted/rejected/superseded prose or an auto-summary).
5. **Secret-firewall / deterministic-compilation surface named**: the POV/audience/
   secret resolvers are the §15 enforcement surface inside compilation. The resolvers
   read writer-visible secret claims into `{writer_visible_hidden_truths}` (writer-facing
   only) and render protected-ignorance fields into the POV-limit placeholders; no
   resolver copies a writer-visible secret into a POV-knowledge placeholder. Rendering
   is deterministic (stable field order from the schema; no LLM, no prose-field salience
   inference).

## Architecture Check

1. Registering one resolver per §4 placeholder into the shared map (rather than a
   monolithic section function) keeps each placeholder independently testable and lets
   the empty-state default from 002 remain the fallback — cleaner and contract-faithful.
2. No backwards-compatibility aliasing/shims: resolvers replace the scaffold's
   empty-state defaults directly; no parallel rendering path.

## Verification Layers

1. Each section-3–12 placeholder resolves from its §4 source or renders its exact
   empty-state constant → schema validation against `compiler-contract.md` §4.
2. Secret firewall (§15) → FOUNDATIONS alignment check + unit test: a snapshot with a
   writer-visible secret hidden from POV renders the claim only in
   `{writer_visible_hidden_truths}` and the protection in `{pov_does_not_know}` /
   `{secret_non_holders_to_protect}`; it never appears in `{pov_knows}`.
3. Accepted-prose exclusion (§10) → unit test: `{prior_accepted_prose_status_or_handoff_note}`
   renders the user note or the exact constant; a pasted-prose payload is not this
   ticket's gate (validation blocks it upstream) but the resolver never synthesizes a
   summary.
4. Determinism → unit test: identical snapshot → identical front-section output.

## What to Change

### 1. Front-section resolvers (`compiler/sections/front.ts`)

Implement resolvers for sections 3–12: `<content_policy>` (rating/scope/tonal/governing/
bias placeholders), `<story_contract>` (title/premise/genre/tone/etc.), `<prose_mode>`
(pov_character/person/tense/…), `<hard_canon>` (`{hard_canon_bullets}`),
`<current_authoritative_state>` (time/location/onstage/positions/statuses/possessions/
visibility/routes/time/consent/locks), `<immediate_handoff>` (recent_causal_context/
last_visible_moment/prior_accepted_prose_status_or_handoff_note/begin_after),
`<manual_directive>`, `<pov_knowledge_constraints>`, `<audience_knowledge>`,
`<secrets_and_reveal_constraints>`. Each emits the §4 source or the exact empty-state
constant.

### 2. Register resolvers (`compiler/placeholder-map.ts`)

Wire the section-3–12 resolvers into the map registry created by 002 (overriding the
scaffold's empty-state defaults).

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (new)
- `packages/core/src/compiler/placeholder-map.ts` (modify — Deps 002 creates it)
- `packages/core/test/compiler-front-sections.test.ts` (new)

## Out of Scope

- Active-working-set pressure + causal-pressure sections (004), cast (005), tail
  records (006), server route (007), docs (008).
- Validating pasted-prose detection in the handoff field — that blocker is the SPEC-006
  engine's job; the compiler assumes a blocker-free snapshot.

## Acceptance Criteria

### Tests That Must Pass

1. Each section-3–12 placeholder resolves from a populated snapshot, and renders its
   exact §4 empty-state constant when the optional source is absent.
2. Secret-firewall test: writer-visible-but-POV-hidden secret never appears in a
   POV-knowledge placeholder.
3. `{prior_accepted_prose_status_or_handoff_note}` renders only the user note or
   `None. No accepted prose is included.`
4. `npm run typecheck && npm test && npm run lint && npm run build` — green.

### Invariants

1. No writer-visible secret crosses into a POV-knowledge placeholder (§15).
2. Front-section output is deterministic for an identical snapshot (§8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — per-placeholder resolution +
   empty-state pinning; secret-firewall assertion; accepted-prose-constant assertion;
   determinism.

### Commands

1. `npm test --workspace @loom/core` — targeted front-section tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Added front-section compiler resolvers for content policy, story contract, prose
  mode, hard canon, current authoritative state, immediate handoff, manual
  directive, POV/audience knowledge, and secret/reveal lanes.
- Split empty-state constants into a standalone compiler module so resolver
  registration stays acyclic.
- Added front-section tests for populated source rendering, exact empty-state
  fallback, accepted-prose handoff behavior, secret firewall behavior, and
  deterministic output.
- Raised the ESLint project-service default-project file cap from 32 to 64 because
  this additional compiler test file crossed the previous repository threshold.

Deviations from original plan:
- `eslint.config.js` was updated to keep the root lint gate usable as the compiler
  test suite grows.

Verification:
- `npm test --workspace @loom/core` passed: 17 files, 118 tests.
- `npm run typecheck` passed.
- `npm test` passed: 42 files, 227 tests.
- `npm run lint` passed.
- `npm run build` passed, with Vite's large-chunk warning only.
