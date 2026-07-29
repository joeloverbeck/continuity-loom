---
report_type: continuity-loom-author-playtest
schema_version: 4
run_id: playtest-the-queen-s-private-audience-2026-07-29T103828Z
report_stem: playtest-the-queen-s-private-audience-2026-07-29T103828Z
story_title: The Queen's Private Audience
story_slug: the-queen-s-private-audience
run_mode: new_story
prior_report: null
project_path: /tmp/continuity-loom-playtest-projects/the-queen-s-private-audience-2026-07-29T103828Z
project_exists_at_close: true
started_at: 2026-07-29T10:38:28Z
completed_at: 2026-07-29T14:27:42Z
status: blocked
completion_reason: browser-resource-exhausted
accepted_segment_sequence: null
base_url: http://127.0.0.1:42877
browser: chromium
viewport: 1440x900
openrouter_send_controls_clicked: 0
provider_request_attempts: 0
provider_requests_blocked: 0
cold_prose_attempts: 0
cold_assistance_attempts: 1
counterfactual_probes: 0
cold_first_view_witnesses: 0
independent_claim_challenges: 2
change_review_comparisons: 0
cast_possibilities_comparisons: 1
candidate_intervention: not-reached
---

# Continuity Loom Author Playtest Report: The Queen's Private Audience

## Run Status

Blocked before prose-prompt inspection. The project, story configuration, records, working set,
Cast-ready brief, one Cast Possibilities comparison, and independently authored final directive
were saved through the visible UI. The guarded browser then closed while navigating to Preview.
Its recorded request failure was `net::ERR_INSUFFICIENT_RESOURCES`; the context terminated
unexpectedly, and the single permitted fresh-browser recovery could not launch Chromium
(`SIGTRAP`; Chrome fallback absent). No candidate was created and no segment was accepted.

The separate story project still exists at
`/tmp/continuity-loom-playtest-projects/the-queen-s-private-audience-2026-07-29T103828Z`.
No OpenRouter send control was clicked and no provider request was attempted.

## Executive Assessment

Continuity Loom supported a careful, source-blind setup for a coercive court scene: local project
custody was clear, Private Notes stated their inert boundary prominently, readiness found missing
record references and POV knowledge with actionable repairs, and the Cast Possibilities prompt
produced three grounded choices that improved the final directive without becoming authority.

Two issues determined the outcome. First, readiness repeatedly treated explicit negative safety
constraints in `Do not force` as content requested in conflict with the policy; the author had to
make that local safety wording less explicit to proceed. Second, a browser resource failure ended
the run before the prose prompt could be inspected, and the bounded fresh-browser recovery failed.
The first is a product-facing validation defect; the second is a run-environment/harness blocker
whose product attribution is not established.

## Story Intent and Expectations

The intended story was a grim medieval court fantasy about adult traveling minstrel Tomas Vey,
summoned for a private performance by Queen Bogdana Avalune: a towering, extraordinarily muscular
conqueror known for music, volatility, murder, and coercive imprisonment. The first segment was to
establish danger through music, physical space, and constrained agency while leaving attraction,
escape, patronage, captivity, and the queen's ultimate intention unresolved.

The expected workflow was local project creation, durable cast and location records, inert private
scratch, an explicit active working set, a Cast-ready saved brief with no authored Bogdana action,
one cold Cast comparison, an independently saved final directive, one cold prose draw, visible
candidate editing, exactly one acceptance, and deliberate post-acceptance continuity review.
Content was bounded to mature but non-explicit pressure: coercion could be dangerous context but
not sexualized or rendered as assault.

The sealed mental model expected structured records and a local brief to remain the authority,
with inspectable prompts and no automatic promotion from notes, assistance, or accepted prose.

## Run Configuration and Continuation Contract

| Item | Value |
| ---- | ----- |
| Repository HEAD | `2e490e4dc98318dff17ea492f31daea9ca65bef2` |
| Initial worktree | Clean |
| Build | `npm run build` passed; Vite reported only its chunk-size warning |
| Isolated app | `127.0.0.1:42877`; explicit blank provider credential; isolated temporary config |
| Initial browser | Chromium 149.0.7827.55; 1440x900; reduced motion; screenshot capable |
| Browser guard | Installed before first navigation; exact app origin only; provider-send endpoints guarded |
| Project | New local project at the exact temporary path above |
| Run boundary | Accept exactly one segment, or stop after bounded blocker recovery |
| Final boundary | Stopped before prose-prompt inspection; accepted sequence remains absent |

