# SPEC026MUTDRIROB-023: Document and queue secondary-tier follow-ups

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — adds documentation queuing the deferred secondary-tier hardening scope; no production behavior change, no implementation.
**Deps**: archive/tickets/SPEC026MUTDRIROB-004.md

## Problem

The report's secondary criticality audit (§4) sequences the next hardening targets — snapshot/reference integrity first, then server security and durability — explicitly *after* SPEC-026. That scope must be recorded as future spec scope so it is not lost, without pulling any implementation into this spec. This trailing docs-only ticket queues those follow-ups.

## Assumption Reassessment (2026-06-20)

1. `docs/robustness-testing.md` exists from archive/tickets/SPEC026MUTDRIROB-004.md (the doc this ticket appends the queued scope to) — hence the Deps; the secondary-tier candidates are enumerated in `reports/prompt-and-validation-robustness-hardening.md` §4.
2. SPEC-026 §Deliverables E4 + §Out of Scope confirm this ticket only *records* the deferred scope (snapshot-builder, record/reference/working-set integrity, server security envelope, SQLite durability, `uuidv7.ts`, core normalization helpers, OpenRouter helpers) and adds **no** implementation change.
3. Cross-artifact boundary under audit: this ticket touches documentation only; it must not create any spec or ticket for the secondary tier (that is a future brainstorm/spec decision).
4. FOUNDATIONS principle restated: no runtime doctrine; the queued note is a pointer to future hardening, subordinate to the existing authority hierarchy. No FOUNDATIONS amendment.

## Architecture Check

1. Recording the deferred scope as a queued-follow-ups note in the robustness doc keeps the sequencing decision discoverable without prematurely creating downstream specs/tickets — cleaner than leaving the report §4 sequencing as the only record.
2. No backwards-compatibility shims; documentation only.

## Verification Layers

1. Queue recorded -> grep-proof that `docs/robustness-testing.md` (or a clearly-linked section) lists the secondary-tier targets and their ordering (snapshot/reference integrity first, then security/durability).
2. No implementation -> grep-proof that this ticket's diff touches only documentation (no `packages/*/src`, no config, no new spec/ticket).

## What to Change

### 1. Queue the secondary-tier follow-ups

Append a "Queued secondary-tier hardening (deferred from SPEC-026)" section to `docs/robustness-testing.md` (or a dedicated note it links): list the report §4 candidates with their recommended order — snapshot/reference integrity first, then server security envelope, then SQLite/project durability — and state that each becomes its own future spec, not backlog to revive automatically.

## Files to Touch

- `docs/robustness-testing.md` (modify) — queued-follow-ups section

## Out of Scope

- Any implementation of the secondary-tier targets (each is a future spec).
- Creating any spec or ticket for the secondary tier.
- Any change to `packages/*/src`, configs, or `packages/core/src/version.ts`.

## Acceptance Criteria

### Tests That Must Pass

1. `docs/robustness-testing.md` contains the queued secondary-tier section listing the §4 targets and their order (grep-proof).
2. The diff touches documentation only.
3. `npm run lint` passes.

### Invariants

1. No implementation change and no new spec/ticket is created by this ticket.
2. The note frames each target as a future spec, not auto-revived backlog.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is grep-proof on the queued-follow-ups section and a docs-only diff.`

### Commands

1. `grep -ni "secondary-tier\|snapshot/reference\|durability" docs/robustness-testing.md` — queued scope present.
2. `git diff --name-only` (at review) shows only `docs/robustness-testing.md` — docs-only.
3. Grep-proof + docs-only diff is the correct boundary: this ticket records future scope and writes no code.
