# SPEC020ACCSEGBRO-001: Disclosure-based segment list with stable index and filter override

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/web` `AcceptedSegmentsView` component (disclosure state model, render restructure), `packages/web/src/styles.css` (summary-row/disclosure CSS), and its component test; no `@loom/core`/`@loom/server`/schema/storage change
**Deps**: None

## Problem

The accepted-segment browser renders every segment's full prose, metadata panel, and delete affordance into one `sequence ASC` column landing at the top (`packages/web/src/accepted-segments/AcceptedSegmentsView.tsx:135-152`, `159-206`). With a real archive the page grows to tens of thousands of pixels and the always-visible delete buttons sit in a long scroll run (§27 dangerous-actions tension). Two structural quirks compound it: the on-screen display index is derived from the **filtered** array (`displayIndex={index + 1}` at line 141), so filtering renumbers segments and blocks any stable anchor; and the always-open delete control is reachable by accident while scrolling.

This ticket establishes the foundational redesign: each segment becomes an accessible collapsed-by-default disclosure unit with an always-visible summary row, the latest segment defaults open, the display index becomes filter-independent, and an active filter force-expands its matches. SPEC-020 Deliverables D1 + D4 (and the summary-row/disclosure portion of D5).

## Assumption Reassessment (2026-06-10)

1. Current code checked: `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` renders all `filteredSegments` into `<ol className="acceptedSegmentList">` (lines 135-152); `AcceptedSegmentItem` (lines 159-206) always renders `<pre className="acceptedSegmentText">` (line 187), the `acceptedMetadataPanel` (line 189), and the Delete button inside the always-visible `acceptedSegmentHeader` (line 182). `displayIndex` is the filtered map index (line 141). `sortSegments` orders `sequence ASC` (lines 233-235). `searchableText` (lines 237-254) backs the filter. `displayIndex` has no cross-file consumer (grep: only `AcceptedSegmentsView.tsx`).
2. Current specs/docs checked: `specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` §Approach (Structure §1-§2, §7-§8), Deliverables D1 + D4; `docs/FOUNDATIONS.md` §21 (see segments individually and in order), §29.8 (#4 do not hide segments from review), §27 (dangerous actions hard to do accidentally). The excerpt is reconfirmed as a pure presentation value (SPEC-020 §Risks "Excerpt determinism"), never stored.
3. Shared boundary under audit: the single React component file and its component test — this ticket owns the new per-segment expansion state model that SPEC020ACCSEGBRO-002 and -003 build on. The state shape (a per-`id` expansion record + latest-default + filter-override) is the contract those tickets consume.
4. FOUNDATIONS principle restated before trusting the spec narrative: §21 requires the user to see accepted segments "individually and in order"; §29.8 #4 hard-fails hiding segments from review. Collapse must therefore keep every segment individually listed in `sequence ASC` with a visible identity/summary row and one-interaction expansion — not paginate, virtualize, or drop any segment from the list. §27 motivates moving Delete behind expansion.
5. Adjacent contradiction classified: the filtered-array display-index renumbering (line 141) is a pre-existing quirk. It is a **required consequence** of this ticket — stable summary labels and the §002 anchors require deriving the index from the full sorted list — not a separate bug deferred elsewhere. The old renumber-from-1-under-filter behavior is intentionally removed (no compatibility flag), per SPEC-020 §Risks final bullet.
6. Mismatch + correction: none — every referenced symbol, line, and CSS class resolved against the current tree during the in-session `/reassess-spec` and this decomposition's spot-check.

## Architecture Check

1. A per-`id` expansion record in component state (e.g. `Record<number, boolean>` keyed by `segment.id`, default-derived as `id === latestId`) is cleaner than a `<details>`-only DOM approach because §002 needs programmatic expansion (deep-link, land-on-latest) and this ticket needs filter-forced expansion plus restore-on-clear — all of which require React to own the open state. The disclosure trigger remains a real `<button>` with `aria-expanded` (or a `<details>/<summary>` whose `open` is React-controlled), keeping the WAI-ARIA contract. Collapsed rows conditionally render only the summary, so the full `<pre>` is absent from the DOM (the render-weight contract, SPEC-020 §Approach §2) rather than merely visually hidden.
2. No backwards-compatibility aliasing or shims: expansion state is ephemeral component state, never persisted to the project store; the prior renumber-under-filter behavior is replaced outright, not kept behind a flag.

## Verification Layers

1. Every segment individually listed in order (§21 / §29.8 #4) -> component test: all summary rows present in `sequence ASC`, none dropped when collapsed.
2. Collapsed rows omit prose from the DOM (render-weight contract) -> component test: a collapsed row's full `<pre className="acceptedSegmentText">` text is absent from the document; expanding re-inserts it.
3. Delete reachable only when expanded (§27) -> component test: Delete button absent from a collapsed row, present (with the existing two-step confirm, still working) when expanded.
4. Display index filter-independent and equal to the export label (D4) -> component test: under an active filter, on-screen "Segment N" does not renumber and equals the export label for the same segment.
5. Excerpt is a pure function of `text`, never stored / never prompt-bound (§10) -> manual review + grep-proof: excerpt derives from `segment.text` in render only; no new storage/API call, no prompt-context affordance added.

## What to Change

### 1. Per-segment disclosure unit (`AcceptedSegmentItem`)

Restructure into an always-visible summary row plus expansion-gated content. Summary row: the disclosure trigger (a `<button>` carrying `aria-expanded`, keyboard-operable, in tab order, inside the heading) showing the stable display index ("Segment N"), the accepted timestamp, and a deterministic one-line excerpt derived from the start of `segment.text` (CSS-truncated; pure presentation, no stored derivative). Expansion-gated content (rendered only when expanded): the full `<pre className="acceptedSegmentText">`, the `acceptedMetadataPanel` (`MetadataGrid`), and the existing delete affordance with its two-step `acceptedDeleteConfirm` flow. When collapsed, none of the prose/metadata/delete DOM is rendered.

### 2. Expansion state model (`AcceptedSegmentsView`)

Add component state tracking per-`id` expansion, defaulting the latest segment (highest `sequence` — last element of the `sortSegments` result) to expanded and all others collapsed. Pass each segment its expanded flag and a toggle handler. State is keyed by `segment.id` and is never persisted. Keep `confirmingId`/delete wiring intact (delete only surfaces inside expanded content now).

### 3. Stable display index (D4)

Derive "Segment N" from each segment's position in the **full** sorted list (`state.segments`), not the filtered array — build an `id → displayIndex` lookup from the full sorted segments and pass the looked-up value into each `AcceptedSegmentItem`. This makes the on-screen label match the export labeling (`markdownArchive`/`textArchive` already number from the full sorted list at `AcceptedSegmentsView.tsx:277,295`) and removes the renumber-under-filter quirk. The stored `sequence` stays visible in the metadata grid.

### 4. Filter-forces-expand override (D4)

While a filter term is active, render each filter-matched segment expanded (a forced-open override, so matches are not hidden behind a collapsed excerpt). Track the user's explicit expansion choices separately so that clearing the filter restores the tracked per-segment state (latest-open default unless the user changed it). Display indices do not renumber under filter (per change 3).

### 5. Summary-row / disclosure CSS (`styles.css`, part of D5)

Add plain-CSS for the summary row layout, the one-line excerpt truncation (ellipsis / single-line clamp), and the disclosure open/closed affordance, consistent with the existing `acceptedSegment*` rules (around `styles.css:1113-1159`). No new framework or dependency.

## Files to Touch

- `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` (modify)
- `packages/web/src/styles.css` (modify)
- `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` (modify)

## Out of Scope

- Land-on-latest scroll/focus and `#segment-<sequence>` deep links — SPEC020ACCSEGBRO-002.
- Expand all / Collapse all and Jump-to-latest / Back-to-top controls — SPEC020ACCSEGBRO-003.
- User-guide refresh, the verification gate, and spec archival — SPEC020ACCSEGBRO-004.
- Pagination, infinite scroll, virtualization, reverse-chronological order, server/API query params, persisting UI state — rejected in SPEC-020 §Out of Scope.
- Any change to export formats, delete semantics, sequence storage, prompt compilation, or validation.