The report is the only continuation locator and summary. A later playtest should reopen the project
through the visible Open form, verify that Accepted Segments is empty, and resume from the saved
final Generation Brief. Prior report prose must not become prompt context.

## Condensed Author Journey

1. Prepared a unique run, clean-worktree baseline, project path, content boundaries, and sealed
   expectations before app launch.
2. Built the app, then launched an explicit blank-credential server and guarded browser. Both
   initial starts needed one narrow loopback-permission retry before navigation.
3. Created the project through the visible form. The UI confirmed the exact path, title,
   compatibility, and store version.
4. Saved the Story Contract and Universal Content Policy, then created separate Entity identities,
   linked Cast Member dossiers for Bogdana and Tomas, one location, and one public knowledge fact.
5. Created one Private Note after the UI explicitly described notes as author-private and excluded
   from prompts, readiness, generation, and accepted prose.
6. Added both Cast Members, both referenced Entities, the location, and the fact to the active
   working set. Assigned both characters to active/onstage full and fixed Tomas as close-third POV.
7. Filled and saved a Cast-ready Generation Brief. Readiness correctly identified missing Entity
   references and POV knowledge, which were repaired through canonical UI.
8. Reproduced the content-envelope contradiction twice by toggling only the explicit safety wording
   in `Do not force`; retained the governing policy and used a less explicit local workaround.
9. Sealed one Bogdana behavior hypothesis, extracted the exact visible Cast prompt, and obtained one
   fresh cold response. Two of three cards contributed to an independently authored final directive.
10. Saved the final directive. Readiness then showed only the expected blank-provider send blocker
    plus non-blocking warnings.
11. Navigation to Preview failed with a browser resource error and unexpected context closure.
    The one fresh guarded-browser recovery could not launch, ending the run.

## What Worked

- The first screen made the create/open split and local folder model concrete, including the exact
  parent-plus-child relationship.
- Project creation visibly read back the path, compatibility, and store version before story data
  was added.
- The Cast Member prerequisite screen explained that Entity owns identity and provided a direct
  recovery action rather than silently inferring a record.
- Private Notes repeated their inert, never-sent boundary at the point of use.
- Readiness named the missing selected references and non-omniscient knowledge profile, explained
  why each blocked, and pointed to the right author action.
- Cast Possibilities disclosed its saved source, POV, eligible cast, record counts, and absence of
  Secret records. Its single cold draw was structurally compliant and locally useful.
- The provider guard remained quiet; no paid or external request was attempted.

## Prioritized Findings

| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |
| --- | -------- | -------------- | -------- | ------- | ---------- | ------ | -------------- |
| F001 | major | defect | readiness | Negative safety constraints in `Do not force` trigger a content-envelope contradiction | high | new | direct-visible, reproduced, independent-supported |
| F002 | blocker | blocker | diagnostics | Browser resource exhaustion prevented prose Preview and bounded recovery | high | new | direct-visible, reproduced, independent-supported |

### F001 — Negative safety constraints are treated as prohibited requests

- **Observed fact:** A saved directive named explicit and coercive outcomes only as things not to
  force. Readiness displayed `Content Envelope Contradiction`, saying the directive asked the
  provider to render material excluded by the Universal Content Policy.
- **Author interpretation and impact:** The validation appears insensitive to negation in this
  field. It blocked prompt preview until the author made a useful local safety statement less
  explicit, creating pressure in the wrong direction on a sensitive scene.
- **Expected versus actual:** Repeating a policy exclusion as a local negative constraint should
  align with the envelope; it instead became a blocker.
- **Visible reproduction:** Save with the explicit negative terms: blocker present. Change only
  `Do not force` to omit those specific terms while preserving the governing policy: blocker
  absent. Restore the original: blocker present. Reapply the one-field workaround: blocker absent.
