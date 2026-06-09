# SPEC-016 — Records Grid Per-Type Columns and Presentation

**Status:** DRAFT
**Feature name:** Per-Type Records Grid
**Classification:** product-behavior (UI/workflow over the *All story records* surface, §6.1; read-only display projection over the record metadata layer)
**Governing authority:** `docs/FOUNDATIONS.md`
**Supporting authorities:** `docs/story-record-schema.md`, `docs/ACTIVE-DOCS.md`, `docs/user-guide.md`

> Section style note: this spec uses the canonical `specs/` section set parsed by `reassess-spec` and `spec-to-tickets` (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions). The numbered "evidence ledger" house style of the archived external-workflow specs (`archive/specs/SPEC-0NN-*`) is intentionally **not** mirrored — that style is an artifact of an external spec generator, not the convention for brainstorm-authored specs.

---

## Brainstorm Context

**Original request.** While browsing `/records` (project `/home/joeloverbeck/stories/red-bunny`), the user reported three problems with the records grid: (1) the "All types" view mixes every type and "messes up the formatting of the columns", and showing all types at once is "basically useless"; (2) the grid always shows standard columns like `salience` and `urgency` even for the many types that have neither; (3) for records like `EMOTION`, the most important field (its label/description) renders as a "big block of text awkwardly sandwiched in its column". The user asked for in-depth web-design/usability research and a spec aligned with `docs/**`, amending a foundational principle if one is contradicted.

**Defect reproduced live** (Puppeteer, against the named project — the project was opened read-only via the standard Open Project flow):
- All record types render through **one fixed 7-column set** regardless of type.
- Filtering to `EMOTION` shows empty `Salience` and `Urgency` columns (EMOTION has neither) while hiding the fields that actually matter for it (`affect_kind`, `intensity`, `holder`).
- The `EMOTION` label cell renders the 80-char prose snippet as a tall, narrow block.
- The right-hand detail pane squeezes the table so the rightmost columns (`Salience`/`Urgency`/`Archived`) clip off-screen.

**Premise verification (`file:line`, verified against the working tree at spec authoring):**
- Fixed column set for all types: `packages/web/src/records/RecordBrowser.tsx:22–33` (`type`, `displayLabel`, `status`, `salience`, `urgency`, `archived`).
- Label cell has no width cap / line-clamp / truncation: `RecordBrowser.tsx:432–441`; CSS `.recordTable th,td` (`vertical-align: top`, no overflow control) and `.linkButton` in `packages/web/src/styles.css:480–506`.
- Type filter offers `"All types"` (empty value) + every `recordTypes` value, and changing it does not change columns: `RecordBrowser.tsx:325–338`.
- A per-type field-presence helper already exists and is reusable for column selection: `descriptorHasField(...)` `RecordBrowser.tsx:35–37`, backed by `getEditorDescriptor` from `@loom/core`.
- Working-set toggle is a hardcoded leading column, independent of the data columns: `RecordBrowser.tsx:415, 427–431`.
- The list endpoint **already loads each record's full payload** then discards all but metadata: `repo.listRecords(...).map(metadata)` in `packages/server/src/record-routes.ts:135` with the projection `metadata(...)` at `record-routes.ts:59–72`; `listRecords` maps rows through `getRecord` (full payload) at `packages/server/src/record-repository.ts:306–317`. → Type-specific columns require **no extra queries**, only a wider projection.
- Current summary metadata shape (the only fields the grid can read today): `packages/core/src/records/metadata.ts:3–16` (`id, type, displayLabel, status?, salience?, urgency?, createdAt, updatedAt, archived, userOrder?`).
- Primary-label derivation already picks the right "most important" field per type: `deriveDisplayLabel` / `deriveFullDisplayLabel` `packages/core/src/records/editor-descriptors.ts:167–181`, keyed by `labelFieldsByType`.
- Cross-type search already matches payload JSON (so full-store search survives type scoping): `textMatches(...)` `record-routes.ts:82–89`.
- Grid layout that causes clipping: `.browserLayout` grid + `.recordTable { width: 100% }` (`styles.css:373–377, 474–478`); no horizontal scroll container.
- The 18 record types and their fields are authoritative in `docs/story-record-schema.md` and `packages/core/src/records/{entity,cast-member,knowledge,space-material,causal-pressure,relationship-emotion}.ts`.

