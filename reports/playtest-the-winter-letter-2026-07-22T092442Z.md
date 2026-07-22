---
report_type: continuity-loom-author-playtest
schema_version: 3
run_id: playtest-the-winter-letter-2026-07-22T092442Z
report_stem: playtest-the-winter-letter-2026-07-22T092442Z
story_title: The Winter Letter
story_slug: the-winter-letter
run_mode: continuation
prior_report: reports/playtest-the-winter-letter-2026-07-20T092714Z.md
project_path: /tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z
project_exists_at_close: true
started_at: 2026-07-22T09:24:42Z
completed_at: 2026-07-22T10:35:00Z
status: completed
completion_reason: accepted-one-segment
accepted_segment_sequence: 4
base_url: http://127.0.0.1:41999
browser: chromium
viewport: 1440x900
openrouter_send_controls_clicked: 0
provider_request_attempts: 0
provider_requests_blocked: 0
cold_prose_attempts: 1
cold_assistance_attempts: 2
counterfactual_probes: 0
cold_first_view_witnesses: 0
independent_claim_challenges: 0
change_review_comparisons: 1
candidate_intervention: light
---

# Continuity Loom Author Playtest Report: The Winter Letter

## Run Status

Completed. The existing local project reopened by exact path, one lightly edited user-supplied cold prose candidate was accepted exactly once as segment 4, and its durable continuity changes were reviewed through the new Accepted-Segment Change Review surface and then hand-authored across records, the Generation Brief, and an inert Private Note. The project remained at `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z`.

No OpenRouter Generate, Ideate, Analyze, model-refresh, or other provider-send control was clicked. The guarded browser recorded zero provider-request attempts, zero blocked provider requests, zero external-request blocks, zero network failures, and zero console entries.

One harness limitation shaped this run: in this WSL2 environment, headless Chromium raster capture (screenshots) and Playwright's pointer motion-stability gate both time out, independent of browser channel. The full author journey was completed through accessibility-tree and visible-text snapshots plus keyboard/`goto` interaction, and no image evidence was retained. This is an environment limitation, not a Continuity Loom defect (see F023, Diagnostics).

## Executive Assessment

The headline of this run is that the post-acceptance workflow replacement has closed the product's longest-standing prompt-contract gap. The old Segment Reconciliation surface is retired; the navigation, guard endpoint (`/api/accepted-segment-change-review/analyze`), and compiled prompt are now Accepted-Segment Change Review. The prior finding F006 — that reconciliation could return silently empty proposal arrays with no evidence-grounded no-change rationale, making emptiness indistinguishable from a failed draw — is resolved by design in the replacing contract: the compiled prompt states that "an empty items list remains unverified advisory output and is valid only with all six reasoned coverage rows," and requires accounting for exactly six named dimensions with a status and a reason each. The single cold draw demonstrated this directly, returning "checked - no relevant change" *with a grounded reason* on the emotions/relationships dimension.

That new surface performed extremely well on its first real exercise in this story's lineage. Sealing an independent baseline before compiling the prompt and drawing once (no retry, per the single-draw method) produced a delta comparison in which every durable change I had independently identified was matched, all six coverage rows agreed with my sealed dispositions (zero disagreements), the response added one reasonable author-judgment interpretation I had only vaguely captured, it invented no canon, and it never disclosed the sealed question's content. For this one episode the draw was discovery-complete relative to my independent reading — an instance-level result from a single stochastic draw, not a rate or reliability claim.

The prose path again performed strongly. One cold response against a directive carrying a compound `must_render` (turn, write-and-hand-over the signed account, seal the question off-page) and an eight-clause `do_not_force` satisfied every clause without a retry, including the two hardest: the sealed question's content never surfaced, and no staff member entered, spoke, or became a character despite the account naming a porter and a duty-desk sister as historical entries. Exactly one clause required a continuity edit — a single narration phrase that drifted toward the still-undecided reveal lock.

Two prior findings closed on retest. F015 (contradictory `Retry Save`/`Saved` note state) is resolved: the note editor shows `Save changes` beside `Saved`. F017 (compiled voice-pressure pins identified cast by dossier summary, not name) is resolved: pins now lead with the cast member's name.

One new moderate finding emerged, and it is the flip side of a deliberate design property. Because the Generation Brief is author-authored handoff, independent of accepted prose, the inherited brief had silently drifted from accepted canon: it presupposed a "turn-around" beat that accepted segment 3 never contains, and the prior report described the same moment a third, conflicting way. No surface reconciles the brief against the accepted segment, so a returning author who trusts the brief verbatim skips a beat. I only caught it by reading the full accepted segment (F021). Notably, Change Review then caught the *internal* contradiction my correction left behind, surfacing it through the accepted segment (F022) — evidence the surface earns its keep beyond simple record deltas.

## Story Intent and Expectations

The continuation remained a restrained speculative drama about the centuries-old time traveler Tomás Vidal trying to keep Clara Hale alive past her planned Christmas 1972 suicide in a sanatorium without coercing her or demanding belief. Segment 3 ended with the independent-test terms fixed, the staff round passed, Clara adding a second demand — a signed written account of Tomás's movements and conversations in the building tonight, delivered before he leaves the doorway — and Tomás agreeing, with Clara's pencil raised over her own paper to compose the sealed question.

The intended segment stayed in Clara's room and doorway. The author's obligation this run was to render Tomás producing and handing over that signed account while Clara wrote and sealed her own question, with the sealed question's content kept entirely off the page and the question of whether Tomás can answer it left undecided. The sealed stopping expectation was a reversible decision once the account was in Clara's hands: the test not yet asked, the result not delivered, the letter not surrendered, the return decision unmade, breakfast still bounding the postponement, and staff never a speaking presence.

No Cold First-View Witness ran. This was a continuation, and the pilot is awaiting disposition.

## Run Configuration and Continuation Contract

