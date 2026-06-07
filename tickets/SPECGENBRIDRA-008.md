# SPECGENBRIDRA-008: Web draft-save UX & API response shapes

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — `GenerationBriefView` save becomes a draft write (no fabricated directive, "Draft saved.", malformed-draft handling, readiness refresh, default labels); `api.ts` response types updated; modifies the view, `api.ts`, and the view test
**Deps**: SPECGENBRIDRA-005

## Problem

The web editor fabricates `manual_moment_directive.must_render: ["Continue the immediate moment."]` when the user leaves the directive blank (`packages/web/src/generation-brief/GenerationBriefView.tsx:158`) and reports save as `"Generation brief saved."` (`:167`) regardless of draft semantics. Saving a brief should mean "store what I've written so far": never invent a launch directive, show `Draft saved.` on success, treat a malformed-shape `400` as an input-shape bug (not readiness feedback), refresh readiness from the canonical server response, and label deterministic defaults. This ticket makes the UI match the draft save model and the new route contract.

## Assumption Reassessment (2026-06-07)

1. The current view fabricates the directive at `GenerationBriefView.tsx:158` (`must_render: manualDirective.must_render.length > 0 ? … : ["Continue the immediate moment."]`), submits all surfaces via `setGenerationBrief(payload)` (`:165`), and sets the notice `"Generation brief saved."` (`:167`). `api.ts` declares `GenerationBriefResponse = { ok: true; session: unknown } | ApiFailure` (`:182`) and `getGenerationBrief`/`setGenerationBrief` (`:327`/`:331`). Confirmed this session.
2. The spec (`specs/SPEC-generation-brief-draftability-and-save-model.md` §UI save behavior, §Console behavior, §`manual_moment_directive.must_render`) prescribes removing the fabrication, the `Draft saved.` / malformed-draft messages, the readiness refresh, the stale-readiness notice, the default label, and console cleanliness.
3. Shared boundary under audit: the `/api/generation-brief` response contract from SPECGENBRIDRA-005 (declared Dep) — GET now returns `{ ok, session, defaults }`; PUT returns `{ ok: true, session }` or `{ ok:false, kind:"malformed-draft", message, issues[] }`. This ticket updates `api.ts` types to match and consumes `defaults` for the label.
4. FOUNDATIONS restated: §11 — a validation blocker must not make Save fail, and warnings must not disable Preview/Generate; the Save button writes a draft only. §27 UI/workflow — defaults are labeled and dangerous-action confusion is reduced; the app must not fabricate continuity inputs. §10 — removing the fabricated directive keeps the launch directive an authored field, never an app invention.
5. Response-schema consumer classification: `GenerationBriefResponse` and the `setGenerationBrief` return type are **breaking** updates aligned to the SPECGENBRIDRA-005 contract (additive `defaults` on GET; `malformed-draft` failure on PUT). Consumers updated: `api.ts` types + `GenerationBriefView` save/readiness handlers. No other caller of these functions exists (grep: only the view).
6. Mismatch + correction: the spec's `readinessSummary` field is out of scope (Readiness/UX spec) — the view refreshes readiness via the existing `ValidationPanel` (`validationKey` bump, `GenerationBriefView.tsx:193`/`:143`), not via a new readiness payload.

## Architecture Check

1. Making Save a pure draft write (submit authored fields verbatim, never fabricate) and routing malformed-shape `400`s to a technical expander — distinct from readiness feedback — gives the user a truthful, low-friction authoring loop and matches the server's draft/readiness separation. Reusing the existing `ValidationPanel`/`validationKey` refresh avoids inventing a parallel readiness channel.
2. No backwards-compatibility aliasing/shims: the fabricated-directive fallback is deleted, not retained behind a flag; the old `invalid-request` handling is replaced by `malformed-draft`.

## Verification Layers

1. No-fabrication invariant (save submits `must_render` as authored; blank → empty, never the fallback string) -> web test + grep-proof the literal `"Continue the immediate moment."` is gone from `GenerationBriefView.tsx`.
2. Draft-message invariant (`Draft saved.` on success; the malformed-draft message + issue paths in a technical expander on `400`) -> web test (`GenerationBriefView.test.tsx`).
3. Blocker-not-failure invariant (a readiness blocker does not turn Save into a failure; Preview/Generate gating is unaffected by warnings) -> web test.
4. Readiness-refresh invariant (after a successful save, readiness refreshes from server state; with unsaved changes, the panel states displayed readiness may be stale) -> web test.
5. Console-clean invariant (leaving a draft field blank produces no console error) -> web test / manual review.

## What to Change

### 1. `packages/web/src/generation-brief/GenerationBriefView.tsx`

- Remove the `["Continue the immediate moment."]` fallback (`:158`); submit `must_render` exactly as authored (empty allowed).
- On success show `Draft saved.`; on `kind: "malformed-draft"` show `The draft could not be saved because the request shape is invalid.` with `issues[].path` in a technical expander; never render a generation blocker as a save failure.
- After a successful save, refresh readiness from the canonical server response (bump `validationKey`); when there are unsaved changes, surface that displayed readiness may be stale.
- Label the deterministic default using GET `defaults` (e.g. `Default: first segment because no accepted prose exists yet.`).
- Ensure normal blank-field authoring produces no `console.error`.

### 2. `packages/web/src/api.ts`

- Update `GenerationBriefResponse` to `{ ok: true; session: GenerationSessionDraft; defaults: … } | ApiFailure` and give `setGenerationBrief` a return type covering `{ ok: true; session }` and `{ ok: false; kind: "malformed-draft"; message; issues }`.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- The route implementation (SPECGENBRIDRA-005 — depended upon).
- `ReadinessSummary` and the three-page readiness UX (`SPEC-readiness-diagnostics-and-three-page-ux.md`).
- Core schema/normalizer and server persistence/migration (earlier tickets).

## Acceptance Criteria

### Tests That Must Pass

1. Saving with a blank directive submits `must_render` empty (no fabricated string); the literal `"Continue the immediate moment."` no longer appears in `GenerationBriefView.tsx`.
2. A successful save shows `Draft saved.`; a `malformed-draft` `400` shows the shape-error message with issue paths, not a readiness message.
3. A readiness blocker does not make the Save button fail; warnings do not disable Preview/Generate.
4. After save, readiness refreshes from server state; with unsaved changes the panel indicates possible staleness; the default label renders from GET `defaults`.
5. `npm test` (web component tests) passes.

### Invariants

1. The Save button performs a draft write only; save success is never gated by generation readiness (§11).
2. The UI never fabricates a launch directive or other continuity input (§10/§27).

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify) — blank-draft save, no-fabrication, `Draft saved.` vs malformed-draft messaging, blocker-not-failure, readiness refresh + stale notice, default label, console cleanliness.

### Commands

1. `npx vitest run packages/web/src/generation-brief/GenerationBriefView.test.tsx` — targeted web view tests.
2. `npm run lint && npm run typecheck && npm test` — full-pipeline gate.
