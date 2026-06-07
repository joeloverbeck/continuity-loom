# SPEC — Generation Brief Draftability and Save Model

Status: completed
Repository: `joeloverbeck/continuity-loom`  
Target commit: `e1df2d032c7ae7976108f70cafa5802a7398ce39`

## Executive decision

The current save model is wrong. Saving a generation brief must behave like saving a draft, not like asking permission to generate prose.

`/api/generation-brief` must accept incomplete, partial, and temporarily blank generation-brief state. Validation must gate Preview and Generate only. A normal authoring workflow must never require the author to satisfy all generation blockers before the app lets them persist the very fields needed to resolve those blockers.

The correct model has three layers:

1. **Draft persistence model** — permissive, partial, saveable, and project-local.
2. **Readiness normalization model** — deterministic defaults and empty-state conversion for validation and compile.
3. **Generation-ready validation model** — strict only at Preview/Generate boundaries.

## Exact-commit repo findings

All repo findings below were verified directly against the codebase at the target commit; each cites its `file:line` source.

The current `GenerationBriefView` locally defaults `generation_validation_focus.validation_focus_tags.generation_context` to `first_segment`, but validation does not read that local state. Validation routes build a server snapshot from the persisted generation session. When save fails, the validation snapshot still sees an empty or missing generation context and raises `focus-tag-count-invalid`.

The current save route performs a shallow merge of the request body into the persisted generation session, then calls `repository.setGenerationSession`. The repository parses with the final `generationSessionSchema`. That schema has optional top-level surfaces, but present nested surfaces contain strict non-empty fields. A draft payload with `immediate_handoff`, `stop_guidance`, or other nested objects present but blank can fail persistence with the generic user message `Generation brief request is invalid.`

The web editor also fabricates `manual_moment_directive.must_render: ["Continue the immediate moment."]` when the user has not supplied a directive. That is unacceptable. The launch directive is the user's authored immediate action choice. The app must not invent it to satisfy schema pressure.

## Product doctrine

Saving a draft means: “store what I have written so far.”

Generating means: “compile a deterministic prompt and send it to a model.”

Those are different acts. They need different contracts.

## Required data models

### `GenerationSessionDraft`

Create a core draft schema, `generationSessionDraftSchema`, exported from `packages/core`, that accepts the same top-level generation-session surfaces as the current schema but permits partial nested objects and blank strings. The companion draft-storage normalizer is `normalizeGenerationSessionDraft` (compact normalized draft storage; see Field-aware merge semantics).

Required properties of the draft schema:

- Top-level surfaces remain optional.
- Nested fields are optional unless structural identity is required for an array item.
- String fields accept `""` during draft persistence.
- String arrays accept empty arrays during draft persistence.
- Array items that contain only blanks are allowed at request time but normalized before storage.
- Unknown keys remain rejected. Draftability is not a license for malformed payloads.
- IDs, enum values, and array/object shapes remain typed. Draft saving should tolerate incompleteness, not arbitrary data.

Examples that must be saveable as drafts:

```json
{
  "generation_validation_focus": {
    "validation_focus_tags": {
      "generation_context": ["first_segment"]
    }
  },
  "stop_guidance": { "soft_unit_guidance": "" },
  "immediate_handoff": {
    "recent_causal_context": "",
    "last_visible_moment": "",
    "prior_accepted_prose_status_or_handoff_note": "none",
    "begin_after": ""
  }
}
```

```json
{
  "manual_moment_directive": {
    "must_render": [],
    "may_render_if_naturally_caused": [],
    "do_not_force": []
  }
}
```

The second example is saveable but not generation-ready.

### `GenerationSessionReadyCandidate`

Validation should not parse persisted draft state with the same schema used for persistence. It should first normalize draft state into a ready candidate via `normalizeGenerationSessionForReadiness`.

The ready candidate must:

