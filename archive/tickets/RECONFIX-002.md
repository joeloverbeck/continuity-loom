# RECONFIX-002: Slim the segment-reconciliation request block and trim vestigial accepted-segment-evidence span attributes

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — changes the `@loom/core` segment-reconciliation prompt serialization (`compiler/reconciliation/compile-segment-reconciliation-prompt.ts`): slims `<segment_reconciliation_request>` and drops the undocumented `start`/`end`/`sequence` attributes from `<segment_span>`. Behavior-preserving for the LLM contract (citation keys, escaping, scope disclosure, and source echo all retained), but the compiled-prompt bytes and fingerprint change, forcing the §Change-Control template/compiler/contract version cascade and re-pinning of all-pillar golden/route fixtures.
**Deps**: None (SPEC-032 / SPEC032SEGRECASS-001..008 implemented and archived; this is a post-completion serialization refinement against that implementation, not a contract widening)

> Namespace note: reuses the established `RECONFIX` (segment-RECONciliation FIX) prefix. `RECONFIX-001` is COMPLETED/archived (`archive/tickets/RECONFIX-001.md`), so this takes the next number, `-002`. The archived SPEC-032 family `SPEC032SEGRECASS-001..008` is not extended because that spec is COMPLETED/archived.

## Problem

The compiled Segment Reconciliation prompt carries two avoidable forms of noise. Both are *correct-by-design* renderings — not bugs — but both can be tightened without touching the FOUNDATIONS-mandated provenance/injection machinery.

1. **`<segment_reconciliation_request>` is over-stuffed deterministic metadata the LLM does not consume.** `renderRequest` (`compile-segment-reconciliation-prompt.ts:102-124`) emits `source_profile`, `segment_selection`, `record_scope`, `accepted_segment.{id,sequence,accepted_at,span_count}`, `source_counts.{reconciliation_field_count,full_record_count,reference_stub_count}`, and `versions.{template,compiler,contract}`. The local parser **never reads this block** — the model's required source echo is handed to it independently by `<segment_reconciliation_output_format>` (`renderOutputFormat`, `:181-200`) and validated there (`parseSource`/`validateSource`, `parse-output.ts:183-218`). The block is provenance/orientation only; `versions`, `accepted_at`, `span_count`, and `source_counts` add bytes the model cannot act on.

2. **`<accepted_segment_evidence>` spans render undocumented `start`/`end`/`sequence` attributes the model never cites.** `renderAcceptedSegmentEvidence` (`:126-140`) emits `<segment_span key="…" sequence="…" start="…" end="…">`. The model cites accepted prose **by key only** (`[SEG-N-S###]`; citation regex `parse-output.ts:112`, validated `:247,739-751`); the UTF-16 `start`/`end` offsets never appear in any citation, the source echo, or the output contract. The offsets are needed only by the server-side `citationMap` (`:212-230`), which reads them from `snapshot.acceptedSegmentSpans` — the typed snapshot — **not** from the prompt text. `sequence` is fully redundant with the key (which encodes `SEG-<sequence>`). Neither `docs/segment-reconciliation-prompt-template.md` §Accepted-Segment Evidence nor `docs/compiler-contract.md` §4.2 documents these attributes, so they are undocumented rendering detail.

What must NOT change (the perceived "mess" that is actually load-bearing, confirmed against the constitution): the `[SEG-N-S###]` citation keys (FOUNDATIONS §9.1 line 332 "escaped evidence spans with deterministic citation keys"; §10 line 410 "provenance is represented by deterministic span keys"; the parser requires every proposal to cite them), the JSON `{ "text": … }` envelope with `<>&` escaping (the prompt-injection defense; template §Accepted-Segment Evidence "rendered as escaped data, never as prompt instructions"), the complete-segment partition (no excerpt/summary/truncation), and `record_scope` disclosure in the prompt (FOUNDATIONS §9.1 line 326). Rendering the accepted segment as plain narrative was considered and rejected: it would strip the keys and escaping and require a FOUNDATIONS amendment.

## Assumption Reassessment (2026-06-24)

