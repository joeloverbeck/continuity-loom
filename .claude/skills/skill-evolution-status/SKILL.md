---
name: skill-evolution-status
description: Read-only readiness census for evidence-gated skills in the current repository — reports only targets ready for Skill Evolution, eligible targets that remain blocked, and stores whose eligibility cannot be determined.
disable-model-invocation: true
---

# Skill Evolution Status

Run one read-only readiness census across `reports/skill-evidence/` in the current repository. This skill is a reporter, not an authorizer: the destination session's fresh Skill Evolution preflight remains final.

Arguments: none.

## Hard boundaries

- Read only: never write `events.jsonl` or `gate-status.json`, run a preflight or derive command that refreshes projections, claim a review, or modify a target.
- Census only: never diagnose incidents, inspect target prose semantically, propose repairs, invoke Skill Evolution, or record evidence.
- Current repository only: never search sibling repositories or a global evidence directory.
- Canonical mechanics only: use the sibling Skill Evidence Capture helper's event validation, target hashing, and gate derivation in memory; never duplicate eligibility thresholds or trust a stored projection as current.
- Safe uncertainty: never print an evolution command for self-targeting, an active timer, an owned review, an unreadable stream, or a missing target.

## Workflow

### 1. Run the census

From the repository root, run exactly:

```bash
node .claude/skills/skill-evolution-status/scripts/status.mjs
```

The helper discovers the repository root, scans every evidence store, validates `events.jsonl`, hashes each live target, and derives current gate state without persisting it. It distinguishes the two freshness proofs explicitly:

- a captured threshold session ID is ready only in another session that exposes a different ID; a no-ID destination remains blocked and waiting does not help;
- a missing threshold session ID uses the 12-hour clock, which another session cannot bypass.

Portability contract: the destination repository must contain compatible sibling Skill Evidence Capture and Skill Evolution skills at their standard `.claude/skills/` paths, plus the standard `reports/skill-evidence/` store. The helper fails safely when that contract is absent or incompatible.

_Done when the helper prints one reconciled census or a safe failure stating that nothing changed._

### 2. Relay the result and stop

Relay the helper output verbatim. Commands appear only under `Ready to evolve` and are already shaped for copy-paste into another top-level session. `Eligible but blocked` gives the active blocker and all available timing, ownership, quarantine, or routing detail. `Could not determine` names stores that might conceal eligibility but cannot be trusted. Closed, collecting, and current-hash-reset stores appear only in the omitted count.

Do not reinterpret readiness, add commands to blocked entries, suggest early review, or continue into evolution in this session.

_Done when the exact census or safe failure has been delivered and no further action was taken._