- **Evidence:** [Content-envelope blocker](assets/playtest-the-queen-s-private-audience-2026-07-29T103828Z/content-envelope-contradiction.png),
  SHA-256 `bded7d2e46976afb0d9a057b52bd7a51fc462a540a674cbf7de4ec9f0279e538`.
- **Workaround and cost:** Keep the Universal Content Policy unchanged, replace the specific local
  prohibitions with generic outcome locks plus “preserve the governing content policy,” save again.
  Cost was two diagnostic toggles and one less explicit local boundary.
- **Likely layer:** Validation contract or implementation; source was not inspected, so the exact
  mechanism is unconfirmed.
- **Desired author-visible outcome:** Negative constraints should be treated as envelope-aligned,
  and any real contradiction should identify the exact affirmative requested clause.
- **Uncertainty:** This is one authored vocabulary set, but the one-field result was reproduced
  twice.

### F002 — Guarded browser resource failure exhausted the run

- **Observed fact:** Opening Preview failed with `net::ERR_INSUFFICIENT_RESOURCES`; the holder
  recorded an unexpected `browser-context-close` with exit code 2. The one permitted fresh
  guarded-browser attempt then launched Chromium only for it to exit on `SIGTRAP`; the Chrome
  fallback was not installed.
- **Author interpretation and impact:** The browser execution environment ran out of a resource or
  hit a runtime limit. The failure prevented prompt inspection, prose evaluation, candidate entry,
  acceptance, and post-acceptance continuity work.
- **Expected versus actual:** A saved project should remain usable through the planned shutdown;
  the browser ended before Preview and could not be recovered within the skill's bound.
- **Reproduction:** The same episode produced the initial resource error/context close and a failed
  fresh launch. Repeated browser starts beyond that were prohibited.
- **Evidence:** Contemporaneously read diagnostic entries at `2026-07-29T14:23:22Z`; the failed
  recovery reported Chromium `SIGTRAP`. The recovery helper replaced the original small diagnostic
  streams before failing, so their exact lines survive only in this report's contemporaneous
  transcription, not as retained artifacts.
- **Workaround and cost:** None within the bounded method. The app and project were preserved for a
  later continuation.
- **Likely layer:** Run environment or browser harness; no evidence attributes this to product UI
  behavior.
- **Desired author-visible outcome:** A fresh guarded session should launch against the durable
  project after an unexpected browser close without discarding prior diagnostic evidence.
- **Uncertainty:** The recorded errors establish the resource failure, not its underlying host cause.

### Independent Claim Challenges

| Claim ID | Eligibility reason | Timestamp | Executor host | Executor model | Model identity exposed | Packet fingerprint | Status | Rival explanation | Observable discriminator | Operator resolution | Evidence basis |
| -------- | ------------------ | --------- | ------------- | -------------- | ---------------------- | ------------------ | ------ | ----------------- | ------------------------ | ------------------- | -------------- |
| F001 | Major finding driving product assessment | 2026-07-29T14:30:00Z | Codex fresh subagent | unknown | false | bde04a9d0175bf9e0ab8bc907eccd149c0ece80e17fa52c929f56eef85fa9bb1 | supported | Particular sensitive terms may trigger regardless of polarity, rather than a generally negation-insensitive path | Hold all state fixed and compare the same terms in negative, affirmative, and neutral constructions | Accepted; retain the run-scoped wording and no implementation/general-vocabulary claim | direct-visible, reproduced, independent-supported |
| F002 | Terminal blocker determining status and scope | 2026-07-29T14:30:00Z | Codex fresh subagent | unknown | false | bde04a9d0175bf9e0ab8bc907eccd149c0ece80e17fa52c929f56eef85fa9bb1 | supported | Preview-specific product state may trigger the browser failure rather than a general resource limit | Under the same host conditions compare a guarded non-product control page with this saved project's Preview | Accepted; preserve the failure chain while leaving product attribution and host cause unestablished | direct-visible, reproduced, independent-supported |

## Surface-by-Surface Experience

