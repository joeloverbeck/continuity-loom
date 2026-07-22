---
report_type: continuity-loom-author-playtest
schema_version: 3
run_id: playtest-the-winter-letter-2026-07-22T160327Z
report_stem: playtest-the-winter-letter-2026-07-22T160327Z
story_title: The Winter Letter
story_slug: the-winter-letter
run_mode: continuation
prior_report: reports/playtest-the-winter-letter-2026-07-22T092442Z.md
project_path: /tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z
project_exists_at_close: true
started_at: 2026-07-22T16:03:27Z
completed_at: 2026-07-22T18:25:00Z
status: completed
completion_reason: accepted-one-segment
accepted_segment_sequence: 5
base_url: http://127.0.0.1:35285
browser: chromium
viewport: 1440x900
openrouter_send_controls_clicked: 0
provider_request_attempts: 0
provider_requests_blocked: 0
cold_prose_attempts: 1
cold_assistance_attempts: 1
counterfactual_probes: 0
cold_first_view_witnesses: 0
independent_claim_challenges: 0
change_review_comparisons: 1
candidate_intervention: light
---

# Continuity Loom Author Playtest Report: The Winter Letter

## Run Status

Completed. The existing local project reopened by exact path, one lightly edited user-supplied cold prose candidate was accepted exactly once as segment 5, its durable changes were reviewed through the Accepted-Segment Change Review surface, and the Generation Brief was re-authored as the segment-6 handoff. The project remained at `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z`.

No OpenRouter Generate, Ideate, Analyze, model-refresh, or other provider-send control was clicked. Across both app/browser windows this run (see below), the guarded browser recorded zero provider-request attempts, zero blocked provider requests, zero external-request blocks, zero network failures, and zero console entries.

Two environmental limitations shaped this run and neither is a Continuity Loom defect. First, as in the prior run, headless raster capture (screenshots) and Playwright's pointer motion-stability click gate both hang in this WSL2 environment (F023); the full journey was completed through accessibility-tree and visible-text snapshots plus keyboard/`goto` interaction, and no image evidence was retained. Second, a **power outage** stopped both run-owned holders after segment 5 was accepted and persisted but before the post-acceptance Change Review draw and record/brief curation. Because the one-segment boundary was already met and the pre-outage safety streams were empty, the isolated app and guarded browser were restarted (fresh session plumbing, same isolated blank-credential config) to complete the post-acceptance continuity work; the no-provider-request proof holds across both windows.

## Executive Assessment

The headline of this run is a new, moderate prompt-contract finding on the reveal path (F024): a critical hard-canon FACT set to **audience visibility `hidden`** produces no audience-concealment instruction in the compiled prose prompt. The Tomás-time-travel fact — the story's hidden premise, known only by the POV character — renders identically to the two `explicit` facts in every prose-prompt location, and the dedicated `<audience_knowledge>` block reads `Audience does not know: None specified`. Reader-concealment of the premise currently rests entirely on the author remembering to write a per-segment `do_not_force` clause plus close-POV craft, not on the field whose name promises audience-level concealment. It did not bite the accepted segment (the directive and craft held), but it reframes the prior reports' "reveal-lock decision" as canonical-metadata hygiene rather than prose safety, and it is the kind of gap that can quietly leak a premise.

The most significant positive is that the prior run's longest-standing workflow gap, F021, is now substantially addressed by design. The Accepted-Segment Change Review contract shipped a `2.1.0` update (compiler `2.0.0`) that explicitly elicits brief-versus-accepted drift. This run's single cold draw reconciled the accepted segment against the Generation Brief's current-state and immediate-handoff fields, naming the exact brief paths that now lag and flagging that the segment "renders forward past the brief's begin_after and last_visible_moment." The contract also carries a reverse-drift clause (a brief field presupposing a beat the segment does not render is reported as interpretation, never an established change); that specific path was not triggered this run because I corrected the one stale inherited brief clause before compiling.

The prose path again performed strongly. One cold response against a compound `must_render` (Clara's deliberation, Tomás's powerless waiting) and an eight-clause `do_not_force` satisfied every clause with no retry, including the hardest: the sealed question never surfaced, no staff entered, and — notably — the response actively refused to let Tomás interpret Clara's faint sounds, directly honoring the no-overhear clause. Exactly one narration phrase drifted toward the still-unmade reveal lock ("a very long time") and was trimmed to one light copyedit — the same class of edit the prior run made, and the practical demonstration of F024's consequence (only manual vigilance, not a compiled instruction, caught it).

The Change Review delta comparison was discovery-complete for this episode: it captured all the material (handoff) work, correctly typed both changes as `next-brief-only` rather than durable canon, invented no canon, kept the reveal lock, and even surfaced two next-brief-only relational/pressure nuances I had under-weighted. Segment 5 therefore required zero durable-record edits; the only post-acceptance canonical work was re-authoring the brief handoff.

## Story Intent and Expectations

The continuation remained a restrained speculative drama about the centuries-old time traveler Tomás Vidal trying to keep Clara Hale alive past her planned Christmas 1972 suicide in a sanatorium without coercing her or demanding belief. Segment 4 ended with Tomás's signed account delivered and read (its obligation discharged), Clara's sealed question armed beside the still-unfinished goodbye letter, the return decision explicitly deferred to "not tonight," and Clara instructing Tomás to step back and stand where she cannot hear her deliberate.

The intended segment 5 stayed in Clara's room: render Clara's deliberation and Tomás's powerless, out-of-earshot waiting, ending at a reversible point with the sealed question's content uninvented, Tomás's answerability undecided, the return open, breakfast still bounding the postponement, and staff never a speaking presence.

No Cold First-View Witness ran. This was a continuation, and the pilot is awaiting disposition per the authoritative pilot-state table.

## Run Configuration and Continuation Contract