**Scope decisions settled with the user during brainstorm:**
1. **"All types" handling → Option B.** On load the grid opens on a sensible *default type* (most-populated; URL `type` param overrides). "All types" remains reachable as an explicit choice but renders only a minimal shared column set — never the union. (Rejected: A = keep "All types" as default; C = eliminate "All types" entirely, which adds §6.1 tension.)
2. **Column configuration → fixed manifest in `@loom/core`.** A deterministic, testable per-type column registry; no user-facing add/hide/reorder/saved-views UI (YAGNI for a single-user local tool).
3. **Column richness → rich (type-specific scalar/enum columns).** Extend the summary projection to carry a few type-relevant scalar/enum fields per type. Reference fields (UUID holders/targets) are deferred to avoid name-resolution scope.

**Final confidence:** ~95%. Remaining gaps are detail-level (exact per-type column lists, exact widths) and carried as the manifest below + named assumptions.

---

## Problem Statement

The `/records` grid uses a single fixed column set (`type, label, status, salience, urgency, archived`) for all 18 record types. This produces three defects:

1. **Meaningless union / default.** The default "All types" view mixes heterogeneous types under one column set. Industry practice (Notion, Airtable, Linear, Jira) and design guidance (NN/G, Shopify Polaris, IBM Carbon) is to scope columns to a type/view and avoid a union grid; a union grid guarantees many irrelevant cells.
2. **Irrelevant columns.** Only 4 types carry `urgency` and 5 carry `salience`; the rest render those columns empty. Types that lack them have their genuinely useful fields (e.g. EMOTION `intensity`/`affect_kind`) shown nowhere.
3. **Long primary field rendered as a block.** 12 of 18 types are prose-keyed (their identifying field is a paragraph). With no width cap, line-clamp, or tooltip, the Label cell wraps into a tall, narrow block. The side detail pane further squeezes the table so columns clip.

This is a presentation-layer problem on the **All story records** browsing surface. It does not touch prompt compilation, validation gating, working-set membership semantics, stored record payloads, or OpenRouter behavior.

---

## Approach

Introduce a **deterministic per-type column manifest in `@loom/core`** that, for each record type, declares the ordered set of columns the grid should show. Extend the record-summary projection to carry the type-specific scalar/enum values the manifest references (the payloads are already loaded server-side). Rework `RecordBrowser` to render columns from the manifest for the selected type, default to a sensible type on load, render the union "All types" view with a minimal shared column set, and fix primary-label and layout presentation.

Research-grounded design rules applied (sources: NN/G *Data Tables* & *Empty States*; IBM Carbon *Data table* / *Overflow content* / *Empty states*; Shopify Polaris *Index table*; Material *Data tables*; Pencil&Paper *Enterprise Data Tables*; Airtable views/grouping guidance):
- **Per-type column sets, not the union.** Columns chosen by relevance, primary field first.
- **Never render a column that is null for an entire type.** Individual empty cells render an explicit "—".
- **Primary identifier:** first column, left-aligned, bounded width, wrap + 2-line clamp (not single-line ellipsis — shared leading words collide), clickable link to detail, sticky on horizontal scroll. Native tooltip carries the label text; the detail pane carries the full payload. Truncation is optical (CSS), never trimming the underlying string.
- **Ordinal severity enums** (salience/urgency/intensity) rendered as compact, consistently-styled cells.
- **Default to a scoped, action-sorted view**; back zero-data with a three-part empty state (status + what-goes-here + Create action).

### Architecture

- **`@loom/core` (pure, framework-free):** the column manifest is the single source of truth, consumed by both the server projection (which fields to extract) and the web grid (which columns to render, in what order, with what header/alignment). Keeps the core import-boundary clean (no `react`/`fastify`/`node:*`).
- **`@loom/server`:** the `metadata(...)` projection consults the manifest to extract the declared scalar/enum fields from each already-loaded payload into the summary, in addition to existing metadata.
- **`@loom/web`:** `RecordBrowser` builds its TanStack column list from the manifest for the active type (or the minimal shared set for "All types"), applies the primary-label and layout CSS fixes, and sets the default/empty-state behavior.

### Per-type column manifest (design intent)

Every view keeps the always-present leading **Working Set** toggle column and a **Label** (primary) column. The table below lists the *additional* type-specific columns. Exact payload key names must be taken from the cited record schema files at implementation; the schema-derived intent is:

| Type | Primary label field | Additional columns (scalar/enum) |
|---|---|---|
| ENTITY | `display_name` | entity_kind, roles_in_story |
| ENTITY STATUS | `current_activity` | life, agency, visibility_to_pov |
| CAST MEMBER | `identity.one_line` | — (label only; rich fields are nested/refs, deferred) |
| FACT | `statement` | status, fact_kind, scope, salience, audience_visibility |
| BELIEF | `claim` | status, belief_mode, confidence, salience, visibility |
| SECRET | `secret_claim` | status, secret_kind, salience, audience_visibility, pov_access |
| LOCATION | `label` | status |
| OBJECT | `label` | status, visibility_to_pov, durability |
| VISIBLE AFFORDANCE | `label` | status, risk, durability |
| EVENT | `description` | status, event_kind, current_relevance, pov_visibility |
| INTENTION | `intent` | status, urgency |
| PLAN | `objective` | plan_status, salience, can_drive_prose, visibility_to_pov |
| CLOCK | `title` | status, clock_kind, salience, visibility |
| OBLIGATION | `terms` | status, obligation_kind, urgency, visibility |
| CONSEQUENCE | `current_effect` | status, consequence_kind, urgency, visibility |
| OPEN THREAD | `title` | status, type (thread kind), urgency, current_relevance |
| RELATIONSHIP | `description` | status, axis, value, valence, visibility |
| EMOTION | `description` | status, affect_kind, intensity, visibility |

**"All types" minimal shared columns:** Working Set, Type, Label, Status, Updated. No `salience`/`urgency` (sparse across types). This view exists only for occasional full-store scanning, not as the default.

**Header disambiguation:** the OPEN THREAD `type` payload key (its *thread kind*: question/promise/…) is rendered under a **"Thread kind"** header and its display value reads `payload.type` — this avoids any collision with the record-`type` "Type" column shown in the "All types" minimal set.

### Default view, sorting, and empty state

- On load, resolve the active type as: URL `type` query param if present and valid → else the **most-populated** type among existing records → else fall back to "All types". The type filter is mirrored to the URL `type` search param (the component already uses `useSearchParams`) so the choice is restorable and shareable.
- Default sort within a scoped view (applied when **Group by** is "None"): by the type's severity column (`salience`/`urgency`/`intensity`) descending when it has one, else by `updatedAt` descending. Severity enums must sort by an explicit ordinal (`low < medium < high < critical`; intensity `low < medium < high < extreme`), **not** lexicographically — the existing `groupBy` sort compares the raw enum string with `localeCompare` (`RecordBrowser.tsx:184–188`), which orders alphabetically (`critical/high/low/medium`); the new default sort uses a manifest-provided ordinal instead. (Existing "Group by" controls remain.)
- When the active type has zero records, render a three-part empty state: status line, one sentence on what the type holds, and the matching "Create {TYPE}" action.

### Primary-label and layout fixes

- Label column: bounded width (min ~280px, max ~440px), `display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden`, top-aligned; `title` attribute with the label text; remains the clickable link to detail.
- Wrap the table in a horizontally-scrollable container (`overflow-x: auto`); make the Working Set + Label columns sticky on horizontal scroll; keep the header sticky on vertical scroll.
- Individual empty data cells render "—" rather than blank.

---

## Deliverables

Grouped as reviewable diffs (one ticket per group is the expected decomposition):

1. **Core column manifest.** New `@loom/core` module defining the per-type column registry (primary field + ordered additional columns, each with field key, header, kind/alignment) and the minimal "All types" column set. Pure data + typed accessors; unit-tested for completeness (a manifest entry for every `recordTypes` member) and for referencing only fields that exist on each type's schema.
2. **Summary projection extension.** Extend `RecordMetadata` (`packages/core/src/records/metadata.ts`) and the server `metadata(...)` projection (`packages/server/src/record-routes.ts`) so the summary carries the manifest-declared scalar/enum display values per record as an **optional** `displayValues?: Record<string, string | null>` map. Optionality is deliberate, to bound blast radius: `RecordSummary` is also constructed by `GenerationBriefView`, `StoryConfigEditor`, `WorkingSetView`, and the `*.test.tsx` fixtures, none of which should be forced to populate it. Driven by the manifest; no new DB queries (the payload is already loaded — `record-repository.ts:306–317` maps every row through `getRecord`). Array-valued columns (e.g. ENTITY `roles_in_story`, a `string[]`) are join-formatted to a single string in the projection. Update `RecordSummary`/`RecordDetail` in `packages/web/src/api.ts` accordingly, and populate `displayValues` on the detail/saved-record path too — either emit it from the detail projection, or recompute it from the payload via the `@loom/core` manifest inside `toRecordSummary` (`RecordBrowser.tsx:64`) — so a freshly-saved row is not blank until the next reload.
3. **Grid rendering from the manifest.** Rework `RecordBrowser.tsx` to build its columns from the manifest for the active type, or the minimal shared set for "All types"; render the primary label per the new rules; render "—" for empty cells. Preserve the Working Set toggle column and all existing filters/search/grouping.
4. **Default view, URL sync, empty state.** Default-type resolution on load, `type`↔URL sync, type-scoped default sort, and the three-part empty state.
5. **Presentation/CSS.** Label line-clamp + bounded width, horizontal-scroll container with sticky primary columns and sticky header, in `packages/web/src/styles.css`.
6. **Tests + docs.** Update `RecordBrowser.test.tsx` for per-type columns, the minimal "All types" set, default-type-on-load, and empty state; add the core manifest unit test. Update `docs/user-guide.md` records-browsing description only if it enumerates columns — verified at reassessment that it currently does **not** (no column/grid enumeration), so this is expected to be a no-op.