| Surface | Result |
| ------- | ------ |
| Project Library | Clear local create/open custody; exact path and compatibility readback worked |
| Story Configuration | Required fields were understandable; maturity preset plus explicitness supported the intended boundary |
| Records | Deep Cast dossiers were laborious but separated durable identity/voice from current pressure; prerequisites were explicit |
| Private Notes | Strong, repeated inertness boundary; one note saved |
| Active Working Set | Manual membership and cast bands were visible; referenced Entities also had to be selected |
| Generation Brief | Rich current-state fields supported physical and epistemic precision; readiness repairs were actionable |
| Cast Possibilities | Triggered for Bogdana; source disclosure was clear; one useful cold draw informed the final directive |
| Validation / Prompt Preview | Not reached — browser context closed while navigating to Preview |
| Generate / Candidate | Not reached — browser recovery exhausted before prose prompt evaluation |
| Accepted Segments | Not reached — no candidate and no acceptance |
| Record Hygiene | Skipped — the compact new record set created no sincere overlap or stale-state question before the blocker |
| Ideate | Skipped — the local author decision was sufficiently defined and Cast supplied the required non-POV comparison |
| Change Review | Not reached — no accepted segment |

## Prompt Usefulness

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| ------ | ----------- | ------------------- | -----------------: | ----------------------------: | ------: | ------- | ---------- |
| Cast Possibilities | Ground one observable Bogdana response before final directive authorship | Compliant: one character, three distinct grounded cards | 3 | 0 | 2 | useful | medium |
| Prose | Produce the first local segment and stop before Tomas answers | Not reached | 0 | 0 | 0 | blocked | high |

Cast used one exact visible prompt (SHA-256
`dd5b9720c6bb7ece5f7a1512a6dd9e1acb7ed6da4d86fb693bebb6eca38ca475`) and one
fresh cold context. There was no retry. The response stayed observable, grounded, and non-prose;
cards 1 and 3 informed a restrained music-centered intervention, while the movement-led card was
considered but not used. Provider response parsing and result cards were not exercised.

The prose prompt was never visibly opened or extracted, so no compilation, model-execution, retry,
or counterfactual inference is available.

## Generation Brief Field Influence

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| ----- | ----------- | ----------------------------- | ----------------------- | ----------------- | ------- | ---------- |
| selected_pov | Bind narration to Tomas | Close third-person access only through Tomas | Not reached — Preview failed | Not reached | not assessable | high |
| current_time | Place the audience temporally | Treat this as Tomas's arrival evening | Not reached — Preview failed | Not reached | not assessable | high |
| current_location | Bind the chamber | Remain in the private music chamber | Not reached — Preview failed | Not reached | not assessable | high |
| onstage_entities | Bound presence | Only Tomas and Bogdana onstage | Not reached — Preview failed | Not reached | not assessable | high |
| immediate_situation_summary | Establish summons and danger | Begin admitted alone and alert | Not reached — Preview failed | Not reached | not assessable | high |
| positions | Preserve body placement | Keep dais, chair, floor, and door coherent | Not reached — Preview failed | Not reached | not assessable | high |
| possessions | Preserve object/control state | Lute and control of the room remain clear | Not reached — Preview failed | Not reached | not assessable | high |
| visible_conditions | Ground bodies | Travel wear and extraordinary physicality shape perception | Not reached — Preview failed | Not reached | not assessable | high |
| environmental_conditions | Ground acoustics/light | Dim light and carrying sound affect prose | Not reached — Preview failed | Not reached | not assessable | high |
| entity_statuses | Color demeanor | Composure under tension versus ease | Not reached — Preview failed | Not reached | not assessable | high |
| line_of_sight_and_visibility | Bound sight | Chamber and door visible, beyond-door space not | Not reached — Preview failed | Not reached | not assessable | high |
| pov_cannot_perceive_now | Lock knowledge | No queen interiority or unseen guards | Not reached — Preview failed | Not reached | not assessable | high |
| routes_and_exits | Preserve constraint | Guarded door remains sole obvious exit | Not reached — Preview failed | Not reached | not assessable | high |
| available_time | Bound duration | One opening piece before pressure shifts | Not reached — Preview failed | Not reached | not assessable | high |
| consent_or_force_conditions | Frame coercion | Constrained agency without physical restraint | Not reached — Preview failed | Not reached | not assessable | high |
| current_locks | Prevent resolution | No casual exit, victory, or known captivity verdict | Not reached — Preview failed | Not reached | not assessable | high |
| must_render | Drive local action | Musical risk followed by restrained royal demand | Not reached — Preview failed | Not reached | not assessable | high |
| do_not_force | Preserve open outcomes | No romance, combat, escape, redemption, or fate decision | Not reached — Preview failed | Not reached | not assessable | high |
| current_voice_pressure | Color Tomas | Spare words, exact observation, indirect craft language | Not reached — Preview failed | Not reached | not assessable | high |
| soft_unit_guidance | Enforce stop | End after the queen's demand, before Tomas answers | Not reached — Preview failed | Not reached | not assessable | high |

