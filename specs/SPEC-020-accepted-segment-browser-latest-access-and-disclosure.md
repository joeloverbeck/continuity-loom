# SPEC-020 — Accepted Segment Browser: Latest-Segment Access and Progressive Disclosure

Status: DRAFT
Phase: post-v1 UX refinement (the v1 implementation order is complete and archived; this spec is not gated by an implementation-order phase)
Depends on: SPEC-011 (Accepted Segment Archive and Browser, COMPLETED — `archive/specs/SPEC-011-accepted-segment-archive-and-browser.md`)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md` §6.5 / §21 (ordered readable archive, segments visible individually and in order), §27 (UI/workflow principles, dangerous actions hard to do accidentally, five surfaces distinct), §29.8 (accepted prose archive hard fails), §10 / §28.1 (no accepted prose in prompts — engaged by exclusion only)
Supporting authorities: `archive/specs/SPEC-011-accepted-segment-archive-and-browser.md` (provenance for the browser's settled contract: read-only, `sequence ASC`, prose-forward, delete-with-confirmation, export-all, no prompt-context affordance), `docs/user-guide.md` (user-facing workflow description to update on completion)

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse.

## Brainstorm Context

- **Original request:** The `/accepted-segments` page renders 23 accepted segments on a
  very vertically-long page. The user virtually always wants to check the **last**
  segment but must scroll the entire archive to reach it, and the page will take longer
  to traverse as the story grows. Analyze the situation, research web design/usability
  and similar implementations, and create a spec improving this in alignment with
  `docs/**`.
- **Observed live (Puppeteer against the dev server, project
  `/home/joeloverbeck/stories/red-bunny`, 2026-06-10):** 23 segments render as one
  `<ol>`; total page height **55,566 px** (~93 screens at a 600 px viewport, ~60 at
  900 px); the page loads at `scrollY 0`; the latest segment's top offset is
  **~53,509 px** — the dominant task (check the latest segment) costs a full-archive
  scroll every visit. Individual segments measured 1,900–3,700 px tall.
- **Premise verification (code, read directly):**
  - `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` renders all segments
    at once: `sortSegments()` orders `sequence ASC` (line 233), `filteredSegments.map`
    renders every item into `<ol className="acceptedSegmentList">` (lines 135–152). No
    pagination, no disclosure, no anchors, no scroll management.
  - Each `AcceptedSegmentItem` (lines 159–206) always renders full prose
    (`<pre className="acceptedSegmentText">`, line 187), the metadata panel, and the
    Delete button in the always-visible header (line 182).
  - **Existing display-index instability:** `displayIndex={index + 1}` is computed from
    the **filtered** array (line 141), so an active filter renumbers visible segments
    ("Segment 14" can display as "Segment 1"). Stable summary labels and anchors
    require deriving the display index from the full sorted list instead; this spec
    corrects that as a direct consequence of its labeling/anchoring design.
  - `GET /api/accepted-segments` returns the full archive with no query params
    (`packages/server/src/accepted-routes.ts:45–52`); this spec needs **no server
    change** — the client already holds all segments.
  - Styling is plain CSS in `packages/web/src/styles.css`; routing is React Router v7;
    component tests live in
    `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`.
- **External research consulted (summary):** NN/g guidance holds that linear narrative
  content should not be paginated and that infinite scroll and virtualization are wrong
  for long variable-height prose; accordions/progressive disclosure fit when users need
  only a few items per visit (true here: the latest segment); "back to top" is
  recommended for pages over ~4 screens; in-page anchor links and focus-moving jump
  controls are the standard navigation aids (WAI-ARIA APG accordion/disclosure pattern
  for accessibility). Comparable products converge on the same shape: chat UIs keep
  oldest-first order but anchor the viewport at the latest entry; AO3/Royal Road keep
  chronological chapter order with a "latest/continue" affordance layered on top;
  changelogs use newest-first only because entries are independent — story segments are
  not, so **reading order stays oldest-first** and the access problem is solved with
  anchoring and disclosure, not reordering.
- **Scope decisions:**
  - **No reordering.** `sequence ASC` story order is settled (SPEC-011) and correct for
    serialized prose; reverse-chronological display is rejected.
  - **No pagination / infinite scroll / virtualization / server query params.** Wrong
    tools for linear prose at this scale; the full-fetch contract stays.
  - **Collapsed-by-default disclosure + latest expanded + land-on-latest** is the
    chosen approach (navigation aids alone were considered as a smaller alternative but
    leave a 55k px page that keeps growing; disclosure also cuts render weight).
  - **Delete moves inside the expanded segment view** — a dangerous action leaves the
    always-visible summary row (FOUNDATIONS §27: dangerous actions hard to do
    accidentally).
  - **Expansion state is ephemeral UI state** — never persisted to the project store;
    no schema or storage change.
- **Assumptions carried (detail-level, correct if not flagged):**
  - "Latest" means the segment with the highest `sequence` in the fetched list.
  - Excerpt length/derivation (single truncated line from the start of `text`) is
    presentation detail left to the implementer within the determinism constraint
    below.
  - Exact placement/visual treatment of "Jump to latest" / "Back to top" is implementer
    detail within the stated accessibility constraints.
- **Final confidence:** ~93%. The problem is reproduced and measured; the approach
  space is well-researched and converges; remaining unknowns are presentation details
  that do not change the deliverable's shape.

---

## Problem Statement

The accepted-segment browser (SPEC-011) renders the entire archive — every segment's
full prose, metadata panel, and delete affordance — into one column in `sequence ASC`
order, landing the user at the top. With 23 segments the page is already ~55,000 px
tall, and the archive is append-only: every accepted segment makes the page longer.

The dominant task on this page is **reviewing the most recent segment** (the user's own
report, consistent with the post-acceptance workflow in FOUNDATIONS §3 step 15–17:
accept, review, update records). That task currently costs a full-archive scroll on
every visit, and the cost grows linearly with story length. Secondary tasks — reading
the story in order, re-finding an older segment, filtering, deleting, exporting — must
remain first-class: FOUNDATIONS §21 requires the user to be able to see accepted
segments "individually and in order," and §29.8 hard-fails hiding accepted segments
from review.

Two structural side-issues compound the problem:

1. **Unstable segment numbering under filter.** `displayIndex` derives from the
   filtered array, so filtering renumbers segments — labels are not stable identities,
   which also blocks any anchor/deep-link design.
2. **Dangerous action always exposed.** Every segment's Delete button is permanently
   visible in a 55k px scroll run — easy to hit while scrolling on touch devices, in
   tension with §27's "make dangerous actions hard to do accidentally."

The fix must operate entirely at the browser presentation layer: the archive's settled
contract (read-only, `sequence ASC` storage order, full-archive export independent of
view state, delete-with-confirmation, no prompt-context affordance, no accepted prose
in prompts) is not in question.

## Approach

Keep the archive a **single ordered page** in story order, but make the latest segment
the landing point and collapse the rest behind accessible per-segment disclosure.
Web-only change (`@loom/web`); no server, schema, or `@loom/core` change.

Rejected alternatives, for the record: **reverse-chronological order** (breaks
serialized reading order; appropriate only for independent entries like changelogs);
**pagination / one-segment-at-a-time reader** (fragments linear prose, adds navigation
burden, more build than the problem warrants); **infinite scroll** (hostile to
re-finding, footer access, and completeness perception); **list virtualization**
(unjustified at this scale, hostile to variable-height prose, find-in-page, and native
anchors). Collapsed-by-default disclosure already removes most DOM/paint weight, which
is the only real performance concern on the horizon.

### Structure of the redesigned browser

1. **Order unchanged.** Segments render in `sequence ASC` (story order), one list, all
   segments always present in the list.
2. **Collapsed-by-default segment rows.** Each segment renders as a disclosure unit:
   - **Summary row (always visible):** stable display index ("Segment N"), accepted
     timestamp, and a deterministic one-line excerpt of the prose (derived from the
     start of `text`, CSS-truncated; pure presentation, no stored derivative). The
     summary row is the disclosure trigger.
   - **Expanded content:** the full prose, the metadata panel, and the delete
     affordance (with its existing two-step confirmation) — delete is reachable only
     when a segment is expanded.
   - **Collapsed rows omit the full prose from the DOM.** A collapsed segment renders
     only its summary row; the full `<pre>` prose, metadata panel, and delete
     affordance mount only on expansion. This is the contract that delivers the
     render-weight win motivating disclosure, and it is why in-page find needs "Expand
     all" (§5). `content-visibility: auto` is therefore not a substitute for collapse
     and native `<details>` find-in-page auto-reveal is not relied upon; the chosen
     primitive must keep collapsed prose out of the document.
   - The **latest segment defaults to expanded**; all others default collapsed.
   - Disclosure must follow the WAI-ARIA disclosure/accordion contract: the trigger is
     a real `<button>` (or `<summary>`) inside the segment heading, with
     `aria-expanded` state, keyboard operable, in normal tab order. Native
     `<details>/<summary>` is acceptable if expansion can still be controlled
     programmatically (expand all / filter override / deep link).
3. **Land on the latest segment.** On view mount with no segment hash in the URL, the
   browser scrolls the latest segment into view and moves focus to its heading/trigger
   (`tabindex="-1"` + programmatic focus so keyboard and screen-reader users land
   there too). Respect `prefers-reduced-motion` (instant jump, no smooth scroll).
4. **Stable identity and deep links.** Each segment element carries
   `id="segment-<sequence>"` (the immutable stored sequence, not the display index).
   Navigating to `/accepted-segments#segment-<sequence>` expands that segment,
   scrolls to it, and focuses it — taking precedence over the land-on-latest default.
   Hash resolution runs on every hash change, not only first mount: the view stays
   mounted across same-route hash navigation (React Router v7 does not remount), so an
   in-app anchor click or browser back/forward between `#segment-<N>` targets must
   re-resolve.
5. **Bulk disclosure controls.** "Expand all" / "Collapse all" controls in the archive
   toolbar restore whole-story reading and in-page find (Ctrl+F) over the full prose
   (collapsed rows hold no prose in the DOM per §2, so find-in-page only sees expanded
   segments — "Expand all" is the deliberate find-in-page path).
6. **Navigation aids.** A "Jump to latest" control and a "Back to top" control,
   available once the list is taller than the viewport (e.g. floating/sticky,
   appearing after scroll). Both move **focus** to their target, not just the
   viewport.
7. **Stable display index.** "Segment N" derives from the segment's position in the
   **full** sorted list, independent of the active filter — fixing the existing
   renumbering quirk. (The stored `sequence` remains visible in the metadata panel as
   today; the display index remains a derived presentation value per SPEC-011.)
8. **Filter interplay.** The filter continues to match against the full searchable
   text + metadata (unchanged semantics, client-side, no server round-trip). Because
   collapsed rows show only an excerpt, a segment matched by an active filter renders
   **expanded** while the filter is active (a forced-open override — otherwise matches
   are invisible and the filter looks broken); clearing the filter restores the user's
   tracked per-segment expansion state. Display indices do not renumber under filter.
9. **Everything else unchanged.** Export-all (Markdown/text) continues to serialize
   the **complete archive in `sequence ASC` order regardless of filter or expansion
   state**; the read-only contract, the "readable output, not canon" notice, the empty
   state, and the absence of any prompt-context affordance are untouched.

## Deliverables

1. **Disclosure-based segment list (web).**
   - Rework `AcceptedSegmentItem` in
     `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` into an accessible
     disclosure unit: always-visible summary row (stable display index, timestamp,
     deterministic one-line excerpt; trigger with `aria-expanded`), expanded content
     carrying full prose, metadata panel, and the existing delete-with-confirmation
     flow. Latest segment defaults open; others closed. Expansion state lives in
     component state keyed by segment `id` — never persisted.
2. **Land-on-latest + deep links (web).**
   - On mount without a `#segment-<sequence>` hash: scroll latest segment into view
     and focus its heading/trigger; honor `prefers-reduced-motion`.
   - Each segment carries `id="segment-<sequence>"`; an incoming hash expands,
     scrolls to, and focuses that segment instead of the latest. Unknown/missing hash
     targets fall back to the latest-segment behavior without error.
   - Hash resolution reacts to `location.hash` changes, not only initial mount (e.g. a
     `hashchange` listener or a `useLocation()` hash dependency): under React Router v7
     the view is not remounted when only the hash changes on the same route, so
     same-route deep-link navigation re-applies the expand/scroll/focus effect and the
     stale-hash fallback on each resolution.
3. **Toolbar and navigation controls (web).**
   - "Expand all" / "Collapse all" in the archive toolbar.
   - "Jump to latest" and "Back to top" controls with focus management and accessible
     names; visible only when useful (list taller than viewport / scrolled away).
4. **Stable display index + filter override (web).**
   - Display index computed from the full sorted list (filter-independent).
   - This aligns the on-screen "Segment N" with the export labeling, which already
     numbers from the full sorted list (`AcceptedSegmentsView.tsx` `markdownArchive` /
     `textArchive`, the `Segment ${index + 1}` lines); today the on-screen label and
     the exported label can diverge under an active filter, and this fix removes that
     divergence.
   - Filter-matched segments render expanded while a filter is active; clearing the
     filter restores tracked expansion state.
5. **Styling (web).**
   - Plain-CSS additions in `packages/web/src/styles.css` for summary rows, excerpt
     truncation, disclosure states, and floating navigation controls, consistent with
     existing surfaces; no new CSS framework or dependency. (Because collapsed rows
     omit their prose from the DOM entirely — Deliverable 1 / Approach §2 — a
     `content-visibility: auto` hint is not a collapse substitute; it is permitted only
     as a pure CSS aid on expanded-but-offscreen items, and may be dropped.)
6. **Tests (web).**
   - Update/extend `AcceptedSegmentsView.test.tsx`:
     - default state: latest segment expanded, all others collapsed, every segment's
       summary row present in `sequence ASC` order;
     - land-on-latest focuses the latest segment's heading; a `#segment-<sequence>`
       hash expands/focuses that segment instead; unknown hash falls back to latest;
     - disclosure trigger toggles `aria-expanded` and content visibility by keyboard;
     - a collapsed row renders its summary excerpt but its full
       `<pre className="acceptedSegmentText">` prose is absent from the document (pins
       the render-weight contract in Approach §2); expanding re-inserts it;
     - expand all / collapse all affect every segment;
     - delete affordance is absent from collapsed rows and present (with the existing
       confirmation flow, which still works) when expanded;
     - display index is stable under an active filter (no renumbering), the on-screen
       "Segment N" equals the export label for the same segment while a filter is
       active, and filter-matched segments render expanded; clearing the filter
       restores prior expansion state;
     - **regressions retained from SPEC-011:** export-all emits every segment in
       `sequence ASC` order even with an active filter *and* with all segments
       collapsed; no "use as prompt context" / "include in prompt" control exists;
       empty state renders; no persistent durable-change banner is introduced.
   - **Test environment:** jsdom does not implement `window.matchMedia` (calling it
     throws) or a real `Element.prototype.scrollIntoView` (no-op), both of which the
     land-on-latest / `prefers-reduced-motion` paths touch. The suite stubs both in
     setup and asserts landing and deep-link targeting via `document.activeElement`,
     mirroring how the existing export test stubs `Blob` / `URL`.
7. **Doc updates on completion** (by the implementer when Verification passes):
   - `docs/user-guide.md`: refresh the accepted-segments section (landing on latest,
     expanding older segments, expand-all for full reading, jump controls).
   - Archive this spec per `docs/archival-workflow.md` once complete.

No `@loom/server` change, no `@loom/core` change, no schema/storage change, no new
dependency.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §6.5 / §21 / §29.8 #4 — ordered readable archive; segments visible individually and in order; do not hide segments from review | aligns | Every segment remains permanently listed in `sequence ASC` with a visible identity row; disclosure is user-controlled (one interaction to read any segment, expand-all for the whole story, deep links per segment), and the dominant review target — the latest segment — becomes *more* visible, not less @ browser list. |
| §27 — five surfaces distinct; dangerous actions hard to do accidentally; accepted segment browsing as reading/review affordance | aligns | The browser stays a read-only "archive of cloth" (no editing affordance added); moving Delete inside the expanded view takes a destructive control out of the 55k px always-visible scroll run while keeping it one disclosure away @ segment item. |
| §10 / §28.1 / §29.4 — no accepted prose in prompts | aligns | Presentation-only change; no prompt-context affordance is added, the compiler input path is untouched, and the existing no-prompt-context regression test is retained @ browser (compiler unchanged). |
| §21 — accepted segment metadata visible; "the accepted text is the accepted text" | aligns | The metadata panel and full prose render unchanged inside the expanded view; the excerpt is a derived presentation value, never stored, never an edited variant of the text @ segment item. |
| §4.10 / §24 / §29.10 — local-first; export/backup not made harder | aligns | Export-all still serializes the complete archive in order regardless of filter/expansion state (test-pinned); no network, storage, or server change; UI state is ephemeral @ export + storage (untouched). |
| §4.4 / §8 — deterministic compilation | N/A | No compiler, validation, schema, or prompt surface is touched; the change is confined to `@loom/web` presentation. |

§29 hard-fail clearance: no hard-fail is answered "yes." Segments are **not** hidden
from review (§29.8 #4) — collapse is user-controlled progressive disclosure with every
segment individually listed, expandable in one interaction, bulk-expandable, and
deep-linkable; nothing is paginated away or virtualized out of the DOM list. Accepted
segments remain unused as prompt context (§29.8 #2), no edited-flag is introduced
(§29.8 #3), rejected candidates remain unstored (§29.8 #1), and the post-acceptance
reminder path is untouched (§29.8 #5). Export remains easy (§29.10); no logging,
secrets, or prompt-audit surface is involved (§29.9).

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all green (no
  `@loom/core` change, so the import-boundary test stays green by construction).
- Component tests in Deliverable 6 pass, including the retained SPEC-011 regressions
  (export-all completeness under filter and collapse; no prompt-context control).
- **Manual smoke (dev server + a project with ≥3 accepted segments, e.g. the repro
  project):** open `/accepted-segments` — the view lands on the latest segment,
  expanded and focused, without scrolling through the archive; older segments show as
  summary rows; expanding one shows full prose + metadata + delete; "Expand all" then
  Ctrl+F finds prose in an older segment; "Back to top" and "Jump to latest" move both
  viewport and focus; visiting `/accepted-segments#segment-<sequence>` of an older
  segment lands there expanded; filtering shows matched segments expanded with stable
  "Segment N" numbering; export with a filter active and everything collapsed still
  downloads the full archive; delete still requires expansion plus the two-step
  confirmation.

## Out of Scope

- **Pagination, infinite scroll, "load more", or list virtualization** — rejected for
  linear prose (see Approach); the full-fetch, full-list contract stays.
- **Reverse-chronological display or any reordering control** — story order is the
  reading order; "latest" access is solved by anchoring, not reordering.
- **Server/API changes** — no query params (`limit`/`offset`/`order`), no new
  endpoints; `GET /api/accepted-segments` is untouched.
- **Persisting UI state** (expansion, scroll position) to the project store or
  anywhere on disk — expansion state is ephemeral component state.
- **Dashboard latest-segment surfacing** — remains deferred exactly as SPEC-011 left
  it; this spec changes only the `/accepted-segments` view.
- **A separate single-segment "reading mode" / prev-next reader** — possible future
  work if whole-story reading ergonomics ever demand it; not justified now.
- **Any change to export formats, delete semantics, sequence storage, acceptance
  flow, prompt compilation, or validation** — untouched.
- **New dependencies or CSS frameworks** — plain CSS and existing React/React Router
  only.

## Risks & Open Questions

- **Disclosure primitive choice (`<details>/<summary>` vs. controlled
  button-`aria-expanded` component).** Native `<details>` gives keyboard/AT semantics
  for free and (in Chromium) auto-reveals content on find-in-page, but programmatic
  control (expand-all, filter override, hash-driven expansion) requires controlling
  the `open` attribute from React. Either primitive is acceptable; the contract is
  the test suite's: programmatic + keyboard control, `aria-expanded` (or native
  equivalent) state, focusable targets. Implementer's choice, recorded in the ticket.
  Whichever primitive is chosen, collapsed rows must keep the full prose out of the
  DOM (the render-weight contract in Approach §2); native `<details>` find-in-page
  auto-reveal is therefore not relied upon — "Expand all" is the find-in-page path.
- **Excerpt determinism.** The summary excerpt must be a pure function of `text`
  (e.g. first line / first ~160 characters, CSS-truncated) — never an LLM summary,
  never stored, never editable; it is presentation, not a second copy of the prose.
- **Filter-forces-expand could open many segments** for a low-selectivity term. This
  is the honest rendering (the match must be visible to be meaningful) and matches
  the pre-SPEC-020 behavior where all matches showed full prose; "Collapse all"
  remains one click away. Not a blocker.
- **Hash precedence vs. land-on-latest.** A stale bookmarked hash for a deleted
  segment must fall back to land-on-latest silently (no error state) — covered by a
  test.
- **Scroll restoration interplay with React Router.** The view manages its own
  landing scroll on mount; if router-level scroll restoration is ever added globally,
  this view's hash/latest anchoring must keep precedence. Note for the implementer;
  no router change is in scope.
- **Display-index stability fix changes filtered labels** (filtered views previously
  renumbered from 1). This is a deliberate correction, surfaced during brainstorm,
  required by stable anchors/labels; the old behavior is not preserved behind a flag.