## Acceptance Criteria

### Tests That Must Pass

1. Default state: with ≥3 segments the latest (highest `sequence`) renders expanded (full prose visible) and all others render collapsed, with every segment's summary row present in `sequence ASC` order.
2. A collapsed row shows its summary excerpt but its full `<pre className="acceptedSegmentText">` prose is absent from the document; toggling the trigger (mouse and keyboard) flips `aria-expanded` and reveals/hides the prose.
3. The Delete button is absent from a collapsed row and present when expanded; the existing two-step confirmation still deletes the segment and removes its row.
4. Under an active filter, on-screen "Segment N" does not renumber and equals the export label for the same segment; filter-matched segments render expanded; clearing the filter restores the prior per-segment expansion state.
5. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` passes (incl. the retained SPEC-011 regressions in that file).

### Invariants

1. Every accepted segment is individually listed in `sequence ASC` with a visible summary row — nothing is paginated away or removed from the DOM list (§21 / §29.8 #4).
2. Expansion state is ephemeral component state keyed by `segment.id`; it is never written to the project store or any disk surface, and the summary excerpt is never stored nor routed to any prompt-context surface (§10).

## Test Plan

### New/Modified Tests

1. `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — add cases for default latest-expanded / others-collapsed, collapsed-omits-prose-from-DOM, keyboard toggle of `aria-expanded`, delete-absent-when-collapsed, and stable-index-equals-export-label under filter with restore-on-clear; keep the existing sequence-order, empty-state, delete-confirmation, export-under-filter, and no-prompt-context regression cases green.

### Commands

1. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. The targeted vitest run is the correct inner boundary (the change is confined to one `@loom/web` component + its CSS); the full four-command gate is the outer boundary SPEC-020 §Verification requires.