- Trim strings.
- Treat blank strings as absent for readiness decisions.
- Remove blank array entries.
- Remove empty array objects that have no semantic content.
- Apply deterministic `generation_context` defaults using accepted-segment count.
- Preserve explicit user-selected generation context if present and valid.
- Preserve explicit user-authored stop guidance if nonblank.
- Convert blank `soft_unit_guidance` to an allowed empty state, not a blocker.
- Never invent story content.
- Never invent a launch directive.

### `GenerationSessionReady`

The final generation-ready schema is an internal normalized view, not the persistence schema. It is acceptable for validation to produce blockers when required ready fields are absent.

`manual_moment_directive.must_render` remains absent if blank. It should then block Preview/Generate as a missing launch directive.

`soft_unit_guidance` does not become absent in a blocking sense. It becomes the deterministic stop-guidance empty state: no additional user narrowing beyond the universal stop rule.

## API contract

### `GET /api/generation-brief`

Returns the persisted draft session plus deterministic display defaults.

Required behavior:

- If no generation context is persisted, return the deterministic default based on accepted-segment count.
- Do not silently create a manual directive.
- Do not treat blank stop guidance as invalid.
- Include draft metadata indicating whether returned fields are persisted or defaulted.

Recommended response shape:

```ts
type GenerationBriefGetResponse = {
  ok: true;
  session: GenerationSessionDraft;
  defaults: {
    generation_context: {
      value: "first_segment" | "continuation_after_accepted_segment";
      source: "persisted" | "accepted-segment-count";
      acceptedSegmentCount: number;
    };
  };
};
```

### `PUT /api/generation-brief`

Accepts draft writes. It must not run generation readiness validation.

Required behavior:

- Parse with `generationSessionDraftSchema`, not `generationSessionSchema`.
- Merge using field-aware partial update semantics, not only shallow top-level merging.
- Normalize structural empties before storage.
- Persist deterministic `generation_context` if the user has never selected one.
- Return the stored draft session.
- Return `400` only for malformed shapes, invalid enum values, invalid IDs, or impossible structural input.
- Include structured issue details with JSON paths and human messages.
- The UI must treat save-time `400` as an input-shape bug, not as ordinary readiness feedback.

Recommended response shape:

```ts
type GenerationBriefPutResponse =
  | { ok: true; session: GenerationSessionDraft; readinessSummary?: ReadinessSummary }
  | {
      ok: false;
      kind: "malformed-draft";
      message: string;
      issues: Array<{ path: string; message: string; expected?: string }>;
    };
```

The route may include a readiness summary after a successful save, but save success must never depend on that summary being blocker-free.

`ReadinessSummary` is defined and produced by `SPEC-readiness-diagnostics-and-three-page-ux.md` (the readiness API, Phase 5 in the implementation order). It is referenced here only as an optional forward field; emitting `readinessSummary` from this route is **out of scope for this spec** and must not be decomposed into a ticket here. Until that spec lands, the successful PUT response is `{ ok: true; session: GenerationSessionDraft }`.

## Field-aware merge semantics

The current shallow merge can accidentally replace an entire nested surface when a form only edits one field. Replace it with deterministic per-surface merge behavior.

Rules:

- Omitted top-level surface: leave existing stored surface unchanged.
- Explicit `null` top-level surface: clear the surface if the API chooses to support clearing. If unsupported, reject with `malformed-draft`.
- Present object surface: merge known nested fields into existing surface, then normalize.
- Present array surface: replace the array with the submitted normalized array. Arrays are form lists, not patch maps.
- Empty strings in object fields: persist as empty draft text only when needed for editor round-trip, or omit during storage if the UI already supplies blank display defaults.

Choose one canonical storage form and enforce it everywhere. The preferred storage form is compact normalized draft storage: omit fully blank optional surfaces and blank list items, but allow partial nonblank surfaces.

## Deterministic defaults

### `generation_context`

Apply this rule in a shared core normalizer:

