# Implementation Order — Generation Brief / Validation / Readiness Specs

Status: ordering rationale for the generation brief / validation / readiness spec sequence
Repository: `joeloverbeck/continuity-loom`
Target commit: `e1df2d032c7ae7976108f70cafa5802a7398ce39`

## What this document decides

`specs/` originally held four specs:

1. `archive/specs/SPEC-generation-brief-draftability-and-save-model.md` — completed and archived.
2. `SPEC-validation-gating-taxonomy-and-focus-matrix.md`
3. `archive/specs/SPEC-readiness-diagnostics-and-three-page-ux.md` — completed and archived.
4. `SPEC-implementation-order-and-regression-plan.md`

This file formalizes the order in which they should be implemented and why.

## Key framing: the four specs are not peers

Three of the four are **content specs** — each defines a distinct slice of behavior:

- **Draftability/Save** — the data contract: draft schema, normalizer, deterministic defaults, `/api/generation-brief` save semantics.
- **Validation Taxonomy** — the semantics: what is a blocker vs. a warning, the focus matrix, retired/rewritten diagnostic codes.
- **Readiness/Three-Page UX** — the presentation: the shared readiness model, diagnostic copy, and the generation-brief / preview / generate pages.

The fourth, `SPEC-implementation-order-and-regression-plan.md`, is **not** a fourth feature. It is the cross-cutting execution spine: its Phases 0–8 already slice and interleave the three content specs and add the characterization-test, docs, and smoke-path scaffolding around them. It states this itself: *"This is still a spec-level plan. No tickets are included."*

Therefore the regression-plan spec is **not implemented separately and last**. It governs *how* the other three are sequenced and is consumed throughout. Treat it as the master checklist, not a deliverable.

## Recommended order

**Content-spec order (the spine of the work):**

1. **Draftability and Save Model** — the data contract first. Completed and archived at `archive/specs/SPEC-generation-brief-draftability-and-save-model.md`.
2. **Validation Gating Taxonomy and Focus Matrix** — validation semantics second.
3. **Readiness Diagnostics and Three-Page UX** — readiness presentation last.

**Governed throughout by** `SPEC-implementation-order-and-regression-plan.md`, whose Phase 0 runs *before* step 1 and whose Phases 7–8 run *after* step 3.

This is the same doctrine the regression-plan spec opens with: *"Fix the data contract first, then validation semantics, then readiness UX. Do not start by polishing the UI around bad blockers."*

## Why this order — dependency direction

The dependencies run one way only. Each spec consumes the artifacts of the one above it and produces the inputs for the one below.

```
Draftability/Save
   ├─ produces: generationSessionDraftSchema
   │            normalizeGenerationSessionDraft
   │            deriveGenerationContextDefault
   │            normalizeGenerationSessionForReadiness  (ready candidate)
   ▼
Validation Taxonomy
   ├─ consumes: the ready candidate + accepted-segment-count default
   ├─ produces: corrected blocker/warning taxonomy + diagnostic types
   ▼
Readiness / Three-Page UX
   ├─ consumes: diagnostics from validation + draft/provider state
   └─ produces: deriveReadiness / readiness API + the three pages
```

- **Validation cannot be corrected before the normalizer exists.** The taxonomy spec's central fixes — retire `missing-stop-guidance`, context-gate `missing-immediate-handoff`, default `generation_context` from accepted-segment count — all assume a normalized ready candidate produced by the draft layer. Without it, validation still parses persisted draft state with the strict final schema, which is the root defect both specs call out. Building validation first would mean building it against the wrong input and reworking it.

- **The false-blocker root cause lives in the data layer, not the validator.** The `focus-tag-count-invalid` failure occurs because the server snapshot is built from persisted state with no server-side default, while the UI's `first_segment` default never reaches validation. That is fixed by `deriveGenerationContextDefault` + the snapshot builder using it — both in the Draftability spec. Fix the contract, and a whole class of "blockers" disappears before the validator is even touched.

