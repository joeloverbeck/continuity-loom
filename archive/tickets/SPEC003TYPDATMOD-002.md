# SPEC003TYPDATMOD-002: Global story-config singleton schemas

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` payload schemas for STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE; registered in the record-type registry; exported from `packages/core/src/index.ts`.
**Deps**: SPEC003TYPDATMOD-001

## Problem

The three global story-configuration singletons (STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE) define durable story identity, the maturity envelope, and prose defaults. They are one-per-project and "always available to generation." Phase 3 needs their runtime Zod schemas so the server's `story_config` singleton table (ticket 012) can validate them on read/write.

## Assumption Reassessment (2026-06-05)

1. The substrate from SPEC003TYPDATMOD-001 exists: `packages/core/src/records/registry.ts` (registration API), `metadata.ts`, exports in `packages/core/src/index.ts`. This ticket registers three definitions and exports their schemas.
2. Field names are taken from `docs/story-record-schema.md` §2.1 (STORY CONTRACT), §2.2 (UNIVERSAL CONTENT POLICY), §2.3 (PROSE MODE) — the schema-authoritative source, not FOUNDATIONS prose. UNIVERSAL CONTENT POLICY has exactly five fields (`rating_label`, `allowed_content_scope`, `tonal_handling`, `governing_policy_note`, `character_bias_handling`); PROSE MODE includes the nested `prose_preferences`-style enums and `special_style_constraints`.
3. Cross-artifact boundary: these schemas are consumed by ticket 012's `getStoryConfig`/`setStoryConfig` singleton upserts. The contract is "one row per config kind, Zod-validated JSON."
4. FOUNDATIONS §25 (mature-fiction envelope) motivates UNIVERSAL CONTENT POLICY: the schema must allow mature content scoping but the data is author-owned; the schema must not encode `NO RESTRICTIONS` or override provider policy (that is content, validated later — Phase 6 — not a Phase-3 schema concern). Restated: Phase 3 defines the shape; it does not enforce content rules.
5. These are singletons with no outgoing entity/object references, so their `extractReferences` returns `[]` (PROSE MODE's `pov_character` may be an `entity_id`; register it as a reference role when present). Status-less types: none of the three carries a `status` field, so their common-metadata `status` projection is `NULL`.

## Architecture Check

1. Registering singletons through the same registry as durable records keeps one iteration model; the server distinguishes them by routing to `story_config` (ticket 012) rather than by a separate code path in core.
2. No backwards-compatibility shims — new schemas only.

## Verification Layers

1. Each singleton schema matches `docs/story-record-schema.md` field names -> schema validation test (accept a fully-populated fixture; reject missing required fields / unknown keys).
2. PROSE MODE `pov_character` as `entity_id` yields a reference projection -> unit test on the registered `extractReferences`.
3. Registry contains all three config kinds after registration -> grep-proof / registry iteration test.

## What to Change

### 1. Singleton payload schemas

Add `packages/core/src/records/global-config.ts`: Zod `.strict()` schemas for STORY CONTRACT, UNIVERSAL CONTENT POLICY, PROSE MODE per `docs/story-record-schema.md` §2.

### 2. Registry registration + reference extractors

Register the three definitions in the registry (status enum: none). PROSE MODE extractor emits a `pov_character` reference role when `pov_character` is an entity id (not `omniscient`/`variable`).

### 3. Exports

Re-export the three schemas from `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/global-config.ts` (new)
- `packages/core/src/records/registry.ts` (modify — register three definitions)
- `packages/core/src/index.ts` (modify — re-export)
- `packages/core/test/records/global-config.test.ts` (new)

## Out of Scope

- The `story_config` DDL table and singleton upserts — tickets 010/012.
- Content-envelope validation (`NO RESTRICTIONS` ban, provider-policy precedence) — Phase 6.
- Compiling these into prompt sections — Phase 7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — three singleton schemas accept valid fixtures and reject missing-required / unknown-key payloads.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. UNIVERSAL CONTENT POLICY schema defines exactly the five fields in `docs/story-record-schema.md` §2.2.
2. All three config kinds are present in the record-type registry after this ticket.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/global-config.test.ts` — per-singleton accept/reject + PROSE MODE `pov_character` reference extraction.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented STORY CONTRACT, UNIVERSAL CONTENT POLICY, and PROSE MODE schemas with registry definitions and exports.

Deviation: no server HTTP route was added; the schemas are consumed by the lifecycle-bound repository accessor.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