| Item | Value |
| --- | --- |
| Mode | Continuation from `reports/playtest-the-winter-letter-2026-07-20T092714Z.md` |
| Project | `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z` |
| Isolated app | `http://127.0.0.1:41999`, localhost only |
| Provider configuration | Explicitly blank isolated OpenRouter credential (`hasOpenRouterCredential: false`) |
| Browser | Guarded managed Chromium 149.0.7827.55, 1440x900, guard installed 09:32:15Z before navigation |
| Returning archive | Segments 1, 2, 3 visibly present before authoring |
| Returning authority | 15 records; Tomás and Clara onstage, Daniel offstage; fully populated handoff brief |
| Assistance used | Accepted-Segment Change Review and Record Hygiene, each through one cold context; Ideate skipped |
| Accepted archive at close | Segments 1, 2, 3, and 4; latest sequence 4 |
| Records at close | 15 (OBLIGATION now closed; CLOCK and FACT-2 updated); all in the active working set |
| Saved lifecycle at close | Continuation after accepted segment; accepted count 4; coherent |

Tomás and Clara remain in Clara's room. The staff round has passed toward the stairwell. Tomás has delivered the signed account and stepped back from the door on Clara's instruction; Clara has written, sealed, and kept her question and its expected answer, set beside the unfinished goodbye letter she has not given up, and told Tomás to stand where she cannot hear him while she deliberates. Breakfast still bounds her postponement; his return is undecided.

## Condensed Author Journey

1. Reopened the prior project by exact local path and verified OPEN true, title, compatibility ok, store version 4/4, and the exact path readback.
2. Read Accepted Segments before touching any authority. Read the full accepted segment 3 as author review; established the true end-of-segment-3 state and reconciled it against the prior report's handoff.
3. Verified the inherited 15-record set, the pinned inert Private Note, cast bands, and the fully populated Generation Brief, all intact as segment 3's end state.
4. Caught that the inherited brief presupposed an unrendered "turn-around" beat (F021) and corrected nine current-state/handoff/directive fields so segment 4 begins at segment 3's true end and renders the turn; saved. Readiness held at one intentional blocker and three warnings.
5. Inspected the compiled prose prompt, confirmed determinism across a refresh (byte-identical), verified every deliberately populated writer-facing field via prompt search, and obtained one cold prose response.
6. Pasted the raw response through **Write or paste candidate**, verified user-supplied provenance and the visible prompt fingerprint, applied one reveal-lock copyedit in the visible editor, and accepted it once as segment 4.
7. Sealed an independent canonical-update baseline, then ran the Accepted-Segment Change Review single cold draw and adjudicated the delta comparison (discovery-complete for this episode; zero coverage disagreements).
8. Closed the OBLIGATION and updated the CLOCK; ran Record Hygiene and adopted its three MAKE_SPECIFIC findings (tightened the CLOCK, narrowed FACT-2), keeping its three KEEP_DISTINCT findings including one safety-critical reveal-lock non-merge.
9. Rewrote the Generation Brief as the segment-5 handoff (17 fields), resolving the positions/consent contradiction Change Review had surfaced; created a new inert Private Note for the account's consistency anchors and the deferred typing question; acknowledged the durable-change reminder only after the canonical surfaces represented the chosen continuity.

## What Worked

- Returning-project custody reproduced exactly: exact path, title, compatibility ok, store version 4/4, prior accepted segments immediately readable (F008).
- The archive made the continuation point discoverable, with the explicit note "Accepted prose is readable output, not continuity canon," and exposed each segment's accepted timestamp and sequence.
- Deterministic compilation held: refreshing the preview produced a byte-identical prompt (same sha256, same 41974-character length).
- The prose prompt produced a response satisfying a compound `must_render` and an eight-clause `do_not_force` with no retry and no structural repair; the sealed question's content never surfaced and staff never became characters.
- Candidate custody stayed explicit: "Draft candidate - not accepted, not canon", "Source: User-supplied", and the inspected prompt fingerprint `fnv1a32:5cbc89ba` shown before Accept. The prompt body itself restates the boundary: "The human reader is the continuity gate... records will be updated manually."
- Acceptance raised a durable-change reminder with a six-question checklist and the full typed-creation shortcut set, and waited for manual work; acknowledging it dismissed it cleanly.
- Accepted-Segment Change Review returned strict, well-grounded JSON: eight items with valid epistemic-status and retention-horizon values, short paraphrased evidence excerpts on established-change items and none on interpretation items, resolvable span and contrast citations throughout, and all six reasoned coverage rows (F020).
- Record Hygiene was sparse, type-aware, refused every cross-type merge, and produced one safety-critical KEEP_DISTINCT that protected the reveal lock (FACT-1 is known by Tomás and Daniel, not Clara) — retest of F014.
- Assistance surfaces stayed visibly quarantined: "Unverified, noncanonical advice. Accepted prose is bounded evidence, never canon or prose-prompt authority."
- Private Notes remained inert author scratch and absorbed both a deferred typing decision and the account's consistency anchors without entering prompt authority (F009).
- Readiness kept the intentional provider blocker isolated from three proportionate warnings throughout, and none of my edits introduced a new blocker (F010).

## Prioritized Findings

| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F006 | moderate | prompt-contract-mismatch | accepted-segment-change-review | Segment Reconciliation's silent-empty-array gap is closed by the replacing surface, which requires six reasoned coverage rows even for an empty items list. | high | resolved | direct-visible, cross-run-recurrent |
| F021 | moderate | friction | generation-brief | The Generation Brief handoff can silently drift from accepted canon, and no surface reconciles brief against accepted prose. | medium | new | direct-visible, single-observer-inference |
| F020 | strength | strength | accepted-segment-change-review | Change Review's mandatory reasoned six-dimension coverage plus per-item epistemic/retention typing makes durable-change discovery grounded and no-change distinguishable. | high | new | direct-visible |
| F022 | strength | strength | accepted-segment-change-review | Change Review surfaced a brief-internal contradiction through the accepted segment, beyond simple record deltas. | high | new | direct-visible |
| F017 | minor | friction | prose-prompt | Compiled voice-pressure pins now lead with the cast member's name. | high | resolved | direct-visible, cross-run-recurrent |
| F023 | note | friction | diagnostics | Headless screenshot capture and Playwright motion-stability interaction are unavailable in this environment; not a product defect. | high | new | direct-visible, reproduced |