1. The two emit sites are exactly as cited (verified this session): `renderRequest` at `compile-segment-reconciliation-prompt.ts:102-124` and `renderAcceptedSegmentEvidence` at `:126-140`. The parser does **not** consume `<segment_reconciliation_request>`: `parseSegmentReconciliationOutput` (`parse-output.ts:116-146`) validates only the model's `source` echo (`:123-124`), whose values originate in `renderOutputFormat` (`:187-193`), not in the request block. The `citationMap` reads offsets from the snapshot (`:218-221`, `span.startOffset`/`span.endOffset`), so dropping the rendered `start`/`end` attributes does not touch it.
2. The change is governed by `docs/compiler-contract.md` §10 change-control (`:539`, verified): a change to "request shape … record/reference serialization" must update `docs/segment-reconciliation-prompt-template.md`, this contract, the template/compiler/contract versions, and golden/parser/route/UI tests in the same change. The same clause requires a FOUNDATIONS amendment **only** "if the change widens accepted-prose access or authority" — this change widens neither (same one segment, same escaping, same keys; it only *removes* metadata and attributes), so **no FOUNDATIONS amendment is required** (confirmed against the §539 wording).
3. **Cross-artifact boundary under audit**: the segment-reconciliation prompt serialization contract spans `compile-segment-reconciliation-prompt.ts`, the domain authority `docs/segment-reconciliation-prompt-template.md`, the `docs/compiler-contract.md` §3.4/§4.2 mapping, the global `packages/core/src/version.ts` triple, and the golden/cross-pillar/route/web fixtures that pin that triple. The output JSON Schema (`output-schema.ts`), the parser (`parse-output.ts`), the span-partition algorithm (`segment-spans.ts`), the `AcceptedSegmentSpan` type (offsets retained for `citationMap`), the citation keys, and the schema catalog are **unchanged**.
4. **FOUNDATIONS principle restated before trusting any narrative**: §9.1/§10 mandate that the accepted segment render as escaped evidence spans with deterministic citation keys, and that scope be named in the prompt. This change preserves all three (keys, escaping, scope disclosure via `<record_contrast_scope>` `:157-169` and the retained `record_scope` in the slimmed request block). It removes only non-mandated metadata; it relaxes no gate, firewall, or disclosure.
5. **Deterministic-compilation surface (§8)**: the compiler stays pure and deterministic — identical declared sources + request + versions must still produce an identical prompt. The only intended behavioral effect is different (shorter) prompt bytes → a different fingerprint, which is why the version cascade is mandatory. No `Date`/random/network/LLM is introduced.
6. **Output-schema / contract-consumer check (additive vs. breaking)**: this is a **removal** from the prompt serialization, not a schema extension. The model-facing *output* contract `segment_reconciliation.v1` is untouched (`output-schema.ts`, `parse-output.ts` source-echo keys unchanged). No persisted data, no migration. Consumers of the prompt text are the LLM (cites by key — unaffected) and the golden/route fixtures (re-pinned here).
7. **Blast radius of the version bump (grep-proof, repo-wide)**: `templates`/`compiler`/`contract` versions are global (`version.ts:26,30,34`), embedded in every pillar's `metadata.versions` and every prompt fingerprint. A repo-wide grep for the triple (`compiler: "1.8.0"` / `contract: "1.9.0"` / `template: "1.6.0"`) and the doc pins identifies the surfaces to re-pin in the same revision: `docs/segment-reconciliation-prompt-template.md:6-8`, `docs/compiler-contract.md:5`, `docs/ACTIVE-DOCS.md:163`, and fixtures `packages/core/test/segment-reconciliation-golden.test.ts`, `packages/core/test/segment-reconciliation-cross-pillar.test.ts`, `packages/core/test/record-hygiene-golden.test.ts`, `packages/server/src/{ideate.e2e,generate-routes,compile-routes,ideate-routes}.test.ts`, `packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx`. The implementer must re-run the grep before finishing and re-pin every active hit (the set above plus any added by intervening work). `docs/story-record-schema.md` carries no version pin (verified — not in the pin grep) and needs no change.
8. **Adjacent finding classified (out of scope)**: `renderOutputFormat` instructs the model to echo `prompt_fingerprint` with the placeholder `"<echo inspected prompt fingerprint>"` (`:192`), yet the fingerprint is not rendered anywhere in the prompt body. Whether the model can supply it is a separate question from this ticket's serialization trim and is **not** addressed here; left unticketed pending its own investigation.

## Architecture Check

1. Removing serialization that no downstream consumer reads (the request block by the parser; the span offset/sequence attributes by the model) is strictly cleaner than retaining it "for provenance" — provenance that the LLM cannot act on and that the parser ignores is pure prompt-budget cost, and the trim brings the rendering into tighter conformance with the documented contract (the offset attributes were never in `docs/segment-reconciliation-prompt-template.md` or `compiler-contract.md §4.2`). The retained orientation fields (`source_profile`, `segment_selection`, `record_scope`, `accepted_segment.{id,sequence}`) are the minimal set that keeps the prompt self-describing and keeps scope disclosure constitutional.
2. No backwards-compatibility aliasing/shims: the slimmer serialization replaces the verbose one outright. No dual-render path, no "legacy verbose" flag. The `AcceptedSegmentSpan` type keeps `startOffset`/`endOffset` because `citationMap` still needs them — that is a real consumer, not a shim.

## Verification Layers

