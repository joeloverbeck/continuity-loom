# Authorized review

You are here only because the preflight printed `authorized: true`. Work from its bounded evidence packet — the trigger events, use counts on the current hash, related prior dispositions, and the concrete artifacts they cite. Do not ingest the full historical ledger; the gate projection exists to keep old incident lore from dominating current judgment. The threshold authorized a diagnosis, not a presumption that the skill is defective or a guarantee of an edit.

Helper (all event writes, from the repository root): `node .claude/skills/skill-evolution/scripts/evolution.mjs <command> --target <skill-path> …` — every command takes `--target`; see `--help` for the rest. Review artifacts live under `reports/skill-evidence/<skill-key>/reviews/`.

### 1. Claim the review

```bash
node .claude/skills/skill-evolution/scripts/evolution.mjs claim --target <skill-path>
```

The helper re-evaluates every authorization term under the store lock, appends `review_started` (trigger IDs, authorizing rule, baseline target hash, provisional risk tier, fresh-session or cooldown proof), and re-derives the gate to `review_in_progress`. If it refuses — another review owns the target, or the gate moved — relay the refusal and stop without semantic analysis.

*Done when the helper printed a `review_id` and the review owns the target.*

### 2. Verify threshold premises

Before thinking about repairs, check against the packet only:

- every trigger event represents a qualifying use;
- events claimed as independent are genuinely independent — distinct top-level sessions or materially different tasks, not retries, continuations, subagent reruns, or duplicate accounts of one event;
- at least one threshold event, including the threshold-crossing one, is contemporaneous;
- trigger hashes match the current target version;
- the candidate symptom cluster is factually plausible as a common symptom (causality is confirmed later, in step 3).

On failure, close and stop: `close --review-id <id> --disposition insufficient_independence|superseded_by_target_version --note "<what failed>"`, then go to step 9.

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

Freeze per trial: the raw prompt/task, raw input artifacts, an observable pass/fail or comparison rubric, any deterministic checks, which behavior it protects, and evaluator-independence requirements. Save the frozen plan under `reviews/<review-id>/`.

If no meaningful fresh validation can be constructed: `close --disposition blocked_no_valid_test`, make no edit, go to step 9.

*Done when the full trial set is frozen on disk, or the review was closed as blocked.*

### 5. Construct an isolated candidate

Copy the live target to `reviews/<review-id>/candidate/` (outside skill discovery) and modify only that copy; the live target stays untouched until every trial passes. Design rules:

- solve the demonstrated mechanism, not every imperfection seen while reading;
- do not fix unrelated defects noticed during the review — they become evidence only if a real skill use records them;
- prefer deletion, consolidation, reordering, or clearer replacement over appending; keep ambiguity/salience repairs token-neutral or smaller;
- no incident narratives, audit provenance, dates, commit hashes, or field stories in runtime instructions;
- growth only for a proven missing capability that cannot be expressed by replacing existing text;
- tool- or repository-specific details go in conditional references, not universal runtime rules; shared guidance keeps one canonical home.

*Done when the candidate differs from the live target only where the mechanism demands it.*

### 6. Run blind comparative validation

Run every frozen trial against both the unchanged current skill and the candidate, using fresh sessions or independent agents with minimal task-local context. Give executors the raw task and artifacts — never the diagnosis, intended repair, expected answer, or which version they hold; randomize or conceal version labels for evaluators. Run applicable deterministic checks on both versions where comparison matters, and on the candidate before landing. Retain raw outputs and evaluator decisions under `reviews/<review-id>/`.

*Done when every frozen trial ran on both versions and the raw outputs are on disk.*

### 7. Apply the acceptance gate

The candidate passes only when it resolves the implicated mechanism on the reproduction case(s); is noninferior on every protected core behavior; introduces no material or severe regression; passes all affected deterministic checks; preserves safety, scope, and ownership invariants; any growth is necessary, minimal, and supported by better outcomes; and it is materially better on the target mechanism rather than merely worded differently. Behaviorally tied: prefer the candidate only when it is meaningfully smaller or clearer; otherwise the current skill stays.

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

`record-validation` freezes the validated candidate hash; `land` reconfirms everything before touching the live target — live hash still equals the claim baseline, candidate bytes exactly those validated, review still owns the target — then backs up the baseline, replaces the live bytes, verifies the landed hash and the `.agents` mirror symlink, and appends `change_landed`. If it refuses because the target moved, authorization expired: `close --disposition superseded_by_target_version` and go to step 9 — never merge a validated candidate into an independently changed target by intuition. If landing verification fails, it restores the baseline itself; record the failure. Do not commit to Git automatically; normal repository recoverability stays as it is.

*Done when `land` printed the before/after hashes and changed-file list, or the review was closed without landing.*

### 9. Close, report, complete

If a change landed, adjudicate now: `close --review-id <id> --disposition resolved_by_change --note "<mechanism and result>"`. Every close references the adjudicated trigger events (the helper includes them; add `--adjudicate <event-id>` only for additional events the review genuinely covered). Trigger events stay in `events.jsonl` forever; the disposition is what retires them from the active set.

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

Every invocation ends in exactly one state. `refused_closed_gate`, `refused_cooldown_or_same_session`, and `refused_self_target` end in `SKILL.md` step 2 with no event and no report. Claimed reviews end as `superseded_by_target_version`, `insufficient_independence`, `outside_target`, `not_reproducible`, `blocked_no_valid_test`, `candidate_rejected_validation`, `resolved_no_change`, or — the only outcome that modifies the live target — `resolved_by_validated_change` (disposition `resolved_by_change`). Name the terminal outcome in the completion.