| Item | Value |
| --- | --- |
| Mode | Continuation from `reports/playtest-the-winter-letter-2026-07-22T092442Z.md` |
| Project | `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z` |
| Isolated app (primary window) | `http://127.0.0.1:35285`, localhost only, blank credential (`hasOpenRouterCredential: false`) |
| Isolated app (post-outage recovery window) | `http://127.0.0.1:34869`, localhost only, blank credential (`hasOpenRouterCredential: false`), same isolated config dir |
| Browser | Guarded managed Chromium 149.0.7827.55, 1440x900; primary guard installed 16:06:16Z, recovery guard installed 17:33:44Z, each before its first navigation |
| Returning archive | Segments 1, 2, 3, 4 present before authoring |
| Returning authority | 15 records; Tomás and Clara onstage, Daniel offstage; fully populated seg-5 handoff brief |
| Assistance used | Accepted-Segment Change Review, one cold context; Ideate and Record Hygiene not naturally needed |
| Accepted archive at close | Segments 1–5; latest sequence 5 |
| Records at close | 15, unchanged (no durable change from segment 5); all in the active working set |
| Saved lifecycle at close | Continuation after accepted segment; accepted count 5; coherent |

Tomás and Clara remain in Clara's room. Clara has broken her silent deliberation only to release Tomás from watching the door and to tell him his task is done for tonight; Tomás has declined to turn or answer and holds the position she set him. The sealed test is unasked, the return undecided, the letter unfinished and unchosen beside the sealed envelope, and breakfast still bounds the postponement.

## Condensed Author Journey

