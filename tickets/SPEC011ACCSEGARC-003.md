# SPEC011ACCSEGARC-003: Accepted segment browser view + styling

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds the `AcceptedSegmentsView` React surface (`@loom/web`) and prose-forward browser styling
**Deps**: SPEC011ACCSEGARC-002

## Problem

SPEC-011's primary deliverable is a prose-forward, read-only browser for accepted segments: an
ordered readable list, a per-segment metadata panel, a simple client-side text filter,
delete-with-confirmation, minimal Markdown/plain-text export, and an empty state. No such surface
exists (`grep` finds no `accepted-segments/` web dir). This ticket builds the component over the
002 clients. It must read as "an archive of cloth, not the loom" (§27) — visibly distinct from the
record and candidate editors — and must offer **no** path that feeds accepted text back into a
prompt (§10/§28.1).

## Assumption Reassessment (2026-06-06)

1. **No accepted-segments web surface exists; the view-type + clients are ready after 002.** Verified: `ls packages/web/src/accepted-segments/` → absent (new dir); the component consumes `listAcceptedSegments()` / `deleteAcceptedSegment(id)` and the `AcceptedSegment` view type from 002. Component convention to mirror: `packages/web/src/generate/GenerateView.tsx` (functional component + `api.ts` clients + local `useState`), tested via RTL/jsdom (`vitest run --environment jsdom`, `packages/web/package.json:11`).
2. **The persisted metadata shape backs the panel exactly.** Verified: SPEC-010 stores `GenerationMetadata` = `{ model, provider: "openrouter", temperature, maxOutputTokens, topP?, versions: { template, compiler, contract } }` (`api.ts:84`; `versions` triple confirmed at `packages/core/src/version.ts` + `snapshot-builder.ts`). The panel renders model, provider, temperature, max output tokens, optional top-p, and the template/compiler/contract version triple — all present, no schema change needed.
3. **Shared boundary under audit: the `AcceptedSegment` view contract from 002 and `packages/web/src/styles.css`.** The component depends on 002's `{ ok: true; segments } | ApiFailure` and `{ ok: true; deleted } | ApiFailure` discriminated unions; CSS additions co-locate here (SPEC-011 Deliverable 7, a distributed styling asset) and share `styles.css` with other surfaces — additive class additions only, no edits to existing rules.
4. **FOUNDATIONS principles motivating this ticket:** §6.5/§21/§29.8#4 (show segments individually and in order; do not hide from review) — the ordered list satisfies this; §10/§28.1/§29.4 (no accepted prose in prompts) — the view exposes **no** "use as prompt context"/"include last segment" control and never writes to the brief or `/generate`; §25/§26/§29.10 (easy export, not canon) — export-all is a client-side download labeled reading output; §27 (five distinct surfaces) — prose-forward, read-only, no field-editing affordances.
5. **Firewall / side-channel surface (§10/§28.1/§29.4, restated before trusting the spec):** export is the one place accepted prose leaves the app. It must be a client-side download only — never a compiler input "through the app": the export action must not write to the generation brief or call `/generate`, and per the M2 reassessment finding, **export-all serializes the complete archive in `sequence ASC` order independent of the active filter** (the filter narrows only the on-screen reading view). A negative test asserts no prompt-context control exists anywhere in the rendered surface.

## Architecture Check

1. A single self-contained `AcceptedSegmentsView` (fetch-on-mount → local list state; filter/confirm/export are local derivations) is the cleanest reviewable unit for one cohesive reading surface, mirroring `GenerateView`. Filter and export operate on already-fetched data (no server round-trip), keeping the read route (001) a plain list. Delete updates local state on success only.
2. No backwards-compatibility shims. No record-editor affordances are reused or aliased; the surface is read-only by construction (no inputs that mutate records).

## Verification Layers

