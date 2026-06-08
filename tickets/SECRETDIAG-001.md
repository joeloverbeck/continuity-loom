# SECRETDIAG-001: Active-secret blocker does not name which reveal-boundary field is missing

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/validation/rules/universal-completeness.ts` (`validateActiveSecrets` message + `field`); coverage in `packages/core/test/validation-clarity-invariants.test.ts` / `validation-blockers.test.ts`
**Deps**: None

## Problem

The generation-brief blocker **"Active Secret Incomplete"** tells the user nothing about *which* field is incomplete. Live repro: project `red-bunny`, SECRET *"Ane Arrieta has been a sex worker for years."* trips the blocker while every required field is populated **except** `forbidden_reveals: []`. The user reported being unable to tell what is incomplete.

`validateActiveSecrets` (`packages/core/src/validation/rules/universal-completeness.ts:178-206`) tests five conditions:

```ts
!hasValue(payload.holders) ||
!hasValue(payload.non_holders_to_protect) ||
!hasValue(payload.forbidden_reveals) ||
!hasText(payload.reveal_permission) ||
missingCues
```

but emits a **static** diagnostic (`:192-201`): `message: "Active secret is missing required reveal-boundary fields."`, `whyItMatters` listing all five candidate fields, and `field: missingCues ? "allowed_surface_cues" : "SECRET"`. So a record missing only `forbidden_reveals` produces the same generic blocker as one missing all five, and the `field` pointer is the whole record. The validation logic itself is **correct** (the secret is active via `status: partially_revealed`; an empty `forbidden_reveals` should block) — only the diagnostic's specificity is at fault.

## Assumption Reassessment (2026-06-08)

1. The predicate and the static message are in `validateActiveSecrets` (`packages/core/src/validation/rules/universal-completeness.ts:185-201`). The five `hasValue`/`hasText` checks already isolate each missing field individually; this ticket reuses those same predicates to build a named list (the established pattern in this file — see the spread-conditional list at `:148-153`).
2. `blocker(...)` is the shared diagnostic factory; `field`, `recordId`, `message`, `whyItMatters`, `suggestedActions` are its contract. Confirm the readiness/UI layer renders `message` verbatim (`packages/web/src/readiness/ReadinessChecklist.tsx`) and that `field` is used only for targeting — changing the message text and narrowing `field` to a specific path is additive, not breaking.
3. FOUNDATIONS principle motivating this: validation must be **legible** and must not weaken the gate (`docs/FOUNDATIONS.md`, validation-clarity / readiness sections). This ticket makes the existing blocker more precise; it does **not** relax, remove, or reorder any blocking condition — the secret still blocks under exactly the same conditions.
4. Enforcement-surface confirmation: the change is to diagnostic *text and targeting only*. The boolean blocking predicate at `:185-191` is unchanged, so fail-closed behavior and the secret firewall are untouched.

## Architecture Check

1. Build the missing-field list from the same predicates already evaluated, mirroring the in-file convention at `:148-153`, so the message and the blocking condition cannot drift apart. Point `field` at the first concretely-missing field so the editor's "Open record" action can target it (currently only `allowed_surface_cues` is targeted, and only under clue pressure).
2. No new diagnostic code, no schema change, no shim. Reuses `blocker(...)` and `DIAGNOSTIC_CODES.activeSecretIncomplete`.

## Verification Layers

1. Message names exactly the missing field(s) → unit assertion: a secret missing only `forbidden_reveals` yields a message containing "forbidden reveals" and **not** the populated fields.
2. Blocking conditions unchanged → existing active-secret blocker tests (`validation-blockers.test.ts`, `validation-matrix-knowledge.test.ts`) still pass: a fully-populated active secret produces no blocker; a multi-missing secret still blocks.
3. `field` targets a real missing field → assertion that `field` is one of the missing field paths (not the generic `"SECRET"`) when a specific field is empty.

## What to Change

### 1. Enumerate missing fields in `validateActiveSecrets`

In `packages/core/src/validation/rules/universal-completeness.ts`, replace the static message with a computed list of the actually-missing fields, e.g.:

```ts
const missing: string[] = [
  ...(!hasValue(payload.holders) ? ["holders"] : []),
  ...(!hasValue(payload.non_holders_to_protect) ? ["protected non-holders"] : []),
  ...(!hasValue(payload.forbidden_reveals) ? ["forbidden reveals"] : []),
  ...(!hasText(payload.reveal_permission) ? ["reveal permission"] : []),
  ...(missingCues ? ["allowed surface cues"] : [])
];

if (missing.length > 0) {
  return [
    blocker({
      code: DIAGNOSTIC_CODES.activeSecretIncomplete,
      recordId: record.id,
      field: firstMissingFieldPath(payload, missingCues), // e.g. "forbidden_reveals"
      message: `Active secret is missing: ${missing.join(", ")}.`,
      whyItMatters: "Active secrets need holders, protected non-holders, forbidden reveals, reveal permission, and clue cues when clue pressure is active.",
      suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
    })
  ];
}
```

`field` should resolve to the schema path of the first missing field (`holders` | `non_holders_to_protect` | `forbidden_reveals` | `reveal_permission` | `allowed_surface_cues`), falling back to `"SECRET"` only if none can be determined. Keep wording aligned with how other rules in this file name fields.

## Files to Touch

- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/test/validation-clarity-invariants.test.ts` (modify — assert the message names the specific missing field) **or** `packages/core/test/validation-blockers.test.ts` (modify), whichever currently owns active-secret blocker assertions

## Out of Scope

- Changing *which* conditions block an active secret (the predicate stays identical).
- Editor-side rendering of `forbidden_reveals` (it already renders an "Add forbidden_reveals" control; making empty-but-required list fields more visually prominent is a separate UX concern, not part of this diagnostic fix).
- The holders picker (`archive/tickets/LISTREFPICK-001.md`) and `non_holders_to_protect` selection (`archive/tickets/NONHOLDPICK-001.md`).

## Acceptance Criteria

### Tests That Must Pass

1. A SECRET active record with only `forbidden_reveals: []` empty produces a blocker whose `message` names "forbidden reveals" and does **not** list the populated fields, with `field` pointing at `forbidden_reveals`.
2. A fully-populated active SECRET produces **no** `activeSecretIncomplete` blocker (unchanged behavior); a secret missing multiple fields lists all of them.
3. `npm run lint && npm run typecheck && npm test` all green.

### Invariants

1. The set of conditions under which an active secret blocks is byte-for-byte unchanged; only diagnostic text and `field` targeting change.
2. The message enumerates exactly the fields that fail their `hasValue`/`hasText` check — no more, no less.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-clarity-invariants.test.ts` (or `validation-blockers.test.ts`) — assert per-missing-field message specificity and `field` targeting for the active-secret blocker.

### Commands

1. `npm test -- validation-clarity-invariants validation-blockers`
2. `npm run lint && npm run typecheck && npm test`
