# SPEC032SEGRECASS-004: Reconciliation compiler, section order, domain-authority doc, and version bump

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `compiler/reconciliation/{template,compile-segment-reconciliation-prompt}.ts`; `RECONCILIATION_SECTION_ORDER` in `template-constants.ts`; `@loom/core` barrel exports; the new `docs/segment-reconciliation-prompt-template.md` authority + its ACTIVE-DOCS registration; `docs/compiler-contract.md` and `docs/story-record-schema.md` amendments; the `version.ts` template/compiler/contract bump and its golden ripple
**Deps**: SPEC032SEGRECASS-003

## Problem

This ticket assembles the deterministic reconciliation prompt: the thirteen always-present sections (proposal §5.7), the role/source-contract at the front edge and the strict output contract at the final edge, the locally-generated accepted-segment evidence (from SPEC032SEGRECASS-002 spans), the nineteen brief fields with explicit missing/blank states, the in-scope records + reference stubs (from SPEC032SEGRECASS-003), and the registry-derived schema catalog. It is where accepted prose first enters a compiled prompt — the exact behavior the FOUNDATIONS amendment (SPEC032SEGRECASS-001, already landed via the -002 co-landing revision) authorizes. Because the compiler establishes a new template/compiler/contract surface, the same revision bumps `version.ts` (`templates 1.5.0→1.6.0`, `compiler 1.7.0→1.8.0`, `contract 1.8.0→1.9.0`) and co-lands the §8-bound authority docs; the version bump ripples into existing produced-version assertions across both packages.

Implements SPEC-032 Deliverable 2 (part c) and the §8-bound slice of Deliverable 1. Section order, mapping, and empty-state rules are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §5.7–§5.8 and §11.2/§11.3.

## Assumption Reassessment (2026-06-24)

1. The upstream modules exist as Deps: SPEC032SEGRECASS-002 (`types`, `segment-spans`, `citation-keys`) and -003 (`schema-catalog`, `record-renderer`). `template-constants.ts` uses the `export const IDEATION_SECTION_ORDER = Object.freeze([...])` pattern (verified L34); `RECONCILIATION_SECTION_ORDER` follows it. The compiler-contract anchors for the prescribed edits exist (verified this session): current `### 2.3 Universal exclusions` → renumber to §2.4 and insert the new `### 2.3` source profile; §3.1/§3.2/§3.3 present → insert `### 3.4`; `### 4.1 Record-hygiene source mapping` present → insert `### 4.2`; pin line `Contract version: 1.8.0` (L5) → `1.9.0`.
2. The schema-doc anchors exist (verified this session): `### 3.3 IMMEDIATE HANDOFF` (L202) for the handoff note; `### 9.3 Story-record hygiene assistance projection` (L991) → insert `### 9.4`; `## 10. Compiler contract and minimum prompt completeness` (L1001) for the synchronization bullet. The new authority doc `docs/segment-reconciliation-prompt-template.md` does not exist yet (collision check passed).
3. **Cross-artifact boundary under audit**: this ticket co-lands three §8-bound surfaces — the new `docs/segment-reconciliation-prompt-template.md` (the template the compiler renders; its drift from the compiler is a continuity bug, so it co-lands here per the §8 same-change rule, with its ACTIVE-DOCS registry row), `docs/compiler-contract.md` §2.3/§3.4/§4.2, and `docs/story-record-schema.md` §3.3/§9.4/§10. The new doc encodes the sign-off-gated §7.4 lifecycle-destination table and the A1 (name) / A2 (exclusion-boundary) assumptions; owner sign-off of those (alongside the -001 §10 wording) is recorded against this ticket before it lands.
4. **FOUNDATIONS principle restated (§8/§9.1/§10)**: this is the first compiled prompt containing accepted prose. The amendment authorizes exactly this — one explicitly-selected segment rendered as escaped evidence spans, never a model-selected excerpt. The compiler must render the *complete* selected segment (no excerpt/summary/truncation), keep the source contract at the front edge and the strict JSON output contract at the final edge, and place accepted-segment data in escaped containers framed as untrusted evidence (never a heading or instruction).
5. **Deterministic-compilation + secret-firewall surface (§8/§15/§29.4)**: identical source tuple + versions must produce a byte-identical prompt and fingerprint. The compiler may only normalize line endings, escape data, sort declared collections, generate citation keys/spans, and generate JSON Schema deterministically — never summarize, classify, select, infer, or repair. No LLM intermediary; no wall-clock; no provider transform. Whole-project scope renders secret-bearing records, but disclosure + opt-in send (SPEC032SEGRECASS-006/-007) hold the firewall; this compiler leaks no secret into a narrator the records forbid because it produces an assistance prompt, never a prose prompt.

