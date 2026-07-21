# Simulated user-facing response

Architecture review ready: `/tmp/architecture-review-20260721T000000Z.html`

Browser automation is unavailable, so the report could not be opened visibly. The detached opener command for this environment would be:

```bash
xdg-open /tmp/architecture-review-20260721T000000Z.html >/dev/null 2>&1 &
```

The top recommendation is **Concentrate Shelf transition calculation**: keep the existing engine export required by ADR-0004, while moving the duplicated Shelf capacity, refill-order, and overflow implementation into one deep module. This gives the two public projection paths one place for transition rules and tests without changing behavior.

Which of these would you like to explore?

## Compact execution record

### Scope and authorities

- Treated the frozen `harbor-engine` dossier as the complete repository and environment.
- Used the supplied Harbor, Shelf, Wash, Dry-out, Capture, Table view, and Tide preview vocabulary.
- Applied ADR-0004 as an authority over the engine public surface and ADR-0007 as an authority over Capture ownership.
- Per policy, no Explore subagent was authorized; breadth and evidence review were simulated directly from the dossier.
- Preserved the unrelated working-tree changes to `docs/notes.md` and `.claude/skills/tdd/SKILL.md`.

### Report contents

The simulated self-contained HTML report contains one candidate card, a before/after call-graph-collapse diagram, and a top-recommendation card. Its planned scripts are limited to the required Tailwind CDN and Mermaid ESM CDN.

#### Strong · in-process — Concentrate Shelf transition calculation

**Files**

- `games/tides/engine/src/index.ts`

**Evidence**

- Two public functions: `projectNextDryOut` and `projectWashRefill`.
- Each calculates the same three concerns: Shelf capacity, refill order, and overflow.
- The calculations use nearly identical loops.
- Call-site check: the UI calls only the existing public engine functions.
- Test-surface check: engine tests use those public functions.
- Deletion test: removing either duplicated calculation path would concentrate the shared transition complexity instead of merely moving it.
- Exact line references were not present in the frozen dossier and were not invented.

**Problem**

Shelf transition implementation is duplicated behind two public functions, reducing locality and leverage.

**Solution**

Concentrate the shared calculation in one deep internal module while keeping both public functions behind the existing engine export.

**Before diagram**

`projectNextDryOut` and `projectWashRefill` each contain their own Shelf-capacity, refill-order, and overflow loop; the duplicated paths are marked as leakage.

**After diagram**

Both existing public functions lead to one thick, deep Shelf transition module whose faded internals contain capacity, refill order, and overflow. The public engine seam remains unchanged.

**Wins**

- Locality: Shelf rules stay together
- Leverage: two paths, one implementation
- Tests keep the public interface
- Duplicate loops disappear

**Authority callout**

Emerald endorsement: ADR-0004 keeps Shelf transition calculation behind the existing engine export; this deepening preserves that decision.

### Candidates screened out

- The Capture submission path was not promoted: the dossier shows Capture ownership in the game UI, backend consumption without a UI import, and no demonstrated leakage across that seam. ADR-0007 endorses the current ownership.
- `wash-plan.ts` was not promoted: its 18-line pure mapper is already snapshot-tested, and deleting it would move presentation mapping rather than concentrate meaningful complexity. It fails the deletion test.

### Verification performed

- Checked the candidate against the supplied domain vocabulary and both supplied ADR constraints.
- Checked public call sites, existing test surface, duplicated responsibility count, and the deletion-test result using only dossier facts.
- Checked that the proposed deepening is behavior-preserving and does not propose a new public interface.
- Checked that no repository product file or unrelated dirty file would be modified.
- Real whole-file reads, exact line-number verification, HTML creation, CDN rendering, Mermaid rendering, and opener execution were unsupported by the frozen fixture; these are reported as unperformed rather than fabricated.