1. Reopened the prior project by exact local path; verified OPEN true, title, compatibility ok, store version 4/4, exact path readback.
2. Read Accepted Segments before touching authority; read the full accepted segment 4 as author review and established its true end state (turn rendered in canon; account discharged; question sealed; return deferred; ends on the "stand where I can't hear you" instruction).
3. Verified the inherited 15-record set (including the two entangled reveal-premise FACTs and their `hidden`/`explicit` audience-visibility split), the CLOCK, the closed OBLIGATION, the two open threads, and the fully populated segment-5 handoff brief.
4. F021 retest: found the inherited seg-5 brief substantially aligned with segment 4 (a marked contrast to the prior run's drift); corrected one stale clause (`available_time` still asserted the delivered account as "owed") and saved. Confirmed the three comboboxes (POV default, cast pin on Tomás, generation context).
5. Inspected the compiled prose prompt (`fnv1a32:4debd1a3`), confirmed byte-identical determinism across a refresh, verified every populated writer field, and recorded F024 (audience_visibility inert). Obtained one cold prose response.
6. Pasted the raw response through **Write or paste candidate** (after resolving the two near-duplicate candidate controls, F025), verified user-supplied provenance and the prompt fingerprint, applied one reveal-lock copyedit in the visible editor, and accepted it once as segment 5.
7. Verified segment 5 in the archive; inspected the durable-change reminder. A power outage then stopped both holders; recovered the environment and re-opened the project.
8. Sealed an independent canonical-update baseline, then ran the Accepted-Segment Change Review single cold draw (`fnv1a32:32b202c8`, contract 2.1.0) and adjudicated the delta comparison (discovery-complete for this episode; both items next-brief-only).
9. Re-authored the Generation Brief as the segment-6 handoff (14 fields) and saved; made no durable-record edits (none warranted); skipped Record Hygiene (no record edits) and new Private Notes (no new deferred item).

## What Worked

- Returning-project custody reproduced exactly, and again after a mid-run process kill: exact path, title, compatibility ok, store version 4/4, prior accepted segments immediately readable (F008).
- The project and its segment 5 survived a full power-outage process termination and re-opened cleanly with compatibility ok — durable local persistence held (F008-adjacent).
- Deterministic compilation held for both prompts: the prose prompt was byte-identical across a refresh, and the Change Review prompt was byte-identical across the app restart (same fingerprints and SHA-256s).
- The prose prompt produced a response satisfying a compound `must_render` and an eight-clause `do_not_force` with no retry and no structural repair; the sealed question never surfaced, staff never became characters, and the response actively refused to overhear Clara's deliberation.
- Candidate custody stayed explicit: "Draft candidate", "Source: User-supplied", and the inspected prompt fingerprint `fnv1a32:4debd1a3` shown before Accept; the disabled provider control ("Replace with OpenRouter generation") sat beside it, never clicked.
- Acceptance raised the durable-change reminder ("Update records manually before the next generation") and reported blockers/warnings coherently; the new sequence 5 archived with source User-supplied (F013).
- Accepted-Segment Change Review returned strict, well-grounded JSON on contract 2.1.0: two typed items with valid 3–7-word verbatim `evidence_excerpt` witnesses, resolvable spans, `affected_target_hints` pointing at the exact brief fields, `next-brief-only` retention, per-item `uncertainty_or_rival_reading`, and all six reasoned coverage rows (F020, F006).
- Compiled voice-pressure pins again led with the cast member's name (F017), and the cast-member dropdown option led with the name too.
- Readiness kept the single intentional provider blocker isolated from three proportionate warnings throughout; neither my brief correction nor the 14-field handoff rewrite introduced a new blocker (F010).

## Prioritized Findings

| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F024 | moderate | prompt-contract-mismatch | prose-prompt | A FACT set to audience visibility `hidden` produces no audience-concealment instruction in the compiled prose prompt; the `<audience_knowledge>` block reads "None specified" for a hidden hard-canon fact. | medium | new | direct-visible |
| F021 | moderate | friction | generation-brief | Brief-versus-accepted drift is now reconciled inside Change Review (contract 2.1.0 drift elicitation); the "no surface reconciles brief against accepted prose" gap is substantially closed. | medium | resolved | direct-visible, cross-run-recurrent |
| F020 | strength | strength | accepted-segment-change-review | Change Review's typed items plus reasoned six-dimension coverage route work correctly (both segment-5 items typed `next-brief-only`, no false durable canon). | high | preserve-strength | direct-visible |
| F025 | minor | friction | candidate | Two near-duplicate controls contain "Write or paste candidate"; only the non-"Go to" one mounts the editor. | medium | new | direct-visible |
| F017 | minor | friction | prose-prompt | Compiled voice-pressure pins lead with the cast member's name. | high | resolved | direct-visible, cross-run-recurrent |
| F006 | moderate | prompt-contract-mismatch | accepted-segment-change-review | The retired Segment Reconciliation silent-empty-array gap remains closed: Change Review requires all six reasoned coverage rows even for an empty items list. | high | resolved | direct-visible, cross-run-recurrent |
| F023 | note | friction | diagnostics | Headless screenshot capture and Playwright motion-stability click both hang in this environment; reproduced this run. Not a product defect. | high | repeated | direct-visible, reproduced |
| F008 | strength | strength | project-setup | Project open provides exact custody and compatibility readback; reproduced twice, including after a mid-run restart. | high | preserve-strength | direct-visible, cross-run-recurrent |
| F010 | strength | strength | readiness | Readiness isolates the intentional provider blocker from proportionate warnings; no author edit introduced a new blocker. | high | preserve-strength | direct-visible |
| F013 | strength | strength | acceptance | Acceptance preserves prose-to-canon boundaries and lifecycle and raises the durable-change reminder. | high | preserve-strength | direct-visible |

### F024 — A FACT's `hidden` audience visibility does not reach the compiled prose prompt

- **Observed fact:** The story's hidden premise is carried by a hard-canon FACT (Tomás can time-travel and is functionally immortal) with `audience_visibility: hidden`, known only by the POV entity. In the compiled prose prompt (`fnv1a32:4debd1a3`), this fact renders identically to the two `explicit` facts in every location it appears: the `<hard_canon>` block, the `<pov_knowledge_constraints>` "POV knows" list, the `<active_working_set>` "Knowledge pressure" summaries, and the `<relevant_facts_beliefs_events>` "POV-accessible facts" list — none carry any per-fact visibility or "do-not-reveal-to-reader" annotation. The dedicated `<audience_knowledge>` block reads `Audience already knows: No audience knowledge distinct from POV specified`, `Audience does not know: None specified`, `Dramatic irony allowed now: None specified`. The only reveal protections actually present are the manual `do_not_force` clause ("do not add future technology"), a `current_locks` line (the sealed test "cannot demonstrate time travel", which concerns test proof, not reader concealment), and generic prose-mode craft notes.
- **Author interpretation and impact:** A records field labeled "Audience visibility" with a value "hidden" naturally reads as "the reader must not learn this." Because the compiled prompt does not populate the `<audience_knowledge>` "does not know" slot from it, concealment of a critical premise depends on the author writing a per-segment `do_not_force` clause and on close-POV craft — the generic non-POV-interiority rule does not stop the POV character's *own* knowledge (Tomás knows he time-travels) from surfacing in narration. This can give false confidence that a premise is protected. It also means the prior reports' "reveal-lock decision" (align the two entangled facts' visibility) has no observable prose-prompt effect and is canonical-metadata hygiene, not prose safety.
- **Expected versus actual:** Expected a `hidden` critical fact to appear under "Audience does not know" (or carry a do-not-reveal marker); actual was "None specified" and identical rendering to explicit facts.
- **Visible reproduction:** Set a critical FACT to `audience_visibility: hidden`, keep it known only by the POV entity, compile the prose prompt, and read the `<audience_knowledge>` block and the fact renderings.
- **Privacy-safe evidence:** Prose prompt visible fingerprint `fnv1a32:5cbc89ba`-lineage; this run's fingerprint `fnv1a32:4debd1a3`, extracted-prompt SHA-256 `09964fc3f045d0b9238ca9897bacd89f023fdb7891f412db86a9302fb059eab4`. The structural label "Audience does not know: None specified" is the minimum excerpt needed; no record payload or prose is reproduced.
- **Workaround and cost:** Author a per-segment `do_not_force` clause that names the premise, and lean on close-POV craft. This run's `do_not_force` already did so, and the accepted prose kept the premise concealed; cost was one manual reveal-lock copyedit on the candidate.
- **Likely layer:** Prompt contract / compiler rendering of record `audience_visibility` (or the story-record schema's intent for the field). Confirmed from the visible prompt text; the field's intended purpose is not verifiable doc-blind.
- **Desired author-visible outcome:** Either FACT `audience_visibility: hidden` should populate the prose prompt's "Audience does not know" list (and a do-not-reveal instruction for POV-known hidden facts), or the records UI should clarify that FACT audience_visibility is not a reader-concealment control and point authors to SECRET reveal permissions and the `do_not_force` directive.
- **Uncertainty:** Doc-blind; I cannot confirm the compiler's intent for the field, and it may serve validation or other prompt types (its effect on the Change Review prompt was not separately isolated). One story, one POV, three FACT records.

### F021 — Brief-versus-accepted drift is now reconciled inside Change Review (resolved)

- **Observed fact:** The prior run's F021 was that the Generation Brief handoff can silently drift from accepted canon with no surface reconciling brief against accepted prose. The Change Review contract is now `2.1.0` (compiler `2.0.0`, template `2.1.0`), and its prompt explicitly instructs brief-versus-accepted reconciliation: a section states that "an inherited Generation Brief current-state or immediate-handoff field can presuppose a beat the latest accepted segment does not render", reported as interpretation requiring author judgment with an empty `evidence_excerpt`. This run's single cold draw exercised the forward direction of the same capability: both returned items carried `contrast` and `affected_target_hints` naming brief paths (`immediate_handoff.begin_after`, `immediate_handoff.last_visible_moment`, `current_authoritative_state.entity_statuses`, `immediate_situation_summary`, `line_of_sight_and_visibility`, `consent_or_force_conditions`), and the handoff coverage row stated the segment "renders forward past the brief's begin_after and last_visible_moment."
- **Author interpretation and impact:** The gap F021 named — no surface reconciles the brief against the accepted segment — is substantially closed by design: Change Review now contrasts the accepted segment against brief fields and pinpoints which brief paths lag. My own F021 retest still found a mild instance of the underlying drift (the inherited `available_time` clause still called the delivered account "owed"), which I corrected manually before compiling; had I left it, the same brief-contrast machinery would have been positioned to surface it.
- **Expected versus actual:** Expected the prior gap to persist unaddressed; found a shipped contract mechanism (PR lineage #160/#161) that reconciles brief against accepted prose.
- **Visible reproduction:** Accept a segment whose end advances past the inherited brief's begin_after, run Change Review, and read the items' contrast/affected_target_hints and the handoff coverage row.
- **Privacy-safe evidence:** Change Review prompt fingerprint `fnv1a32:32b202c8`, extracted-prompt SHA-256 `00fb1aba9ab97f1fe6825347aad05fcea044860e56a01d844669dd7a7a61d65e`, contract 2.1.0. See the Change Review Delta Comparison disclosure.
- **Workaround and cost:** The author must run Change Review after acceptance (or on the latest segment at continuation entry) to benefit; it is not an automatic continuation-entry aid.
- **Likely layer:** Prompt contract (Change Review 2.1.0) plus UI workflow (author must invoke it).
- **Desired author-visible outcome:** Preserve the 2.1.0 brief-drift elicitation; consider surfacing it (or a lightweight equivalent) at continuation entry, when a returning author is most exposed to an already-drifted inherited brief.
- **Uncertainty:** The specific reverse-drift path (brief presupposing an unrendered beat) was not triggered this run because I corrected the one stale clause pre-compile; only the forward direction was exercised. One draw, one continuation.

### F020 — Change Review's typed coverage routes work correctly (preserve-strength)

- **Observed fact:** Both returned items carried a valid `epistemic_status` ("established change") grounded by a 3–7-word verbatim `evidence_excerpt` (a 6-word excerpt for Clara's spoken release; a 4-word excerpt for Tomás's non-turn), and both were typed `retention_horizon: next-brief-only` with `affected_target_hints` at brief fields — correctly routing segment 5's changes to the next brief rather than to durable records. The six coverage rows were each reasoned: `checked - no relevant change` on spatial, time, and facts (each with a grounded reason), `changes found` on intentions, emotions, and handoff.
- **Author interpretation and impact:** The typing told me segment 5 introduced no durable-record change (both items ephemeral), which matched my sealed baseline; the reasoned no-change rows made "nothing durable changed" legible rather than a bare empty list. This is the mechanism behind F006's resolution and is worth preserving.
- **Expected versus actual:** Expected a typed, coverage-complete accounting; received exactly that, with correct durable-vs-ephemeral routing.
- **Visible reproduction:** Accept a quiet reversible segment, run Change Review, and read the per-item retention typing and the six coverage rows.
- **Privacy-safe evidence:** Change Review response on contract `accepted_segment_change_review.v2`; see the Change Review Delta Comparison disclosure for tallies and fingerprint.
- **Workaround and intervention cost:** None; adoption is manual re-authoring, as intended (here, only the brief).
- **Likely layer:** Prompt contract and schema.
- **Desired author-visible outcome:** Preserve per-item epistemic/retention typing and reasoned six-dimension coverage.
- **Uncertainty:** One draw; instance-level, not a rate.

### F025 — Two near-duplicate "Write or paste candidate" controls; only one opens the editor

- **Observed fact:** On the Generate / Candidate page, two buttons contain the phrase "Write or paste candidate": "Go to Write or paste candidate" (a scroll/anchor control) and "Write or paste candidate" (the control that mounts the "Candidate text" editor). Activating the "Go to" button via keyboard did not mount the editor; only the plain "Write or paste candidate" button did.
- **Author interpretation and impact:** For a keyboard/automation-driven perceiver, the first "…candidate" match lands on the scroll-only button and no editor appears, which briefly stalls the accept flow. For a sighted human, the "Go to" jump link with the real control visible after scroll is likely obvious, so impact is minor/cosmetic — but the near-duplicate accessible names are an information-architecture snag.
- **Expected versus actual:** Expected one obvious candidate-entry control; found two controls whose names both contain the same action phrase.
- **Visible reproduction:** Open Generate / Candidate and enumerate buttons; observe both "Go to Write or paste candidate" and "Write or paste candidate".
- **Privacy-safe evidence:** Button accessible names as quoted; no story content involved.
- **Workaround and intervention cost:** Target the exact "Write or paste candidate" control; a few extra inspection steps.
- **Likely layer:** UI / information architecture.
- **Desired author-visible outcome:** Differentiate the two controls' accessible names (e.g., the jump link as "Jump to candidate entry") so the editor-opening control is unambiguous.
- **Uncertainty:** May read differently to a sighted mouse user; single observer.

### F017 — Compiled voice-pressure pins name the cast member (resolved, retest)

- **Observed fact:** The "Active cast voice pressure pins" block leads each pin with the cast member's label: "Clara Hale; …; local function: active_speaker; …" and "Tomás Vidal; …; local function: pov_narrator; …; current generation voice pressure: …". The cast-member dropdown option likewise led with the name ("Tomás Vidal — …").
- **Author interpretation and impact:** Auditing whether voice pressure landed on the right character reads directly from the name; the prompt-side name-versus-description legibility problem stays closed.
- **Expected versus actual:** Expected name-first pins (as resolved last run); confirmed.
- **Visible reproduction:** Set a `current_voice_pressure` for a named cast member, compile the prose prompt, read the pin block.
- **Privacy-safe evidence:** Prose prompt fingerprint `fnv1a32:4debd1a3`.
- **Workaround and intervention cost:** None.
- **Likely layer:** Prompt compiler rendering of the cast pin block.
- **Desired author-visible outcome:** Preserve name-first pins.
- **Uncertainty:** Three cast members, one pov_narrator.

### F006 — Reconciliation's silent-emptiness gap remains closed (resolved, re-confirmed)

- **Observed fact:** The Change Review prompt requires accounting for exactly six named dimensions and states that "an empty items list remains unverified advisory output and is valid only with all six reasoned coverage rows"; the output schema's top-level `required` is `[items, coverage]`, and the coverage status enum is `changes found` / `checked - no relevant change`. This run's draw returned three reasoned `checked - no relevant change` rows (spatial, time, facts), each with a grounded reason.
- **Author interpretation and impact:** A no-change result is mandatory-carry six reasoned rows, so "nothing changed" stays distinguishable from a failed draw. Re-confirmed on a genuinely low-change segment.
- **Expected versus actual:** Expected the structural requirement to hold; confirmed.
- **Visible reproduction:** Accept a reversible segment, run Change Review, read the coverage requirement and the reasoned rows.
- **Privacy-safe evidence:** Change Review prompt fingerprint `fnv1a32:32b202c8`.
- **Workaround and cost:** None.
- **Likely layer:** Prompt contract.
- **Desired author-visible outcome:** Preserve the six-reasoned-coverage requirement.
- **Uncertainty:** One draw; the resolution rests on the visible contract requirement (structural).

### F023 — Headless screenshot and motion-stability click unavailable (harness, reproduced)

- **Observed fact:** `screenshot` was avoided; a `click` on "Go to Write or paste candidate" timed out at Playwright's pointer motion-stability gate (5000 ms), while `goto`, `fill`, `fill-file`, `focus`, `press`, `select`, `text`, `text-file`, and `tree` all succeeded, and console/network/provider streams stayed empty. Managed Chromium 149 launched cleanly both times (no channel fall-through this run).
- **Author interpretation and impact:** No image evidence; controls activated via keyboard, navigation via `goto`. A human author needs neither raster capture nor automation stability gating and is unaffected.
- **Expected versus actual:** Expected the prior run's environment limitation to persist; confirmed for click.
- **Visible reproduction:** Run any `click`/`screenshot` in this WSL2 headless environment.
- **Privacy-safe evidence:** One recorded click timeout; empty diagnostic streams.
- **Workaround and intervention cost:** Perceive via `tree`/`text`, activate via `focus`+`press`, navigate via `goto`.
- **Likely layer:** Environment/harness, not the product.
- **Desired author-visible outcome:** None for the product; noted so future runs expect it.
- **Uncertainty:** Environment-specific.

### F008 / F010 / F013 — Reproduced strengths

- **F008 (project custody):** Reopened with exact path, title, compatibility ok, store version 4/4 — twice, including after the power-outage restart, at which point the project and its just-accepted segment 5 re-loaded cleanly. Preserve.
- **F010 (readiness):** One intentional provider blocker held against three proportionate warnings (long-cast-dossier and prompt-length lost-in-the-middle risks, plus sample-utterances recommendation) throughout; neither the one-field correction nor the 14-field handoff rewrite introduced a new blocker. Preserve.
- **F013 (acceptance lifecycle):** Acceptance archived segment 5 (source User-supplied) and raised the durable-change reminder directing manual record updates before the next generation; blockers/warnings reported coherently. Preserve.

## Surface-by-Surface Experience

| Surface | Author goal | Current-run experience | Outcome |
| --- | --- | --- | --- |
| Project Library | Reopen the local story | Exact-path open with full custody readback; reproduced after a mid-run restart | Completed |
| Accepted Segments | Verify prior archive and new segment | Segments 1–4 present before work; segment 5 visibly latest after one acceptance; per-segment timestamps and the readable-output note exposed | Completed |
| Records | Recover and curate continuity | 15 inherited records legible; the reveal-premise FACTs' `hidden`/`explicit` split read via detail panels; no records created or edited (none warranted) | Completed |
| Private Notes | Preserve inert unknowns | Not exercised: segment 5 created no new deferred question or anchor beyond the prior run's inert notes | Correctly skipped |
| Active Working Set | Confirm scene authority | Cast bands and names intact; all 15 records selected; no change needed | Completed |
| Generation Brief | Correct drift, then leave a handoff | Group navigator, plain-first labels, unsaved-changes bar; saved twice (one seg-5 correction, then the 14-field seg-6 handoff) | Completed; F021 |
| Validation / Prompt Preview | Audit determinism and field presence | Byte-identical prompt across refresh; every populated writer field located; guard blocks broad prompt-body snapshots, `text-file` extracts the exact prompt | Completed; F024 |
| Generate / Candidate | Paste, verify, and accept cold prose | Manual intake beside disabled Generate; provenance and `fnv1a32` fingerprint shown before Accept; two "…candidate" controls (F025) | One edited candidate accepted |
| Change Review | Discover durable changes from segment 5 | Six-dimension reasoned coverage, typed items, span/contrast/affected-target citations on contract 2.1.0; discovery-complete for this episode | Useful; F020, F021, F006 |
| Record Hygiene | Check overlap after editing records | Not invoked: zero record edits this run, so no new overlap risk arose | Correctly skipped |
| Ideate | (Not needed) | The next beat was determined by segment 4's close; no genuine author block | Correctly skipped |
| Story Configuration | (Not needed) | Premise and prose mode unchanged | Correctly skipped |

## Prompt Usefulness

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Generated Prose Prompt | Render Clara's deliberation and Tomás's powerless waiting, stopping at a reversible decision | Compliant on the compound `must_render` and all eight `do_not_force` exclusions | 1 | 0 | 1 | Strong; selected after one reveal-lock copyedit | high for this response |
| Accepted-Segment Change Review Prompt | Discover durable deltas from accepted segment 5 | Compliant; typed items, reasoned six-dimension coverage, valid provenance and citations, contract 2.1.0 | 2 | 0 | 2 (both next-brief-only, applied to the brief) | Useful; discovery-complete for this episode | high on this draw |

The prose prompt was used once with no retry; its only defect was a single narration phrase ("a very long time") that drifted toward the still-unmade reveal lock and was trimmed in the visible candidate editor. No targeted counterfactual was warranted, because every populated field appeared in the response. Record Hygiene and Ideate were not invoked (no natural need); the run therefore has one assistance draw (the Change Review comparison), consistent with `cold_assistance_attempts: 1`.

The Change Review draw is the run's strongest single assistance result: it typed both changes as next-brief-only (so segment 5 required no durable-record edit), reconciled the accepted segment against brief fields (F021), kept the reveal lock, and invented no canon. This is a prompt-contract strength, not merely a model-output success — the six-reasoned-coverage requirement and the evidence_excerpt anti-invention witness are contract properties.

## Generation Brief Field Influence

Rows describe the segment-5 prose prompt (`fnv1a32:4debd1a3`) that produced the accepted segment. The only field edited this run before this compile is `available_time` (marked E). All populated fields appeared in the compiled prompt (verified by reading the extracted prompt) and were observably followed by the response.

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `current_time` | Hold the deep-night post-seal interval | No dawn or time jump | Present in current state | Time advances only by the waiting; morning "nearer" | Used | high |
| `current_location` | Bind to Clara's room | Never leave the room | Present | Entire response stays in room and doorway | Used | high |
| `immediate_situation_summary` | Open at segment 4's true end | Deliberation just begun, Tomás out of earshot | Present | Opens on Tomás a few steps back, watching | Used | high |
| `positions` | Tomás stepped back, back to desk | Out of earshot, facing away | Present | He stands back, back to the desk | Used | high |
| `possessions` | The two papers with Clara | Sealed envelope + unfinished letter set together | Present | The two papers are the deliberation's fulcrum | Used | high |
| `visible_conditions` | Behavioral inference only | Read Clara through stillness | Present | Faint sounds he refuses to interpret | Used | high |
| `environmental_conditions` | Sparse pressure | Cold, radiator, frost | Present | Radiator knocks, frost thickens | Used | high |
| `entity_statuses` | Preserve deliberation, powerlessness, coma | No unsupported state changes | Present | All hold; Daniel offstage | Used | high |
| `line_of_sight_and_visibility` | Limit perception | Infer Clara by sound | Present | He cannot see/parse her work | Used | high |
| `pov_cannot_perceive_now` | Protect the sealed content | Infer rather than know | Present | Sealed content never perceived | Used strongly | high |
| `routes_and_exits` | Keep the staffed threshold | Nobody leaves | Present | Nobody leaves | Used | high |
| `available_time` (E) | Remove the discharged-account pressure | Only morning bounds time | Present (stale "owed" clause removed) | No account-owed pressure re-enters | Used | high |
| `consent_or_force_conditions` | Preserve revocable consent | No approach/overhear | Present | He acts only within her instruction | Used strongly | high |
| `current_locks` | Cap what the test proves; seal content; no time-travel demonstration | Limits stated; premise withheld | Present | Limits honored; premise withheld | Used strongly | high |
| `recent_causal_context` | Carry segment 4 forward | Explain the deliberation | Present in handoff | Continuous from the seal + step-back | Used | high |
| `last_visible_moment` | Fix the step-back into silence | The just-completed step-back | Present in handoff | Opens continuous with it | Used | high |
| `begin_after` | Start after the step-back | Deliberation as the opening | One handoff match | Opens in the deliberation | Exact match | high |
| `must_render` | Deliberation + powerless waiting, reversible | All render | Present as directive | All render; nothing settled | Used strongly | high |
| `may_render_if_naturally_caused` | Permit ambient pressure and a little speech | Only locally caused pressure | Present | Ambient pressure; Clara's one line | Used | high |
| `do_not_force` | Exclude sealed content, result, staff, logistics, premise | Preserve uncertainty and one-room scope | Present | All eight exclusions hold | Used strongly | high |
| `cast_member_id` | Keep voice pressure on Tomás | Do not overwrite Clara's anchor | Named pin leads with "Tomás Vidal" (F017) | Tomás performs the restraint | Used | high |
| `current_voice_pressure` | Keep Tomás plain, non-overselling | Do not fill silence; do not plead | Present in pin | He holds still, does not plead | Used strongly | high |
| `selected_pov` | Use PROSE MODE default | Effective POV Tomás | Present (POV: Tomás Vidal) | Close-third through Tomás | Used | high |
| `soft_unit_guidance` | Stop at a reversible point | End on a reversible word | Present in stop rule | Ends on Clara's reversible line | Exact match | high |

Validation-only `generation_context` remained "Continuation after accepted segment" at compile time; it is a readiness check, not prose context. The author-only override `reason` field held the literal text "none" (author-only, not sent to the writer) and `override_text` was blank; these are not treated as ignored writer-facing fields.

## Assistance Evaluation

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Ideate | Skipped: the next beat (deliberation + powerless waiting) was fully determined by segment 4's close; no genuine author block | Not invoked | — | — | — | Correctly skipped |
| Accepted-Segment Change Review | Acceptance changed the immediate handoff (Clara's spoken release; Tomás's non-response) | Strict JSON: 2 typed items, all six reasoned coverage rows, contract 2.1.0 | 2 next-brief-only items adopted into the seg-6 brief | None wrong; both are next-brief-only (no durable-record work exists to perform) | Manual re-authoring of the brief | Useful |
| Record Hygiene | Skipped: zero record edits this run, so no new cross-record overlap/restatement risk arose; the set was already hygiene-checked last run | Not invoked | — | — | — | Correctly skipped |

No assistance output was pasted into the app. Provider transport, provider model selection, provider response parsing, and in-app assistance result cards were not exercised on the cold path; the two adopted concepts were re-authored by hand into the Generation Brief.

### Change Review Delta Comparison

| Segment sequence | Record scope | Prompt fingerprint | Baseline in-profile | Baseline out-of-profile | Correspondence counts | Coverage disagreements | Substitution verdict | Related finding IDs |
| --- | --- | --- | ---: | ---: | --- | ---: | --- | --- |
| 5 | active_working_set | 00fb1aba9ab97f1fe6825347aad05fcea044860e56a01d844669dd7a7a61d65e | 4 | 2 | matched=2; baseline-only=1; review-only-accepted=0; review-only-rejected=0; partial=1; unscorable=0 | 3 | discovery-complete for this episode | none - all differences non-material |

An independent canonical-update baseline was sealed before the prompt was compiled or any segment-derived edit was made. The two matched items correspond to my handoff/relational baseline expectations; the one `baseline-only` item (a marginal time creep) was folded by the response into a reasoned dim-2 no-change (sound: the creep is already conveyed by `current_time` and crossed no clock threshold); the one `partial` item is correct out-of-profile behavior (the response emits `affected_target_hints` at brief fields but cannot author the brief values). The three coverage disagreements (dimensions time, intentions, emotions) are all non-material and in the direction of the response over-delivering: it surfaced Clara's communicated release and her breaking of silence as next-brief-only pressure/relationship nuances I had under-weighted, and was soundly conservative on the time creep — none omit or misdirect canonical work, and both open threads and the closed obligation were left untouched. Scope was frozen to `active_working_set` (all fifteen records are in the working set, so it equals whole-project content). This is a single stochastic draw adjudicated by one operator against a self-authored baseline; the verdict is instance-level and not a rate, reliability, or independence claim.

## Candidate and Accepted Segment

One cold prose attempt produced a ~639-word response. It passed close-POV, one-room physical continuity, knowledge limits, consent, sensitivity, exact-directive, exclusion, voice, and stop-discipline review on first reading, and handled the "out of earshot" nuance correctly (Tomás at the edge of hearing for Clara's private sounds, but hearing her deliberately-raised address). Only one defect was found: a narration phrase drifted toward the still-unmade reveal lock; it was trimmed to a shorter phrase in the visible candidate editor so the prose would not gesture at Tomás's hidden longevity. Candidate intervention was `light`; no retry, replacement response, counterfactual, or rewrite occurred.

The edited response was pasted as a user-supplied candidate, visibly matched to prompt fingerprint `fnv1a32:4debd1a3`, and accepted once (archive timestamp `2026-07-22T16:51:39.105Z`), then archived as segment 5 with stored sequence 5 (template 1.11.0 / compiler 1.13.0 / contract 1.16.0). No prose excerpt is reproduced here. The content of Clara's sealed question was deliberately not recorded anywhere.

## Cumulative Finding Ledger

| ID | First seen | Classification | Summary | Current status | Latest evidence |
| --- | --- | --- | --- | --- | --- |
| F001 | 2026-07-19 run | friction | Create/Open local path semantics underexplained. | resolved | Parent-path/folder explanation present; macOS-style example cosmetic only. |
| F002 | 2026-07-19 run | friction | Story Configuration prioritized schema keys over labels. | not-retested | Story Configuration not revisited this run. |
| F003 | 2026-07-19 run | friction | Required CAST MEMBER core imposed high first-segment cost. | not-retested | No cast created. |
| F004 | 2026-07-19 run | confusion | Working Set cast rows identified by descriptions. | preserve-strength | Cast rows and the cast_member dropdown lead with names; prompt-side fixed (F017). |
| F005 | 2026-07-19 run | friction | Manual candidate entry below the long readiness surface. | preserve-strength | `Write or paste candidate` beside disabled Generate, opened without a credential (see also F025). |
| F006 | 2026-07-19 run | prompt-contract-mismatch | Segment Reconciliation could return silent empty arrays. | resolved | Change Review requires six reasoned coverage rows; three reasoned no-change rows this draw. |
| F007 | 2026-07-19 run | friction | First CDP connection needed a loopback permission retry. | resolved | No loopback permission failure, including on the post-outage restart. |
| F008 | 2026-07-19 run | strength | Project open provides exact custody and compatibility readback. | preserve-strength | Reopened exactly twice; survived a power-outage restart with compatibility ok. |
| F009 | 2026-07-19 run | strength | Private Notes are visibly inert and excluded from prompt authority. | not-retested | No note created or edited this run. |
| F010 | 2026-07-19 run | strength | Readiness distinguishes blockers from warnings. | preserve-strength | One intentional blocker + three proportionate warnings held; no new blocker from edits. |
| F011 | 2026-07-19 run | friction | Prior first browser holder exited before the journey ended. | resolved | No product-caused holder termination; the two terminations this run were an external power outage (Diagnostics). |
| F012 | 2026-07-19 run | strength | Prompt search exposes writer-field placement. | preserve-strength | All populated writer fields located in the compiled prompt; "Search within prompt" present. |
| F013 | 2026-07-19 run | strength | Acceptance preserves prose-to-canon boundaries and lifecycle. | preserve-strength | Segment 5 archived (User-supplied); durable-change reminder raised. |
| F014 | 2026-07-19 run | strength | Record Hygiene is sparse, type-aware, and safe. | not-retested | Hygiene not invoked (no record edits). |
| F015 | 2026-07-20T02:33Z run | friction | Private Note editing showed contradictory `Retry Save`/`Saved`. | not-retested | Notes not edited this run. |
| F016 | 2026-07-20T09:27Z run | prompt-contract-mismatch | Ideate's author focus cannot change the kind of answer returned. | not-retested | Ideate not naturally needed. |
| F017 | 2026-07-20T09:27Z run | friction | Compiled voice-pressure pins identified cast by dossier, not name. | resolved | Pins and the cast dropdown lead with the cast member's name. |
| F018 | 2026-07-20T09:27Z run | strength | Record Hygiene and post-acceptance review are complementary. | not-retested | Hygiene not invoked this run. |
| F019 | 2026-07-20T09:27Z run | strength | Newly created records default outside the active working set. | not-retested | No records created. |
| F020 | 2026-07-22T09:24Z run | strength | Change Review's reasoned six-dimension coverage plus per-item typing makes discovery legible. | preserve-strength | Both seg-5 items typed next-brief-only; three reasoned no-change rows. |
| F021 | 2026-07-22T09:24Z run | friction | Generation Brief handoff can silently drift from accepted canon with no reconciling surface. | resolved | Change Review 2.1.0 elicits brief-vs-accepted drift; this draw reconciled the segment against named brief paths. |
| F022 | 2026-07-22T09:24Z run | strength | Change Review surfaced a brief-internal contradiction through the accepted segment. | not-retested | No brief-internal contradiction present this run; the brief-field contrast mechanism was again evident (affected_target_hints). |
| F023 | 2026-07-22T09:24Z run | friction | Headless screenshot/click unavailable in this environment; not a product defect. | repeated | Click timed out at the motion-stability gate; journey completed via tree/text and keyboard/goto. |
| F024 | Current run | prompt-contract-mismatch | FACT `audience_visibility: hidden` produces no audience-concealment instruction in the compiled prose prompt. | new | Hidden hard-canon fact renders identically to explicit facts; `<audience_knowledge>` reads "None specified". |
| F025 | Current run | friction | Two near-duplicate "Write or paste candidate" controls; only one opens the editor. | new | "Go to Write or paste candidate" scrolls only; "Write or paste candidate" mounts the "Candidate text" editor. |

## Continuation Handoff

- **Project:** `/tmp/continuity-loom-playtest-projects/the-winter-letter-2026-07-19T022000Z` existed at close.
- **Latest accepted segment:** sequence 5.
- **Report for the next run:** `reports/playtest-the-winter-letter-2026-07-22T160327Z.md`.
- **Story intent:** Tomás still seeks a noncoercive way to keep Clara alive long enough to change her conclusion; Clara still controls proximity, evidence standards, the sealed test's timing, and the duration of her postponement.
- **Unresolved response point:** Clara has broken her silent deliberation only to release Tomás from watching the door and say his part is done for tonight; Tomás has declined to turn or answer and holds his post. She has resolved nothing — the sealed test unasked, the return undecided, the goodbye letter unfinished and unchosen beside the sealed envelope. The next author should render her deliberation continuing after speaking, and may render a first small reversible movement toward how she spends the little time before morning, without asking the test, resolving the return, or completing/destroying the letter. The sealed question's content must not be invented; Tomás's answerability must remain undecided; whether he may return is Clara's to decide and must stay open tonight; staff must not enter, speak, or become characters.
- **POV and cast:** close-third past through Tomás; Tomás and Clara remain in Clara's room, Tomás a few steps back from the door with his back to her; Daniel remains offstage and comatose in 1972.
- **Local pressure:** the round has passed toward the stairwell; breakfast still bounds Clara's postponement and is nearer; the account is delivered and its obligation closed; the live pressures are the armed-but-dormant sealed test, the undecided return, and the morning boundary.
- **Canonical work completed:** no durable-record edits were warranted (Change Review typed both segment-5 changes next-brief-only); the Generation Brief was re-authored as the segment-6 handoff (14 fields updated and saved) reflecting Clara's spoken release, Tomás's non-response, the marginal advance toward morning, and the still-open threads.
- **Outstanding author decisions:** (1) the reveal-lock FACT `audience_visibility` split (Daniel-wakes `explicit` vs Tomás-time-travel `hidden`) remains unresolved — deferred pending clarity on what the field does at the prose-prompt level (F024); do not change hard canon casually. (2) whether FACT-2's "judged the Daniel-facts short of proof" clause should be retyped from a current-state FACT to a BELIEF (not segment-derived; still open). (3) Clara's endpoint resolve — segment 5 keeps it deferred (she chose neither paper).
- **Retest targets:** F024 audience_visibility behavior (does a hidden critical fact ever reach the prose prompt's audience block?); F021 whether Change Review's reverse-drift path triggers when an inherited brief field genuinely presupposes an unrendered beat; F022 brief-internal-contradiction catch if two brief fields are left inconsistent; F014/F018/F019 if a future segment edits or creates records; F016 Ideate focus; F002 Story Configuration labels; F003 first-time CAST MEMBER burden; whether Change Review's discovery-completeness holds across further draws.

## Diagnostics and Evidence

The run began from repository HEAD `c3059e51f3d86a7733cec109f6d9271f6b8eb17d` with a clean worktree baseline (`git status --short` produced no output). Durable workspace changes are limited to this report and its (empty at close) evidence directory.

Two app/browser windows were used because of a power outage. The primary window launched the built app on `127.0.0.1:35285` with an explicitly blank credential (`hasOpenRouterCredential: false`) and an isolated config directory; its guarded managed Chromium 149 holder installed provider guards at 16:06:16Z before the first navigation and restricted all requests to the exact app origin. Segment 5 was authored, accepted (archive timestamp `2026-07-22T16:51:39.105Z`), and verified in this window; its diagnostic streams were empty. A power outage then stopped both run-owned holders (recorded as an environmental interruption, not product behavior, and not a provider-safety event). The isolated app was restarted on `127.0.0.1:34869` with a fresh session directory and the same isolated blank-credential config; a fresh guarded Chromium 149 holder installed provider guards at 17:33:44Z before its first navigation. The project re-opened cleanly (compatibility ok) with segment 5 intact, and the post-acceptance Change Review draw and the segment-6 brief re-authoring were completed in this window. Headless raster capture and the motion-stability click gate remained unavailable throughout (F023); the journey was completed via accessibility-tree and visible-text snapshots and keyboard/`goto` interaction.

Safety counts copied before requested shutdown (identical across both windows; the primary window's streams were captured empty before the recovery streams were re-initialized):

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
- One cold prose draw and one Change Review draw do not establish output rates or model stability. Executor model identities were not exposed by the host.
- F024 rests on the visible prose prompt (structural: a hidden critical fact renders identically to explicit facts and the audience block reads "None specified"), but the compiler's intent for `audience_visibility` is not verifiable doc-blind; the field may serve validation or other prompt types, and its effect on the Change Review prompt was not separately isolated.
- F021's resolution rests on the visible contract 2.1.0 requirement plus one draw that exercised only the forward direction (segment advances past the brief); the reverse-drift path (brief presupposing an unrendered beat) was not triggered because the one stale inherited clause was corrected before compiling.
- The Change Review draw's "discovery-complete for this episode" verdict is instance-level against a self-authored baseline; it is not a rate, reliability, or independence claim. The three coverage disagreements were non-material and in the direction of the response over-delivering.
- Screenshot capture and the motion-stability click were unavailable (F023), so no image evidence exists and visual-only checks (focus-ring visibility, color-only state, clipping) were not assessable; structural accessibility (roles, accessible names, labels) was assessed via the accessibility tree.
- A power outage interrupted the run after acceptance; the environment was restarted to complete post-acceptance work. The no-provider-request proof is preserved across both windows, but the run spanned two app instances and two guarded-browser holders.
- Cold First-View, Independent-Claim, and Method-register pilots were all awaiting disposition, so none ran or advanced in this report. The retired Paired-Draw Check did not run.
- Ideate and Record Hygiene were not invoked, so F016 and F014/F018 remain unretested; Story Configuration was not revisited (F002); no cast member or record was created (F003/F019); Private Notes were not edited (F009/F015).
- No targeted counterfactual was run, because no populated field appeared ignored. Field influence remains correspondence evidence, not isolated causality.
- The reveal-lock, FACT-2 typing, and resolve decisions were deferred rather than resolved, so their correctness is unverified. Records were not tested across a deliberate migration.
- Mobile layout, keyboard-only completion, screen-reader usability, performance, and backup/restore were outside scope, though the run incidentally observed clean project persistence across a process kill.
- Source code and active product docs were not inspected during the author journey; repository instructions and the report format were read only after authoring and review ended.
