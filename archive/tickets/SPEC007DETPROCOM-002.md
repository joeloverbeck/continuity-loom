# SPEC007DETPROCOM-002: Core compiler scaffold — types, template constants, 28-section skeleton, fingerprint/determinism harness

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/core` `compiler/` module (`compilePrompt`, compile-result/metadata types, placeholder-map registry, frozen template constants, pure-JS fingerprint), new exports in `packages/core/src/index.ts`.
**Deps**: SPEC007DETPROCOM-001

## Problem

No compiler exists in code. Before per-section resolvers can be written, the pipeline
needs its load-bearing scaffold: the `compilePrompt(snapshot)` entry point, the
compile-result/metadata types, the placeholder-mapping registry that realizes
`compiler-contract.md` §4 (one resolver + requiredness + missing behavior + exact
empty-state constant per placeholder), the frozen template-constant section blocks,
the 28-section ordered renderer, and the determinism harness (pure-JS fingerprint +
byte-identical-output proof). This ticket builds that skeleton so each later ticket
fills in one section group against a stable contract.

The skeleton renders **constant sections** verbatim and emits the **exact empty-state
constant** for every dynamic placeholder; SPEC007DETPROCOM-003…006 then replace those
empty-state defaults with real resolvers.

## Assumption Reassessment (2026-06-05)

1. No `compilePrompt` exists (`grep -rn "compilePrompt" packages/` returns nothing in
   source); `packages/core/src/compiler/` does not exist yet. `whatWillCompile`
   (`packages/core/src/records/compile-destinations.ts:78`) and `buildValidationSnapshot`
   (`packages/core/src/validation/snapshot.ts:48`) exist and are exported from
   `packages/core/src/index.ts`.
2. The binding section order and placeholder mapping live in
   `docs/compiler-contract.md` §3 (28 sections) and §4 (per-placeholder source /
   requiredness / missing behavior / empty-state), mirrored in
   `docs/requirements-version-1/PROMPT-COMPILER.md`; the literal surface is
   `docs/prompt-template.md`. The 28-section order in §3 was verified identical to
   PROMPT-COMPILER's list during reassessment.
3. **Cross-artifact boundary under audit**: the compiler is the bridge between the
   immutable `ValidationSnapshot` (`snapshot.ts`) and `prompt-template.md` via the
   `compiler-contract.md` §3/§4 contract. The scaffold pins that contract in code
   (section order array + empty-state constant table) so resolver tickets cannot drift
   from it.
4. **FOUNDATIONS principle restated**: §8 — the compiler is "a deterministic renderer,
   not an intelligence layer": stable section names, deterministic ordering, no LLM
   select/rank/summarize/repair, no record mutation. §9 — all conceptual sections
   preserved, constant sections never omitted, no provider-specific fork. The scaffold
   enforces these structurally (a fixed section-order array; constant blocks from a
   frozen module).
5. **Deterministic-compilation surface named**: the fingerprint + determinism harness
   IS the §8/§4.4/§29.4 enforcement surface ("identical snapshot + versions →
   byte-identical prompt"). Per `packages/core/test/boundary.test.ts`, `@loom/core`
   may not import `node:*` or framework modules, so the fingerprint **must** be a
   pure-JS hash (not `node:crypto`) and the token estimate a deterministic char-based
   heuristic (not an external tokenizer) — both reproducibility signals, not crypto
   guarantees (spec §Approach "Compile result + metadata"; §Risks "Fingerprint must be
   non-reversible, key-free, and boundary-safe"). The metadata carries the version
   triple from SPEC007DETPROCOM-001, never API keys / secret-storage values / focus
   tags / validation-only fields (`compiler-contract.md` §9).
6. Mismatch + correction: none. The scaffold's module layout (`compiler/` with
   `compile-prompt.ts`, `types.ts`, `placeholder-map.ts`, `template-constants.ts`,
   `fingerprint.ts`) is an implementation choice consistent with the existing
   per-concern file style in `packages/core/src/`; resolver tickets extend
   `placeholder-map.ts` (create-then-modify chain, their `Deps: 002`).

## Architecture Check

1. A single placeholder-map registry (one entry per `compiler-contract.md` §4
   placeholder: resolver, requiredness, missing behavior, exact empty-state constant)
   plus a fixed 28-element section-order array is cleaner than ad-hoc per-section
   string-building: the contract becomes data, section omission becomes structurally
   impossible, and each resolver ticket plugs into the same shape. The empty-state
   constants live in one table so mis-copied phrases are caught by one test.
2. No backwards-compatibility aliasing/shims: this is greenfield compiler code; no
   prior compiler surface to alias. The pure-JS fingerprint is a deliberate choice to
   honor the core purity boundary, not a shim around `node:crypto`.

## Verification Layers

1. 28 sections render in exact `compiler-contract.md` §3 order → codebase grep-proof /
   unit test: the rendered prompt's section tags appear in the §3 sequence.
2. Every `prompt-template.md` placeholder resolves or renders its exact empty-state
   constant → schema validation against `compiler-contract.md` §4: a test asserts each
   constant (e.g. `None selected for this generation`, `None. No accepted prose is
   included.`) is pinned to its section.
3. Determinism (§8/§29.4) → FOUNDATIONS alignment check + unit test: same snapshot +
   version triple → byte-identical prompt string and identical fingerprint across
   repeated runs.
4. Core purity preserved → codebase grep-proof: `packages/core/test/boundary.test.ts`
   stays green (no `node:*` / framework import in the new `compiler/` files).

## What to Change

### 1. Compile-result + metadata types (`compiler/types.ts`)

`CompileResult = { prompt: string; metadata: CompileMetadata }`. `CompileMetadata`
carries the reproducibility triple (`template`/`compiler`/`contract` from the snapshot
`versions`), a non-reversible content `fingerprint: string`, and a `lengthEstimate` /
`tokenEstimate`. No keys, no focus tags, no validation-only fields.

### 2. Placeholder map + empty-state constants (`compiler/placeholder-map.ts`)

A registry keyed by placeholder name; each entry: `resolve(snapshot) => string`,
`required` rule, `missingBehavior`, and the **exact** empty-state constant copied
verbatim from the §4 row. The scaffold supplies the constant table and, for dynamic
placeholders, a default resolver that returns the empty-state constant (resolver
tickets override). Export the empty-state constants for pinning tests.

### 3. Frozen template constants (`compiler/template-constants.ts`)

Byte-for-byte constant blocks for the constant sections — `<role>`,
`<authority_hierarchy>`, `<content_policy>` framing prose, `<invention_permissions>`,
`<contradiction_prohibitions>`, `<prose_craft>`, `<stop_rule>` guidance,
`<final_output_instruction>` — aligned with `prompt-template.md`.

### 4. 28-section renderer + entry point (`compiler/compile-prompt.ts`)

A fixed `SECTION_ORDER` array (the §3 sequence) drives rendering; `compilePrompt(snapshot)`
asserts required-source presence (bug-level abort, **no** partial prompt, no
user-facing blocker), renders each section via the placeholder map, and returns
`CompileResult`. No record mutation, no LLM, no selection/ranking/summarization.

### 5. Pure-JS fingerprint + token estimate (`compiler/fingerprint.ts`)

A deterministic pure-JS string hash (e.g. FNV-1a/djb2 — no `node:crypto`) and a
char-based token estimate. Both feed `CompileMetadata`.

### 6. Exports

Add `compilePrompt`, `CompileResult`, `CompileMetadata`, and the empty-state constant
table to `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/compiler/compile-prompt.ts` (new)
- `packages/core/src/compiler/types.ts` (new)
- `packages/core/src/compiler/placeholder-map.ts` (new)
- `packages/core/src/compiler/template-constants.ts` (new)
- `packages/core/src/compiler/fingerprint.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/compiler-scaffold.test.ts` (new)

## Out of Scope

- Per-section dynamic resolver logic for the front sections (003), pressure/causal
  sections (004), cast (005), and tail records (006) — the scaffold renders their
  empty-state constants until those tickets land.
- The server `/api/compile` route (007) and governing-doc reconciliation (008).
- Any reconciliation edit to `compiler-contract.md` §4 wording — deferred to 008
  (the scaffold renders `<invention_permissions>` / `<contradiction_prohibitions>` /
  `<prose_craft>` as constants per the literal template; the §4 doc note is 008's).

## Acceptance Criteria

### Tests That Must Pass

1. A unit test renders a minimal snapshot and asserts all 28 section tags appear in
   exact `compiler-contract.md` §3 order.
2. A determinism test compiles the same snapshot + version triple twice and asserts
   byte-identical `prompt` and identical `fingerprint`.
3. An empty-state test asserts each §4 empty-state constant is pinned to its section
   (verbatim phrase).
4. `packages/core/test/boundary.test.ts` passes (no `node:*` / framework import).
5. `npm run typecheck && npm test && npm run lint && npm run build` — green.

### Invariants

1. Output is a total deterministic function of `(snapshot)` — no wall-clock, no
   `Math.random`, no `node:crypto`, no LLM, no record mutation.
2. No universal-contract section is ever omitted; required-source absence aborts with
   no partial prompt.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-scaffold.test.ts` — section order, empty-state
   constant pinning, determinism + fingerprint stability, metadata triple presence.
2. `packages/core/test/boundary.test.ts` — unchanged; must stay green with the new
   `compiler/` files.

### Commands

1. `npm test --workspace @loom/core` — targeted core compiler + boundary tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Added the `@loom/core` compiler scaffold with `compilePrompt`, compile metadata
  types, fixed 28-section rendering order, frozen template section constants, and
  a placeholder registry with deterministic empty-state resolvers.
- Added a pure-JS FNV-1a prompt fingerprint and deterministic character-based token
  estimate for compile metadata.
- Exported the compiler entry point, metadata types, section order, placeholder map,
  and empty-state constants from `packages/core/src/index.ts`.
- Added `compiler-scaffold.test.ts` coverage for section order, pinned empty states,
  placeholder exhaustion, deterministic output/fingerprint stability, and metadata
  version triple propagation.

Deviations from original plan:
- None.

Verification:
- `npm test --workspace @loom/core` passed: 16 files, 113 tests.
- `npm run typecheck` passed.
- `npm test` passed: 41 files, 222 tests.
- `npm run lint` passed.
- `npm run build` passed.