## Architecture Check

1. Reusing `RECONCILIATION_SECTION_ORDER` as a frozen constant beside `SECTION_ORDER` / `IDEATION_SECTION_ORDER` keeps section ordering a single deterministic source, matching the established compiler convention. Co-landing the §8-bound docs with the compiler (rather than deferring them to the trailing docs ticket) prevents template/contract/compiler drift — a continuity bug under §8. Bumping all three versions in this same revision keeps `version.ts`, the contract pin, and the new surface coherent.
2. No backwards-compatibility aliasing/shims: the version bump replaces the old pins outright (no alias for the old contract version, per CLAUDE.md); the new prompt is net-new, reusing existing modules by import, not by duplicating logic.

## Verification Layers

1. Byte-identical-prompt invariant (identical snapshot/request/versions → identical prompt + fingerprint; any source/version change changes the fingerprint) → golden test.
2. Thirteen-section-order + front/final-edge invariant → golden test asserting exact section sequence and that the source contract is first, the strict output schema last.
3. Accepted-prose-confinement invariant (only the reconciliation prompt contains accepted text; arbitrary segment text cannot create a new section/tag or alter instructions) → golden test with prompt-injection-like accepted prose + a cross-pillar assertion (full cross-pillar capstone lives in SPEC032SEGRECASS-008).
4. Version-coherence invariant (compiled `metadata.versions` equals the bumped `versionInfo`; the contract pin equals `version.ts`) → updated produced-version assertions across packages + `grep` of the contract pin.

## What to Change

### 1. Compiler + section order + exports

Add `RECONCILIATION_SECTION_ORDER` (13 frozen sections, proposal §5.7) to `template-constants.ts`; implement `template.ts` (section text constants) and `compile-segment-reconciliation-prompt.ts` (assemble sections from the snapshot, generate the prompt fingerprint, return the compile response shape). Export the public reconciliation surface from `packages/core/src/index.ts`.

### 2. Version bump + golden ripple

Bump `version.ts`: `templates 1.5.0→1.6.0`, `compiler 1.7.0→1.8.0`, `contract 1.8.0→1.9.0` (`app` unchanged). Update `docs/compiler-contract.md` pin to `1.9.0`. Then update every test asserting a **produced** version value (read from `versionInfo` through compile/route output): `packages/core/test/compiler-front-sections.test.ts:503–505` (`versionInfo.*.version`), `packages/server/src/ideate.e2e.test.ts:97`, `packages/server/src/compile-routes.test.ts:160,189`, `packages/core/test/record-hygiene-golden.test.ts:24`, `packages/core/test/compiler-ideation-golden.test.ts:178`, `packages/server/src/ideate-routes.test.ts:71` (`toMatchObject(body.metadata…)`). For each remaining `versions: {…}` literal passed as a *builder input* (`ideation-taxonomy-capstone.test.ts:137`, `compiler-ideation-golden.test.ts:54`, `generate-routes.test.ts:147,183`), trace whether the compiler/route echoes the input or stamps `versionInfo`; update only the produced-assertion sites and leave inert inputs. Re-run `npm test` to confirm no missed assertion.

### 3. §8-bound authority docs