### F006 — Reconciliation's silent-emptiness gap is closed by the replacing surface

- **Observed fact:** The Segment Reconciliation surface is gone. The left navigation now reads "Change Review" pointing at `/accepted-segment-change-review`; the guarded provider endpoint is `/api/accepted-segment-change-review/analyze`; the compiled prompt is titled "Accepted-Segment Change Review Candidate Prompt" on contract `accepted_segment_change_review.v2` (versions 2.0.0 / 2.0.0 / 2.1.0). The extracted prompt requires the model to "Account for exactly these dimensions: spatial/material/bodily state | time/clocks/ongoing processes | facts/knowledge/beliefs/secrets | intentions/plans/commitments/promises/open pressures | emotions/relationships | immediate next-segment handoff," and states "An empty items list remains unverified advisory output and is valid only with all six reasoned coverage rows." The output schema's top-level `required` is `[items, coverage]`; the coverage status enum includes "changes found" and "checked - no relevant change." The single cold draw returned "checked - no relevant change" on emotions/relationships *with a grounded reason* (a non-durable POV-internal beat; RELATIONSHIP-1 untouched).
- **Author interpretation and impact:** The prior gap was that an empty reconciliation result carried no evidence-grounded no-change rationale, so an author could not distinguish "nothing changed" from "the draw failed." The replacing contract makes a no-change result mandatory-carry six reasoned coverage rows, so silence is now grounded and distinguishable. This closes F006 structurally rather than by chance of a substantive draw.
- **Expected versus actual:** Expected the F006 concern to persist or merely narrow again; found the underlying gap eliminated by the surface replacement.
- **Visible reproduction:** Accept a segment, open Change Review, extract the prompt, and read the coverage requirement; observe that any conforming response must carry all six reasoned rows.
- **Privacy-safe evidence:** Change Review prompt visible fingerprint `fnv1a32:8c959ec0`; extracted-prompt SHA-256 `3d79f90fa62f8175487bbdbedb770b1ef4b94064505c3ba5e490a5ce2e3c3f12`. Requirement text quoted above is the minimum excerpt needed.
- **Workaround and cost:** None; the workaround the prior report kept as a fallback (reject and reconcile by hand on an empty draw) is no longer needed to distinguish emptiness from failure.
- **Likely layer:** Prompt contract, confirmed from the visible prompt text.
- **Desired author-visible outcome:** Preserve the six-reasoned-coverage requirement in the contract; it is the property that closes the gap.
- **Uncertainty:** One draw on one segment. The resolution rests on the visible contract requirement (structural), not on the single draw's quality; the draw only demonstrates conformance.

### F021 — The Generation Brief handoff can silently drift from accepted canon

- **Observed fact:** The prior run left the Generation Brief pre-authored as this run's handoff. Several current-state and handoff fields presupposed a beat that accepted segment 3 does not contain: `positions` read "Tomás... has turned at her instruction to face the corridor, his back to her work"; `immediate_situation_summary`, `last_visible_moment`, and `begin_after` each asserted Clara "told him to turn around" and that he had turned. Accepted segment 3 ends on Tomás's assent to the signed-account demand while still facing Clara, with Clara's pencil only "held above the paper" — no turn instruction and no turned back. The prior report's own handoff described the same moment a third way ("Clara is drafting the sealed question with *her* back to Tomás"), conflicting with the brief's "*his* back to her work." No surface reconciles the Generation Brief against the accepted segment: Change Review contrasts the accepted segment against records and brief fields, and Record Hygiene contrasts records against records; neither checks whether the brief matches what was actually accepted.
- **Author interpretation and impact:** The brief's independence from accepted prose is a deliberate, correct design property (accepted prose is never prompt authority). The failure mode is that the handoff can diverge from what was accepted with nothing flagging it. A returning author who trusts the brief verbatim opens the next segment from a presupposed state, skipping a rendered beat and creating a jump-cut in the accepted sequence. I caught it only by reading the full accepted segment, which the prior report itself noted a returning author does not reliably do.
- **Expected versus actual:** Expected the inherited handoff to match the accepted segment it followed. Actual: it presupposed an unrendered beat, and the two prior descriptions of that beat disagreed.
- **Visible reproduction:** On any continuation, read the latest accepted segment in full and compare its ending against the inherited Generation Brief's current-state and handoff fields; observe there is no in-app aid for this comparison.
- **Privacy-safe evidence:** Direct comparison of accepted segment 3's ending against the inherited brief fields, both read through the visible UI. No prose excerpt retained.
- **Workaround and intervention cost:** Read the full accepted segment and re-author the drifted fields so the segment begins at the accepted end state and renders the missing beat. Cost this run: correcting nine brief fields before compiling.
- **Likely layer:** UI workflow (absence of a brief-versus-accepted reconciliation aid), against a correct compiler/authority design.
- **Desired author-visible outcome:** Consider a lightweight, non-authoritative aid that flags when the Generation Brief's stated current state is inconsistent with the latest accepted segment, without letting accepted prose become authority — for example, a returning-author prompt to confirm the handoff against the latest segment.
- **Uncertainty:** One continuation, one observer; the drift originated in prior author-authored handoff text, not app behavior, so this is a workflow-support gap rather than a defect. Whether authors are commonly bitten by it is unmeasured.

### F020 — Change Review's reasoned coverage and per-item typing make discovery legible