1. Request-block-slim invariant (`<segment_reconciliation_request>` contains exactly `source_profile`, `segment_selection`, `record_scope`, and `accepted_segment.{id,sequence}` — and no `accepted_at`, `span_count`, `source_counts`, or `versions`) → golden test assertion on the rendered section.
2. Span-attribute-trim invariant (each `<segment_span>` tag carries `key` only — no `start`, `end`, or `sequence` attribute — while the JSON `{ "text": … }` envelope and `<>&` escaping are retained) → golden test assertion on the rendered `accepted_segment_evidence` section.
3. Provenance/firewall no-regression invariant (citation keys `[SEG-N-S###]` still render and are still required by the parser; the cross-pillar capstone still finds exactly one segment and the `<segment_span ` count still equals `acceptedSegmentSpans.length`; accepted prose still appears only in the reconciliation prompt) → existing `segment-reconciliation-cross-pillar.test.ts` (re-pinned, otherwise unchanged) + parser suite green.
4. Version-cascade invariant (every active template/compiler/contract pin and golden fixture across all pillars reflects the new triple; `metadata.versions` matches) → full `npm test` + repo-wide grep proof that the old triple no longer appears in active sources.

## What to Change

### 1. `compiler/reconciliation/compile-segment-reconciliation-prompt.ts` — slim the request block and trim span attributes

In `renderRequest` (`:102-124`): emit only `source_profile`, `segment_selection`, `record_scope`, and `accepted_segment: { id, sequence }`. Remove `accepted_segment.accepted_at`, `accepted_segment.span_count`, the entire `source_counts` object, and the entire `versions` object. Keep `canonicalBlock` (sorted-key, `<>&`-escaped JSON).

In `renderAcceptedSegmentEvidence` (`:126-140`): emit the open tag as `<segment_span key="${escapeAttribute(span.key)}">` — drop the `sequence`, `start`, and `end` attributes. Keep the `canonicalBlock({ text: span.text })` envelope and the `</segment_span>` close unchanged. Leave the empty-state branch (`:127-129`) unchanged.

Do not touch `AcceptedSegmentSpan` (`reconciliation/types.ts`), `segment-spans.ts`, `citationMap` (`:212-230`), `renderOutputFormat`, `renderRecordContrastScope`, `renderBriefField`, the schema catalog, or the parser.

### 2. `packages/core/src/version.ts` — version cascade

Bump each global contract version one minor: `templates 1.6.0 → 1.7.0` (`:26`), `compiler 1.8.0 → 1.9.0` (`:30`), `contract 1.9.0 → 1.10.0` (`:34`). (If intervening work has moved these, apply the equivalent next-minor increments.)

### 3. Domain docs — record the new serialization and pins (§Change-Control mandated, same revision)

- `docs/segment-reconciliation-prompt-template.md`: update the three header pins (`:6-8`) to the new triple; in §Accepted-Segment Evidence and §Source Profile, ensure the request-block/span description matches the slimmed shape (the doc never documented the offset attributes, so no removal there, but confirm no stale mention of `source_counts`/`versions` in the request block).
- `docs/compiler-contract.md`: update the header pin (`:5`, contract `1.9.0 → 1.10.0`); in §4.2 (`:261-268`) update the `<segment_reconciliation_request>` row (`:267`) to drop "source counts, pinned versions" from its content description; §3.4 thirteen-section order (`:224-242`) is unchanged (the request section still renders, just slimmer).
- `docs/ACTIVE-DOCS.md`: update the version note (`:163`) to the new triple.
- `docs/story-record-schema.md`: no change (carries no version pin — verified).

### 4. Test fixtures — re-pin the triple and assert the slimmed serialization

- `packages/core/test/segment-reconciliation-golden.test.ts`: update the version-triple assertion (`:40`); update any case asserting on the request-block contents (no `source_counts`/`versions`/`accepted_at`/`span_count`) and on `accepted_segment_evidence` span attributes (no `start`/`end`/`sequence`); the escaping assertion (the `<…` content) stays.
- `packages/core/test/segment-reconciliation-cross-pillar.test.ts`: re-pin the triple; the `<segment_span ` count (`:55`) and `"accepted_segment":` (`:56`) assertions still hold (tag and `accepted_segment` retained).
- `packages/core/test/record-hygiene-golden.test.ts`, `packages/server/src/{ideate.e2e,generate-routes,compile-routes,ideate-routes}.test.ts`, `packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx`: re-pin the triple wherever the old values appear.
- `packages/core/test/segment-reconciliation-spans.test.ts`: **no change** — it asserts on the `AcceptedSegmentSpan` type and partition algorithm (`startOffset`/`endOffset`/`text`), which are retained.

## Files to Touch

