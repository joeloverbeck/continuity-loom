# SPEC-017 — Generation Brief Visual Structure and Navigation

**Status:** COMPLETED
**Feature name:** Generation Brief Pre-Flight Console
**Classification:** product-behavior (UI/workflow over the *Generation-time brief* surface, §6.3; presentation-only — no schema, validation, storage, or compiler changes)
**Governing authority:** `docs/FOUNDATIONS.md`
**Supporting authorities:** `docs/story-record-schema.md`, `docs/ACTIVE-DOCS.md`, `docs/user-guide.md`

> Section style note: this spec uses the canonical `specs/` section set parsed by `reassess-spec` and `spec-to-tickets` (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions).

---

## Brainstorm Context

**Original request.** The user reported that on `/generation-brief` "most sections are undifferentiated, so it's easy to lose oneself, look over fields that maybe they should have paid attention to"; the page "is looked over after every generation to change some contents, so it should be as visually pleasant and well structured as possible." The user asked for online usability research and a spec aligned with `docs/**`.

**Defect observed live** (Puppeteer, project `/home/joeloverbeck/stories/red-bunny` opened via the standard Open Project flow, full-page screenshot sweep):
- The page is **~7,900 px tall** (measured at the default 800 px viewport) with **30 fields across 8 form sections** plus the validation panel — roughly seven viewports of undifferentiated scroll.
- Sections are separated only by a hairline top border; headers are same-size all-caps `h3`s with no containment, description, or visual rhythm change between sections.
- Field labels are **raw snake_case schema names** (`pov_cannot_perceive_now`, `prior_accepted_prose_status_or_handoff_note`).
- The ⓘ field-help trigger renders **after** its field's `</label>`, so visually it floats as an orphaned circle that reads as belonging to the *next* field.
- Empty optional/conditional textareas render at full height (~90–150 px each); with many blank (`entity_statuses`, `pov_cannot_perceive_now`, `current_locks`, `available_time`, …) they inflate the scroll and bury the filled fields that need review.
- The only save affordance is a single button at the very bottom; the only "readiness may be stale" notice is at the very top. A user editing mid-page sees neither.
- There is no in-page navigation: no jump links, no section status, no way to tell from anywhere which sections still have unfilled required fields.

**Premise verification (`file:line`, verified against the working tree at spec authoring):**
- Section chrome is only `border-top: 1px` + `padding-top`: `.configPanel`, `packages/web/src/styles.css:662–665`.
- Flat all-caps `h3` headers for all 8 sections: `packages/web/src/generation-brief/GenerationBriefView.tsx:385, 412, 628, 681, 729, 773, 785, 824`.
- Labels are schema leaf names passed through `BriefLabel`: `GenerationBriefView.tsx:76–93`.
- `BriefFieldHelp` renders after each `</label>` (orphaned ⓘ): pattern at `GenerationBriefView.tsx:404, 421, 430, …`; the `short` summary and the rich guidance are popover-only (`packages/web/src/field-help/FieldHelp.tsx:54–84`), **with one exception**: `criticalVisibleHint` already renders always-visible *outside* the popover (`FieldHelp.tsx:32–34`, `<span className="fieldHelpCriticalHint">`). Among the rendered brief fields it currently surfaces on `prior_accepted_prose_status_or_handoff_note` ("Accepted prose is readable output, not continuity authority." — `field-guidance-brief-config.ts:302`), `stop_guidance.soft_unit_guidance` (:374), `current_cast_voice_pressure[].current_voice_pressure` (:43), and `generation_context` (:425). This always-visible hint must survive the field-row rework (see D2).
- `FieldGuidance` carries `short`, `requiredness`, `promptDestinations`, etc. but **no display label**: `packages/core/src/records/field-guidance.ts:21–41`.
- Save button bottom-only: `GenerationBriefView.tsx:838`; stale-readiness warning top-only: `GenerationBriefView.tsx:374–376`.
- Readiness diagnostics come from the readiness API and re-run on save (`validationKey`): `packages/web/src/generation-brief/ValidationPanel.tsx:5`, `GenerationBriefView.tsx:379`.
- Field-jump machinery already exists: every section heading has an id (`aria-labelledby` anchors like `handoff-brief`), one section carries a `data-field` anchor, and `focusBriefField`/`resolveBriefFieldTarget` resolve deep links: `GenerationBriefView.tsx:318–350`.
- Per-field requiredness is already rendered as chips via `RequirednessMarker` (imported `GenerationBriefView.tsx:19`).