Generation context was intentionally left as the visible coherent first-segment validation setting;
it is a validation-focus control, not expected prose content. The author-only override reason
remained blank.

## Assistance Evaluation

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| ------- | ---------------------- | -------------------- | -------------- | -------------- | ---------------- | ------- |
| Cast Possibilities | Required: one eligible non-POV active/full character could receive a participation requirement | Substantive compliant three-card response | Two cards contributed; sealed hypothesis revised | One plausible movement-led card not used | Independently re-authored and explicitly saved in Must render | useful |
| Ideate | Skipped: no genuine unresolved premise-level decision before the blocker | None | None | None | None | skipped |
| Record Hygiene | Skipped: compact new records had no sincere overlap/staleness concern | None | None | None | None | skipped |
| Accepted-Segment Change Review | Not reached: no segment accepted | None | None | None | None | blocked |

Provider response parsing and assistance-result cards were not exercised. Cold output was never
injected, imported, intercepted, or treated as continuity authority.

### Cast Possibilities Pre-Directive Comparison

| Hypothesis fingerprint | Prompt fingerprint | Timestamp | Executor host | Executor model | Model identity exposed | Eligible characters | Hypotheses retained | Hypotheses revised | Hypotheses rejected | Cards contributed | Cards considered-not-used | Cards rejected | Cards unscorable | Final must_render | Final may_render | Final omitted | Response verdict | Intervention burden | Related finding IDs |
| ---------------------- | ------------------ | --------- | ------------- | -------------- | ---------------------- | ------------------: | -------------------: | ------------------: | -------------------: | ----------------: | ------------------------: | -------------: | -----------------: | ----------------: | ---------------: | ------------: | ---------------- | ------------------- | ------------------- |
| 914d274cbd9bd3f620795b850f6e76287f6cbf88e22867b20e325490c2afb0e5 | dd5b9720c6bb7ece5f7a1512a6dd9e1acb7ed6da4d86fb693bebb6eca38ca475 | 2026-07-29T12:14:00Z | Codex fresh subagent | unknown | false | 1 | 0 | 1 | 0 | 2 | 1 | 0 | 0 | 1 | 0 | 0 | useful | light | none - all differences were nonmaterial author choices |

## Candidate and Accepted Segment

Not reached — the guarded browser failed before prose-prompt inspection. No prose response was
drawn, no candidate editor was opened, no intervention burden was assessed, and no segment was
accepted. `accepted_segment_sequence` is therefore `null`.

## Cumulative Finding Ledger

| ID | First seen | Classification | Summary | Current status | Latest evidence |
| --- | ---------- | -------------- | ------- | -------------- | --------------- |
| F001 | Current run | defect | Negative safety constraints trigger content-envelope contradiction | new | Reproduced twice with one-field toggles; blocker crop retained |
| F002 | Current run | blocker | Browser resource exhaustion prevented Preview and fresh recovery | new | Resource error, unexpected context close, then Chromium SIGTRAP |
| F003 | Current run | strength | Project entry and creation make local custody verifiable | preserve-strength | Exact path, compatibility, and store version read back visibly |
| F004 | Current run | strength | Private Notes state their inert boundary prominently | preserve-strength | Boundary repeated before and after one saved note |
| F005 | Current run | strength | Readiness gives actionable dependency repairs | preserve-strength | Entity-reference and POV-knowledge blockers resolved through UI |
| F006 | Current run | strength | Cast Possibilities produced grounded, distinct local options | preserve-strength | Compliant three-card cold draw; two cards contributed |
| F007 | Current run | friction | Loopback permission blocked initial holders | resolved | Exact-command narrow retries launched both holders before navigation |
| F008 | Current run | friction | Note save driver timed out after the save had succeeded | resolved | Visible count, edit mode, and Saved status prevented duplicate activation |

