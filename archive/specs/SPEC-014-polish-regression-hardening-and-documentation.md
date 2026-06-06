# SPEC-014 — Polish, regression hardening, and documentation

Status: ✅ COMPLETED
Phase: 14 (Implementation Order — Continuity Loom v1) — the final phase
Depends on: SPEC-001 … SPEC-013 (all implemented; the full create → validate → compile → preview → send → candidate → accept → archive → reminder loop exists and the tame demo exercises it end-to-end)
Governing authority: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` §"Phase 14" (the phase gate), `docs/requirements-version-1/TESTING-STRATEGY.md` (the test doctrine this phase realizes)
Supporting authorities: `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` (storage backup/migration/recoverability behavior to document + harden), `docs/compiler-contract.md` + `docs/prompt-template.md` (golden-output contract), `docs/FOUNDATIONS.md` §29 (the hard rules this phase armors with regressions)
Engaged by relevance: `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md` — Phase 14 adds regression armor over the rules these define; it adds **no** new rule to any of them.

> Section set: the canonical `specs/` set (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions) — used because no live spec in `specs/` set a house convention; preamble embellishments mirror archived SPEC-013 for series consistency.

---

## Brainstorm Context

**Original request.** "We've just implemented SPEC-013 (archived). Analyze `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (and supporting docs) to create the next spec in `specs/`, aligned with `docs/FOUNDATIONS.md` and relying on `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/story-record-schema.md`, `docs/stress-coverage-matrix.md`, `docs/stress-suite.md`."

**Roadmap selection.** Phases 1–13 are all `✅ Implemented` (SPEC-001 → SPEC-013, archived). The next — and final — not-yet-implemented unit in the implementation order is **Phase 14 — Polish, regression hardening, and documentation**. Its dependency is satisfied: Phase 14 says "harden the system *after* the full loop exists," and the full loop now exists and is demo-exercised. Next number across `specs/` (empty) + `archive/specs/` (max 013) is **014**.

**Phase 14 is a hardening basket, not a feature.** The order doc's "Done Means" forbids introducing any *new* product behavior in v1 (no branches, cloud authority, automatic prose-to-canon, LLM record mutation, permanent prompt archives by default, API-key leakage, or validation override). The correct shape of this spec is therefore overwhelmingly **regression tests + golden-output stabilization + documentation**, with runtime changes kept minimal and YAGNI-strict. Each Phase-14 gate item is scoped as a *delta over what already exists*, not a from-scratch build.

**Premise verification (file:line).**

