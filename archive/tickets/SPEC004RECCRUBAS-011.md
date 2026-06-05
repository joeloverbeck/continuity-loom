# SPEC004RECCRUBAS-011: Phase-4 capstone — end-to-end CRUD gate and manual smoke runbook

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: None (verification-only) — adds one server-side e2e test; no production logic
**Deps**: SPEC004RECCRUBAS-008, SPEC004RECCRUBAS-009, SPEC004RECCRUBAS-010

## Problem

The spec's §Verification gate spans surfaces no single implementation ticket owns: the full record CRUD loop over HTTP across representative types, working-set membership persistence, reference-integrity protection, secrets/privacy (no payload/prose in logs), the `127.0.0.1`-only bind, and the cross-cutting "no raw-JSON editor anywhere" invariant. This capstone exercises the composed pipeline end-to-end — a CI-runnable server-side e2e test plus a manual UI smoke runbook for the browser-only portions — and introduces no new production logic.

## Assumption Reassessment (2026-06-05)

1. All upstream surfaces exist by this ticket's `Deps`: record CRUD + config + working-set routes (SPEC004RECCRUBAS-003/-004) on the server; shell/editors/browser/working-set UI (-005..-010) on the web. The existing server e2e pattern is `packages/server/src/gate.e2e.test.ts`; the server already binds `127.0.0.1` (SPEC-001/002) and redacts logs (SPEC-001). The leaf set `{-008, -009, -010}` transitively covers every prior ticket (-008→-007→-005→-003,-004→-002; -007→-001; -009→-004; -010→-006→-005,-001 & -004).
2. Spec `specs/SPEC-004-...md` §Verification enumerates the gate bullets exercised here (typecheck/lint/test/build; route round-trips; malformed-400; reference-integrity; working-set membership; no-open-project errors; no-payload-in-logs; manual smoke through the app; 127.0.0.1 bind).
3. Cross-artifact invariant mapping (each §Verification bullet → its own proof surface): full CRUD loop → server e2e; reference-integrity → server e2e with referencing fixture; working-set membership without full brief → server e2e against the -002-relaxed schema; no payload/prose in logs → server e2e log-capture assertion; 127.0.0.1 bind → server e2e / existing bind assertion; no raw-JSON editor → repo-wide grep-proof over `packages/web/src`; manual UI loop (create one record per category, edit, filter, blocked delete, edit three globals, toggle working set) → manual runbook.
4. FOUNDATIONS §23/§29.9 (secrets: no key/payload in logs) and §24 (local-first: localhost-only bind) are the security invariants this capstone re-asserts at the integrated level; it adds no behavior that could weaken them — it only observes.

## Architecture Check

1. A single trailing capstone keeps the integrated gate in one place and avoids burdening each implementation ticket with cross-surface assertions it cannot own alone. Splitting CI-runnable server e2e from a manual UI runbook reflects the real test boundary (no browser-automation infra in the vitest+jsdom setup).
2. No backwards-compatibility shim: verification-only; it exercises the pipeline the prior tickets composed and modifies no production file.

## Verification Layers

1. End-to-end record lifecycle over HTTP (create→list→get→update→archive→delete) for representative atomic + CAST MEMBER types -> server e2e test.
2. Reference-integrity blocks a referenced delete with enumerated referrers -> server e2e test.
3. Working-set membership round-trips without a full brief -> server e2e test against the relaxed schema.
4. No record payload/prose/brief text appears in captured logs -> server e2e log-capture assertion (FOUNDATIONS §23).
5. No raw-JSON record editor exists in the web tree -> repo-wide grep-proof.
6. Browser UI loop (per UI-WORKFLOWS "Done Means") -> manual runbook checklist.

## What to Change

### 1. Server-side e2e gate test

Add `packages/server/src/phase4-gate.e2e.test.ts` that, against a temp project, drives the composed route layer: create one record of several categories (entity/cast/knowledge/space/causal/relationship), edit + archive + delete, hit a reference-integrity block, round-trip a story-config singleton, round-trip working-set membership (no full brief), and assert captured logs contain no payload/prose text. Re-enumerate expected counts from the fixture at test start (no hardcoded totals).

### 2. Manual UI smoke runbook

In this ticket's body, a step-by-step runbook the implementer follows by hand against `npm run dev`: create/open a project; create one record per category through typed editors; edit one; filter the browser by type/status/search/reference; attempt a delete blocked by a reference and observe the guiding message; edit all three global-config singletons; toggle working-set membership and confirm it persists across reload; confirm the server is reachable only on `127.0.0.1`. Each step lists its expected observable result.

### 3. No-raw-JSON grep-proof

A grep-proof command (in Commands) asserting no record editor renders a raw-JSON `<textarea>`/JSON.parse-backed control in `packages/web/src`.

## Files to Touch

- `packages/server/src/phase4-gate.e2e.test.ts` (new)

## Out of Scope

- Any production logic or new feature — this ticket only verifies.
- Browser end-to-end automation (Puppeteer/Playwright) — not in v1 test infra; the UI loop is a manual runbook.
- Phase-5+ surfaces (custom CAST MEMBER editor, full brief, validation, compiler, transport).
- Governing-doc status updates — SPEC004RECCRUBAS-012.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/server/src/phase4-gate.e2e.test.ts` drives the full CRUD + config + working-set + reference-integrity pipeline against a temp project and passes, with counts re-enumerated from the fixture.
2. The e2e log-capture assertion confirms no record payload/prose/brief text is logged.
3. The no-raw-JSON grep-proof returns no matches in `packages/web/src`.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all pass.
5. The manual UI smoke runbook is completed with every step's expected result observed.

### Invariants

1. The integrated pipeline never produces a silent dangling reference and never logs payload/prose/keys (FOUNDATIONS §23/§29.9).
2. The server is reachable only on `127.0.0.1` (FOUNDATIONS §24).

## Test Plan

### New/Modified Tests

1. `packages/server/src/phase4-gate.e2e.test.ts` — composed end-to-end gate + log-capture assertion.

### Commands

1. `npx vitest run packages/server/src/phase4-gate.e2e.test.ts`
2. `grep -rEn "JSON\\.parse|raw.?json" packages/web/src/records packages/web/src/config || echo "no raw-JSON editor — OK"`
3. `npm test && npm run typecheck && npm run lint && npm run build`
