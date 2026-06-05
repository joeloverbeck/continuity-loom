# SPEC006DETVALENG-008: Warnings + secret/API-key safety blocker

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` rule modules `validation/rules/warnings.ts` and `validation/rules/security.ts`; appends to the `validation/rules` barrel.
**Deps**: SPEC006DETVALENG-001

## Problem

Rule families 4 and 5 of the engine. Family 4 — **warnings** (`docs/compiler-contract.md` §6 "Warnings that must not block" / `docs/requirements-version-1/VALIDATION-ENGINE.md` "Warning examples"): prompt length / lost-in-the-middle risk; too many high-salience records; no sample utterances; sparse setting texture; no active clock/obligation/thread where the directive otherwise suffices; long active dossier may need a stronger current pin; low-drama scene may need sharper prose-craft pressure; old/resolved-but-selected record. Warnings never block and never compile into a prompt. Family 5 — **secret/key safety** (`VALIDATION-ENGINE.md` "Security/privacy implications" / `FOUNDATIONS.md` §23): an API-key-like string detected in a prompt-facing field is a **security blocker**, and diagnostics must never echo keys or copy large sensitive prose.

## Assumption Reassessment (2026-06-05)

1. The engine foundation (snapshot, `Diagnostic` with `Severity`, barrel) is created by SPEC006DETVALENG-001. This ticket adds `rules/warnings.ts` and `rules/security.ts` and appends both to `rules/index.ts`. Salience inputs exist on records (e.g. `salience` enums in `knowledge.ts`/`causal-pressure.ts`); sample-utterance presence is a CAST MEMBER dossier field (`cast-member-sections.ts`).
2. Binding source: `compiler-contract.md` §6 warning list; `VALIDATION-ENGINE.md` "Warning examples" + "Security/privacy implications"; `FOUNDATIONS.md` §23 secrets rules ("If a key is detected in a project file, prompt, or log, that is a security bug"). The existing record layer already rejects an `api_key` field on records (`packages/core/test/records.test.ts` shows `secretSchema.parse({... api_key ...})` throwing) — this ticket adds the *prompt-facing-field* key-scan at validation time, which the schema layer does not cover for free-text fields.
3. Shared boundary under audit: the append-only `validation/rules/index.ts` barrel and `ValidationRule` signature; parallel sibling with tickets 002–007 (append-only). Warning rules emit `severity: "warning"`; the security rule emits `severity: "blocker"`.
4. FOUNDATIONS §11 (warnings vs blockers must be distinct) and §23 (key safety) restated: warnings are app-surface diagnostics, never prompt instructions and never `isBlocked`-setting; a key-like string in a prompt-facing field is a blocking security diagnostic. These principles are under audit ahead of the spec narrative.
5. Fail-closed/secret-firewall surface named: the security rule is part of the secret firewall (§23/§29.9). It must detect key-like strings deterministically (regex/entropy/prefix heuristic over prompt-facing free-text fields) and emit a blocker whose `message`/`affected` **never echo the matched key** — the diagnostic names the field, not the value. No mutation, no LLM, no logging of the value (server-side logging discipline is ticket 009).

## Architecture Check

1. Warnings and the security blocker are separate modules because they have opposite severities and opposite consumer treatment (collapsible/quiet UI vs. prominent blocker) and must be independently testable; co-locating them in one ticket is justified only because both are small and round out the engine's non-completeness/non-matrix rules (spec batch (d)).
2. No backwards-compatibility aliasing/shims: net-new rule modules; the prompt-facing key-scan complements, and does not alias, the record-schema `api_key` rejection.

## Verification Layers

1. Each warning fires on a crafted snapshot and never sets `isBlocked` -> unit test asserting `severity === "warning"` and `result.isBlocked === false` when only warnings present.
2. API-key-like string in a prompt-facing field → security blocker -> unit test asserting `severity === "blocker"` and `isBlocked === true`.
3. Diagnostic never echoes the key -> grep/assertion test: the matched key substring does not appear in `message` or any `affected` value.
4. Warnings vs blockers distinct in data -> FOUNDATIONS alignment check (§11) + the partitioned `ValidationResult.blockers`/`warnings` arrays.

## What to Change

### 1. Warning rules

`packages/core/src/validation/rules/warnings.ts` — deterministic warning predicates emitting `severity: "warning"` diagnostics: prompt length/lost-in-the-middle estimate (deterministic size threshold over the snapshot), count of high-salience records over a threshold, no sample utterances selected, sparse setting texture, no active clock/obligation/thread where directive suffices, long active dossier needing a stronger pin, low-drama prose-craft hint, old/resolved-but-selected record.

### 2. Security rule

`packages/core/src/validation/rules/security.ts` — scan prompt-facing free-text fields for API-key-like strings (deterministic pattern/entropy/prefix heuristic); emit a `severity: "blocker"` security diagnostic that names the offending field via `affected` but never includes the matched value in `message` or `affected`.

### 3. Register rules

`packages/core/src/validation/rules/index.ts` (modify) — import `warningRules` and `securityRules`, spread both into `validationRules`.

## Files to Touch

- `packages/core/src/validation/rules/warnings.ts` (new)
- `packages/core/src/validation/rules/security.ts` (new)
- `packages/core/src/validation/rules/index.ts` (modify — created by SPEC006DETVALENG-001)
- `packages/core/test/validation-warnings-security.test.ts` (new)

## Out of Scope

- Universal completeness/blockers and matrix rows — tickets 002–007.
- Server-side payload/key logging discipline — ticket 009 (`/api/validate` route logs no brief/directive/key text).
- Web rendering of warnings (collapsible groups) — ticket 010.

## Acceptance Criteria

### Tests That Must Pass

1. Each warning fires on its crafted snapshot, emits `severity: "warning"`, and a warning-only result has `isBlocked === false`.
2. An API-key-like string in a prompt-facing field produces a `severity: "blocker"` security diagnostic with `isBlocked === true`, and the matched key never appears in the diagnostic text/refs.
3. `npm test -- validation` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. Warnings never set `isBlocked` and never become prompt instructions.
2. The security diagnostic identifies the field but never echoes the key value; detection is deterministic (no LLM).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-warnings-security.test.ts` — per-warning fire + non-blocking assertions; key-detection blocker + no-echo assertion.

### Commands

1. `npm test -- validation-warnings-security`
2. `npm run typecheck && npm run lint && npm test && npm run build`