- **Compiler golden** — one in-run determinism test exists at `packages/core/test/compiler-golden.test.ts` (asserts `second.prompt` byte-equals `first.prompt` and equal fingerprint, lines 148–149). There is **no checked-in canonical golden prompt file** to detect drift across runs/commits. Compiler entry is `compilePrompt(snapshot: ValidationSnapshot)` (`packages/core/src/compiler/compile-prompt.ts:11`).
- **Validation diagnostic shape** — already rich: `severity`, `whyItMatters`, `suggestedActions` on the diagnostic type (`packages/core/src/validation/types.ts:22,26,27`); ~45 codes registered. No invariant test asserting every blocker carries ≥1 actionable suggestion / unique codes.
- **Storage backup/migration** — backup via `VACUUM INTO` exists (`packages/server/src/project-store.ts:378`); version gate via `evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, …)` (`packages/server/src/project-store.ts:155,327`) returning `"ok" | "incompatible-version" | "migration-required"` (`packages/core/src/project-storage.ts:22,55,64`; `LOOM_SCHEMA_VERSION = 1` at `:5`). **No migration *runner* exists** — and v1 needs none (LOCAL-FIRST-STORAGE.md:93 defers the runner to later-phase work; Phase 14 is terminal, so there is no Phase 15 to build it). Open-failure path is recoverable (open is blocked with a clear `migration-required` diagnostic, leaving the store intact).
- **Accepted-prose exclusion** — the compiler consumes only a `ValidationSnapshot` and **never imports the accepted-segment store** (the accepted archive lives in `packages/server/src/{accepted-routes,record-repository,record-tables}.ts`; nothing in `packages/core/src/compiler/` references it except the *user-authored* handoff-note placeholder). Contamination blocker `promptFacingProseContamination` is enforced in `packages/core/src/validation/rules/universal-blockers.ts:388,415,427`. Tests are scattered (validation-blockers, stress-coverage, demo-fixture); no single consolidated regression file.
- **API-key leakage** — boundary tests exist (`packages/server/src/project-store.secret-boundary.test.ts`; `packages/server/src/accepted-routes.test.ts` log/response capture). Gap: no test asserting the *compiled prompt string* and *error-path* surfaces are key-free.
- **UI perf** — `RecordBrowser.tsx` already memoizes filtering/grouping (`useMemo`, lines 141–143) and uses `@tanstack/react-table` (line 7). Existing test uses 4 records; no dense-dataset test.
- **User docs** — `README.md` exists (developer-facing); `docs/user-guide.md` does **not** exist (confirmed absent). All product docs under `docs/requirements-version-1/` are requirements/dev docs, not an end-user guide.
- **Tooling** — `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all present and CI-gated (per CLAUDE.md); Vitest runner; ~68 test files across the three packages.

**Scope decisions (settled with the user at brainstorm time).**

1. **One spec.** Phase 14 ships as a single `SPEC-014` covering all 7 gate items, matching the one-spec-per-phase convention; `spec-to-tickets` will fan it into one ticket per gate item.
2. **User docs = markdown guide.** End-user documentation ships as a new `docs/user-guide.md` (plus a README pointer). **No in-app help UI** — that would be new product behavior, out of scope for a hardening phase, and the gate only requires that "documentation explains" the loop.
3. **UI perf = test-first.** Add a dense-record (~500–1000) smoke test asserting correctness and acceptable behavior; keep the existing memoization/TanStack approach. Introduce virtualization/pagination **only if** the test surfaces a real problem (deferred unless triggered).
4. **No migration runner.** Phase 14 *documents and hardens* migration/version/recoverability behavior (detection + recoverable open-failure + backup-before-risk guidance); it does **not** build a schema-migration runner (out of v1 scope, no later phase).

**Final confidence:** ~96% after scope-edge confirmation.

---

## Problem Statement

Continuity Loom has a complete, demo-exercised v1 loop, but its hardest invariants are protected unevenly and it ships with no end-user documentation. The compiler's determinism is asserted only within a single test run, not against a frozen baseline that would catch silent prompt drift across commits. Accepted-prose exclusion and API-key safety are covered by scattered happy-path tests rather than dedicated regression suites that pin the constitutional boundaries. Validation diagnostics carry the right fields but lack an invariant test guaranteeing every blocker stays actionable. Storage migration/recoverability behavior is implemented but undocumented and under-tested. The record browser has no dense-dataset coverage. And there is no user-facing guide explaining how the loop works, that data is locally owned, or that accepted prose never feeds the next prompt.

Phase 14 — the final v1 phase — closes these gaps. It adds **regression armor, golden-output stabilization, and documentation** without introducing any new product behavior. Every change either pins an existing invariant against regression or explains existing behavior to the user.

## Approach

Close each Phase-14 gate item as a delta over the current implementation. No compiler/validation/schema/prompt-template *behavior* changes (validation message wording may be refined for clarity only where a message is demonstrably unclear; codes, severities, and gating are untouched).

1. **Compiler golden-output stabilization.** **Extend the existing `packages/core/test/compiler-golden.test.ts`** — which today compiles a synthetic `goldenInput()` and asserts in-run determinism, section order (`promptSectionOrder == SECTION_ORDER`), and fixed `metadata.versions`, but holds **no frozen cross-run baseline** — by adding a checked-in canonical golden artifact (a frozen expected prompt string/fixture file) and a test that asserts byte-identical output against the stored golden. Source the frozen golden from the tame demo's first-segment snapshot — assembled from the exported `demoRecords` / `demoGenerationSession` / `demoStoryConfig` (deterministic, already schema-valid) — so the golden tracks a realistic prompt, not a toy. The test must fail loudly on any prompt drift and be deliberately re-baselined only when the versioned template/compiler/contract changes (per TESTING-STRATEGY §"Deterministic compiler tests"). Retain `goldenInput()`'s existing in-run determinism, fingerprint, section-order, and version assertions.

2. **Validation diagnostics — clarity invariants + light refinement.** Add an invariant test over the production validation rules asserting: every emitted blocker carries ≥1 `suggestedActions` element; diagnostic `code` values are unique across the `DIAGNOSTIC_CODES` registry; every diagnostic has a non-empty `message` and `whyItMatters`; warnings never gate preview/send while blockers always do. Scope the uniqueness check to the registry / emitted diagnostics — do **not** assert that every registered code is emitted, since `acceptedProseContamination` is currently registered (`packages/core/src/validation/types.ts`) but fired by no production rule (the verbatim-prose path emits `promptFacingProseContamination`); removing that orphan is a code change out of this hardening phase's scope. Refine specific diagnostic *message text* only where the brainstorm/implementation surfaces a genuinely unclear message — no code, severity, or field changes.

3. **Storage backup/migration — document + harden recoverability.** Document, in `docs/user-guide.md` (and cross-referenced from LOCAL-FIRST-STORAGE if useful), the backup workflow, the version/compatibility gate, and the recoverable open-failure behavior (`migration-required` / `incompatible-version` leave the project intact and produce a clear diagnostic). Add a test asserting that opening a store whose `user_version` is ahead/behind yields the correct recoverable diagnostic **without mutating or corrupting the store**, and that a backup copy opens cleanly. **No migration runner** is built.

4. **UI performance for dense record projects — test-first.** Add a `RecordBrowser` test that renders ~500–1000 synthetic records and asserts correctness (filter/search/group still produce correct results) and that the surface remains usable (renders without error; existing memoization holds). Add virtualization/pagination only if this test demonstrates an unacceptable problem (deferred otherwise).

5. **API-key leakage regressions.** Add tests proving no API key leaks into (a) the **compiled prompt string** produced by `compilePrompt`, and (b) **error-path** responses/logs (e.g., send failure, invalid project). Use fake key patterns. These complement the existing project-store/route boundary tests. Map **every** surface in the TESTING-STRATEGY §"Security tests" list to a covering test (cite existing, add new, or mark N/A with reason): **project metadata** + **SQLite project store** — existing `packages/server/src/project-store.secret-boundary.test.ts`; **accepted segment metadata** — existing `packages/server/src/accepted-routes.test.ts`; **compiled prompt string** — new (a); **prompt preview text** — new (the preview renders the compiled prompt; assert key-free); **logs** — new (b, error-path); **generated demo fixtures** — existing demo-fixture coverage (assert no key in bundled demo data); **candidate session serialization if any** — N/A unless a persisted candidate session exists (v1 stores no discarded/regenerated candidates; confirm at decomposition); **generated files** — covered by the storage/backup surface (the `VACUUM INTO` backup copy; confirm at decomposition). No surface is left unmapped.

6. **Accepted-prose exclusion regressions (consolidated).** Add a dedicated regression test file that pins the §29.8 / §29.4 boundary: (a) the compiler consumes only a `ValidationSnapshot` and the accepted-segment store is **never** consulted during compilation; (b) verbatim accepted/rejected/superseded text in any prompt-facing handoff field trips `promptFacingProseContamination` and disables preview/send; (c) a clean user-authored handoff note is allowed; (d) the accepted-segment browser exposes no "include in prompt" affordance; (e) **no automatic prose-derived summary field exists** in the generation-time brief schema — the only legitimate prior-prose field is the user-authored `prior_accepted_prose_status_or_handoff_note` (per FOUNDATIONS §10). This consolidates today's scattered coverage into one named regression suite and covers all six checks in TESTING-STRATEGY §"Regression tests for accepted-prose exclusion".

7. **User-facing documentation.** Add `docs/user-guide.md` explaining, for an end user: the loop (records → validate → compile → preview → send → candidate → accept → archive → manual record update → repeat); local-first project ownership (the project folder is yours; copy/back it up; nothing is uploaded except the prompt you send); prompt preview (what it is, why it's gated by validation); OpenRouter setup (where the key lives — global secret storage, never the project; configuring model/temperature/max tokens); the candidate lifecycle (edit / regenerate / discard / accept); and the manual-record-update responsibility after accepting durable changes (the app reminds; the app never extracts canon from prose). Add a short pointer from `README.md`. Keep a "Why no branches / why accepted prose isn't prompt context / is my data uploaded?" FAQ aligned with FOUNDATIONS.

## Deliverables

- **`packages/core/test/compiler-golden.test.ts` (extended) + checked-in golden fixture** — a checked-in canonical golden prompt (frozen string/fixture file) and a byte-identical comparison test sourced from the tame demo's first-segment snapshot (built from exported `demoRecords` / `demoGenerationSession` / `demoStoryConfig`); the file's existing in-run determinism, fingerprint, section-order, and version assertions retained.
- **`packages/core/test/` validation clarity-invariant test** — asserts blockers carry ≥1 `suggestedActions` element, codes unique across the `DIAGNOSTIC_CODES` registry, non-empty `message`/`whyItMatters`, warnings non-gating; plus any minimal message-text refinements.
- **Storage hardening** — a recoverable version-gate/backup test (`@loom/server` and/or `@loom/core`) asserting `migration-required`/`incompatible-version` are recoverable + non-mutating and a backup opens cleanly; migration/version/recoverability behavior documented in `docs/user-guide.md`.
- **`packages/web/` dense-record test** — `RecordBrowser` correctness + usability under ~500–1000 records; virtualization/pagination only if triggered.
- **API-key leakage regression tests** — compiled-prompt-string, prompt-preview, and error-path/log key-absence assertions (fake keys), complementing existing boundary tests; all nine TESTING-STRATEGY security surfaces mapped to a covering test, a new test, or a documented N/A.
- **Consolidated accepted-prose exclusion regression file** — compiler-never-consults-archive, handoff-contamination blocks, clean handoff allowed, no "include in prompt" affordance, no automatic prose-derived summary field exists.
- **`docs/user-guide.md`** — end-user guide covering the loop, ownership, prompt preview, OpenRouter settings, candidate lifecycle, manual record updates, and a FOUNDATIONS-aligned FAQ; **`README.md`** pointer added.
- **`docs/requirements-version-1/IMPLEMENTATION-ORDER.md`** — mark Phase 14 `✅ Implemented via SPEC-014` and check its phase-gate boxes (bookkeeping, at implementation time).

## FOUNDATIONS Alignment

| Principle / §29 hard-fail | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §29.4 Prompt compilation (deterministic; no accepted prose in prompts) | aligns | Golden-output test pins byte-identical compilation; accepted-prose regression proves the compiler consumes only a `ValidationSnapshot` and never the archive @ prompt-compilation. |
| §29.5 Validation (fail-closed; blockers ≠ warnings) | aligns | Clarity-invariant test guarantees blockers stay actionable and gating; warnings stay non-gating; no gating behavior changes @ validation gate. |
| §29.8 Accepted-prose archive (segments excluded from prompts; reminds user) | aligns | Consolidated regression file pins exclusion + no "include in prompt" affordance; documents the durable-change reminder for users @ archive + compiler + docs. |
| §29.9 Prompt audit & secrets (no key/prompt logging; no key in story files) | aligns | New leakage regressions assert keys are absent from the compiled prompt string and error paths @ transport + prompt + logs. |
| §29.10 Data ownership (local, copyable, recoverable) | aligns | Backup/version-gate recoverability test + user-guide ownership/backup section reinforce local ownership; no remote authority added @ storage + docs. |
| §29.1 Identity (no autonomous generation / plot rails / branches) | aligns | Pure hardening + docs; introduces no generation logic, plot machinery, or branches; FAQ explicitly states "no branches" @ docs. |
| §29.2 Continuity authority (no LLM record mutation / prose-to-canon) | aligns | No LLM touches records; docs reiterate the manual-update responsibility; accepted prose stays non-canonical @ docs + tests. |
| §29.11 Quality & workflow checks | aligns | Improves validation legibility (clarity invariants), preserves prompt inspectability (golden), and helps users update records after durable changes (user guide). |

No §29 hard-fail is tripped. Phase 14 is terminal: it adds regression armor *for* the hard rules rather than deferring any clearance, so there is no interim tension. The deliberate non-build of a migration runner is settled by LOCAL-FIRST-STORAGE.md (runner is later-than-v1) and satisfies LOCAL-FIRST's "Done Means" because version fields exist and migration/open failures are recoverable.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` all pass (including the `@loom/core` import-boundary test — golden fixtures stay framework/node-free).
- The golden-output test fails if the compiled prompt for the fixed snapshot changes by even one byte, and passes on identical inputs/versions.
- The validation clarity-invariant test passes: every blocker has ≥1 `suggestedActions` element, codes are unique across the `DIAGNOSTIC_CODES` registry, messages/`whyItMatters` non-empty, warnings non-gating.
- The storage recoverability test shows `migration-required`/`incompatible-version` produce clear, non-mutating, recoverable diagnostics and a backup copy opens cleanly.
- The dense-record `RecordBrowser` test (~500–1000 records) renders correctly and filters/searches/groups correctly without error.
- Leakage regressions: fake API keys never appear in the compiled prompt string, prompt-preview text, or error-path responses/logs; each of the nine TESTING-STRATEGY security surfaces resolves to a covering test, a new test, or a documented N/A.
- Accepted-prose regression file passes: compiler never consults the archive, handoff contamination blocks preview/send, clean handoff allowed, no "include in prompt" affordance exists, no automatic prose-derived summary field exists.
- `docs/user-guide.md` exists and covers the loop, ownership, prompt preview, OpenRouter settings, candidate lifecycle, and manual record updates; `README.md` links to it.
- `IMPLEMENTATION-ORDER.md` marks Phase 14 implemented with its gate boxes checked.