## Continuation Handoff

- **Project path:** `/tmp/continuity-loom-playtest-projects/the-queen-s-private-audience-2026-07-29T103828Z`
- **Project exists at close:** yes.
- **Latest accepted sequence:** none; Accepted Segments was not reached and no candidate was accepted.
- **Saved state:** Story Contract, content policy, Prose Mode, two Entity identities, two linked Cast
  Member dossiers, one location, one public knowledge fact, one Private Note, six selected working-set
  records, active/full bands for Tomas and Bogdana, and a saved final Generation Brief.
- **Next local point:** Reopen the project, confirm Accepted Segments is empty, inspect the saved
  brief, then resume at Validation / Prompt Preview. The final directive ends at Bogdana's
  music-centered demand before Tomas decides how to answer.
- **POV and participation:** Tomas remains the close-third past POV; Bogdana is active/onstage full.
- **Already completed method work:** One Cast comparison is complete. Do not repeat it merely because
  the browser failed later; the final directive was independently authored and saved.
- **Outstanding work:** Prose prompt field-presence audit, one cold prose attempt (plus at most one
  unchanged-prompt quality retry if warranted), candidate editing, exactly one acceptance, accepted
  sequence verification, durable-change reminder, and any naturally useful Change Review comparison.
- **Retest priority:** F001 when a local negative constraint repeats policy exclusions; F002 only as
  environment/harness recovery evidence, not presumed product behavior.
- **Report to supply:** `reports/playtest-the-queen-s-private-audience-2026-07-29T103828Z.md`.

## Diagnostics and Evidence

- Initial app start: first sandboxed attempt exited before ready; exact narrow host retry succeeded.
- Initial browser start: first sandboxed bind returned `EPERM); exact narrow host retry succeeded.
- Initial browser safety: Chromium, 1440x900, screenshot capable, provider guard ready before
  navigation, exact-origin restriction active.
- Unexpected termination: GET `/preview` recorded `net::ERR_INSUFFICIENT_RESOURCES`, followed by
  `browser-context-close`, expected=false, exitCode=2.
- Fresh-browser recovery: stale session pointer was removed after its metadata was copied; Chromium
  then exited by `SIGTRAP`, and the Chrome fallback was absent.
- The failed recovery helper recreated the diagnostic streams as empty before launch failure. They
  are excluded from retained evidence rather than misrepresented as the original streams.
- OpenRouter send controls clicked: 0.
- Provider request attempts: 0.
- Provider requests blocked: 0.
- External request blocks: 0 before the failed recovery.

### Evidence Index

- [Content-envelope contradiction](assets/playtest-the-queen-s-private-audience-2026-07-29T103828Z/content-envelope-contradiction.png) —
  tightly scoped visible blocker card for F001; contains no prompt, record payload, response, candidate,
  accepted prose, or secret.

## Coverage Limitations

- This was an instructed, source-and-doc-blind author journey. It does not establish uninstructed
  discoverability or human transfer.
- Browser failure prevented prose-prompt inspection, all Generation Brief field compilation checks,
  prose evaluation, candidate editing, acceptance, Accepted Segments verification, and
  post-acceptance continuity work.
- One Cast draw supports only an instance-level usefulness judgment, not reliability or rate claims.
- Ideate and Record Hygiene did not trigger naturally. Change Review was ineligible without an
  accepted segment.
- Provider response parsing/result cards, OpenRouter transport, and model refresh were intentionally
  untested. No provider request was attempted.
- The Cold First-View Witness, Paired-Draw Check, and method register are retired and did not run.
- Two decision-driving claims received the standing Independent Claim Challenge before final
  validation; the reconciled results appear under Prioritized Findings.
- The accessibility/layout pass was limited to visible labels, semantic roles, desktop fit, and the
  successful screenshot self-check before the blocker.