- **Readiness UX renders what validation emits.** The Three-Page UX spec's `ReadinessDiagnostic` shape (title, group, fastestFix, dedupeKey, affected display labels) is a *presentation* of the corrected taxonomy. Building the pages first would mean rendering the old codes, then rebuilding every card once the taxonomy lands. The spec explicitly warns against "polishing the UI around bad blockers."

- **`canSaveDraft: true` is a precondition for the whole readiness model.** The Three-Page UX readiness object hard-codes `canSaveDraft` as always true and treats unsaved-draft as non-blocking state. That invariant only holds once the Draftability spec has separated save from readiness. The UX layer assumes the save model is already correct.

## Mapping the regression spine onto the content specs

`SPEC-implementation-order-and-regression-plan.md` is the authoritative phase list. Each phase belongs to a content spec (or is cross-cutting). Implement phases in numeric order; the mapping below shows which spec owns each.

| Phase | Regression-plan phase | Owning content spec | Notes |
|---|---|---|---|
| 0 | Lock regression fixtures | cross-cutting | Characterization tests that prove today's failures *before* any change. Must precede step 1. |
| 1 | Core draft schema and normalizer | **Draftability/Save** | `generationSessionDraftSchema`, `normalizeGenerationSessionDraft`, `deriveGenerationContextDefault`, `normalizeGenerationSessionForReadiness`. |
| 2 | Server persistence and snapshot fixes | **Draftability/Save** | `generation-brief-routes.ts`, `record-repository.ts`, `snapshot-builder.ts`. |
| 3 | Compiler empty states | **Draftability/Save + Validation** (shared) | Blank stop guidance + first-segment handoff empty states in `compiler/empty-states.ts`. Specified by *both* content specs; see "Shared seam" below. |
| 4 | Validation taxonomy correction | **Validation Taxonomy** | The rules under `validation/rules/*` + diagnostic types. |
| 5 | Diagnostic model and readiness API | **Readiness/UX** (+ Validation types) | `validation/types.ts`, `deriveReadiness` / `/api/readiness`, `web/src/api.ts`. |
| 6 | Three-page UX implementation | **Readiness/UX** | `generation-brief`, `prompt`, `generate` views + shared checklist. |
| 7 | Active docs and user guide | cross-cutting | Update `FOUNDATIONS.md` and the active docs once behavior is settled. |
| 8 | Demo project smoke path | cross-cutting | Full end-to-end smoke run; final gate. |

## The shared seam: compiler empty states (Phase 3)

Phase 3 is the one place two content specs overlap. Both the Draftability spec ("Deterministic defaults" → `soft_unit_guidance` / `immediate_handoff` compiled text) and the Validation spec ("Blank `soft_unit_guidance`" / "Immediate handoff") prescribe the same deterministic compiler strings:

```text
Soft unit: No additional user narrowing; use the universal local stop rule above.
No prior accepted prose. Begin from current authoritative state and the launch directive.
```

Land these strings **once**, in Phase 3, between the data layer (Phases 1–2) and the validator (Phase 4). Rationale: the validator's decision to *not* block on blank stop guidance / first-segment handoff is only safe once the compiler has a truthful empty state to emit. Doing them together also bundles the intended prompt-fingerprint/golden-file change into a single deliberate contract version bump (per the spec's Phase 3 risk note), rather than churning goldens twice.

## Cross-spec invariants every phase must preserve

These hold across all four specs and must not regress at any phase boundary:

- Draft saving is never gated by generation readiness (`canSaveDraft` stays true except malformed shape / no project).
- `generation_context` defaulting is deterministic and **server-visible**, not UI-only.
- Accepted prose, rejected/superseded candidates, and prose-derived summaries never enter prompt context.
- Warnings never set `canPreview`/`canGenerate` and never enter the compiled prompt.
- API-key secrecy, localhost binding, and local-first ownership are never weakened.
- No branch/beat/act/drama-manager machinery and no LLM-based validation are introduced.

## One-line summary

Implement **Draftability/Save → Validation Taxonomy → Readiness/Three-Page UX**, executed through the Phase 0–8 spine of `SPEC-implementation-order-and-regression-plan.md` (characterization tests first, shared compiler empty states at Phase 3, docs and smoke path last). The regression-plan spec is the conductor, not a fourth instrument.