- `packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `docs/segment-reconciliation-prompt-template.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/ACTIVE-DOCS.md` (modify)
- `packages/core/test/segment-reconciliation-golden.test.ts` (modify)
- `packages/core/test/segment-reconciliation-cross-pillar.test.ts` (modify)
- `packages/core/test/record-hygiene-golden.test.ts` (modify)
- `packages/server/src/ideate.e2e.test.ts` (modify)
- `packages/server/src/generate-routes.test.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (modify)
- `packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx` (modify)
- (+ any additional active version-triple pin surfaced by the repo-wide grep in Assumption Reassessment item 7)

## Out of Scope

- The accepted-segment representation itself — citation keys, the JSON `{text}` escaped envelope, the complete-segment partition, and the span-partition algorithm (`segment-spans.ts`) are FOUNDATIONS-mandated and unchanged. Plain-narrative rendering is explicitly rejected (would need a §1.1 FOUNDATIONS amendment).
- The output JSON Schema (`output-schema.ts`), the parser (`parse-output.ts`), the source-echo shape, the verbatim-echo firewall, reference-token grammar, the schema catalog, lifecycle destinations, and the UI quarantine — all untouched.
- Removing the `<segment_reconciliation_request>` section entirely — this ticket *slims* it (keeps orientation fields and scope disclosure); full removal was not the chosen remedy.
- The `prompt_fingerprint` echo-placeholder question (Assumption Reassessment item 8) — separate investigation.
- `AcceptedSegmentSpan.startOffset`/`endOffset` (the type fields) and `citationMap` — retained; only the *prompt rendering* of the offsets is dropped.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation` — the reconciliation golden/spans/cross-pillar/parser suites pass with the slimmed request block (no `source_counts`/`versions`/`accepted_at`/`span_count`), the trimmed span tags (`key` only), and the new version triple.
2. `npm test` — green across all packages, including the re-pinned non-reconciliation golden/route/web fixtures (record-hygiene, prose generate/compile, ideation) that embed the global version triple.
3. `npm run typecheck && npm run lint && npm run build` — green, including the `@loom/core` import-boundary rule.

### Invariants

1. `<segment_reconciliation_request>` renders exactly `source_profile`, `segment_selection`, `record_scope`, `accepted_segment.{id,sequence}` and nothing else; `<segment_span>` tags carry only `key`; the `{ "text": … }` `<>&`-escaped envelope and `[SEG-N-S###]` citation keys are retained; `record_scope` remains disclosed in the compiled prompt.
2. Compilation stays pure and deterministic; the only behavioral change is shorter prompt bytes and the corresponding new fingerprint, reflected by a one-minor bump of all three global versions and re-pinning of every active pin/fixture in the same revision.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-golden.test.ts` — assert the slimmed request block and the `key`-only span tags (and the new version triple); this is the primary proof the serialization changed as intended.
2. `packages/core/test/segment-reconciliation-cross-pillar.test.ts` + `record-hygiene-golden.test.ts` + server route fixtures + web view test — re-pinned to the new triple; they additionally prove the global version cascade landed everywhere and no pillar regressed.

### Commands

1. `npm test -- segment-reconciliation`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. `grep -rnE 'compiler: "1\.8\.0"|contract: "1\.9\.0"|template: "1\.6\.0"' packages docs` returns nothing in active sources after the change — the targeted grep is the correct boundary for proving the global pin cascade is complete, complementing the full `npm test` that proves no fixture regressed.

## Outcome

Completed: 2026-06-24

What changed:

- Slimmed `<segment_reconciliation_request>` to render only `source_profile`, `segment_selection`, `record_scope`, and `accepted_segment.{id,sequence}`.
- Trimmed accepted-segment evidence span tags to `key` only while retaining deterministic `[SEG-N-S###]` citation keys, JSON `{ "text": ... }` envelopes, and `<>&` escaping.
- Bumped global template/compiler/contract versions to `1.7.0` / `1.9.0` / `1.10.0`.
- Updated the segment-reconciliation prompt-template docs, compiler contract, active-doc version note, and all active version/cascade fixtures surfaced by the repo grep.
- Added golden/cross-pillar assertions for the slim request block and key-only `<segment_span>` rendering.

Deviations from original plan:

- Included two active pin surfaces found by the implementation grep but not named in the initial file list: `packages/core/test/compiler-front-sections.test.ts` and `packages/core/test/segment-reconciliation-catalog.test.ts`.
- No browser smoke was run; this ticket changes pure compiler serialization, docs, and pinned fixtures, with route/UI coverage exercised through the full test suite.

Verification:

- `npm test -- segment-reconciliation` - passed; 8 test files, 50 tests.
- `npm test` - passed; 166 test files, 1754 tests.
- `npm run typecheck && npm run lint && npm run build` - passed; Vite emitted its existing chunk-size warning.
- `grep -rnE 'compiler: "1\.8\.0"|contract: "1\.9\.0"|template: "1\.6\.0"' packages docs` - passed; no matches.
- `git diff --check` - passed.
