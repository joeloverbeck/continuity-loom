# Authorized review

You are here only because the preflight printed `authorized: true`. Work from its bounded evidence packet — the trigger events, use counts on the current hash, related prior dispositions, their adjudicated incident bodies under `related_prior_incident_events`, and the concrete artifacts they cite. Do not ingest the full historical ledger; the gate projection exists to keep old incident lore from dominating current judgment. The threshold authorized a diagnosis, not a presumption that the skill is defective or a guarantee of an edit.

Helper (all event writes, from the repository root): `node .claude/skills/skill-evolution/scripts/evolution.mjs <command> --target <skill-path> …` — every command takes `--target`; see `--help` for the rest. Review artifacts live under `reports/skill-evidence/<skill-key>/reviews/`.

### 1. Claim the review

```bash
node .claude/skills/skill-evolution/scripts/evolution.mjs claim --target <skill-path>
```

The helper re-evaluates every authorization term under the store lock, appends `review_started` (trigger IDs, authorizing rule, baseline target hash, provisional risk tier, fresh-session or cooldown proof), and re-derives the gate to `review_in_progress`. If it refuses — another review owns the target, or the gate moved — relay the refusal and stop without semantic analysis.

*Done when the helper printed a `review_id` and the review owns the target.*

### 2. Verify threshold premises

Check the packet only. For duplicate-mechanism judgment, `related_prior_incident_events` supplies the incident bodies adjudicated by related dispositions; it does not permit a full-ledger read.

- every trigger event represents a qualifying use;
- events claimed as independent are genuinely independent — distinct top-level sessions or materially different tasks, not retries, continuations, subagent reruns, or duplicate accounts of one event;
- at least one threshold event, including the threshold-crossing one, is contemporaneous;
- trigger hashes match the current target version;
- the candidate symptom cluster is factually plausible as a common symptom (causality is confirmed later, in step 3).

On failure, close with the exact outcome and step 9's residual arguments: `superseded_by_target_version` for an invalidated target hash; `insufficient_independence` only for an authorization premise that claimed independence; `cluster_not_actionable` when authorization still holds but the proposed cluster fails the common-mechanism/actionability premise. Existing dispositions keep their meanings. Then go to step 9.

*Done when every premise was confirmed, or the review was closed with the failed premise in the note.*

### 3. Determine target ownership and causal mechanism

Now — and only now — read the target skill, plus the minimum external contracts needed to test ownership. Classify the evidence:

| Causal disposition | It proceeds? | Terminal outcome → close disposition |
|---|---|---|
| **Target defect** — misleading, contradictory, missing, or badly placed guidance causally connected to the incidents | yes | — |
| **Target compliance defect** — the right rule exists but its structure, placement, salience, or instruction competition repeatedly defeats compliance | yes | — |
| Outside target — another skill, contract, tool, environment, model limitation, or user instruction owns it | no | `outside_target` → `outside_target` |
| Task-specific novelty — does not generalize beyond the triggering task | no | `resolved_no_change` → `closed_no_skill_defect` |
| Not reproducible on a fresh case, or symptom without a demonstrated mechanism | no | `not_reproducible` → `monitor_for_recurrence` |

For a non-proceeding class: close with the mapped disposition and a factual note, route outside-target evidence to its owner factually without proposing an unsanctioned repair, never edit another owner from this review, and go to step 9.

*Done when the confirmed mechanism and ownership class are written down, and non-proceeding classes were closed.*

### 4. Freeze the validation plan before any candidate exists

Define the trials first, so the change cannot pick only tests it already knows how to pass. Ordinary, narrow change — at least three paired trials:

1. a fresh reproduction of the implicated mechanism;
2. an adjacent case exercising the same capability differently;
3. an unrelated core regression case.

Escalate to at least five paired trials (add another core-regression case and a fragile, edge, or safety-relevant case) when the change affects destructive or external actions, state integrity or confidentiality, shared conventions or multiple skills, triggering or scope boundaries, a broad workflow section, more than one major behavior, or substantial deletion or reorganization.

Freeze per trial: raw task and artifacts, protected behavior, evaluator independence, and each instrument's pass/fail/tie rubric. Before any candidate exists, name exactly one decisive instrument, an ordered tie-break for the others, and any hard-veto safety, invariant, or deterministic checks. Save the plan under `reviews/<review-id>/`.

If no meaningful fresh validation can be constructed: `close --disposition blocked_no_valid_test`, make no edit, go to step 9.

*Done when the full trial set is frozen on disk, or the review was closed as blocked.*

### 5. Construct an isolated candidate

Create the authoritative candidate at `reviews/<review-id>/candidate/`. Isolation is an invariant: the live target stays byte-unchanged and undiscoverable through skill resolution, while this candidate remains the sole byte authority for `record-validation` and `land`. Check staging uses only an unmodified copy. Design rules:

- solve the demonstrated mechanism, not every imperfection seen while reading;
- do not fix unrelated defects noticed during the review — they become evidence only if a real skill use records them;
- prefer deletion, consolidation, reordering, or clearer replacement over appending; keep ambiguity/salience repairs token-neutral or smaller;
- no incident narratives, audit provenance, dates, commit hashes, or field stories in runtime instructions;
- growth only for a proven missing capability that cannot be expressed by replacing existing text;
- tool- or repository-specific details go in conditional references, not universal runtime rules; shared guidance keeps one canonical home.

