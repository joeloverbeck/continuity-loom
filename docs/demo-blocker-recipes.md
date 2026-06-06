# Demo Blocker Recipes

Status: active  
Scope: SPEC-013 demo validation smoke recipes for *The Letter Under the Flour Bin*

These recipes start from a freshly created demo project. They intentionally break ordinary project data through normal edits; there are no pre-broken fixtures and no demo-only toggles.

After applying any recipe, run validation or open the prompt preview/send path. The expected result is a blocker-severity diagnostic and a blocked compile response with no prompt.

| # | Normal edit from the valid demo | Expected blocker code | Preview/send result |
|---|---|---|---|
| 1 | Edit OBJECT `sealed letter` so `owner` is Elin and `carried_by` is Niko. | `object-current-holder-contradiction` | Blocked; the prompt is not compiled. |
| 2 | Edit the generation brief so the directive asks Niko to read the hidden letter, then remove the current routes/exits context. | `impossible-action-physical-context` | Blocked; the prompt is not compiled. |
| 3 | Edit the generation brief so Mara can interrupt from offstage, then remove the route/timing mechanism from current state. | `offstage-interruption-missing-route` | Blocked; the prompt is not compiled. |
| 4 | Paste accepted/candidate-style prose into the handoff's recent causal context. | `prompt-facing-prose-contamination` | Blocked; the prompt is not compiled. |
| 5 | Edit SECRET `The letter names a ledger substitution` so Niko is both protected from the secret and modeled as POV-held hidden knowledge. | `hidden-truth-in-pov-knowledge` | Blocked; the prompt is not compiled. |
| 6 | Edit stop guidance to ask for the whole chapter or mystery reveal. | `local-prose-scope-violation` | Blocked; the prompt is not compiled. |
| 7 | Remove Niko's current cast voice row while dialogue is expected. | `sparse-voice-pressure` | Blocked; the prompt is not compiled. |
| 8 | Keep physical interaction expected, but remove the current locks/impossible-action context from current state. | `matrix-physical-interaction-incomplete` | Blocked; the prompt is not compiled. |

Recipe 4 targets the deterministic validation-engine blocker `prompt-facing-prose-contamination`. This is separate from the brief editor's paste warning, which is advisory UI feedback and does not replace the fail-closed validation gate.
