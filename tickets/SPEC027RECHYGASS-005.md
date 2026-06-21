# SPEC027RECHYGASS-005: Server snapshot builder + response parser

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/server` modules `record-hygiene-snapshot-builder.ts` and `record-hygiene-parse.ts` plus their tests. No change to any existing route or behavior.
**Deps**: SPEC027RECHYGASS-004

## Problem

The server must build the complete `StoryRecordHygieneSnapshot` from project state (every non-archived hygiene-active record, with deterministic reference summaries) and strictly parse the external model's flat findings format, quarantining anything malformed. The snapshot must **fail closed** on structural blockers (a malformed row, an unsupported type, a duplicate id) and must never silently drop a record to fit; the parser must verify every citation against the compiled key set and must never turn model output into a record-write payload.

## Assumption Reassessment (2026-06-21)

1. **Repository seams (codebase).** `RecordRepository` (`packages/server/src/record-repository.ts:168`); `listRecords({ includeArchived?: boolean }): RecordReadResult[]` (`:306`, maps each row through `getRecord` → `RecordReadResult` union at `:32`, which carries `{ ok:false, kind:"malformed-record" }`); `referencesForRecord(id): RecordReference[]` (`:474`, outgoing `refRole`/`targetId`); `incomingReferencesForRecord(id): IncomingRecordReference[]` (`:480`, `IncomingRecordReference` at `:69`). **Premise correction carried from reassessment**: `listRecords` does **not** silently drop malformed rows — it returns them as `{ ok:false }`; the builder must inspect each result and **fail `422 malformed-hygiene-source`** on any `ok:false`, never filter it out (the proposal's "as the general list route currently does" rationale is stale and must not be reused).
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 3 + proposal §6.3 (builder steps) and §6.9 (parser rules); the output format is normative in the authority doc (SPEC027RECHYGASS-003).
3. **Cross-artifact boundary under audit.** The builder produces `StoryRecordHygieneSnapshot`/`HygieneRecord`/`HygieneReferenceSummary` (types from `archive/tickets/SPEC027RECHYGASS-002.md`), gated by `isHygieneActive` (002) and labelled/status-projected via core registry functions (`projectRecordStatus`, `registry.ts:63`). The parser validates against the citation-key set the compiler emits (SPEC027RECHYGASS-004). It mirrors the error-category style of `ideate-routes.ts` (`{ ok:false, kind:… }`).
4. **FOUNDATIONS principle motivating this ticket.** §9.1 (amended) whole-project completeness — the project-review source predicate must render the *complete* declared set or fail; §11 fail-closed — only structural/transport blockers gate, never the overlap/contradiction/staleness the surface exists to inspect. Completeness and fail-closed are the invariants under audit.
5. **Secret-firewall + no-auto-mutation enforcement (§15/§13/§29.2).** Excluded `ENTITY`/`CAST MEMBER` references resolve to the stored repository `displayLabel` **only** — no dossier/base-record payload field enters the snapshot. The parser quarantines malformed output (`{ ok:false, raw }`) rather than repairing it with another model call, and **never** converts a finding into a record-write payload (no path from model output to a record mutation).

## Architecture Check

1. **A dedicated builder beats reusing `buildValidationSnapshot`.** The validation snapshot is active-working-set-scoped and carries story config; reusing it would either omit the required whole-project corpus or blur the two authorities. A separate `buildStoryRecordHygieneSnapshot` keeps the project-review source explicit and fail-closed. The strict parser is separate from `parseIdeationResponse` because the output contracts differ (relation/action taxonomy, ≥2 citations, survivor rules).
2. **No backwards-compatibility aliasing/shims.** New modules; the existing list route and ideation parser are untouched.

## Verification Layers

1. All non-archived hygiene-active records are included even when absent from the active working set; archived/terminal excluded → server unit test against a fixture repository.
2. One malformed row → `422 malformed-hygiene-source`, not silently skipped → server unit test asserting the failure path.
3. Excluded `ENTITY`/`CAST MEMBER` payload fields never enter the snapshot (only `displayLabel` resolves) → server unit test.
4. Parser rejects/quarantines unknown citations, cross-type `MERGE`, invalid/absent `survivor`, duplicate finding numbers, duplicate clusters, missing `END HYGIENE REVIEW`, and `findings_reported` ≠ block count → parser unit test.
5. Parser never emits a record-write payload → manual review + test asserting the result shape is findings/`raw` only.

## What to Change

### 1. `record-hygiene-snapshot-builder.ts` (new)
`buildStoryRecordHygieneSnapshot(repository)`: call `listRecords({ includeArchived: false })` once; **fail `422 malformed-hygiene-source` on any `ok:false` result**; keep only records satisfying `isHygieneActive`; derive `displayLabel`/`fullDisplayLabel` and projected status via core registry functions; collect outgoing (`referencesForRecord`) and incoming (`incomingReferencesForRecord`) summaries into `HygieneReferenceSummary`; resolve excluded `ENTITY`/`CAST MEMBER` references to stored `displayLabel` only; validate unique ids, supported types, payload validity; return the complete snapshot or a clear typed failure.

### 2. `record-hygiene-parse.ts` (new)
`parseRecordHygieneResponse(text, validCitationKeys)`: strictly parse the §6.9 flat format; verify every citation against the key set; require ≥2 distinct citations per finding; require same-type citations + a single cited `survivor` for `MERGE`/`REMOVE` (and `none` otherwise); flag unknown action/relation/confidence values and duplicate finding numbers/clusters; require `findings_reported` to equal the parsed block count and the final `END HYGIENE REVIEW` marker; return `{ ok:true, findings }` or quarantine as `{ ok:false, raw }` — never a record-write payload, never a model-repair retry.

## Files to Touch

- `packages/server/src/record-hygiene-snapshot-builder.ts` (new)
- `packages/server/src/record-hygiene-parse.ts` (new)
- `packages/server/src/record-hygiene-snapshot-builder.test.ts` (new)
- `packages/server/src/record-hygiene-parse.test.ts` (new)

## Out of Scope

- The compile/analyze routes and OpenRouter send (SPEC027RECHYGASS-006) — this ticket ships the builder + parser as pure server functions.
- The web surface (SPEC027RECHYGASS-007).
- Any record mutation, validation diagnostic, or active-working-set interaction.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — builder includes every non-archived hygiene-active record (even outside the active working set), excludes archived/terminal, and resolves excluded ENTITY/CAST references to `displayLabel` only.
2. `npm test` — a single malformed row yields `422 malformed-hygiene-source` (not a silent skip); duplicate id / unsupported type also fail closed.
3. `npm test` — the parser verifies citations, enforces ≥2-citations / same-type-MERGE / survivor rules, requires the end marker and matching count, and quarantines malformed output as `{ ok:false, raw }`.

### Invariants

1. The builder renders the **complete** hygiene-active set or returns a clear failure — it never silently omits a record (no token-budget eviction, no ranking).
2. No excluded-record payload field and no parser output ever becomes a record-write payload (no auto-mutation path).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-hygiene-snapshot-builder.test.ts` (new) — fixture repository covering archived/terminal exclusion, AWS-independence, malformed-row 422, excluded-reference label-only resolution.
2. `packages/server/src/record-hygiene-parse.test.ts` (new) — valid parse + every quarantine/flag path (unknown citation, cross-type MERGE, bad survivor, duplicate numbers, missing marker, count mismatch).

### Commands

1. `npm test -- record-hygiene-snapshot-builder record-hygiene-parse` — targeted builder + parser coverage.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline gate.
3. Unit tests against a fixture repository are the correct boundary here because builder + parser are pure server functions; the end-to-end route + provider path is exercised in SPEC027RECHYGASS-006 and the capstone (009).
