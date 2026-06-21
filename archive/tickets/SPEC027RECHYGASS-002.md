# SPEC027RECHYGASS-002: Core hygiene types + hygiene-active predicate

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` modules `compiler/hygiene/types.ts` and `compiler/hygiene/active-predicate.ts` plus `index.ts` re-exports; substrate that feeds the deferred hygiene compiler (SPEC027RECHYGASS-004). No runtime behavior change to any existing surface.
**Deps**: SPEC027RECHYGASS-001

> **Same revision; never merge standalone (§1.1).** As the feature's root code ticket, this lands in the **same revision** as the FOUNDATIONS amendment (SPEC027RECHYGASS-001); the amendment must not merge ahead of it. The rest of the feature DAG inherits the amendment-before-feature ordering transitively through this ticket.

## Problem

The record-hygiene prompt compiles from the complete set of non-archived, **hygiene-active** atomic records. "Hygiene-active" is a new, deterministic per-type predicate (archive flag + in-scope type + per-type live-status set) that exists nowhere today, and the compiler needs a dedicated snapshot type (`StoryRecordHygieneSnapshot`) distinct from `ValidationSnapshot`. This ticket adds the pure-data substrate — the types and the single exported predicate authority — that every later record-hygiene ticket consumes.

## Assumption Reassessment (2026-06-21)

1. **Projection seam (codebase).** Projected status comes from `projectRecordStatus(recordType: string, payload: unknown): string | null` at `packages/core/src/records/registry.ts:63`, which delegates to `getRecordTypeDefinition(recordType)?.projectStatus?.(payload) ?? null`. The predicate consumes this, not a re-implemented status reader. `FACT` and `ENTITY STATUS` have no payload status enum (the spec's predicate table treats FACT as projected `active` and ENTITY STATUS as every non-archived row).
2. **Spec/doc authority.** `specs/SPEC-027-record-hygiene-assistance-prompt.md` Deliverable 2 + the source proposal §3.3 (per-type hygiene-active status table), §3.1 (fixed type order), §6.2 (`StoryRecordHygieneSnapshot`, `HygieneRecord`, `HygieneReferenceSummary` shapes). The 16 in-scope atomic types and their live-status sets are normative there.
3. **Cross-artifact boundary under audit.** `StoryRecordHygieneSnapshot` / `HygieneRecord` / `RecordHygieneRequest` are the contract consumed by the core compiler (SPEC027RECHYGASS-004) and produced by the server snapshot builder (SPEC027RECHYGASS-005). This ticket owns the type definitions; those tickets must not redefine them. `index.ts` (`packages/core/src/index.ts:24-31` export barrel) is also modified by 004 — sequential via `Deps`, not a parallel conflict.
4. **FOUNDATIONS principle motivating this ticket.** §9.1 (as amended by 001) `project-review` source profile requires "an explicit deterministic records-only projection of explicitly named story-record types across the project, with explicit archive and per-type status predicates." This predicate IS that projection's gate; it must be exhaustive and deterministic.
5. **Substrate determinism / secret-firewall (§8/§15) — deferred enforcement surface named.** No validator or compiler consumes these types yet; the enforcement surfaces are the deterministic compiler (SPEC027RECHYGASS-004) and the explicit OpenRouter send (SPEC027RECHYGASS-006). Confirm the data model introduces no leakage or nondeterminism path those surfaces would have to undo: (a) the predicate is a pure function of `(archived, type, projectRecordStatus(...))` — no wall-clock, no `Math.random`, no incidental object-key iteration; (b) `HygieneRecord.payload` carries the full record payload (including SECRET claims) by design, but it is inert data here — the secret firewall is enforced downstream by the explicit, inspectable, user-initiated send and the no-logging rules (006), not weakened by holding the payload in a type.

## Architecture Check

1. **One exported predicate authority beats scattered inline checks.** A single `isHygieneActive` (plus the in-scope type list and per-type live-status table colocated in `active-predicate.ts`) gives the snapshot builder, tests, and any future caller one source of truth; inlining the archive+type+status logic at each call site would drift. The snapshot type is deliberately separate from `ValidationSnapshot` (which is built from `active_working_set.selected_records` and carries story config) so the two authorities never blur.
2. **No backwards-compatibility aliasing/shims.** New modules; `compilePrompt(ValidationSnapshot, …)` is not overloaded and `ValidationSnapshot` is not widened.

## Verification Layers

1. Predicate exhaustiveness (every status enum value of all 16 types classified included/excluded per §3.3) → schema/unit test (`record-hygiene-predicate.test.ts` table).
2. `FACT` projects `active`; `ENTITY STATUS` includes every non-archived record (no payload status) → unit test.
3. Determinism — predicate is a pure function with no wall-clock/random/incidental-ordering → manual review + the unit test asserting stable output under input permutation.
4. Core platform/framework boundary intact (no `node:*`/fastify/react/vite import) → codebase grep-proof via the ESLint `no-restricted-imports` rule (`eslint.config.js:56-80`) run by `npm run lint`.

## What to Change

### 1. `compiler/hygiene/types.ts` (new)

Define `HygieneRecordType` (the 16 in-scope atomic types), `HYGIENE_TYPE_ORDER` (the fixed §3.1 type order used for deterministic rendering), `RecordHygieneRequest` (`{ mode: "full_active_atomic_review" }`), and the snapshot types `StoryRecordHygieneSnapshot` (`records`, `referenceIndex`, `versions`), `HygieneRecord` (`id`, `type`, `displayLabel`, `fullDisplayLabel`, `status`, `payload`), and `HygieneReferenceSummary` (`outgoing`, `incoming`) per proposal §6.2.

### 2. `compiler/hygiene/active-predicate.ts` (new)

Export `isHygieneActive(record)` (and the supporting in-scope-type set + per-type live-status table). A record is hygiene-active iff `archived === false`, its type ∈ the in-scope set, and `projectRecordStatus(type, payload)` ∈ the per-type live set from §3.3 (FACT → projected `active`; ENTITY STATUS → any non-archived row, no status check). Keep the per-type status table colocated and exported for test enumeration.

### 3. `packages/core/src/index.ts` (modify)

Re-export the new public types and `isHygieneActive` / `HYGIENE_TYPE_ORDER` alongside the existing compiler exports (`:24-31`).

## Files to Touch

- `packages/core/src/compiler/hygiene/types.ts` (new)
- `packages/core/src/compiler/hygiene/active-predicate.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/record-hygiene-predicate.test.ts` (new)

## Out of Scope

- The deterministic compiler, serialization, citation keys, renderer, template (SPEC027RECHYGASS-004).
- The server snapshot builder that *populates* `StoryRecordHygieneSnapshot` (SPEC027RECHYGASS-005).
- Any similarity/embedding detector, validation diagnostic code, or stored schema field (spec §Out of Scope).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — `record-hygiene-predicate.test.ts` classifies **every** status enum value of all 16 in-scope types as included/excluded exactly per §3.3 (including FACT→`active` and ENTITY STATUS→all-non-archived), and excludes every archived row.
2. `npm run typecheck` — the new types compile and are consumed type-safely; `index.ts` re-exports resolve.
3. `npm run lint` — the ESLint core import-boundary rule passes (no `node:*`/fastify/react/vite in the new modules).

### Invariants

1. `isHygieneActive` is a pure, deterministic function of `(archived, type, projectRecordStatus(type, payload))` — identical inputs always yield identical output.
2. `StoryRecordHygieneSnapshot` carries no story-config, generation-session, active-working-set, accepted-prose, candidate, note, timestamp, or provider field (the snapshot is records-only).

## Test Plan

### New/Modified Tests

1. `packages/core/test/record-hygiene-predicate.test.ts` (new) — exhaustive per-type include/exclude table over every status enum value; archived-exclusion; FACT and ENTITY STATUS special cases; input-permutation stability.

### Commands

1. `npm test -- record-hygiene-predicate` — targeted predicate coverage.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline gate (core builds first, boundary rule enforced).
3. The predicate unit test is the correct verification boundary here because this ticket ships pure data + one pure function; there is no route or prompt to exercise until SPEC027RECHYGASS-004+.

## Outcome

Completed: 2026-06-21

What changed:
- Added `packages/core/src/compiler/hygiene/types.ts` with the fixed 16-type hygiene order, `RecordHygieneRequest`, `StoryRecordHygieneSnapshot`, `HygieneRecord`, and `HygieneReferenceSummary` types.
- Added `packages/core/src/compiler/hygiene/active-predicate.ts` with the single exported `isHygieneActive` predicate authority, the in-scope type set, and the per-type live-status table.
- Re-exported the new hygiene substrate from `packages/core/src/index.ts`.
- Added `packages/core/test/record-hygiene-predicate.test.ts` covering type order, every current registry status value, archived-row exclusion, FACT projection, ENTITY STATUS inclusion, out-of-scope `CAST MEMBER`/`ENTITY` exclusion, and deterministic row-local behavior.
- Coupled this first dependent code substrate in the same revision as SPEC027RECHYGASS-001, per FOUNDATIONS §1.1 and the ticket dependency note.

Deviations:
- None. The predicate uses the current registry `projectRecordStatus` projector rather than re-reading payload status fields.

Verification:
- `npm test -- record-hygiene-predicate` passed: 1 file, 4 tests.
- `npm run build` passed.
- `npm run typecheck` passed.
- `npm test` passed: 136 files, 1027 tests.
- `npm run lint --workspace @loom/core` passed.
- `npx eslint docs/FOUNDATIONS.md packages/core/src/compiler/hygiene/active-predicate.ts packages/core/src/compiler/hygiene/types.ts packages/core/src/index.ts packages/core/test/record-hygiene-predicate.test.ts` passed for code; `docs/FOUNDATIONS.md` was ignored by the ESLint config.
- `npm run lint` did not pass because the pre-existing untracked `.codex/worktrees/spec026-mutdrirob` checkout is inside the repo and ESLint traversed its generated `dist` files. This was unrelated to SPEC027RECHYGASS-001/002 and was left untouched.
