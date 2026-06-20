# SPEC026MUTDRIROB-004: Add robustness-testing authority doc and ACTIVE-DOCS registry entry

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds `docs/robustness-testing.md` and registers it in `docs/ACTIVE-DOCS.md`; documentation only, no production behavior change.
**Deps**: SPEC026MUTDRIROB-001, archive/tickets/SPEC026MUTDRIROB-002.md, SPEC026MUTDRIROB-003

## Problem

The robustness regime's operational policy (enrolled scopes, commands, tool versions, coverage/mutation floors, the changed-source rule, full-run cadence, baseline/ratchet process, survivor classifications, equivalent-mutant disable rules, seed/replay policy, artifact retention, behavior-defect escalation) outlives any single ticket and must not be rediscovered from CI YAML. This ticket adds `docs/robustness-testing.md` as a development-assurance authority and registers it in `docs/ACTIVE-DOCS.md`, explicitly subordinate to FOUNDATIONS and the domain contracts and explicitly **not** a definer of prompt or validation behavior.

## Assumption Reassessment (2026-06-20)

1. `docs/ACTIVE-DOCS.md` exists and is the authority registry / change-intake map (confirmed this session); no `docs/robustness-testing.md` exists yet and no ACTIVE-DOCS robustness entry exists (confirmed).
2. SPEC-026 §Deliverables A3 + report §13.1 enumerate the doc's required contents and the registry-entry framing; the commands/versions it documents are created by SPEC026MUTDRIROB-001 (tool versions, mutation scripts), -002 (coverage commands/thresholds), and -003 (baseline/ratchet format) — hence the Deps.
3. Cross-artifact boundary under audit: the authority hierarchy in `docs/ACTIVE-DOCS.md` — the new doc must be registered as *development-assurance* authority subordinate to `docs/FOUNDATIONS.md` and the compiler/validation contracts, not as a behavior authority.
4. FOUNDATIONS principle restated: this doc adds **no** new runtime doctrine (report §13.2). It records assurance policy only; existing domain docs remain authoritative for compiler and validation behavior. No FOUNDATIONS amendment.

## Architecture Check

1. A standalone operational authority doc keeps assurance policy (thresholds, cadence, survivor disposition, seed policy) discoverable and reviewable in one place, cleaner than scattering it across CI YAML and config comments. Registering it in ACTIVE-DOCS preserves the single authority map.
2. No backwards-compatibility shims; purely additive documentation.

## Verification Layers

1. Doc exists with required sections -> grep-proof for each mandated heading in `docs/robustness-testing.md`.
2. Registry entry present and correctly scoped -> grep `docs/ACTIVE-DOCS.md` for the new row describing it as development-assurance authority that does not define prompt/validation behavior.
3. Commands documented match reality -> each command cited in the doc resolves to a script created in 001–003 (FOUNDATIONS/contract cross-check is manual review).

## What to Change

### 1. New authority doc

`docs/robustness-testing.md` covering: enrolled source scopes; commands + exact tool versions; coverage + mutation floors (P1/P2 90, P3 95 break, plus green/warning bands); the changed-source rule; full-run cadence (scheduled, not per-PR); baseline + ratchet process (`max(break floor, reviewed baseline)`); survivor classifications (the seven dispositions); equivalent-mutant narrow-disable rules; property seed + replay policy (`FC_SEED`/`FC_PATH`, fixed PR seed, rotating scheduled seeds); artifact retention + the no-external-dashboard decision; escalation when a campaign exposes a behavior defect.

### 2. ACTIVE-DOCS registry entry

Add a row to `docs/ACTIVE-DOCS.md` registering `docs/robustness-testing.md` as development-assurance authority, subordinate to FOUNDATIONS and domain contracts, explicitly stating it does not define prompt or validation behavior.

## Files to Touch

- `docs/robustness-testing.md` (new)
- `docs/ACTIVE-DOCS.md` (modify) — registry entry

## Out of Scope

- Any FOUNDATIONS amendment (none warranted — report §13.2).
- Queuing the deferred secondary-tier scope (SPEC026MUTDRIROB-023).
- Implementing the gates the doc describes (Phase E).

## Acceptance Criteria

### Tests That Must Pass

1. `docs/robustness-testing.md` exists and contains every mandated section (grep-proof).
2. `docs/ACTIVE-DOCS.md` contains the registry entry describing the doc as development-assurance authority that does not define prompt/validation behavior.
3. `npm run lint` passes (no broken doc links if link-checked).

### Invariants

1. The doc defines no prompt or validation behavior; domain contracts remain authoritative.
2. No FOUNDATIONS amendment is introduced.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is grep-proof on mandated headings and the ACTIVE-DOCS registry row.`

### Commands

1. `grep -n "robustness-testing" docs/ACTIVE-DOCS.md` — registry entry present.
2. `for s in "Survivor" "Ratchet" "Seed" "Cadence" "Floors"; do grep -qi "$s" docs/robustness-testing.md || echo "MISSING $s"; done` — mandated sections present.
3. Grep-proof is the correct boundary: this ticket changes documentation only and is verified by content presence, not runtime tests.