- **Observed fact:** Every returned item carried a valid `epistemic_status` ("established change" or "interpretation requiring author judgment") and a `retention_horizon` ("durable record candidate", "author decision required", or "next-brief-only"), a short paraphrased `evidence_excerpt` on established-change items and an empty one on interpretation items, resolvable segment spans, and contrast keys naming existing records and specific brief paths. The six coverage rows each carried a status and a reason. In the sealed delta comparison, all six coverage rows agreed with my independent dispositions.
- **Author interpretation and impact:** The typing tells the author which items are asserted changes versus judgment calls, and which belong in durable records versus only the next brief — routing the manual work rather than dumping a flat list. This is the mechanism behind F006's resolution and is worth preserving.
- **Expected versus actual:** Expected an advisory list; received a typed, coverage-complete accounting that separated assertion from interpretation and durable from ephemeral.
- **Visible reproduction:** Accept a segment that changes durable state, run Change Review, and read the per-item typing and the six coverage rows.
- **Privacy-safe evidence:** Change Review response on contract `accepted_segment_change_review.v2`; see the Change Review Delta Comparison disclosure for the fingerprint and tallies.
- **Workaround and intervention cost:** None; adoption is manual re-authoring, as intended.
- **Likely layer:** Prompt contract and schema.
- **Desired author-visible outcome:** Preserve the per-item epistemic/retention typing and the reasoned six-dimension coverage.
- **Uncertainty:** One draw; instance-level evidence, not a rate.

### F022 — Change Review surfaced a brief-internal contradiction through the accepted segment

- **Observed fact:** My F021 correction edited `positions` to say Tomás was "still facing Clara," but I left the inherited `consent_or_force_conditions` field asserting "He turned his back on her instruction." Change Review item ITEM-004 flagged exactly this: "The positions field recorded him as still facing Clara, while the consent_or_force field already noted he had turned his back; the segment resolves this in favor of his having turned."
- **Author interpretation and impact:** Change Review is scoped to the accepted segment, yet by contrasting it against brief fields it surfaced an internal inconsistency between two brief fields I had left divergent. That is real value beyond record-delta discovery, and it directly extends F018's hygiene/change-review complementarity.
- **Expected versus actual:** Expected item output about record deltas; also received a correct catch of a brief-internal contradiction.
- **Visible reproduction:** Leave two current-state brief fields inconsistent, accept a segment that resolves the inconsistency, and run Change Review.
- **Privacy-safe evidence:** ITEM-004 of the Change Review response; contrast keys referenced `positions`, `line_of_sight_and_visibility`, and `consent_or_force_conditions`.
- **Workaround and intervention cost:** I resolved both fields to the post-turn state in the segment-5 handoff.
- **Likely layer:** Prompt contract (the contrast paths include brief fields).
- **Desired author-visible outcome:** Preserve the brief-field contrast behavior.
- **Uncertainty:** One instance; the contradiction was author-introduced, so this shows capability, not frequency.

### F017 — Compiled voice-pressure pins now name the cast member (resolved)

- **Observed fact:** In the compiled prose prompt, the "Active cast voice pressure pins" block now leads each pin with the cast member's label: "Clara Hale; A grieving mathematical thinker...; local function: active_speaker; ..." and "Tomás Vidal; An ancient interventionist...; local function: pov_narrator; ...; current generation voice pressure: ...". The prior report's F017 recorded pins that led with the dossier summary and omitted the name.
- **Author interpretation and impact:** Auditing whether voice pressure landed on the right character no longer requires resolving identity through `local_function` and the onstage listing; the name is read directly. The prompt-side variant of the name-versus-description legibility problem is closed.
- **Expected versus actual:** Expected to re-confirm the prior dossier-first pins; found name-first pins.
- **Visible reproduction:** Set a `current_voice_pressure` for a named cast member, compile the prose prompt, and read the voice-pressure pin block.
- **Privacy-safe evidence:** Prose prompt visible fingerprint `fnv1a32:5cbc89ba`; extracted-prompt SHA-256 `018581c673dd64149d1a830aac98b802632d6d61721932406f34f42f8b06c501`.
- **Workaround and intervention cost:** None needed.
- **Likely layer:** Prompt compiler rendering of the cast pin block.
- **Desired author-visible outcome:** Preserve the name-first pin format.
- **Uncertainty:** Three cast members, one pov_narrator; a larger cast was not tested.

### F023 — Headless screenshot and motion-stability interaction unavailable (harness, not product)

- **Observed fact:** `browser-act.mjs screenshot` and `elementshot` time out at 10s/20s/30s, and `click`/`elementshot` time out at Playwright's pointer motion-stability gate, while `goto`, `fill`, `fill-file`, `focus`, `press`, `select`, `text`, `text-file`, and `tree` all succeed and console/network/provider streams stay empty. The failure reproduced with both the system `chrome` channel (v144) and, after installing the repo-pinned Playwright Chromium plus its headless shell (revision 1228), managed `chromium` (v149). Root cause during setup: the repo-pinned Playwright expected Chromium revision 1228 but only a stale revision-1181 build was cached, so the first holder fell through to system Chrome; installing the correct build let managed Chromium launch, but raster capture and the motion-stability gate still hang — an environment-level compositor/animation-frame degradation, not a channel- or product-specific issue.
- **Author interpretation and impact:** No image evidence could be captured, and buttons had to be activated via keyboard and navigation done via `goto`. A human author, who needs neither raster capture nor automation stability gating, is unaffected. The full journey completed through accessibility-tree and visible-text perception.
- **Expected versus actual:** Expected working screenshots as in prior runs (which used Chromium 144); found capture unavailable in the current environment.
- **Visible reproduction:** Run any `screenshot`/`elementshot`/`click` on this WSL2 headless environment.
- **Privacy-safe evidence:** Repeated timeouts across channels; empty diagnostic streams; documented in Diagnostics.
- **Workaround and intervention cost:** Perceive via `tree`/`text`; activate controls with `focus` + `press`; navigate with `goto`. No image assets retained.
- **Likely layer:** Not assessable at the product layer; environment/harness.
- **Desired author-visible outcome:** None for the product; noted so future runs in this environment expect it.
- **Uncertainty:** Environment-specific; prior runs on this machine captured screenshots.

