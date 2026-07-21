# User-facing response

Architecture review complete. I found one verified deepening opportunity.

## Deepen Shelf transition projection behind the engine surface

**Strong · duplicated domain-rule dependency**

Files:

- `games/tides/engine/src/index.ts`
- Engine tests for `projectNextDryOut` and `projectWashRefill`
- UI call sites of those two public functions (verification only)

Evidence:

- Two public projection functions independently implement the same three rule groups: Shelf capacity, refill order, and overflow.
- Both functions are already exercised through the engine's public surface.
- The UI calls only those public engine functions, so it does not depend on either loop's internal shape.
- Deletion test: one internal Shelf-transition implementation could replace both duplicated loops while preserving the two existing public functions and their callers. The duplicate rule implementations can then be deleted without moving responsibility across a package seam.
- Authority check: `docs/adr/0004-engine-public-surface.md` endorses keeping Shelf transition calculations behind the existing engine export.
- The fixture identifies exact symbols but supplies no source line numbers, so the report records symbol-level references rather than inventing line references.

Before: two public functions each own capacity, refill-order, and overflow calculations.  
After: the same two public functions form a small stable interface over one deeper internal Shelf-transition implementation.

Problem: one engine rule set has two implementations that can drift independently.

Solution: keep both public projections, but make one engine-internal implementation own the shared Shelf transition rules.

Wins:

- Locality: Shelf rules stay together
- Leverage: both projections improve
- Interface: public surface unchanged
- Tests hit engine behavior
- Drift surface becomes one

**ADR endorsement:** ADR 0004 already places this calculation behind the engine export; this deepening reinforces that boundary without reopening the decision.

Top recommendation: **Deepen Shelf transition projection behind the engine surface.** It removes duplicated rule ownership while preserving the authority-backed public seam.

Report path: `/tmp/architecture-review-20260721T000000Z.html`  
Opener command: `xdg-open /tmp/architecture-review-20260721T000000Z.html`

The opener was not dispatched because browser/GUI automation is unavailable in this fixture.

Which of these would you like to explore?

---

# Compact execution record

- Mode: fixture simulation; no product or documentation changes made.
- Inputs read: candidate `SKILL.md`, candidate-local `HTML-REPORT.md`, task `prompt.md`, and task `input.md` only.
- Repository authorities and code facts: consumed from the task-local dossier as complete fixture evidence.
- Delegation: not used. The dossier requires an explicit user request for delegated agents, and the skill invocation alone does not provide it.
- Working-tree protection: the unrelated changes to `docs/notes.md` and `.claude/skills/tdd/SKILL.md` were left untouched.
- Candidate promoted: duplicated Shelf transition calculation in `engine/src/index.ts`.
- Candidate screened out: capture-envelope flow. ADR 0007 assigns Capture to the game UI, and the backend consumes the envelope without importing the UI, so the supplied evidence does not show a responsibility leak.
- Candidate screened out: `wash-plan.ts`. Its 18-line pure presentation mapper sits at the UI boundary and already has direct snapshot coverage; the supplied evidence does not show coupled behavior that would survive the deletion test.
- Report generation: simulated as a fresh self-contained HTML report at the path above, with one candidate card, a before/after call-graph collapse, the ADR endorsement, and one Top recommendation.
- Report opening: simulated environment check; no GUI opener run because browser automation is unavailable.
- Checkpoint: stopped after the required exact question and before grilling or implementation.
