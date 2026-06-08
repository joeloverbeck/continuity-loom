# FORBIDREV-001: Let an active secret affirmatively declare "no forbidden reveals"

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/records/knowledge.ts` (SECRET schema), `packages/core/src/compiler/sections/front.ts` (`forbidden_reveals` resolver), `packages/core/src/records/field-guidance-records.ts` (authoring guidance), `docs/compiler-contract.md`, `docs/story-record-schema.md`; regression coverage in `packages/core/test/`
**Deps**: None

## Problem

An active secret (`status: hidden | partially_revealed`) with `forbidden_reveals: []` is a **blocker** in two places:

- `validateActiveSecrets` — `packages/core/src/validation/rules/universal-completeness.ts:178-216` (`!hasValue(payload.forbidden_reveals)` at `:212`).
- `matrix-knowledge.ts:99-127` — under a `secret_or_clue_pressure` focus (`hasValue(payload.forbidden_reveals)` at `:111`).

Live repro: project `red-bunny`, SECRET *"Ane Arrieta has been a sex worker for years."* — every required reveal-boundary field is populated **except** `forbidden_reveals`, which the user deliberately wants empty because the secret is allowed to surface naturally (populated `clue_carriers` / `allowed_surface_cues`, a non-`locked` `reveal_permission`).

The gate cannot distinguish **"I left it blank"** (a silent omission that would render the empty-state `None specified` into an *active* secret's prompt and invite leakage — exactly what FOUNDATIONS §29.6 forbids) from **"I have decided nothing is additionally forbidden beyond the reveal permission"** (a legitimate authorial decision). It forces the author to fabricate a fake restriction or be blocked.

This ticket adds an **affirmative "none" state** so the author can declare *"no forbidden reveals beyond the stated reveal permission."* A true blank still blocks. The prompt continues to address forbidden reveals explicitly (not omit them), so the constitution is honored without amendment.

> Scope note: prior ticket `archive/tickets/SECRETDIAG-001.md` (same secret/project) improved this blocker's *message legibility* and asserted that an empty `forbidden_reveals` should block. This ticket does **not** reverse that — true blank (`[]`) still blocks; it only adds an affirmative escape hatch (`"none"`).

## Assumption Reassessment (2026-06-08)

1. `forbidden_reveals` is `z.array(nonemptyString).default([])` at `packages/core/src/records/knowledge.ts:74`. The sibling field `non_holders_to_protect` already uses the affirmative-sentinel union pattern this ticket mirrors: `z.union([z.array(recordId), z.enum(["all_except_holders", "none"])])` at `:69`.
2. `hasValue` (`packages/core/src/validation/rules/universal-completeness.ts:413-423`) returns `true` for any non-empty string, so `hasValue("none") === true`. **Both gates therefore pass with no change to the validation rules** once the schema accepts `"none"` — the only required behavior change is in the schema, the compiler rendering, and tests. (The same `hasValue` shape is duplicated in `matrix-knowledge.ts:223`; confirm it is byte-identical so the gate behaves the same — it is.)
3. FOUNDATIONS principle motivating this: §15 (`docs/FOUNDATIONS.md:480-503`) requires the prompt to **distinguish** "forbidden reveals"; §29.6 (`:931`) hard-fails on **omitting** forbidden reveals "when secrets are active." An affirmative `"none"` that renders an explicit sentence is *not* an omission — it distinguishes forbidden reveals as "none beyond the reveal permission." So this aligns with §15/§29.6 and does not require a FOUNDATIONS amendment. `compiler-contract.md:131` currently licenses the `None specified` empty-state "only when no active secret"; the new affirmative rendering replaces that for the active-secret-with-`"none"` case.
4. Enforcement-surface confirmation (§15 secret firewall / §8 deterministic compilation): the blocking predicate for a *blank* active secret is unchanged — `forbidden_reveals: []` on an active secret still blocks in both gates. The firewall is preserved; the compiler change is deterministic (a pure value→string mapping, no LLM input).
5. Output-schema extension: this extends the SECRET payload schema (`secretSchema`). Consumers of `forbidden_reveals`: the compiler resolver (`front.ts:140-142`), both validation gates, and the demo fixture (`packages/core/src/demo/letter-under-flour-bin.ts:277`, an array — still valid). The change is **additive** (a union widening that accepts a new literal; arrays remain valid). No code does `forbidden_reveals.map/.length/.<member>` (grep clean across `packages/core/src` and `packages/web/src`), so widening to a union breaks no call site.
6. Adjacent contradiction: the in-app editor cannot currently *set* the `"none"` value (the generic list editor only appends prose items). That is a required follow-up, scoped separately as **FORBIDREV-002** (editor affordance), not this ticket.

## Architecture Check

1. Mirroring the existing `non_holders_to_protect` union-with-sentinel pattern keeps the SECRET schema internally consistent and avoids inventing a parallel mechanism (e.g. a separate boolean flag), which would be a second authority path for the same fact.
2. No validation-rule edits, no new diagnostic code, no shim, no backwards-compat alias. The widened schema flows through the existing `hasValue` predicate unchanged; only the compiler gains an explicit branch for the sentinel.

## Verification Layers

1. Blank active secret still blocks → unit assertion in both gate test suites: an active SECRET with `forbidden_reveals: []` still yields its blocker.
2. Affirmative `"none"` clears both gates → unit assertion: an otherwise-complete active SECRET with `forbidden_reveals: "none"` yields **no** `activeSecretIncomplete` and **no** `matrixSecretClueIncomplete` blocker.
3. Compiler renders `"none"` as an explicit affirmative line (not the bare word `none`, not the `None specified` empty-state) → compiler unit/golden assertion on the `{forbidden_reveals}` placeholder.
4. Schema accepts both shapes and rejects garbage → schema parse test: `[]`, `["..."]`, and `"none"` parse; `"None"`/`"anything else"` reject (only the `"none"` literal is allowed).

## What to Change

### 1. Widen the schema (`packages/core/src/records/knowledge.ts:74`)

```ts
forbidden_reveals: z.union([z.array(nonemptyString), z.literal("none")]).default([]),
```

Mirror the `non_holders_to_protect` style at `:69`. Keep the `.default([])`.

### 2. Render the sentinel in the compiler (`packages/core/src/compiler/sections/front.ts:140-142`)

The `forbidden_reveals` resolver maps active SECRET payloads through `listLine`. Special-case the `"none"` literal so it renders an explicit affirmative sentence instead of the bare word:

```ts
forbidden_reveals: (snapshot) =>
  bulletRecords(snapshot, "SECRET", isActiveSecret, (payload) =>
    payload.forbidden_reveals === "none"
      ? "No reveals are forbidden beyond the stated reveal permission."
      : listLine(payload.forbidden_reveals)
  ).join("\n") || EMPTY_STATE_CONSTANTS.forbidden_reveals,