1. Ordered readable render (segments in `sequence ASC` with a derived 1-based display index, readable `text`, timestamp, and the full metadata panel) -> RTL render assertion in `AcceptedSegmentsView.test.tsx` against a mocked `listAcceptedSegments`.
2. Client-side filter (substring narrows the visible list; clearing restores the full list; no `fetch` fires on filter) -> RTL interaction test + `fetch`-call-count assertion.
3. Delete-with-confirmation (a confirm step precedes `deleteAcceptedSegment`; success removes the row; `not-found`/`no-open-project` surface without removing it) -> RTL test with mocked `deleteAcceptedSegment` success + failure.
4. Export-all (produces Markdown and plain-text containing **every** segment's text in `sequence ASC` even with an active filter; download invoked; no write to brief/`/generate`) -> RTL test stubbing the download (`URL.createObjectURL` / anchor click) and asserting full-archive content.
5. No-prompt-context firewall (no "use as prompt context"/"include in prompt" control exists; no persistent durable-change banner/checklist appears) -> RTL negative assertions (`queryBy…` is null) — FOUNDATIONS §10/§28.1/§29.4 alignment check.

## What to Change

### 1. `AcceptedSegmentsView.tsx` (new)

Fetch via `listAcceptedSegments()` on mount into local state; render states for loading, `ApiFailure` (e.g. `no-open-project`), empty ("no accepted segments yet"), and populated. Populated render: ordered list (`sequence ASC`) with a derived 1-based display index, prose-forward readable `text`, accepted timestamp, and a per-segment metadata panel (model, provider, temperature, max output tokens, optional top-p, template/compiler/contract versions). A controlled text-filter input performs a client-side substring match over `text` + visible metadata. A delete control with a confirm step (confirm dialog or two-step button) calls `deleteAcceptedSegment(id)`; copy states deletion removes readable output only and does **not** repair records. An export-all control serializes the **complete** archive (all segments, `sequence ASC`, regardless of filter) to Markdown and a plain-text variant and triggers a client-side download, labeled reading output. No prompt-context control, no record-edit affordance.

### 2. `styles.css` (modify, additive)

Add classes for the prose-forward list/text, metadata panel, filter input, confirm-delete affordance, and export button, consistent with existing surfaces. No new CSS framework; no edits to existing rules.

### 3. `AcceptedSegmentsView.test.tsx` (new)

Cover the five verification layers above with mocked 002 clients.

## Files to Touch

- `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` (new)
- `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` (new)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Nav promotion and routing into the shell — owned by 004 (this ticket exports the component only).
- Server routes (001) and API clients (002).
- Per-segment / filtered export, EPUB/DOCX, chapter assembly (§ sophisticated publishing pipeline — out).
- In-place editing of accepted text ("the accepted text is the accepted text").
- Any "include last segment in prompt" affordance; any persistent durable-change reminder (Phase 12).
- Dashboard latest-segment surfacing (deferred).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/web -- AcceptedSegmentsView` — renders segments in `sequence ASC` with text + full metadata panel; empty archive shows the empty state; the filter narrows by substring and clearing restores the full list with no `fetch`; delete requires confirmation, removes the row on success, and surfaces `not-found`/`no-open-project` without removing it; export-all produces Markdown + plain-text containing every segment's text (download invoked) even with an active filter; **no** "use as prompt context"/"include in prompt" control and **no** persistent durable-change banner exist (asserted absent).
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green (core untouched; boundary test stays green).

### Invariants

1. The view is read-only: it never writes accepted `text` into the generation brief or calls `/generate`; the only mutation it performs is `deleteAcceptedSegment`.
2. Export-all output contains the full archive in `sequence ASC` order independent of the active filter; the filter affects only the on-screen list.

## Test Plan

### New/Modified Tests

1. `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — render/empty/filter/delete-confirm/export/no-prompt-context cases with mocked `listAcceptedSegments` + `deleteAcceptedSegment`.

### Commands

1. `npm test -w @loom/web -- AcceptedSegmentsView`
2. `npm run typecheck && npm run lint && npm test && npm run build`
