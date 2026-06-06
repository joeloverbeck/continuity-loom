# SPEC014POLREGHAR-004: Dense-record RecordBrowser test

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends `packages/web/src/records/RecordBrowser.test.tsx`; no production component changes (virtualization is deferred-unless-triggered, see Out of Scope).
**Deps**: None

## Problem

`RecordBrowser` already memoizes filtering/grouping (`useMemo` at `packages/web/src/records/RecordBrowser.tsx:141-143`) and renders through `@tanstack/react-table` (`useReactTable`, line 155), but its only test exercises ~4 records. There is no coverage proving the browser stays **correct** (filter/search/group produce the right subset) and **usable** (renders without error) under a dense project (~500–1000 records). SPEC-014 D4 adds that smoke so a regression that breaks dense-dataset filtering or throws on large inputs is caught; virtualization/pagination is introduced only if this test surfaces a real problem.

## Assumption Reassessment (2026-06-06)

1. `packages/web/src/records/RecordBrowser.tsx` consumes `records`, `filters`, and `workingSetIds`; line 141 builds `new Set(workingSetIds)`, line 142 memoizes `filterLocally(records, filters, workingSetIdSet)`, line 143 memoizes `groupedRecords`, and line 155 builds the table via `useReactTable`. Imports `useEffect, useMemo, useState` (line 8) and `@tanstack/react-table` (line 7). The filtering/grouping path is internal (`filterLocally` + the `groupedRecords` memo), so correctness is best asserted through the rendered component, not an unexported helper.
2. `packages/web/src/records/RecordBrowser.test.tsx` exists and renders the component with a small fixture; this ticket **extends** that file's existing render harness rather than inventing a new one (mandatory pre-impl check: mirror the existing test's render/query setup and prop shape).
3. Cross-artifact boundary under audit: the test asserts the `RecordBrowser` component contract (props → rendered rows/group headers) under dense input. No shared schema or cross-package boundary is touched — this is a `@loom/web` component test.
4. No mismatch: the memoization lines (141–143), TanStack import (7), and the existence of `RecordBrowser.test.tsx` were confirmed against the working tree on 2026-06-06.

## Architecture Check

1. A test-first dense smoke (correctness + no-throw) is the right next step per SPEC-014 §Approach #3: it validates the existing memoized/TanStack approach holds at scale before spending complexity on virtualization. Synthesizing records programmatically (a deterministic generator) keeps the fixture maintainable and lets the count be tuned without hand-authoring.
2. No backwards-compatibility shims: the test extends the existing harness; it introduces no alternate browser component or feature flag.

## Verification Layers

1. Filter correctness under density → render with ~500–1000 synthetic records, apply a filter whose matching subset is known by construction, assert the visible/queried rows equal that subset — test assertion.
2. Search + grouping correctness → a search term and a grouping selection each yield the by-construction-expected rows/group buckets — test assertion (distinct invariants).
3. Usability / no-throw → the dense render completes without throwing and the memoized derivations produce stable output across a re-render with identical props — test assertion (distinct surface).
4. Multi-invariant ticket: correctness and usability are mapped to separate assertions above; single-layer N/A.

## What to Change

### 1. Add a dense-record case to `RecordBrowser.test.tsx`

- Add a deterministic generator that produces ~500–1000 synthetic records spanning multiple record types / filterable attributes (use the same record shape the existing fixture uses; vary fields so a chosen filter and search term have a **known** expected match count).
- Render `RecordBrowser` with the dense set via the existing harness; assert the initial render does not throw.
- Apply a filter with a by-construction-known matching subset; assert the rendered rows equal that subset.
- Apply a search term and a grouping selection; assert the expected rows/group headers appear.
- Re-render with identical props and assert the derived output is stable (memoization holds — no incorrect recompute artifacts).

## Files to Touch

- `packages/web/src/records/RecordBrowser.test.tsx` (modify)

## Out of Scope

- **Virtualization / pagination** in `RecordBrowser.tsx` — added only in a follow-up if this test demonstrates an unacceptable problem (deferred-unless-triggered per SPEC-014).
- A render-time performance budget assertion — correctness + no-throw is the contract for this ticket; a timing budget is a separate follow-up if needed.
- Any change to the production `RecordBrowser` component or its filtering helpers.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx` — the dense-record correctness + usability case and the existing small-fixture cases pass.
2. The filter/search/group assertions fail if the expected-subset construction and the rendered rows disagree — confirming the test verifies correctness, not just absence of a throw.
3. `npm test` — full suite green.

### Invariants

1. Filter, search, and grouping produce the by-construction-correct subset at ~500–1000 records.
2. The dense render completes without throwing and memoized derivations remain stable across identical re-renders.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — dense-dataset correctness + usability smoke (extends existing file).

### Commands

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx`
2. `npm run lint && npm run typecheck && npm test`
3. The single web-test-file run is the correct boundary — the deliverable is one component smoke; `npm test` confirms no cross-package regression.
