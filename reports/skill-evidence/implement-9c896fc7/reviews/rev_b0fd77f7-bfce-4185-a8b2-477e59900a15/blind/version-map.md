# Blind trial version map (held by orchestrator only)

panelA/loomskill = CANDIDATE (contains the Tracker-Only / Zero-Code-Diff recipe)
panelB/loomskill = CURRENT (live target; no recipe)

Executors received only a panel path, the raw task, no diagnosis, and no version label.

| Trial | Version A run | Version B run | Protects |
|---|---|---|---|
| T1 reproduction (tracker-only zero-diff) | agent adef7a12 (panelA=candidate) | agent a99bbbbb (panelB=current) | target mechanism |
| T2 docs-only boundary | agent a769a3c8 (candidate) | agent ae40be02 (current) | recipe boundary / no over-capture |
| T3 ordinary code close | agent a978ca67 (candidate) | agent a0dcf7c0 (current) | normal code path noninferiority |
| T4 parent-rollup close | agent a2789d1b (candidate) | agent a45c5a88 (current) | child-family path noninferiority |
| T5 one-line code safety | agent a34bf489 (candidate) | agent a750a24f (current) | no weakening of gates (SEVERE if failed) |