## Surface-by-Surface Experience

| Surface | Author goal | Current-run experience | Outcome |
| --- | --- | --- | --- |
| Project Library | Reopen the local story | Exact-path open flow with full custody readback; parent/folder guidance still explicit (macOS-style example only, cosmetic) | Completed |
| Accepted Segments | Verify prior archive and new segment | Segments 1-3 present before work; segment 4 visibly latest after one acceptance; per-segment timestamps and the readable-output note exposed | Completed |
| Records | Recover, update, and curate continuity | 15 inherited records legible; OBLIGATION closed, CLOCK and FACT-2 updated via type-specific forms; no records manufactured | Completed |
| Private Notes | Preserve inert unknowns and anchors | `Save changes` beside `Saved`; new inert note created for consistency anchors and a deferred typing question | Completed; F015 resolved |
| Active Working Set | Confirm scene authority | Cast bands and names intact; no change needed; no record silently added | Completed |
| Generation Brief | Correct drift, then leave a handoff | Group navigator, plain-first labels, explicit unsaved-changes bar; saved twice (segment-4 correction, then segment-5 handoff) | Completed; F021 |
| Validation / Prompt Preview | Audit determinism and field presence | Byte-identical prompt across refresh; every populated writer field located; guard blocks broad prompt-body snapshots, `text-file` extracts the exact prompt | Completed |
| Generate / Candidate | Paste, verify, and accept cold prose | Manual intake beside disabled Generate; provenance and `fnv1a32` prompt fingerprint shown before Accept | One edited candidate accepted |
| Change Review | Discover durable changes from segment 4 | Six-dimension reasoned coverage, typed items, span and contrast citations; discovery-complete for this episode | Useful; F006 resolved, F020/F022 |
| Record Hygiene | Check overlap after editing records | Six findings, three actionable MAKE_SPECIFIC, three KEEP_DISTINCT, zero false positives, one safety-critical non-merge | Useful; F014 retested |
| Ideate | (Not needed) | The next beat was fully determined by segment 3's close; no genuine author block | Correctly skipped |
| Story Configuration | (Not needed) | Premise and prose mode unchanged; nothing prompted a review | Correctly skipped |

## Prompt Usefulness

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Generated Prose Prompt | Render the turn, the signed account and its handover, and Clara sealing her question, stopping at a reversible decision | Compliant on the compound `must_render` and all eight `do_not_force` exclusions | 1 | 0 | 1 | Strong; selected after one reveal-lock copyedit | high for this response |
| Accepted-Segment Change Review Prompt | Discover durable deltas from accepted segment 4 | Compliant; typed items, reasoned six-dimension coverage, valid provenance and citations | 8 | 0 | 8 | Useful; discovery-complete for this episode | high on this draw |
| Story-Record Hygiene Prompt | Decide what to tidy after editing records | Compliant; advisory only, no write instructions, all cross-type merges refused | 3 | 3 | 3 change + kept 3 KEEP_DISTINCT | Useful and high-signal | high on this draw |

The prose prompt was used once with no retry; its only defect was a single narration phrase ("across a very long life") that drifted toward the still-undecided reveal lock and was trimmed to "long ago" in the visible candidate editor. No targeted counterfactual was warranted, because every populated field appeared in the response.

The Change Review draw is the run's strongest single result. Its typed items and mandatory reasoned coverage separate asserted changes from author-judgment interpretations and route each to a durable record or the next brief. Its "checked - no relevant change" row on emotions/relationships — carrying a grounded reason rather than a bare empty array — is the concrete behavior that closes F006.

Record Hygiene's "no-change" column counts three KEEP_DISTINCT findings. One did real safety work: it refused to merge FACT-1 (Daniel wakes in 2006; known by Tomás and Daniel) with FACT-2 (Clara's 1972 judgment that the Daniel-facts fell short of proof; known by Tomás and Clara), noting that a merge would leak Daniel's future recovery into Clara's 1972 knowledge and defeat the sealed test. The other two correctly confirmed distinctness at some attention cost.

## Generation Brief Field Influence