## Out of Scope

- **Any new product behavior.** No new UI surfaces, no in-app help/tooltips, no generation/validation/compiler/schema/prompt-template behavior changes (validation *message wording* may be clarified only; gating/codes/severities are untouched).
- **A schema-migration runner.** v1 ships version detection + recoverable open-failure + backup only; the runner is later-than-v1 (LOCAL-FIRST-STORAGE.md:93) and there is no Phase 15.
- **UI virtualization/pagination** unless the dense-record test demonstrates an unacceptable problem (deferred-unless-triggered).
- **Dashboard latest-segment surfacing** (remains deferred per the order doc).
- **Live OpenRouter calls in tests** (mocked transport only, per TESTING-STRATEGY).
- **Desktop packaging, cloud sync, collaboration, encryption** (out of v1 entirely).
- **New stress-suite cases or schema/contract amendments** — this phase armors existing rules; it does not add them.

## Risks & Open Questions

- **Golden brittleness vs. value.** A byte-identical golden test will fail on any intentional template/compiler/contract change. *Resolution direction:* document in the test (and user/dev notes) that the golden is re-baselined *deliberately* only when a versioned template/compiler/contract field changes — exactly the TESTING-STRATEGY failure mode ("snapshot tests accepted blindly after prompt drift") to guard against. Pin the golden's source snapshot to a stable fixture (the demo first-segment snapshot, via the exported demo symbols) and keep both the frozen baseline and the in-run assertions in `compiler-golden.test.ts` so unrelated fixture churn doesn't ripple.
- **Validation message refinement scope creep.** "Refined for clarity" could tempt broad message rewrites. *Resolution direction:* limit to messages demonstrably unclear during this phase; the clarity-invariant test, not wholesale rewrites, is the deliverable. Any message change must keep code/severity/field stable.
- **Dense-record test threshold.** The exact record count and what "acceptable" means (no thrown error + correct filtering vs. a render-time budget) is a decompose-time detail. *Resolution direction:* assert correctness + no-error at ~500–1000 records first; only add a timing budget or virtualization if a real problem appears.
- **Leakage test realism.** Asserting "no key in the compiled prompt" is only meaningful if the test threads a fake key through a realistic path (settings/transport) rather than a trivially key-free snapshot. *Resolution direction:* seed a fake key into the global secret/settings surface and assert it is absent from the prompt and error outputs — not merely absent from an input that never carried it.
- **Where storage/migration docs live.** User-facing recoverability/backup guidance belongs in `docs/user-guide.md`; deeper rationale already lives in LOCAL-FIRST-STORAGE.md. *Resolution direction:* user guide gets the actionable "how to back up / what a version mismatch means" section; avoid duplicating the requirements doc.

## Outcome

Completed: 2026-06-06

What changed:
- Implemented and archived `SPEC014POLREGHAR-001` through `SPEC014POLREGHAR-008`.
- Added frozen compiler golden coverage, validation clarity invariants, storage recoverability/backup regression coverage, dense `RecordBrowser` coverage, API-key leakage regressions, accepted-prose exclusion regressions, and `docs/user-guide.md` with a README pointer.
- Updated `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` to mark Phase 14 implemented via SPEC-014 and check all Phase 14 gate items.

Deviations from original plan:
- The storage recoverability test updates both project metadata schema version and SQLite `user_version` to reach the live compatibility gate, because mismatched metadata/store versions are rejected earlier as invalid metadata.
- The dense browser smoke runs at 500 records with an explicit 10s timeout for full-suite stability.
- The accepted-prose compiler grep proof checks import specifiers rather than all compiler source text because prompt constants legitimately contain accepted-prose exclusion wording.

Verification results:
- Targeted Phase-14 regression bundle passed: 7 files, 33 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 72 files, 429 tests.
- Docs/ledger proof passed: `docs/user-guide.md` exists, README links it, and `IMPLEMENTATION-ORDER.md` contains `Implemented via SPEC-014`.