```

(Exact sentence wording at implementer discretion; it must read as an affirmative decision, not an omission, and must not be the `None specified` empty-state string.)

### 3. Document the affirmative option

- `packages/core/src/records/field-guidance-records.ts:115` (`SECRET.forbidden_reveals[]`): add guidance that an author may declare `none` to affirm there are no forbidden reveals beyond the reveal permission, rather than leaving the field blank.
- `docs/compiler-contract.md:131`: note that an active secret satisfies the `{forbidden_reveals}` requirement either with a populated list **or** an affirmative `none`, and describe the affirmative rendering.
- `docs/story-record-schema.md:622`: update the field type from `forbidden_reveals: prose list` to `forbidden_reveals: prose list | none`.

## Files to Touch

- `packages/core/src/records/knowledge.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/records/field-guidance-records.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/validation-completeness.test.ts` (modify — where active-secret completeness coverage lives per SECRETDIAG-001's Outcome) and/or `packages/core/test/validation-matrix-knowledge.test.ts` (modify)
- a compiler test covering the `{forbidden_reveals}` placeholder (modify/add — locate the suite that already exercises `front.ts` SECRET resolvers)

## Out of Scope

- The in-app editor affordance to *set* `"none"` — that is **FORBIDREV-002** (depends on this ticket).
- Any change to *which* conditions block a **blank** active secret — a true `forbidden_reveals: []` on an active secret still blocks in both gates, byte-for-byte.
- Downgrading the blocker to a warning, or making it conditional on `reveal_permission` (the rejected Option B; would tension §29.6/§29.4 and require a FOUNDATIONS amendment).
- Touching `non_holders_to_protect`, `allowed_surface_cues`, `reveal_permission`, or any other reveal-boundary field.

## Acceptance Criteria

### Tests That Must Pass

1. An otherwise-complete active SECRET with `forbidden_reveals: "none"` produces **no** `activeSecretIncomplete` blocker and **no** `matrixSecretClueIncomplete` blocker (under a `secret_or_clue_pressure` focus).
2. An active SECRET with `forbidden_reveals: []` still produces the `activeSecretIncomplete` blocker (and `matrixSecretClueIncomplete` under clue pressure) — unchanged.
3. The compiler renders the active secret's `{forbidden_reveals}` placeholder as the explicit affirmative line when the value is `"none"`, and as the comma-joined list when populated.
4. `secretSchema` parses `forbidden_reveals` values `[]`, `["Do not name the real parent."]`, and `"none"`; rejects `"None"` and arbitrary strings.
5. `npm run lint && npm run typecheck && npm test` all green.

### Invariants

1. The set of conditions under which a **blank** (`[]`) active secret blocks is byte-for-byte unchanged; only the addition of the `"none"` satisfying value and its rendering are new.
2. An active secret never renders the `None specified` empty-state into the `{forbidden_reveals}` placeholder — it renders either the populated list or the affirmative `none` sentence (the empty-state remains reachable only when no active secret exists).
3. `forbidden_reveals` accepts exactly an array of nonempty strings **or** the literal `"none"` — no other sentinel.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-completeness.test.ts` — assert the `"none"` no-blocker case and the `[]` still-blocks case for `validateActiveSecrets`.
2. `packages/core/test/validation-matrix-knowledge.test.ts` — same two cases under `secret_or_clue_pressure`.
3. Compiler test for `front.ts` SECRET resolvers — assert the affirmative-line rendering for `"none"` and the list rendering otherwise.
4. Schema parse test for `secretSchema.forbidden_reveals` — accept `[]` / `["..."]` / `"none"`, reject other strings.

### Commands

1. `npm test -- validation-completeness validation-matrix-knowledge`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-08

What changed:

- Widened the SECRET `forbidden_reveals` schema to accept either a prose-string array or the exact literal `"none"`, keeping the default blank array unchanged.
- Added deterministic compiler rendering for `"none"` as `No reveals are forbidden beyond the stated reveal permission.`
- Updated field guidance, compiler contract, and story record schema documentation for the affirmative sentinel.
- Added regression coverage for active-secret completeness, secret/clue matrix validation, compiler rendering, and schema parsing/rejection.

Deviations from original plan:

- None. Validation predicates were left unchanged; the existing `hasValue` behavior now treats the accepted `"none"` literal as populated while blank arrays still block.

Verification results:

- `npm test -- validation-completeness validation-matrix-knowledge compiler-front-sections records` — passed, 8 files / 81 tests.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 99 files / 649 tests.