Create `docs/segment-reconciliation-prompt-template.md` (the domain authority: profile, source predicate, nineteen-field boundary, thirteen-section order, schema catalog, §7.4 lifecycle destinations, output schema, provenance spans, echo guard, UI quarantine — proposal §§3–8 in normative form) and register its row in the `docs/ACTIVE-DOCS.md` authority table **and** the "Prompt, compiler, validation, and schema authorities" bullet list. Apply the `docs/compiler-contract.md` §2.3 (new profile) / §2.4 (renumbered Universal exclusions) / §3.4 (section order) / §4.2 (source mapping) + §8 empty-state + §9 + §10 change-control edits (proposal §11.2). Apply the `docs/story-record-schema.md` §3.3 handoff note / §9.4 projection / §10 synchronization-bullet edits (proposal §11.3).

## Files to Touch

- `packages/core/src/compiler/reconciliation/template.ts` (new)
- `packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` (new)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/index.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `docs/segment-reconciliation-prompt-template.md` (new)
- `docs/ACTIVE-DOCS.md` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/segment-reconciliation-golden.test.ts` (new)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/server/src/ideate.e2e.test.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (modify)
- `packages/core/test/record-hygiene-golden.test.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (modify)

## Out of Scope

- The output JSON Schema and parser (SPEC032SEGRECASS-005) — this ticket renders the prompt and references the output-format section, but the strict schema + parser land in -005.
- The server routes/snapshot builder (SPEC032SEGRECASS-006) and web page (SPEC032SEGRECASS-007).
- `docs/user-guide.md`, the `docs/ACTIVE-DOCS.md` version note, and stress/robustness docs — those non-§8 docs land in SPEC032SEGRECASS-008.
- The cross-pillar capstone proper (SPEC032SEGRECASS-008); this ticket's golden carries only a localized confinement assertion.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-golden` — thirteen-section order, byte-identical prompt+fingerprint, fingerprint-changes-on-source-change, and prompt-injection-confinement tests pass.
2. `npm test` — green across both packages, including every updated produced-version assertion (no stale `1.5.0/1.7.0/1.8.0` assertion remains where the value is produced from `versionInfo`).
3. `npm run typecheck && npm run lint && npm run build` — green, including the `@loom/core` import-boundary rule.

### Invariants

1. Identical source tuple + versions → byte-identical prompt and fingerprint; the source contract is the first section, the strict output schema the last; all thirteen sections always render.
2. `grep -n "1\.9\.0" docs/compiler-contract.md` returns the updated pin; `grep -rn "contract: \"1\.8\.0\"" packages/` returns no *produced-assertion* match left asserting the old contract version.

### Invariants (co-landing)

3. **Same revision; never merge standalone (§1.1)**: the §8-bound docs (`segment-reconciliation-prompt-template.md`, `compiler-contract.md`, `story-record-schema.md`) and the `version.ts` bump land in the *same revision* as the compiler — the contract pin, the template doc, and the compiler must never diverge across revisions. Owner sign-off of the §7.4 lifecycle table and the A1/A2 assumptions (encoded in the new authority doc) is recorded before this ticket lands.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-golden.test.ts` — new golden suite (proposal §12.1 cases: section order, determinism, fingerprint sensitivity, escaping/injection, empty-record state, source disclosure/exclusions).
2. `packages/core/test/compiler-front-sections.test.ts`, `packages/server/src/{ideate.e2e,compile-routes,ideate-routes}.test.ts`, `packages/core/test/{record-hygiene-golden,compiler-ideation-golden}.test.ts` — update produced-version assertions to `1.6.0/1.8.0/1.9.0`.

### Commands

1. `npm test -- segment-reconciliation-golden`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. The full `npm test` (not a filter) is the correct boundary for this ticket because the version bump ripples across both packages' suites; a filtered run would hide a missed produced-version assertion until CI.

## Outcome

Completed: 2026-06-24

Added the segment-reconciliation prompt compiler/template, exported the profile APIs, updated compiler/template/contract versions to `1.6.0`/`1.8.0`/`1.9.0`, and registered the active template authority docs.

Verification: `npm test -- segment-reconciliation-golden`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