```ts
function deriveGenerationContextDefault(acceptedSegmentCount: number) {
  return acceptedSegmentCount === 0
    ? "first_segment"
    : "continuation_after_accepted_segment";
}
```

Locations that must use the same rule:

- `GET /api/generation-brief` for display defaults.
- `PUT /api/generation-brief` when persisting an otherwise missing selector.
- `buildSnapshotFromOpenProject` (`packages/server/src/snapshot-builder.ts`) as a last-defense normalization step. It currently reads the persisted session with no `generation_context` defaulting, which is the source of the `focus-tag-count-invalid` false blocker.
- UI initial state, but only as presentation; UI-only defaults are not authoritative.
- Project migration/backfill for existing persisted sessions.

The validation snapshot builder already has access to the repository, and the repository exposes accepted-segment listing/latest APIs. It must use that source of truth, not local browser state.

### `soft_unit_guidance`

Blank `soft_unit_guidance` is a valid draft state and a valid ready state.

Compiled behavior when blank:

```text
Soft unit: No additional user narrowing; use the universal local stop rule above.
```

That line is deterministic compiler text, not story content and not a user-invented plot instruction.

This string **supersedes** the existing `EMPTY_STATE_CONSTANTS.soft_unit_guidance` value (`"None specified"`) in `packages/core/src/compiler/empty-states.ts`. Update the constant in place rather than introducing a second rendering path — `EMPTY_STATE_CONSTANTS` remains the single deterministic authority for placeholder empty states (FOUNDATIONS §8). This is a deliberate compiler-contract version bump (coordinated with the Phase 3 shared compiler-empty-states seam in `IMPLEMENTATION-ORDER.md`).

The universal stop rule remains the authority:

```text
Render only the next local unit that follows from the supplied state and directive.
Stop as soon as the immediate response point is reached.
Do not continue into downstream consequences, chapter summaries, options, or alternate branches.
```

Nonblank stop guidance is allowed when it narrows the local stop point. It blocks only when it contradicts the universal local-prose contract, requests a chapter/reveal/arc/outcome, conflicts with the launch directive, or asks the model to plan beyond the next local response point.

### `immediate_handoff`

For `first_segment`, blank immediate handoff is allowed. The compiler must render a truthful empty state:

```text
No prior accepted prose. Begin from current authoritative state and the launch directive.
```

The first-segment empty handoff overlaps the existing per-placeholder constants in `EMPTY_STATE_CONSTANTS` (`recent_causal_context`, `last_visible_moment`, `begin_after`, `prior_accepted_prose_status_or_handoff_note`). Reconcile against that file deterministically: either keep emitting the existing per-placeholder constants, or replace them with this single combined line — choose one and record it in the compiler contract, so there is exactly one authority and the prompt fingerprint changes once (FOUNDATIONS §8).

For `continuation_after_accepted_segment`, a handoff is generation-ready only when it supplies a recent causal bridge / last visible moment / begin-after point. It must not include accepted prose.

The route must not block draft saving for either case.

### `manual_moment_directive.must_render`

This field is the launch directive. It remains required for Preview and Generate. It is not required for draft saving.

The UI must never fabricate a directive. Remove the current fallback that submits `"Continue the immediate moment."` when the user leaves the field blank.

## UI save behavior

Required changes:

- The Save button saves draft state only.
- Save success message: `Draft saved.`
- Save failure message for malformed draft input: `The draft could not be saved because the request shape is invalid.` Show issue paths in a technical expander.
- Do not show generation blockers as save failures.
- After save, refresh readiness status from the canonical server response.
- If there are unsaved changes, readiness panels must state that the displayed readiness may be stale.
- Field defaults shown in the UI must be labeled where relevant: `Default: first segment because no accepted prose exists yet.`

## Console behavior

Normal authoring mistakes must not produce console errors.

Console errors are acceptable for unexpected transport failures, unhandled exceptions, or developer diagnostics. They are not acceptable for a user leaving an unfinished draft field blank.