**Research basis (external, two parallel research passes).** Key source-backed conclusions adopted here:
- Differentiate sections with strong headings, one-line descriptions, and whitespace/containment — not accordion machinery (NN/g "Form Design: White Space", "Formatting Long-Form Content"; UX Movement settings-layout study).
- For a long page an expert revisits with a specific target, use a **sticky in-page section nav with anchor links and scroll-spy** (NN/g "In-Page Links", "Vertical Navigation"; Smashing "Sticky Menus UX Guidelines").
- **Do not collapse sections** the author must verify before every run; accordions raise interaction cost and hide state for review-everything tasks (NN/g "Accordions on Desktop", "Progressive Disclosure").
- Mark required *and* optional; surface per-section completion quietly, with attention drawn to what is missing, not what is done (NN/g "Marking Required Fields"; Baymard "Required & Optional Field Labels"; GOV.UK task-list pattern).
- Essential field meaning belongs in **always-visible helper text**, not behind info icons; info popovers are for supplemental depth (NN/g "Info-Tips Aren't Always Helpful", "Tooltip Guidelines").
- Use a **contextual save bar that appears only when the form is dirty** (Shopify Polaris contextual save bar; pick one save mechanism, not per-card + global).
- Size textareas to expected answer length via `rows` and let them auto-grow (GOV.UK textarea component; CSS `field-sizing: content` with fallback).
- Single-column field flow; a side *navigation* column is fine (Baymard "Avoid Multi-Column Forms").
- Product analogues: Sudowrite Story Bible (sections labeled by what they feed downstream), GOV.UK task-list statuses, Vercel-style section cards with header + description. Anti-patterns: Campfire rearrangeable panels (destroys positional memory), full accordion parameter panels with state hidden when collapsed.

