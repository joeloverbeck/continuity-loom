# Demo Blocker Recipes

Status: active how-to — live demo-fixture smoke recipes for *The Letter Under the Flour Bin*
Authority: support (see docs/ACTIVE-DOCS.md)

Origin: these recipes were introduced by SPEC-013, now archived at `archive/specs/SPEC-013-tame-demo-project-and-stress-coverage.md`.

These recipes start from a freshly created demo project. They intentionally change ordinary project data through normal edits; there are no pre-broken fixtures and no demo-only toggles.

After applying a true-blocker recipe, run validation or open the prompt preview/send path. The expected result is a blocker-severity diagnostic. Draft saving can still preserve the edit, but Preview/Generate stay blocked until the required item is fixed.

## True Blocker Recipes

| # | Normal edit from the valid demo | Expected readiness result | Author-facing copy | Technical code | Affected target display |
|---|---|---|---|---|---|
| 1 | Clear the manual directive. | Draft saved; Preview/Generate blocked. | Add a manual directive so the next local prose unit has a launch action. | `missing-manual-directive` | Generation Brief -> Manual directive |
| 2 | Remove the universal current-state floor: time, location, onstage entities, or immediate situation. | Draft saved; Preview/Generate blocked. | Restore the current time, place, onstage/material entities, and what is happening now. | `missing-current-authoritative-state` | Generation Brief -> Current state |
| 3 | Set continuation after accepted segment, then remove the recent causal handoff and begin-after/last-visible moment. | Draft saved; Preview/Generate blocked. | Add a user-authored continuation handoff; do not paste accepted prose. | `missing-immediate-handoff` | Generation Brief -> Immediate handoff |
| 4 | Edit stop guidance to ask for the whole chapter or mystery reveal. | Draft saved; Preview/Generate blocked. | Keep the request to one local prose unit and one response point. | `local-prose-scope-violation` | Generation Brief -> Stop guidance |
| 5 | Keep physical interaction expected, but remove positions, visibility, object state, route, or available-time context. | Draft saved; Preview/Generate blocked. | Add the physical state needed for the expected interaction. | `matrix-physical-interaction-incomplete` | Generation Brief -> Current state / Focus tags |
| 6 | Edit OBJECT `sealed letter` so `owner` is Elin and `carried_by` is Niko. | Draft saved; Preview/Generate blocked. | Resolve the object holder contradiction before compiling. | `object-current-holder-contradiction` | Records -> sealed letter |
| 7 | Edit the generation brief so Mara can interrupt from offstage, then remove the route/timing mechanism from current state. | Draft saved; Preview/Generate blocked. | Add a route, timing, communication, or entrance mechanism for the interruption. | `offstage-interruption-missing-route` | Generation Brief -> Current state |
| 8 | Paste accepted/candidate-style prose into the handoff's recent causal context. | Draft saved; Preview/Generate blocked. | Replace prose text with a user-authored continuity handoff. | `prompt-facing-prose-contamination` | Generation Brief -> Immediate handoff |
| 9 | Edit SECRET `The letter names a ledger substitution` so Niko is both protected from the secret and modeled as POV-held hidden knowledge. | Draft saved; Preview/Generate blocked. | Resolve the POV knowledge and secret-holder contradiction. | `hidden-truth-in-pov-knowledge` | Records -> secret / POV knowledge |
| 10 | Remove the OpenRouter provider configuration before opening Generate. | Preview can remain available if story readiness passes; Generate is blocked. | Configure the local provider settings before sending. | `provider-configuration-missing` | Settings -> OpenRouter |
| 11 | With Generation context saved as First segment, accept the first segment; or with Continuation saved, delete the final accepted segment. | Draft remains saved; Generation Brief shows saved/required/count mismatch; Preview, user-supplied candidate intake, and Generate are blocked with no provider call. | Choose the required Generation context shown by the blocker and save the Generation Brief. | `generation-context-accepted-segment-mismatch` | Generation Brief -> Generation context |

Recipe 8 targets the deterministic validation-engine blocker `prompt-facing-prose-contamination`. This is separate from the brief editor's paste warning, which is advisory UI feedback and does not replace the fail-closed validation gate.

Recipe 11 must not auto-repair the saved value. Use the existing Generation Brief selector, save explicitly, reload, and confirm that the status becomes coherent before compiling a fresh prompt.

## Non-Blocking Warning Recipes

These recipes should not block Preview or Generate. They show advisory diagnostics, grouped salience warnings, or no diagnostic when the universal prompt remains structurally complete.

| # | Normal edit from the valid demo | Expected readiness result | Author-facing copy | Technical code | Affected target display |
|---|---|---|---|---|---|
| W1 | Leave `soft_unit_guidance` blank while the current-state floor and manual directive are present. | Ready if no other blockers exist; no blocker. | Optional stop guidance is blank; the universal local stop rule still applies. | none or info only | Generation Brief -> Stop guidance |
| W2 | Remove Niko's current cast voice row while durable CAST MEMBER voice/body anchors remain sufficient and dialogue is expected. | Warning only; Preview/Generate remain available. | A current voice pin may help this local exchange, but durable voice anchors are still the authority. | `local-voice-pressure-may-help` | Generation Brief -> Current cast voice pressure |
| W3 | Select a long active cast dossier with no additional current pin. | Grouped salience warning only. | Consider adding a local voice/body pin if the active dossier is long and the current moment needs emphasis. | `cast-salience-risk` | Active Working Set -> Active cast |
| W4 | Keep the setting texture sparse in a quiet opening where current state and directive are otherwise sufficient. | Warning only. | Add setting texture if you want more concrete rendering; it is not required for readiness. | `sparse-setting-texture` | Generation Brief -> Current state |
| W5 | Generate a quiet scene with no active clock, obligation, or open thread selected while the manual directive is otherwise sufficient. | Warning only. | A clock or thread can add pressure, but it is not required for this local unit. | `no-active-clock-pressure` | Active Working Set -> Clocks / Threads |

Current cast voice pressure rows are local guidance only. Active, present-minor, and offstage role authority comes from cast-band membership; current voice rows should not add role/scope fields to make a recipe pass.
