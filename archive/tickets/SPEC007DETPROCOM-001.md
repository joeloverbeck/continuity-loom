# SPEC007DETPROCOM-001: Retire version placeholders; add the contract version

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` `VersionInfo`/`versionInfo` (`version.ts`), the `ValidationVersions` schema (`validation/snapshot.ts`), the server `/api/version` Zod schema (`version-schema.ts`), and the `/api/validate` snapshot pass-through (`validation-routes.ts`).
**Deps**: None

## Problem

`packages/core/src/version.ts` still exposes `templates` and `compiler` as the
literal type `status: "placeholder"` at `version: "0.0.0"`, and exposes **no**
compiler-contract version. SPEC-006 deliberately deferred retiring this to Phase 7
(archived `SPEC-006` lines 122-123). The deterministic compiler (SPEC007DETPROCOM-002+)
must stamp a real reproducibility **triple** — template / compiler / contract
versions — into its output metadata so that "identical snapshot + versions →
byte-identical prompt" is a checkable contract (`FOUNDATIONS.md` §4.4/§8;
`compiler-contract.md` §1/§10; `PROMPT-COMPILER.md` "Versioning and change control").

This ticket retires the placeholder status, sets a concrete v1 baseline, and adds
the `contract` version key across the core type, the validation snapshot, and the
two server surfaces that consume them — before any compiler code is written.

## Assumption Reassessment (2026-06-05)

1. `version.ts` defines `VersionInfo` with `templates.status: "placeholder"` and
   `compiler.status: "placeholder"`, both `version: "0.0.0"`, and **no** `contract`
   key (`packages/core/src/version.ts:1-29`). `versionInfo` is exported from
   `packages/core/src/index.ts:128-129`.
2. The spec under decomposition (`specs/SPEC-007-deterministic-prompt-compiler.md`,
   Deliverable 2 + §Approach "Version metadata") prescribes flipping the `status`
   literal `"placeholder"` → `"stable"`, versions `1.0.0`, and adding
   `contract: { version, status }`; `ValidationVersions` gains `contract`, and
   `/api/validate` passes `contract: versionInfo.contract.version`.
3. **Cross-artifact boundary under audit**: the `versionInfo` shape is a shared
   contract across three packages — `@loom/core` (`version.ts`, `ValidationVersions`),
   `@loom/server` (`version-schema.ts` validates it at `/api/version`;
   `validation-routes.ts` maps it into the snapshot), and `@loom/web` (renders
   `templates.status`/`compiler.status` in `AppShell.tsx`). Every consumer of the
   `"placeholder"` literal and of the `{ template, compiler }` versions shape is the
   blast radius this ticket must close.
4. **FOUNDATIONS principle restated**: §8/§4.4 deterministic compilation requires
   the prompt be reproducible given "template version, compiler version, and
   compiler contract version". A reproducibility **triple** that can be partially
   absent would undermine that guarantee, so `ValidationVersions.contract` is a
   **required** field (not optional) — the decomposition chose required over
   optional to keep the triple always-present (no soft shim, per `tickets/README.md`
   §1).
5. **Deterministic-compilation surface named**: the version triple is the
   reproducibility key stamped into future compile metadata. This change introduces
   **no** nondeterministic input (the versions are static string constants, not
   wall-clock or environment-derived) and **no** secret-firewall path (versions
   carry no keys or secret-storage values). Enforcement of "identical versions →
   identical prompt" lands in SPEC007DETPROCOM-002's determinism harness; this
   ticket only supplies the constants.
6. **Output-schema extension**: two schemas are extended. (a) `VersionInfo`
   (`version.ts`) + its server validator `versionInfoSchema` (`version-schema.ts`):
   the `status` literal changes `"placeholder"` → `"stable"` (a **breaking** literal
   change) and a `contract` object is **added**. Consumers: the `/api/version` route
   (`server.ts:61`), `server.test.ts:24-25`, `gate.e2e.test.ts:42`, and the web
   shell `AppShell.tsx:51,55` (+ its test `App.test.tsx:85`). (b) `ValidationVersions`
   (`snapshot.ts:23-26`) gains a **required** `contract: string` — a **breaking**
   addition for every construction site: `validation-routes.ts:53-56` and ~9 core
   validation tests that build `versions: { template, compiler }`.
7. **Rename/removal blast radius** (the `"placeholder"` literal): repo-wide grep
   (`.claude/skills/`, `docs/`, `specs/`, code tree) for the consumers updated here —
   `packages/server/src/version-schema.ts:14,18`, `packages/server/src/server.test.ts:24-25`,
   `packages/web/src/App.test.tsx:15,19,85`. `AppShell.tsx:51,55` renders the status
   **dynamically** (no source change — it will display "stable"); only its test
   assertion is hardcoded. Displaying a `contract` row in the web shell is **out of
   scope** (deferred to Phase 8 per the spec's "version-metadata UI surfacing" Out of
   Scope line).
8. **Adjacent contradictions**: none uncovered. The ~9 core validation-test edits are
   **required consequences** of the required-`contract` field, not separate bugs;
   they are mechanical (`contract: "1.0.0"` added to each `versions:` literal) and
   must land atomically with the type change or `npm run typecheck`/`npm test` break.
9. Mismatch + correction: the spec's Deliverable 2 named only `version.ts` +
   `ValidationVersions` + `/api/validate`. Decomposition (Step 2 Issue I1,
   user-approved **expand-scope-in-place + required `contract`**) widened Files to
   Touch to the full consumer set above; the spec text is intentionally unedited.

## Architecture Check

1. Setting concrete `1.0.0` / `"stable"` constants and a required `contract` field is
   cleaner than leaving placeholders or making `contract` optional: the reproducibility
   triple is then a total function of the snapshot, so the future determinism harness
   can assert presence without nullable branches. Updating every construction site now
   (rather than defaulting a missing field) keeps the type honest.
2. No backwards-compatibility aliasing or shims: the `"placeholder"` literal is
   replaced outright, not unioned with `"stable"`; `contract` is required, not an
   optional-with-default soft shim.

## Verification Layers

1. No `"placeholder"` version status remains → codebase grep-proof:
   `grep -rn '"placeholder"' packages/ --include=*.ts --include=*.tsx | grep -v dist`
   returns no version-status matches.
2. The triple is present and non-placeholder at runtime → schema validation:
   `versionInfoSchema.parse(versionInfo)` succeeds with `templates/compiler/contract`
   each `status: "stable"`, `version: "1.0.0"` (server test).
3. `ValidationVersions` carries `contract` through the snapshot → schema validation:
   `buildValidationSnapshot(...).versions.contract` is defined in a core test.
4. Deterministic-compilation alignment (§8) → FOUNDATIONS alignment check: versions
   are static constants, introducing no nondeterministic input — reviewed against
   §4.4/§8 (the determinism *test* lands in SPEC007DETPROCOM-002).

## What to Change

### 1. `@loom/core` version surface

In `packages/core/src/version.ts`: change the `VersionInfo` interface so `templates`,
`compiler`, and a new `contract` each have `version: string` and `status: "stable"`;
set every `version` to `"1.0.0"` and every `status` to `"stable"` in the `versionInfo`
constant. Add a `contract: { version: "1.0.0", status: "stable" }` entry.

### 2. `ValidationVersions` schema

In `packages/core/src/validation/snapshot.ts`: extend `ValidationVersions` from
`{ template, compiler }` to `{ template, compiler, contract }` (all required `string`).

### 3. Server consumers

- `packages/server/src/version-schema.ts`: change `templates.status` and
  `compiler.status` literals to `z.literal("stable")` and add a `contract` object
  (`version: z.string().min(1)`, `status: z.literal("stable")`).
- `packages/server/src/validation-routes.ts`: add
  `contract: versionInfo.contract.version` to the `versions` object passed to
  `buildValidationSnapshot` (alongside the existing `template`/`compiler` mapping).
- `packages/server/src/server.test.ts`: update the `.status` assertions
  `"placeholder"` → `"stable"`; add a `contract.status` assertion.

### 4. Core validation tests + web shell test (mechanical fan-out)

- Add `contract: "1.0.0"` to every `versions:` literal in the ~9 core validation
  tests (`validation.test.ts` ×2, `validation-blockers.test.ts`,
  `validation-completeness.test.ts`, `validation-warnings-security.test.ts`,
  `validation-matrix-{durable,voice,knowledge,physical}.test.ts`,
  `validation-stress-mapping.test.ts`).
- `packages/web/src/App.test.tsx`: update the mock `status: "placeholder"` values to
  `"stable"` and the assertion `getAllByText("placeholder")` → `getAllByText("stable")`
  (`AppShell.tsx` needs no change; it renders the status dynamically).

## Files to Touch

- `packages/core/src/version.ts` (modify)
- `packages/core/src/validation/snapshot.ts` (modify)
- `packages/server/src/version-schema.ts` (modify)
- `packages/server/src/validation-routes.ts` (modify)
- `packages/server/src/server.test.ts` (modify)
- `packages/core/test/validation.test.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify)
- `packages/core/test/validation-completeness.test.ts` (modify)
- `packages/core/test/validation-warnings-security.test.ts` (modify)
- `packages/core/test/validation-matrix-durable.test.ts` (modify)
- `packages/core/test/validation-matrix-voice.test.ts` (modify)
- `packages/core/test/validation-matrix-knowledge.test.ts` (modify)
- `packages/core/test/validation-matrix-physical.test.ts` (modify)
- `packages/core/test/validation-stress-mapping.test.ts` (modify)
- `packages/web/src/App.test.tsx` (modify)