*Done when the candidate differs from the live target only where the mechanism demands it.*

### 6. Run blind comparative validation

Run every frozen trial against the unchanged current skill and candidate in fresh sessions or independent agents. Give executors only the raw task and artifacts; conceal the diagnosis, expected answer, and version labels.

For checks resolving siblings, mirrors, or repository paths, use a temporary sibling-complete staging tree outside discovery: copy the canonical layout, place candidate bytes at the target's canonical relative depth, and recreate applicable mirrors. A location-only failure is a harness artifact; repair and rerun it, and it must not be counted as a trial result. Run applicable deterministic checks on both versions and the candidate before landing. Retain raw outputs and decisions under the review.

*Done when every frozen trial ran on both versions and the raw outputs are on disk.*

### 7. Apply the acceptance gate

Apply hard vetoes, then the frozen order: decisive pass/fail decides; on its declared tie, the first non-tie tie-break decides; lower priorities never override it. `Behaviorally tied` means the frozen behavioral instrument set all tied. If every ordered instrument ties, keep the current skill unless the candidate is meaningfully smaller or clearer. Encode the existing mechanism, noninferiority, regression, safety/scope/ownership, minimal-growth, and material-improvement gates as instrument results or hard vetoes.

On failure, leave the target untouched: `record-validation --decision rejected …`, then `close --disposition candidate_rejected_validation`, and go to step 9. A rejected candidate is not a license to improvise another in the same review — new evidence must reopen eligibility. Sole exception: a mechanical candidate defect discovered before any behavioral trial may be corrected once, then the complete frozen suite reruns.

*Done when the acceptance decision is made from the trial results alone.*

### 8. Record, land, verify

```bash
node .claude/skills/skill-evolution/scripts/evolution.mjs record-validation --target <skill-path> \
  --review-id <id> --decision accepted --risk-tier <ordinary|high> \
  --candidate reports/skill-evidence/<skill-key>/reviews/<review-id>/candidate \
  --trials <count> --artifacts reports/skill-evidence/<skill-key>/reviews/<review-id> [--summary "…"]
node .claude/skills/skill-evolution/scripts/evolution.mjs land --target <skill-path> \
  --review-id <id> --candidate <same candidate path>
```

`record-validation` freezes the candidate hash. Before mutation, `land` rechecks baseline, candidate bytes, ownership, and the required agent mirror before any live-target mutation for `.claude/skills/` targets. An absent or broken mirror refuses landing with its condition and repair, no target change, and no `change_landed`; healthy and non-applicable mirrors proceed. Then `land` backs up, replaces, verifies, and appends. A moved target requires `superseded_by_target_version`; a failed verification restores the baseline. Never merge by intuition or commit automatically.

*Done when `land` printed the before/after hashes and changed-file list, or the review was closed without landing.*

### 9. Close, report, complete

If a change landed, adjudicate now: `close --review-id <id> --disposition resolved_by_change --note "<mechanism and result>"`. Every close references the adjudicated trigger events (the helper includes them; add `--adjudicate <event-id>` only for additional events the review genuinely covered). Trigger events stay in `events.jsonl` forever; the disposition is what retires them from the active set.

Before any close, classify other packet incidents: genuinely resolved uses `--adjudicate`; considered but unexamined uses `--decline`, recorded as immutable `declined_event_ids`. A declined event stays visible but cannot by itself reauthorize. A later contemporaneous open incident on the unchanged target releases suppression for normal derivation. The census consumes that projection and omits declined-only evidence.

Then write the review report at `reviews/<review-id>.md` — required for every claimed review, with unreached sections marked `not reached — <disposition>`:

```markdown
# Skill Evolution Review: <skill-name>

## Authorization
- Gate rule:
- Trigger event IDs:
- Target before hash:
- Fresh-session/cooldown proof:

## Evidence adjudication
- Independence result:
- Confirmed mechanism:
- Target ownership:

## Candidate
- Change hypothesis:
- Files changed in isolated candidate:
- Runtime size before/after:

## Frozen validation plan
- Risk tier:
- Paired trials:
- Deterministic checks:

## Results
- Current version:
- Candidate version:
- Regressions:
- Decision:

## Landing
- Landed: yes/no
- Target after hash or unchanged hash:
- Final disposition:
```

The user-facing completion is concise, links the report, and states whether the live skill changed.

*Done when the disposition event exists, the report is written, and the completion was delivered.*

## No same-review expansion

Unrelated imperfections noticed during an authorized review are not in scope: do not fix them, do not broaden the candidate, and do not manufacture an incident merely from reading the skill. If an unrelated defect directly causes a frozen-trial failure, record it as a trial result and leave it for a later evidence cycle unless it makes the current candidate unsafe. This is what keeps a narrow authorized review from turning back into a general audit.

## Terminal outcomes

Every invocation ends in exactly one state. `refused_closed_gate`, `refused_cooldown_or_same_session`, and `refused_self_target` end in `SKILL.md` step 2 with no event and no report. Claimed reviews end as `superseded_by_target_version`, `insufficient_independence`, `cluster_not_actionable`, `outside_target`, `not_reproducible`, `blocked_no_valid_test`, `candidate_rejected_validation`, `resolved_no_change`, or — the only outcome that modifies the live target — `resolved_by_validated_change` (disposition `resolved_by_change`). Name the terminal outcome in the completion.