Rows describe the segment-4 prose prompt (fingerprint `fnv1a32:5cbc89ba`) that produced the accepted segment. Edited-this-run fields are marked (E). All populated fields appeared in the compiled prompt (verified by in-prompt search) and were observably followed by the response.

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `current_time` | Hold the deep-night post-round interval | No dawn or time jump | Present in current state | Time advances only by the writing/sealing | Used | high |
| `current_location` | Bind the scene to Clara's room and doorway | Never leave the room | Present | Entire response stays in room and doorway | Used | high |
| `immediate_situation_summary` (E) | Open at segment 3's true end | Begin before the turn, account just agreed | Present | Opens on Clara directing the turn | Used | high |
| `positions` (E) | Tomás still facing Clara at open | Turn is rendered, not presupposed | Present | He turns on her instruction, then writes | Used | high |
| `possessions` | Give each their own paper | Clara's sheets/envelope; his ordinary paper | Present | He uses his visitor papers; she her own sheets | Used | high |
| `visible_conditions` (E) | Keep inference behavioral | Read Clara through posture and stillness | Present | Uncovered letter, still hands carry her state | Used | high |
| `environmental_conditions` | Sparse pressure | Cold, radiator, window texture only | Present | Radiator and cold supply texture | Used | high |
| `entity_statuses` (E) | Preserve skepticism, restraint, coma | No unsupported state changes | Present | All three statuses hold | Used | high |
| `line_of_sight_and_visibility` (E) | Limit perception once he turns | Infer Clara by sound after turning | Present | He hears the pencil, cannot see her work | Used | high |
| `pov_cannot_perceive_now` | Protect the sealed content | Infer rather than know | Present | Sealed content never perceived | Used strongly | high |
| `routes_and_exits` | Keep the staffed threshold | Nobody leaves the unit | Present | Nobody leaves | Used | high |
| `available_time` | Round eased; account owed before he leaves | Interruption receded; account first | Present | Round is gone; he writes before stepping back | Used | high |
| `consent_or_force_conditions` | Preserve revocable consent | Clara controls distance, objects, terms | Present | No touch/threat; he acts only on her word | Used | high |
| `current_locks` | Cap what the test can prove; seal content | Limits stated; content withheld | Present | Limits honored; content withheld | Used strongly | high |
| `recent_causal_context` (E) | Carry segment 3 forward without the false turn | Explain why the account happens now | Present in handoff | Response opens on the turn and account | Used | high |
| `last_visible_moment` (E) | Fix segment 3's true last beat | The signed-account assent, pencil raised | Present in handoff | Continuous with that beat | Used | high |
| `begin_after` (E) | Start at the account assent, before the turn | Render the turn as the opening | One handoff match | Opens on Clara's turn instruction | Exact match | high |
| `must_render` (E) | Turn, signed account and handover, sealed question off-page | All three render | Present as directive | All three render; content off-page | Used strongly | high |
| `may_render_if_naturally_caused` | Permit loophole handling and ambient pressure | Only locally caused pressure | Present | Ambient pressure only, naturally caused | Used | high |
| `do_not_force` | Exclude sealed content, result, staff, logistics | Preserve uncertainty and one-room scope | Present | All eight exclusions hold | Used strongly | high |
| `cast_member_id` | Keep voice pressure on Tomás | Do not overwrite Clara's anchor | Named pin leads with "Tomás Vidal" (F017) | Tomás performs the restraint | Used | high |
| `current_voice_pressure` | Keep Tomás plain, non-overselling | Name limits; do not fill silence | Present in pin | He names limits, lets silence stand | Used strongly | high |
| `selected_pov` | Use PROSE MODE default | Effective POV Tomás | Present | Close-third through Tomás | Used | high |
| `soft_unit_guidance` | Stop at a reversible decision | End once the account is in her hands | Present in stop rule | Ends on "let me think" | Exact match | high |

Validation-only `generation_context` remained "Continuation after accepted segment" with "Accepted segments: 3" and "Status: Coherent" at compile time. It is a readiness check, not prose context. Blank override text, the author-only override reason, and blank sample utterances were left empty and are not treated as ignored writer-facing fields.

## Assistance Evaluation

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Ideate | Skipped: the next beat (write and hand over the account; seal the question) was fully determined by segment 3's close; no genuine author block | Not invoked | — | — | — | Correctly skipped |
| Accepted-Segment Change Review | Acceptance visibly changed obligations, clocks, possessions, and handoff | Strict JSON: 8 typed items, all six reasoned coverage rows | 7 baseline items matched, 1 valid review-only interpretation adopted as a judgment flag | None wrong; two items surfaced work the contract cannot itself perform (create ops / brief authoring) | Manual re-authoring in visible editors | Useful |
| Record Hygiene | Editing the OBLIGATION and CLOCK plausibly created cross-record restatement | Six findings: 3 MAKE_SPECIFIC, 3 KEEP_DISTINCT | 3 MAKE_SPECIFIC applied (tightened CLOCK, narrowed FACT-2); 1 KEEP_DISTINCT prevented an unsafe reveal-lock merge | Zero false positives; two KEEP_DISTINCT were correct but low-value confirmations | Manual edits to CLOCK and FACT-2; typing question deferred to Private Note | Useful |

No assistance output was pasted into the app. Provider transport, provider model selection, provider response parsing, and in-app assistance result cards were not exercised on the cold path; every adopted concept was re-authored by hand through visible editors.