## Migration and backfill

Because the project has not yet successfully generated a prompt, migration can be simple and explicit.

Required migration:

- Existing generation sessions parsed under the old strict schema must be read through the draft schema. Once partial drafts can be persisted, every server read path that currently calls `generationSessionSchema.parse` on stored data will throw on a partial draft and must be switched to `generationSessionDraftSchema` (then normalized). The concrete sites are:
  - `record-repository.ts` `getGenerationSession` (`packages/server/src/record-repository.ts:380`);
  - `record-repository.ts` `pruneDeletedRecordFromGenerationSession` (`packages/server/src/record-repository.ts:392`) — fires on **any record deletion**, so an un-migrated draft makes record deletion throw;
  - `working-set-integrity-migration.ts` (`packages/server/src/working-set-integrity-migration.ts:34`).
  - `generation-brief-descriptors.ts` (`packages/core/src/records/generation-brief-descriptors.ts:5`) consumes the schema *shape*, not persisted data — it stays on the strict schema and needs no change.
- Missing `generation_context` must be defaulted from accepted-segment count.
- Blank or missing `soft_unit_guidance` must remain allowed.
- Existing `stop_guidance.soft_unit_guidance` values should be preserved if nonblank.
- Existing empty current-cast pressure rows should be removed.
- Existing fabricated `"Continue the immediate moment."` directives are stripped only under an exact, conservative match: `manual_moment_directive.must_render` is exactly `["Continue the immediate moment."]` (the fallback as the sole entry, byte-identical). Any directive with additional entries, different text, or this phrase alongside other authored content is left untouched. The migration must not heuristically guess authorship beyond this exact-sole-entry rule — silently discarding a directive a user may have authored would violate FOUNDATIONS §4.1 (user-owned continuity) and §20 (no silent mutation of authored state).

## Test requirements

### Core schema tests

- Draft schema accepts blank nested stop guidance.
- Draft schema accepts partial handoff.
- Draft schema accepts empty manual directive arrays.
- Draft schema rejects unknown keys.
- Draft schema rejects invalid enum values and invalid record IDs.
- Ready normalizer trims blanks, removes empty list items, and preserves explicit nonblank fields.

### Server route tests

- `PUT /api/generation-brief` saves a partial blank draft with `ok: true`.
- Save does not run readiness blockers.
- Save does not log prompt text, API keys, candidate text, accepted prose, or full record payloads.
- `GET /api/generation-brief` returns `first_segment` when accepted segment count is zero.
- `GET /api/generation-brief` returns `continuation_after_accepted_segment` when accepted segment count is nonzero.
- `PUT` persists explicit user override of generation context.
- Malformed draft returns structured issues.

### Snapshot tests

- Snapshot builder applies `generation_context` default if persisted draft is missing it.
- Snapshot builder uses accepted-segment count from the repository.
- Snapshot builder does not include accepted prose text in prompt input.
- Snapshot builder allows blank stop guidance to normalize to the deterministic empty state.

### Web tests

- The editor can save an otherwise blank draft.
- The editor does not fabricate `must_render`.
- After successful draft save, readiness refreshes from server state.
- A validation blocker does not make the Save button fail.
- Preview/Generate remain blocked when true blockers exist.
- Warnings do not disable Preview or Generate.

## Non-goals

- Do not implement branch, beat, act, or drama-manager machinery.
- Do not ask an LLM to decide whether a draft is ready.
- Do not mutate records from accepted prose.
- Do not include accepted prose in prompts.
- Do not create tickets in this spec.

## FOUNDATIONS Alignment

