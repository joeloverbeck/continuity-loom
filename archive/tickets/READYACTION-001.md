# READYACTION-001: Make the current-authoritative-state blocker authorable and field-named

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` readiness copy + validation message (`packages/core/src/validation/readiness.ts`, `packages/core/src/validation/rules/universal-completeness.ts`); `@loom/web` Generation Brief inputs (`packages/web/src/generation-brief/GenerationBriefView.tsx`)
**Deps**: None. (READYACTION-002 depends on this ticket for the new inputs and the section anchor as focus targets.)

## Problem

A user with `current_authoritative_state.current_time` filled still sees a single permanent blocker — `Required before prompt generation (1)` / "Missing Current Authoritative State" — and cannot clear it. Two facts combine:

1. The blocker fires when **any** of `current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary` is empty (`packages/core/src/validation/rules/universal-completeness.ts:100-116`), but the Generation Brief renders an input only for `current_time` (`packages/web/src/generation-brief/GenerationBriefView.tsx:291-319`). The other three required fields are silently written as empty on save (lines 301-302) or not written at all (`immediate_situation_summary`), so there is **no surface anywhere in the app to author them** — the blocker is structurally unclearable.
2. The author-facing copy is generic fallback text (no `COPY_TABLE` entry → `fallbackCopy`, `packages/core/src/validation/readiness.ts:91-191,422-437`): "missing required launch context" never names *which* field is missing.

This violates `docs/FOUNDATIONS.md:381` ("A validation error should identify the conflicting records or fields … and indicate what the user can change") and `:387` ("Readiness diagnostics must be author-actionable").

## Assumption Reassessment (2026-06-08)

1. `validateGenerationBriefSurfaces` (`packages/core/src/validation/rules/universal-completeness.ts:100-116`) emits one blocker with `field: "generationSession.current_authoritative_state"` and `message: "Current authoritative state is missing required launch context."` when any of the four fields fails `hasText`/`hasValue`. Verified by Read + a live `/api/readiness` call against an open project returning exactly that blocker.
2. `packages/web/src/generation-brief/GenerationBriefView.tsx:291-319` renders a single `<input name="generationSession.current_authoritative_state.current_time">`; the `updateSurface("current_authoritative_state", …)` onChange spreads default-empty values for the remaining fields. No other web surface writes `current_authoritative_state` (grep of `packages/web/src`).
3. `docs/ACTIVE-DOCS.md` routes validation-blocker **taxonomy/count** changes to a spec; this ticket deliberately keeps the single blocker and the `(1)` count, changing only its author-facing copy and the available authoring inputs — so it stays ticket-scope and does not touch the fail-closed gate.
4. FOUNDATIONS principle motivating this ticket: author-actionable, field-identifying diagnostics (`docs/FOUNDATIONS.md:381,387,836`). The fix restores that guarantee; it does not change *when* the blocker fires.
5. Fail-closed surface: the validation gate (`deriveReadiness` blocker count → `canPreview`/`canGenerate`, `packages/core/src/validation/readiness.ts:202-204`) is unchanged. The blocker still fires under exactly the same conditions; only its message text and the inputs that let a user satisfy it change. Deterministic compilation and the secret firewall are untouched.
6. Schema: the new inputs author existing fields on `currentAuthoritativeStateReadySchema` (`packages/core/src/records/generation-brief-readiness.ts:39-57`) — `current_location` (`recordId | readyString`), `onstage_entities` (`recordId[]`), `immediate_situation_summary` (required `readyString`). Change is **additive UI only**; no schema field is added, renamed, or removed, and the draft schema already accepts these (`generation-brief-draft.ts`).
7. n/a — no rename/removal.
8. Adjacent contradiction found: the physical-context blocker (`validateActivePhysicalContext`, same file, lines 204-234) requires further `current_authoritative_state` fields that also have no Brief input. Classified as a **separate future ticket** (out of scope here per the brainstorm scope decision), not a consequence of this ticket.

## Architecture Check

1. Keeping one blocker and routing the dynamic missing-field list through curated copy (rather than splitting into per-field blockers) is the minimal change that satisfies FOUNDATIONS §381 without altering the readiness taxonomy/count or its many consumers (tests, dedupe keys, the `(N)` heading). Adding the missing inputs is the only way to make the existing blocker satisfiable — it is a gap fix, not new behavior.
2. No backwards-compatibility shims: the curated `COPY_TABLE` entry replaces the fallback path for this code; no aliasing introduced.

## What to Change

### 1. `@loom/web` — author the three missing required fields

In `GenerationBriefView.tsx`, inside the `CURRENT AUTHORITATIVE STATE` section (`aria-labelledby="current-state-brief"`), add controls for:
- `current_location` — text `<input name="generationSession.current_authoritative_state.current_location">` (schema permits a plain string).
- `immediate_situation_summary` — `<textarea name="generationSession.current_authoritative_state.immediate_situation_summary">`.
- `onstage_entities` — a control producing a `recordId[]`. Prefer a multi-select backed by the already-loaded ENTITY list (`povEntities`, loaded at line 81) so the user picks real entity records; a newline-separated textarea (mirroring `must_render` at lines 354-361) is an acceptable minimal fallback. Name it `generationSession.current_authoritative_state.onstage_entities`.

Each must update via the existing `updateSurface("current_authoritative_state", { …preserve all current fields…, <field>: value })` pattern (do not drop the other spread fields). Add a `BriefFieldHelp` line for each, mirroring the existing `current_time` help.

Add `data-field="generationSession.current_authoritative_state"` to the section element so a parent-path focus target can resolve to it (consumed by READYACTION-002).

### 2. `@loom/core` — curated, field-naming blocker copy

- Add a `COPY_TABLE` entry for `DIAGNOSTIC_CODES.missingCurrentAuthoritativeState` (`packages/core/src/validation/readiness.ts`) in the `required-before-prompt-generation` group, with an author-facing `title`, `summary`, `whyItMatters`, and a `fastestFix` that points to the CURRENT AUTHORITATIVE STATE section and lists the required fields (current time, location, onstage entities, immediate situation summary).
- Make the blocker name the **specific** missing fields: in `validateGenerationBriefSurfaces`, compute which of the four sub-fields are absent and include that list in the diagnostic `message` (e.g. "Current authoritative state is missing: current location, onstage entities, immediate situation summary."), and surface that dynamic list in the author-facing summary the card renders.
- Keep exactly **one** affected target (the parent path) and therefore one action button — do **not** emit per-field affected targets (that is the deliberately-rejected per-field-button variant; `actionsFor` would otherwise generate a button per target).

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/core/src/validation/readiness.ts` (modify)
- `packages/core/src/validation/rules/universal-completeness.ts` (modify)
- `packages/core/test/validation-blockers.test.ts` (modify — assert dynamic missing-field message)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` or nearest existing brief test (modify/new — inputs render + save payload)

## Out of Scope

- The physical-context blocker's missing inputs (`positions`, `possessions`, `line_of_sight_and_visibility`, `routes_and_exits`, `available_time`, `current_locks`) — separate future ticket.
- Splitting the blocker into per-field blockers or rendering per-field "Edit X" buttons (rejected in the brainstorm).
- The focus/scroll behavior of the "Edit current state" button and cross-page field targeting — READYACTION-002.
- Any change to when the blocker fires, the fail-closed gate, or the `(N)` count.

## Acceptance Criteria

### Tests That Must Pass

1. Core: with `current_time` present but `current_location`/`onstage_entities`/`immediate_situation_summary` absent, the derived readiness blocker's author-facing summary names those specific missing fields (not a generic "missing required launch context").
2. Core: with all four fields present, `validateGenerationBriefSurfaces` emits no `missing-current-authoritative-state` blocker and `deriveReadiness` reports `canPreview === true` (provider aside).
3. Web: the CURRENT AUTHORITATIVE STATE section renders inputs for `current_time`, `current_location`, `onstage_entities`, and `immediate_situation_summary`; editing them and saving sends non-empty values for each in the `setGenerationBrief` payload.
4. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The blocker fires under exactly the same field conditions as before (no gate/taxonomy change); only its copy and the available inputs differ.
2. `current_authoritative_state` saves preserve every existing sub-field (no field is dropped by the new onChange handlers).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-blockers.test.ts` — dynamic missing-field message + cleared-when-complete cases.
2. `packages/web/src/generation-brief/*brief*.test.tsx` — new inputs render and round-trip through save.

### Commands

1. `npm test -w @loom/core -- validation-blockers`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completion date: 2026-06-08

What changed:
- Added Generation Brief authoring controls for `current_location`, `onstage_entities`, and `immediate_situation_summary`, plus the parent `data-field` anchor for `generationSession.current_authoritative_state`.
- Replaced the generic current-authoritative-state diagnostic message with a single blocker that names the missing required sub-fields.
- Added curated readiness copy for the current-state blocker while preserving the dynamic missing-field summary in the author-facing readiness item.
- Added focused core and web tests for the dynamic message, readiness summary, required-field completion, and save payload.
- Made existing malformed-fixture core tests typecheck-clean without changing production behavior.

Deviations from original plan:
- Used the existing ENTITY-backed multi-select for `onstage_entities`; no free-form fallback was needed.
- Added a readiness-level test in `packages/core/test/readiness.test.ts` in addition to the requested validator test so the author-facing summary is directly covered.
- Touched `packages/core/test/validation-completeness.test.ts` to keep the required `npm run typecheck` gate passing under the current strict test config.

Verification results:
- `npm test -w @loom/core -- readiness validation-blockers` passed.
- `npm test -w @loom/web -- GenerationBriefView` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed; Vite reported the existing large chunk warning.