The hygiene pass declined to resolve a possible mis-typing it detected (FACT-2's "judged the Daniel-facts short of proof" clause reads as an epistemic belief rather than an objective FACT), recommending the author decide. That refusal is correct for a surface with no authority over canon, and the question was recorded in the inert Private Note rather than acted on mid-run.

### Change Review Delta Comparison

| Segment sequence | Record scope | Prompt fingerprint | Baseline in-profile | Baseline out-of-profile | Correspondence counts | Coverage disagreements | Substitution verdict | Related finding IDs |
| --- | --- | --- | ---: | ---: | --- | ---: | --- | --- |
| 4 | active_working_set | 3d79f90fa62f8175487bbdbedb770b1ef4b94064505c3ba5e490a5ce2e3c3f12 | 5 | 3 | matched=7; baseline-only=0; review-only-accepted=1; review-only-rejected=0; partial=2; unscorable=0 | 0 | discovery-complete for this episode | none - all baseline/review differences are nonmaterial |

An independent canonical-update baseline was sealed before the prompt was compiled or any segment-derived edit was made. The two `partial` items are correct out-of-profile boundary behavior: Change Review surfaced the possession change and the affected brief fields but did not (and cannot) emit the create operations or brief field values. The one `review-only accepted` item flagged whether Clara's suicidal resolve is deferred versus genuinely shifting — a reasonable author-judgment interpretation the response did not assert as canon; I judged it deferred and captured that in the brief. Scope was frozen to `active_working_set` (all fifteen records are in the working set, so it equals whole-project content). This is a single stochastic draw adjudicated by one operator against a self-authored baseline; the verdict is instance-level and not a rate, reliability, or independence claim.

## Candidate and Accepted Segment

One cold prose attempt produced a 690-word response. It passed close-POV, one-room physical continuity, knowledge limits, consent, sensitivity, exact-directive, exclusion, voice, and stop-discipline review on first reading. Only one defect was found: a narration phrase ("across a very long life") drifted toward the still-undecided FACT-1/FACT-3 reveal lock; it was trimmed to "long ago" in the visible candidate editor so the prose would not pre-empt a pending author reveal decision. Candidate intervention was `light`; no retry, replacement response, counterfactual, or rewrite occurred.

The staff referenced inside Tomás's written account (a porter, a duty-desk sister) do not enter, speak, or become characters in the scene; they appear only as past entries in the document, which is consistent with the exclusion contract. Their access details are Tomás-asserted background; rather than promote them to high-salience canon FACTs, I recorded them as an inert consistency anchor in a Private Note, matching the Change Review item that judged them low-salience and author-optional.

The edited response was pasted as a user-supplied candidate, visibly matched to prompt fingerprint `fnv1a32:5cbc89ba`, and accepted once at `2026-07-22T09:59:38.353Z`, then archived as segment 4 with stored sequence 4. No prose excerpt is reproduced here. The content of Clara's sealed question was deliberately not recorded anywhere; the Private Note carries the standing instruction never to write it down.

## Cumulative Finding Ledger

| ID | First seen | Classification | Summary | Current status | Latest evidence |
| --- | --- | --- | --- | --- | --- |
| F001 | 2026-07-19 run | friction | Create/Open local path semantics underexplained. | resolved | Parent-path and folder-name explanation still present; macOS-style example is cosmetic only. |
| F002 | 2026-07-19 run | friction | Story Configuration prioritized schema keys over labels. | not-retested | Story Configuration was not revisited this run. |
| F003 | 2026-07-19 run | friction | Required CAST MEMBER core imposed high first-segment cost. | not-retested | No cast was created. |
| F004 | 2026-07-19 run | confusion | Working Set cast rows identified by descriptions. | resolved | Names primary in Working Set and dropdowns; prompt-side variant now also fixed (see F017). |
| F005 | 2026-07-19 run | friction | Manual candidate entry below the long readiness surface. | preserve-strength | `Write or paste candidate` beside disabled Generate, opened without a credential. |
| F006 | 2026-07-19 run | prompt-contract-mismatch | Segment Reconciliation could return silent empty arrays; emptiness indistinguishable from failure. | resolved | Surface replaced by Change Review, which requires six reasoned coverage rows even for an empty items list. |
| F007 | 2026-07-19 run | friction | First CDP connection needed a loopback permission retry. | resolved | No loopback permission failure occurred. |
| F008 | 2026-07-19 run | strength | Project open provides exact custody and compatibility readback. | preserve-strength | Reopened with exact path, title, compatibility ok, store version 4/4. |
| F009 | 2026-07-19 run | strength | Private Notes are visibly inert and excluded from prompt authority. | preserve-strength | New inert note absorbed anchors and a deferred decision without entering prompt context. |
| F010 | 2026-07-19 run | strength | Readiness distinguishes blockers from warnings. | preserve-strength | One intentional blocker and three proportionate warnings held; no new blocker introduced by edits. |
| F011 | 2026-07-19 run | friction | Prior first browser holder exited before the journey ended. | resolved | The one holder swap this run was a deliberate setup-phase recovery with a clean exit 0; no unexpected termination. |
| F012 | 2026-07-19 run | strength | Prompt search exposes writer-field placement. | preserve-strength | All populated writer fields located in the compiled prompt. |
| F013 | 2026-07-19 run | strength | Acceptance preserves prose-to-canon boundaries and lifecycle. | preserve-strength | One new segment, durable reminder with six-question checklist and typed shortcuts, coherent accepted-count-4 brief. |
| F014 | 2026-07-19 run | strength | Record Hygiene is sparse, type-aware, and safe. | preserve-strength | Retested: 6 findings, 0 false positives, every cross-type merge refused, one safety-critical non-merge. |
| F015 | 2026-07-20T02:33Z run | friction | Private Note editing showed contradictory `Retry Save`/`Saved`. | resolved | Editor showed `Save changes` beside `Saved` before and after a successful edit and note creation. |
| F016 | 2026-07-20T09:27Z run | prompt-contract-mismatch | Ideate's author focus cannot change the kind of answer returned. | not-retested | Ideate was not naturally needed this run. |
| F017 | 2026-07-20T09:27Z run | friction | Compiled voice-pressure pins identified cast by dossier summary, not name. | resolved | Pins now lead with the cast member's name. |
| F018 | 2026-07-20T09:27Z run | strength | Record Hygiene and post-acceptance review are complementary. | preserve-strength | Hygiene caught cross-record restatement that segment-scoped Change Review did not surface. |
| F019 | 2026-07-20T09:27Z run | strength | Newly created records default outside the active working set. | not-retested | No records were created this run. |
| F020 | Current run | strength | Change Review's reasoned six-dimension coverage plus per-item epistemic/retention typing makes discovery legible and no-change distinguishable. | new | Contract requires all six reasoned coverage rows; draw returned a reasoned no-change row and typed every item. |
| F021 | Current run | friction | The Generation Brief handoff can silently drift from accepted canon, with no surface reconciling brief against accepted prose. | new | Inherited brief presupposed an unrendered turn-around absent from accepted segment 3; prior report described it a third, conflicting way. |
| F022 | Current run | strength | Change Review surfaced a brief-internal contradiction through the accepted segment. | new | ITEM-004 caught `positions` versus `consent_or_force_conditions` divergence. |
| F023 | Current run | friction | Headless screenshot capture and Playwright motion-stability interaction are unavailable in this environment; not a product defect. | new | Screenshot/click timeouts across both browser channels; journey completed via tree/text and keyboard/goto. |

## Continuation Handoff

- **Project:** `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z` existed at close.
- **Latest accepted segment:** sequence 4.
- **Report for the next run:** `reports/playtest-the-winter-letter-2026-07-22T092442Z.md`.
- **Story intent:** Tomás still seeks a noncoercive way to keep Clara alive long enough to change her conclusion; Clara still controls proximity, evidence standards, the sealed test's timing, and the duration of her postponement.
- **Unresolved response point:** Clara has armed her sealed test (question and expected answer sealed and kept) and told Tomás to stand where she cannot hear him while she deliberates over the sealed envelope and the still-unfinished goodbye letter, set down together. The next author must render that deliberation and Tomás's powerless waiting. The sealed question's content must not be invented; whether Tomás can answer it must remain undecided; whether he may return is Clara's to decide and must stay open tonight.
- **POV and cast:** close-third past through Tomás; Tomás and Clara remain in Clara's room, Tomás now stepped back from the door and out of earshot; Daniel remains offstage and comatose in 1972; staff remain interruption pressure and must not enter, speak, or become characters.
- **Local pressure:** the round has passed toward the stairwell; breakfast still bounds Clara's postponement; the account is delivered and the OBLIGATION closed; the live pressures are the armed-but-dormant test, the undecided return, and the morning boundary.
- **Canonical work completed:** the OBLIGATION for the signed account is closed; the CLOCK was updated for the delivered account and armed test and then tightened to timing-only per Record Hygiene; FACT-2 was narrowed to its unique durable assertions (the unfinished letter, the woods intent, the judgment that the Daniel-facts fell short); the Generation Brief carries the full end-of-segment-4 state and a segment-5 directive that stops before anything is settled; a new inert Private Note carries the account's consistency anchors and the deferred FACT-2 typing question.
- **Outstanding author decisions:** (1) the FACT-1 (explicit) versus FACT-3 (hidden) reveal-lock decision remains unmade — decide whether the reader is meant to know the premise the POV character already knows, then correct whichever visibility is mis-set, without changing hard canon casually; (2) whether FACT-2's "judged the Daniel-facts short of proof" clause should be retyped from a current_state FACT to a BELIEF; (3) whether Clara's endpoint resolve should be recorded as deferred versus genuinely easing.
- **Retest targets:** F021 brief-versus-accepted drift and whether any reconciliation aid appears; F016 Ideate focus behavior; F002 Story Configuration labels; F003 first-time CAST MEMBER burden; F019 working-set default if a future segment creates records; whether Change Review's discovery-completeness holds across further draws.

## Diagnostics and Evidence

The run began from repository HEAD `177aa45d1ba2dc91ca9747f87992f06df1c8f08c` with a completely clean worktree baseline (`git status --short` produced no output). Durable workspace changes are limited to this report.

The app was launched through the run-owned safe holder on `127.0.0.1:41999` with an explicitly blank credential (`hasOpenRouterCredential: false`) and an isolated config directory. The first guarded browser holder fell through to the system Chrome channel because the repo-pinned Playwright Chromium build was not cached; after installing the correct build (`npx playwright install chromium`), the first holder was shut down via `shutdown.request` (clean exit 0) during setup — before any project was opened or state changed — and one fresh managed-Chromium holder was started, installing provider guards at 09:32:15Z before the first navigation and restricting all browser requests to the exact app origin. That deliberate setup-phase swap is recorded as harness recovery, not product behavior. Headless raster capture and Playwright's motion-stability gate remained unavailable throughout (F023); the journey was completed via accessibility-tree and visible-text snapshots and keyboard/`goto` interaction. No bounded mid-journey recovery, app restart, or replacement story project was needed, and the fresh browser holder exited only on the requested shutdown.

Safety counts copied before requested shutdown:

- OpenRouter send controls clicked: 0
- Provider request attempts: 0
- Provider requests blocked: 0
- External request blocks: 0
- Network failure entries: 0
- Console log entries: 0
- Server stderr entries: 0

### Evidence Index

No retained evidence. Screenshot capture was unavailable in this environment (F023); no image supports a finding, and every fingerprint, count, and verdict in this report is reproducible from the visible UI. No prompt, raw response, record payload, private-note body, candidate prose, accepted prose, project database, app log, browser profile, trace, session file, or empty diagnostic stream is retained.

## Coverage Limitations

- One continuing story, one newly accepted segment, one desktop viewport, and one technical operator do not establish general usability.
- No real OpenRouter request was made. Provider transport, provider model selection, provider response parsing, in-app assistance result cards, retries, rate errors, and key-management UX were not exercised.
- One cold prose draw, one Change Review draw, and one Record Hygiene draw do not establish output rates or model stability. Executor model identities were not exposed by the host.
- F006's resolution rests on the visible contract requirement (structural) plus one conforming draw. The single Change Review draw's "discovery-complete for this episode" verdict is instance-level against a self-authored baseline; it is not a rate, reliability, or independence claim.
- F021 is a single-observer inference from one continuation; the drift originated in prior author-authored handoff text, so it is a workflow-support gap rather than an app defect, and its prevalence is unmeasured.
- Screenshot capture and Playwright motion-stability were unavailable (F023), so no image evidence exists and visual-only checks (focus-ring visibility, color-only state, clipping) were not assessable; structural accessibility (roles, accessible names, labels) was assessed via the accessibility tree.
- Cold First-View, Independent-Claim, and Method-register pilots were all awaiting disposition, so none ran or advanced in this report. The retired Paired-Draw Check did not run.
- Ideate was not invoked, so F016 remains unretested; Story Configuration was not revisited, so F002 remains unretested; no cast member was created, so F003 and F019 remain unretested.
- No targeted counterfactual was run, because no populated field appeared ignored. Field influence remains correspondence evidence, not isolated causality.
- The FACT-2 typing question and the reveal-lock decision were deferred rather than resolved, so their correctness is unverified. Records were not tested across a process restart.
- Mobile layout, keyboard-only completion, screen-reader usability, performance, backup/restore, process restart, and migration were outside scope.
- Source code and active product docs were not inspected during the author journey; repository instructions and the report format were read only after authoring and review ended.