---

## FOUNDATIONS Alignment

| Principle | Stance | Rationale |
|---|---|---|
| §6.1 All story records | aligns | Every record stays reachable: the union "All types" view remains (minimal columns), per-type views cover all types, and cross-type search (payload-deep, `record-routes.ts:82–89`) is preserved. Default-scoping changes presentation, not completeness. |
| §6.2 / §7 Active working set supremacy | aligns | The Working Set "Selected/Add" toggle column is preserved unchanged in every view; membership semantics are untouched; no record is silently added/removed/reprioritized. |
| §27 UI and workflow principles | aligns | Improves "clear record previews", "visible object/location/entity state", and easier working-set curation; reduces clerical friction without reducing authorial control (§29.11). |
| §29.3 working-set hard fails ("prevent the user from inspecting…?") | aligns | This is the records browser; the detail pane and prompt-preview surfaces are untouched. Nothing that will be compiled becomes less inspectable. |
| §4.4 / §8 Deterministic compilation | N/A (asserted clean) | The manifest and `displayValues` are display-only and never enter prompt compilation; the compiler input is unchanged. The spec forbids feeding any grid-projected value into the compiler. |
| §5 Story-state authority / schema | aligns | `displayValues` is read-only derived projection of existing user-authored payload fields; no new stored state, no mutation, records remain the authority. |

No FOUNDATIONS principle is contradicted, so **no amendment is required**. (Option C — eliminating "All types" — would have created mild §6.1 tension; it was rejected in favor of Option B for this reason.)

---

## Verification

- **Core:** unit test asserts the manifest has an entry for every `recordTypes` member, that each declared field key exists on that type's schema/descriptor, and that the "All types" set is the intended minimal set. Manifest is deterministic (same input → same columns).
- **Projection:** test that `metadata(...)` emits the manifest-declared `displayValues` for representative types (EMOTION → affect_kind/intensity; FACT → fact_kind/scope/salience) and omits/ nulls absent fields, with no additional DB access.
- **Web:** `RecordBrowser.test.tsx` asserts (a) selecting EMOTION shows Affect kind/Intensity and **not** empty Salience/Urgency; (b) "All types" shows only the minimal shared columns; (c) default type on load is the most-populated type (URL param overrides); (d) empty-state renders for a type with no records; (e) Working Set toggle and search/group still work.
- **Manual:** reproduce the original flow against `red-bunny`; confirm EMOTION label is a 2-line clamped, tooltipped, clickable cell; confirm no empty Salience/Urgency columns; confirm no off-screen clipping (horizontal scroll + sticky primary column).
- **Gates:** `npm run lint`, `npm run typecheck`, `npm test` pass; the `@loom/core` import-boundary rule still holds (manifest is framework/platform-free).

---

## Out of Scope

- User-configurable columns, hide/reorder controls, or saved per-type views (explicitly deferred; YAGNI).
- Resolving reference fields (UUID holders/targets) to display names in grid columns (deferred; primary label already names most records).
- Any change to prompt compilation, validation gating, working-set membership rules, stored record payloads/schema semantics, or OpenRouter/secrets behavior.
- Changes to the record **editors** or the detail pane's payload view (the detail pane remains the full-record surface).
- Per-type sorting beyond the single default-sort rule described.

---

## Risks & Open Questions

- **Manifest drift vs. schema.** If a record type gains/loses a field, the manifest can reference a stale key. Mitigation: the core completeness/field-existence test fails closed when a manifest field key is absent from the type's schema.
- **Exact column lists are design intent, not final.** The manifest table above should be confirmed field-by-field against the schema files during implementation; column counts may be trimmed for density (Carbon/NN/G favor fewer, important columns).
- **`displayValues` shape.** Settled: a generic, **optional** `Record<string, string | null>` map keyed by field name, formatted to strings in the projection (array columns join-formatted), keeping the metadata schema stable as the manifest evolves. Populated on both the list projection and the detail/saved-record path (see Deliverable 2).
- **Default = most-populated type** is a deterministic heuristic; "last-used" persistence beyond the URL param is out of scope. Open question only if the user later wants sticky last-used across sessions.
- **Named assumptions:** (1) ordinal severity enums are rendered as plain compact cells, not a new badge component (avoid scope creep) — assuming plain cells; (2) the "Updated" column in the minimal view uses the existing `updatedAt` — assuming a date/relative-time render consistent with the rest of the app.