- **§4.4 / §8 Deterministic compilation** — The readiness normalizer (`normalizeGenerationSessionForReadiness`) and `deriveGenerationContextDefault` are pure deterministic functions keyed on persisted draft state and accepted-segment count; no LLM intermediary selects, ranks, summarizes, or repairs anything. Blank-state compiler strings live in `EMPTY_STATE_CONSTANTS` as a single deterministic authority, so identical inputs + versions still produce an identical prompt.
- **§10 / §29.4 No accepted prose in prompts** — The draft schema keeps `prior_accepted_prose_status_or_handoff_note` typed (`nonemptyString | "none"`) and the spec forbids inventing handoff/story content. Permissive draft saving never opens a path for accepted, rejected, or superseded prose to enter prompt context.
- **§11 / §29.5 Validation and hard fails** — Draftability moves strictness off the save boundary, but Preview and Generate stay deterministically blocked when true blockers exist (missing launch directive, contradictions, impossible conditions). Warnings never disable Preview/Generate. No v1 override is introduced. Blocker/warning taxonomy itself is owned by `SPEC-validation-gating-taxonomy-and-focus-matrix.md`; this spec only supplies the normalized ready candidate it consumes.
- **§4.1 / §20 User-owned continuity & gatekeeping** — Migration touches only app-fabricated noise (the exact-sole-entry UI fallback) and never rewrites authored directives, records, or accepted prose. The generation-time brief is a draft surface, not canon; the human remains the sole continuity authority.
- **§29 hard-fail checklist** — §29.1 (identity), §29.4 (prompt compilation), §29.5 (validation), §29.2 (continuity authority) all pass; no branching/plot-rail machinery, no LLM-in-compilation, no accepted-prose-as-canon is introduced.

## Risks & Open Questions

- **Explicit `null` top-level surface** — The field-aware merge rules allow clearing a surface via explicit `null` "if the API chooses to support clearing." Decide before decomposition whether `PUT` supports surface clearing or rejects `null` as `malformed-draft`; pick one and make it a deliverable.
- **Canonical empty-string storage form** — The spec states a preference for compact normalized draft storage (omit fully blank optional surfaces and blank list items) but also allows persisting empty strings "for editor round-trip." These can conflict. Settle the single canonical storage form so the normalizer and the editor agree.
- **Accepted-segment count source** — The repository exposes no dedicated count API; `getLatestAcceptedSegment().sequence` (`record-repository.ts:437`) or `listAcceptedSegments().length` (`record-repository.ts:423`) is the source for `deriveGenerationContextDefault`. Confirm which is canonical, or add a `countAcceptedSegments()` helper, so GET, PUT, and the snapshot builder all read the same number.
- **"Project has not yet generated" assumption** — The simple migration rests on the claim that no prompt has been successfully generated. This is a project-state assumption, not a codebase invariant. The exact-sole-entry directive rule (above) keeps the migration safe even if that assumption is wrong.

## Outcome

Completed on 2026-06-07 through tickets `SPECGENBRIDRA-001` through `SPECGENBRIDRA-009`.

- Added draft and readiness schemas/normalizers in core, including deterministic generation-context defaults.
- Switched persisted generation sessions and server draft routes to the draft schema, with field-aware partial saves, structured malformed-draft errors, and compact normalized storage.
- Defaulted generation context in snapshots from accepted-segment count, migrated existing drafts on project open, and stripped only the exact sole fabricated `Continue the immediate moment.` directive.
- Updated compiler empty states and contract versions for blank stop guidance.
- Updated the web save flow to be a draft write: no fabricated directive, `Draft saved.` success, malformed-draft technical details, default labels, and stale-readiness refresh behavior.
- Added the capstone e2e `packages/server/src/generation-brief-draftability.e2e.test.ts` covering draft save, defaults, validation/compile boundaries, accepted-prose exclusion, and log secrecy.

Notable settled questions:

- `null` surface clearing is not part of the implemented draft route contract; malformed shapes return `malformed-draft`.
- Compact normalized storage is the canonical storage form for blank optional draft surfaces.
- Accepted-segment count is derived from `repository.listAcceptedSegments().length`.

Final verification:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
