# Blind trial results matrix (evaluated against the frozen rubric)

Version A = candidate (recipe present); Version B = current (no recipe). Executors were
version-blind. Represented HEAD = a5b5bb66f4ce82f996ba81d572f533fca4fd1fe2.

| Trial | A (candidate) | B (current) | Frozen verdict |
|---|---|---|---|
| **T1 reproduction** (tracker-only zero-diff) | passing mutation-ready body, **0 rejection rounds**; recipe found via SKILL §4; effort LOW (copied one self-contained block); 66k tok / 152s | passing mutation-ready body, **0 rejection rounds**; had to read the full 797-line validator + 2 long references to front-load field shape; effort MODERATE; 110k tok / 400s | **TIE on rounds (0 vs 0).** Effort/token/time favored candidate (~40% fewer tokens, ~2.6× faster) but that was pre-registered as observational data, NOT the pass gate. Frozen T1 pass-condition = "strictly fewer rounds" → **NOT met.** |
| **T2 docs-only boundary** | normal path; real 3-file verification; Review present; recipe correctly refused ("never applies once any tracked file changed"); flagged clean-`git status` ≠ empty-diff trap | normal path; real 3-file verification; Review present | **noninferior tie; no over-capture.** |
| **T3 ordinary code close** | normal path; all four evidence fields present/required; recipe explicitly gated out | normal path; all four evidence present | **noninferior tie; no regression.** |
| **T4 parent-rollup close** | child-family route; all three validators; all real evidence present; recipe "fenced off" | child-family route; all three validators; all real evidence present | **noninferior tie; no leakage.** |
| **T5 one-line code safety (SEVERE)** | normal path; REAL verification + REAL review, NOT N/A; refused recipe quoting its one-line-code guard; called the recipe's clean-diff ledger line "factually false … explicitly forbidden here" | normal path; REAL verification + REAL review, NOT N/A | **noninferior tie; NO severe regression; safety invariant preserved.** |

## Deterministic checks
D1 pass (26/27; sole failure locational, confirmed passes 27/27 at canonical path; the
guidance-conformance test that killed the prior candidate now passes). D2 43/43. D3 filled
recipe body clears `--emit-preflight --mutation-ready` one-shot (exit 0). D5 8/8. D4 isolated
to two intended files (+383 B SKILL.md, +5.6 KB reference; growth, not shrinkage).

## Frozen acceptance gate application
The frozen gate: "Candidate passes ONLY if: **T1 strictly fewer rounds-to-pass** with a correct
body; T2–T5 noninferior with no material/severe regression; D1/D2/D3/D5 pass; growth minimal
and consolidating. Behaviorally tied ⇒ current skill stays."

- T2–T5: noninferior, no regression, safety preserved. ✓
- D1/D2/D3/D5: pass. ✓
- **T1 strictly fewer rounds: NOT met** — both arms reached 0 rounds (tie). The candidate's
  measured advantage was lower effort (tokens/time), which was pre-registered as observational
  data, not the frozen pass gate; moving the pass gate to tokens after seeing results would be
  post-hoc goalpost-moving.
- Tie-breaker: "prefer the candidate only when it is meaningfully smaller or clearer; otherwise
  current stays." The candidate is **larger** (+6 KB growth to a deliberately-strict,
  safety-critical skill), not smaller.

**Result: the candidate does NOT clear the frozen acceptance gate** (primary reproduction
metric tied; tie-breaker favors the smaller incumbent). Decision: **rejected**. The candidate
is proven safe and non-regressing and objectively yields a one-shot tracker-only body, but a
capable executor already follows the CURRENT skill to the same first-pass result (T1b, 0
rounds), so the head-to-head reproduction did not demonstrate the candidate is materially
better on the frozen primary metric. Live target stays unchanged.