## Out of Scope

- The compiler module, `compilePrompt`, and compile metadata (SPEC007DETPROCOM-002+) —
  this ticket only supplies the version constants they will stamp.
- Surfacing a `contract` version row in the web UI / any version-metadata UI — Phase 8
  (`PROMPT-COMPILER.md` "User-facing behavior"; spec Out of Scope).
- Any change to validation rules or `/api/validate` behavior beyond threading the new
  `contract` field (the response shape is otherwise unchanged).
- Bumping `app.version` or any DDL / `user_version`.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck` — green across all packages after the required `contract` field
   is added to every `ValidationVersions` construction site.
2. Updated `packages/server/src/server.test.ts` asserts `/api/version` returns
   `templates`, `compiler`, and `contract` each with `status: "stable"`.
3. `npm test` and `npm run lint` and `npm run build` — all green.

### Invariants

1. The reproducibility triple (template / compiler / contract) is always present in
   `versionInfo` and in every `ValidationSnapshot.versions` — `contract` is required,
   never optional.
2. No version `status` equals `"placeholder"` anywhere in non-`dist` source.

## Test Plan

### New/Modified Tests

1. `packages/server/src/server.test.ts` — assert the `/api/version` triple is present
   and `status: "stable"` (including `contract`).
2. `packages/core/test/validation.test.ts` (+ the other ~8 validation tests) — updated
   `versions` literals carry `contract`; existing assertions otherwise unchanged.
3. `packages/web/src/App.test.tsx` — rendered version statuses read `"stable"`.

### Commands

1. `grep -rn '"placeholder"' packages/ --include=*.ts --include=*.tsx | grep -v dist`
   — no version-status matches remain.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Retired the `templates` and `compiler` placeholder version statuses in
  `@loom/core` and set them to stable `1.0.0` values.
- Added the required `contract` version to `VersionInfo`,
  `ValidationVersions`, the server `/api/version` schema, and the
  `/api/validate` snapshot construction path.
- Updated core validation fixtures and server/web tests for the stable
  version surface and required reproducibility triple.

Deviations from original plan:
- None.

Verification:
- `grep -rn '"placeholder"' packages/ --include=*.ts --include=*.tsx | grep -v dist`
  returned no matches.
- `npm run typecheck` passed.
- `npm test` passed: 40 files, 219 tests.
- `npm run lint` passed.
- `npm run build` passed.