**Key decisions.** Approach B ("sectioned pre-flight console") chosen over a CSS-only pass (no navigation or completion signal — doesn't fix "easy to lose oneself") and over a GOV.UK check-your-answers read-mode (strongest review speed, but adds a second view mode with behavior-adjacent risk; deferred — see Out of Scope). Display labels live in `@loom/core` field guidance as the single field-semantics authority rather than a parallel web-side label map (no duplicate authority paths).

**Confidence: ~92%.** Named assumptions (correct any in review): (1) the section rail sits at the right edge of the brief content column on wide viewports and degrades to a horizontal jump bar on narrow ones; (2) the contextual save bar replaces the bottom save button and the top-only stale notice; (3) textarea right-sizing applies to the generation-brief page only; (4) human labels are sentence-case renderings that keep constitutional vocabulary intact.

---

## Problem Statement

The Generation Brief is the page the author re-reads and partially edits **before every generation** (FOUNDATIONS §3 step 3, §6.3). The current rendering works against that loop:

1. **No section identity.** Eight sections with constitutionally distinct meanings (current state vs. handoff vs. directive vs. voice pressure vs. overrides vs. focus vs. stop guidance) render as one continuous wall separated by hairlines. (These are sub-sections of the single *generation-time brief* continuity surface, §6.3 — not the five continuity surfaces of §6.) FOUNDATIONS §27 calls for the UI to make high-friction continuity work feel pleasant, fast, and tractable, with clear validation and a legible workflow — which a wall of undifferentiated sections works directly against.
2. **No orientation or completion signal.** On ~7,900 px of scroll there is no way to jump to a section or see which sections still have unfilled required fields, so fields get overlooked — the exact failure the user reported.
3. **Field labels are schema identifiers.** Raw snake_case labels force the author to translate machine names on every visit; most of the rich authoring guidance that exists in core is hidden behind small ⓘ popovers (the `criticalVisibleHint` high-consequence line is the one always-visible exception today), which research shows are routinely missed.
4. **Misattached help affordance.** The ⓘ trigger floats between fields and visually attaches to the wrong field.
5. **Empty fields dominate.** Full-height empty optional textareas push the filled, review-critical content apart.
6. **Save and dirty-state are invisible mid-page.** The save button exists only at the bottom; the "readiness may be stale" warning only at the top.

## Approach

Restructure `GenerationBriefView` into a **pre-flight console**: one single-column scrolling page (no accordions, no mode switch, stable section order for positional memory) with:

1. **Section cards.** Each of the 8 brief sections becomes a visually contained card: white background, 1px border, radius, internal padding, a header row with a human-readable section title, the existing schema-name anchor kept as secondary text, and a one-line muted description of what the section feeds (e.g. Current Authoritative State → "Binding 'where things stand right now' — time, place, bodies, possessions. Compiles into the prompt's current-state section."). STOP GUIDANCE keeps its amber accent (`stopGuidancePanel`) as the existing high-consequence differentiation. The validation panel stays first and visually distinct from the editable cards.
2. **Field rows.** A field's label row contains, on one line: human-readable label (new `displayLabel` from core guidance, falling back to the schema leaf), the existing `RequirednessMarker` chip, the schema path as small muted monospace (preserves correlation with validation messages, docs, and deep links), and the ⓘ trigger **inline in the label row** (fixes orphaning). Below the label row, the guidance `short` string renders as always-visible helper text wired with `aria-describedby`; the popover keeps the deep content (prompt destinations, doctrine warnings, examples). Existing inline warnings (paste guard, non-local stop) are unchanged.
3. **Sticky section rail.** A sticky in-page navigation rail (right edge of the brief content at wide viewports; horizontal jump bar under the page header at narrow widths) listing Validation plus the 8 sections. Each entry: anchor jump (reusing the existing heading ids / `focusBriefField` machinery, with `scroll-margin-top`), scroll-spy active highlight (IntersectionObserver), and a quiet per-section **draft fill chip** — "3/3 required" in success tone when all *currently-required* fields in the section are non-empty in the in-memory draft, amber "1 required empty" otherwise, and a neutral "n filled" for sections with no required fields. Chips are computed client-side from the draft plus `getFieldGuidance().requiredness` (`always` counts always; `continuation` counts only when the effective `generation_context` is `continuation_after_accepted_segment`; `conditional`/`optional` never count as required). Chips are **advisory draft-fill indicators, not validation**: the readiness panel remains the only diagnostic authority, and chip wording must say "filled"/"empty", never "valid"/"ready".
4. **Contextual save bar.** A sticky bottom bar inside the brief surface that appears only when `hasUnsavedChanges` is true: "Unsaved changes — readiness shown above may be stale" + the **Save Generation Brief** button (same single partial-merge PUT `save()`; no autosave, no per-card saves). It replaces the bottom-only button and the top-only stale notice; the "Draft saved." status notice remains.
5. **Right-sized auto-growing textareas.** Default heights proportional to expected content (`rows={2}` for optional/conditional prose fields, `rows={4}` for required narrative fields), `field-sizing: content` as progressive enhancement with `resize: vertical` retained, capped with a `max-height` + scroll so a long value cannot blow up the page.

No changes to: schemas, stored draft shape, the `PUT /api/generation-brief` payload, validation/readiness logic, compiler, or routes. `displayLabel` is display metadata on existing core guidance entries; it is not prompt-facing and is never compiled.

## Deliverables

### D1 — `@loom/core`: display labels in field guidance
- Add optional `displayLabel?: string` to `FieldGuidance` (`packages/core/src/records/field-guidance.ts:21–41`).
- Populate `displayLabel` for **all generation-brief field entries** in `packages/core/src/records/field-guidance-brief-config.ts` (sentence case; constitutional vocabulary kept: e.g. `must_render` → "Must render", `pov_cannot_perceive_now` → "POV cannot perceive right now", `prior_accepted_prose_status_or_handoff_note` → "Prior accepted-prose status / handoff note" — the label must keep the user-authored-handoff framing required by FOUNDATIONS §10 and must not imply accepted prose is a prompt source).
- Unit test: every `generation_brief`-surface guidance entry has a non-empty `displayLabel`.
- Scope note: there are **46** `generation_brief`-surface entries in `field-guidance-brief-config.ts`, but the page currently renders only ~30 of them as fields (e.g. `cast_voice_overrides` has 5 core entries yet only `override_text` renders; `active_working_set` exposes only `selected_pov`). Populate `displayLabel` for **all 46** (the test enforces this) so labels exist if the non-rendered fields surface later — do not scope this deliverable to only the rendered subset.

### D2 — `@loom/web`: section cards and field rows
- Rework `GenerationBriefView.tsx` section markup into header (title + one-line description) plus card body; keep DOM section order, heading ids, and `data-field`/`name` anchors stable so `focusBriefField` deep links (`?field=`) keep working.
- Rework `BriefLabel`/`BriefFieldHelp` composition into a single field-row component: human label + requiredness chip + muted schema path + inline ⓘ; helper text (`guidance.short`) under the label row with `aria-describedby` on the input.
- **Preserve the existing always-visible `criticalVisibleHint`.** `FieldHelp.tsx:32–34` renders `guidance.criticalVisibleHint` always-visible *outside* the popover; the field-row rework must keep it always-visible (now positioned alongside the new `short` helper text, not folded into the popover). This guards high-consequence doctrine lines — notably `prior_accepted_prose_status_or_handoff_note`'s "Accepted prose is readable output, not continuity authority." (§10 / §28.1).
- Add static one-line section descriptions (web-side copy; aligned with each section's role in §6.3 and the compiler destinations).

### D3 — `@loom/web`: sticky section rail with draft fill chips
- New `generation-brief/SectionRail.tsx`: section list, anchor jumps, scroll-spy, per-section fill chips as specified in Approach §3; narrow-viewport horizontal fallback.
- Chip computation helper (pure function over the draft + guidance requiredness + effective generation context) — unit-testable without DOM.
- Extract a shared `isRequiredNow(requiredness, generationContext): boolean` predicate (currently-required ⇔ `always`, or `continuation` when `generationContext === "continuation_after_accepted_segment"`) and have **both** the chip helper and `RequirednessMarker` consume it. `RequirednessMarker.tsx:16–24` already inlines this rule; without a single source of truth the per-field `*` marker and the section chip can drift. Refactor `RequirednessMarker` onto the extracted predicate (no behavior change).

### D4 — `@loom/web`: contextual save bar
- New sticky dirty-state bar; remove the bottom-only button (`GenerationBriefView.tsx:838`) and the top stale notice (`:374–376`); save semantics unchanged.

### D5 — `@loom/web`: styles
- `styles.css`: `briefSection` card treatment (replacing bare `.configPanel` usage on this page), field-row and helper-text styles, rail + scroll-spy active state, save bar, textarea sizing (`rows` + `field-sizing: content` + `max-height`).

### D6 — Tests
- Update `GenerationBriefView.test.tsx` queries for new labels/markup (query by accessible name or `name` attribute — never weaken assertions to pass).
- New tests: rail lists all sections with working anchors; fill-chip helper (required counting incl. `continuation` context switching); `isRequiredNow` predicate unit test (shared by chip helper and `RequirednessMarker`); save bar appears on edit, disappears after successful save; helper text rendered and `aria-describedby` wired; `displayLabel` fallback to schema leaf; **`criticalVisibleHint` still renders always-visible** after the field-row rework (assert against the `prior_accepted_prose_status_or_handoff_note` field's "Accepted prose is readable output…" hint).
- Extend `FieldHelp.a11y.test.tsx` coverage to the inline-trigger placement; rail is a labeled `nav` landmark.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale |
|---|---|---|
| §27 UI and workflow (make continuity work pleasant/fast/tractable; readiness checklist drives diagnostics; dangerous actions hard) | aligns | Section cards + rail make the brief's eight sections visibly distinct and the long page navigable; the readiness panel remains the sole diagnostic surface; stop guidance keeps its high-consequence accent. (This restructures *within* the generation-brief surface; it does not alter the §6 five-surface boundaries.) |
| §11 / §29.5 validation doctrine (warnings never gate; no new blockers; draft saving never blocked) | aligns | Fill chips are advisory presentation of *existing* requiredness metadata over the in-memory draft; they gate nothing, add no validation, and never use "ready/valid" wording. Save/Preview/Generate gating is untouched. |
| §6.3 generation-time brief draft/ready states | aligns | Draft saving and partial-merge persistence unchanged; the save bar makes dirty state *more* visible, satisfying §27's "draft saving should show whether the draft saved". |
| §10 / §28.1 no accepted prose in prompts (naming rule) | aligns | The human label for `prior_accepted_prose_status_or_handoff_note` preserves the handoff-note framing; the paste-guard warning is retained verbatim; and the field's always-visible `criticalVisibleHint` ("Accepted prose is readable output, not continuity authority.") is preserved by the field-row rework (D2), not buried in the popover. |
| §4.4 / §8 deterministic compilation | N/A (untouched) | No compiler, schema, normalization, or prompt-facing change; `displayLabel` is UI metadata in core guidance, never compiled. |
| §29.11 quality checks (validation legibility, reduced clerical friction without reduced authorial control) | aligns | The change is precisely a §29.11 improvement: faster, more legible brief review with no reduction of authorial control. It stays within the brief surface and does not change the five-surface boundaries or the active-working-set surface. |

§29 hard-fail sweep: no LLM involvement, no record mutation, no silent selection changes, no accepted-prose prompt sourcing, no gating changes, no storage/ownership changes — all hard-fail questions answer "no".

## Verification

1. `npm run lint`, `npm run typecheck`, `npm test` all pass.
2. Existing generation-brief deep-link behavior (`?field=` focus/scroll) verified by the existing tests, updated only for markup.
3. Manual Puppeteer pass against a real project (the red-bunny reproduction flow): sections render as distinct cards with titles/descriptions; rail jumps land on the right section with the heading visible below any sticky chrome; editing any field summons the save bar; saving dismisses it and refreshes readiness; empty optional textareas no longer dominate scroll height (page height materially reduced with the same data); ⓘ sits in the label row of the field it describes.
4. Fill-chip correctness spot-check: with `generation_context = continuation_after_accepted_segment`, continuation-required fields count as required in chips; switching to `first_segment` removes them.

## Out of Scope

- A GOV.UK-style "check your answers" read-mode summary with jump-to-edit (deferred; revisit only if the restructured page still reads slowly in practice).
- Replacing native multi-`<select>` entity pickers with richer widgets.
- Any change to readiness/validation logic, blocker taxonomy, schemas, stored draft shape, API routes, or save semantics (no autosave, no per-section saves).
- Active working set curation surfaces, prompt preview, and the CAST MEMBER editor.
- Accordion/collapse machinery and reorderable sections (documented anti-patterns for this workflow).
- Display labels for non-brief surfaces (records, story config) — the core field can carry them later, but populating them is not this spec.

## Risks & Open Questions

- **Label muscle-memory break.** Authors used to schema names lose their visual anchors; mitigated by keeping the schema path visible as secondary text in every field row.
- **Chip misread as validation.** A green "3/3 required" could be read as "section is valid". Mitigated by wording ("filled"), neutral/quiet styling per GOV.UK guidance (attention on what's missing), and the readiness panel remaining first on the page.
- **`field-sizing: content` support** is not universal; the `rows` defaults plus `resize: vertical` are the functional baseline, auto-grow is enhancement-only.
- **Scroll-spy in jsdom** is untestable directly; keep IntersectionObserver behind a small seam so chip/anchor logic is unit-tested and scroll-spy is covered by the manual Puppeteer pass.
- **Open question (rail placement):** right-edge rail inside the brief column vs. left beside it (the app shell already owns the far-left nav). Spec assumes right-edge; flip during implementation if it crowds the 1280 px layout.
- **Open question (section descriptions copy):** final one-liners should be reviewed against `docs/prompt-template.md` destination names during implementation so descriptions never misstate where a field compiles.

## Outcome

Completed 2026-06-10 via archived ticket series:

- `archive/tickets/SPEC017GENBRIVIS-001.md`
- `archive/tickets/SPEC017GENBRIVIS-002.md`
- `archive/tickets/SPEC017GENBRIVIS-003.md`
- `archive/tickets/SPEC017GENBRIVIS-004.md`
- `archive/tickets/SPEC017GENBRIVIS-005.md`
- `archive/tickets/SPEC017GENBRIVIS-006.md`

Implemented display labels in core field guidance, shared requiredness/fill helpers, section cards and field rows, sticky section rail with advisory fill chips, contextual dirty-state save bar, and capstone browser verification. No schema, storage, compiler, API-route, validation-gating, or prompt-compilation semantics changed.

Verification completed:

- `npm test --workspace @loom/web -- GenerationBriefView section-fill` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed (103 files, 777 tests).
- Browser smoke against the local demo project verified cards, rail jumps, fill-chip context switching, inline help placement, contextual save-bar summon/dismiss, readiness refresh, and final restoration of demo draft values. The original pre-change scroll-height delta could not be numerically proven because no preserved pre-change browser measurement was available in this run; compact empty optional textarea behavior was verified directly.
