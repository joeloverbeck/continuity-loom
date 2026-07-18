# Closeout Templates

Read this before drafting parent rollups, sibling-issue rollups, child-family
audit bodies, `/tmp` body files, closeout preflight scratchpads, or final
body-check commands.

## Large Tracker Body Workflow

Large tracker body workflow: for long parent rollups or child-family audits, compose the body in a temporary file under `/tmp`, inspect the exact file contents before posting, post with the tracker CLI's `--body-file` option, capture the resulting issue/comment URL or exact reference, and keep the staging path out of the published body. Use an interactive editor when available; when no editor is available or shell writes are constrained, create the `/tmp` body with the environment-approved file-edit mechanism, keep it outside the repo, and still inspect the exact file before posting. For GitHub, `gh issue close` only accepts an inline `--comment`, not `--body-file`; post long evidence first with `gh issue comment --body-file <file>`, capture that comment URL, verify the stored body with `verify-github-comment-body.mjs`, then close with a short inline pointer to the evidence comment. Use this pattern for parent rollups and any long child comment; reserve inline `--body` for short child comments only.

Two-sink boundary: a tracked implementation report is an evidence source, not the place for its own final SHA, reviewed HEAD SHA, or terminal review result. Keep that tracked source SHA-independent. Build the final self-referential fields in the uncommitted `/tmp` body or tracker comment after the final tree and review are stable; do not amend the tracked report solely to add them. When an acceptance manifest is available, prefer the deterministic scaffold helper below over retyping the fielded body from scratch.

Published-body sink identity: a private conversation preflight or local scratchpad may name the `/tmp` body path, but the body sent to the tracker must not publish that staging path. Before posting, use a stable description that is true before and after publication, such as `GitHub issue #369 combined closeout comment body inspected before posting`, or a real comment URL that already exists. Apply this rule to `Durable sink/body inspected:`, `Audit sink:`, `Body file(s) inspected:`, and `Closeout gate passed: audit sink ...`. The `--closing` validator rejects absolute local paths in those publishable fields; fixture/database paths in the evidence-identity inventory remain allowed.

For large bodies in constrained editors or Codex sessions, build the `/tmp` file in bounded sections. After construction, verify the file exists and has the expected rough shape with `test -f "$body"`, `wc -l "$body"`, `wc -c "$body"`, targeted `sed -n` ranges, a placeholder sweep for unresolved angle-token placeholders such as `<context>` or `<parent-rollup-url pending>`, and the applicable validators before any tracker mutation. The scaffold builder and closing validator default to a 65,536-byte maximum. `--max-bytes <positive integer>` may lower that ceiling or match a different tracker's documented contract; it must not be used to bypass GitHub's limit. Add `--size-plan` while generating the scaffold to print its total bytes, audit bytes, non-audit bytes, remaining fill budget, recommended evidence headroom, and `ok` / `low-headroom` / `exceeds-limit` status. Add `--require-headroom` to stop before writing a scaffold whose remaining fill budget is below the recommendation; this is the preferred precomposition gate when TDD, review, browser, or large parent-PRD evidence will still replace placeholders. Run the bounded excerpts, token sweeps, and each validator as separate output-bounded calls; do not aggregate them into one parallel or combined result whose total output can truncate. If creation output, inspection output, or context compaction makes completeness uncertain, treat the body as untrusted: first rerun `test -f`, `wc -l`, `wc -c`, targeted excerpts for the header, TDD/review/browser sections, audit table, and closeout gate lines, then rerun the placeholder sweep and every applicable validator before posting or closing. Passing validators do not restore trust in truncated inspection output.

If the size plan reports `low-headroom` or `exceeds-limit`, stop before filling or tracker mutation. Do not recover space with circular evidence such as `exact named items in this criterion` or by removing required atoms and proof surfaces. Split the detailed audit into disjoint issue/check groups with repeatable `--select <issue[:check-id[,check-id...]]>` arguments on `build-acceptance-manifest.mjs`; each invocation emits a mechanically matching subset manifest and audit scaffold through its normal `--output` and `--audit-output` flags. A selector containing only an issue number includes every check for that issue; a selector with check IDs includes only those IDs, in source order. Ensure the selector groups are disjoint and collectively cover every full-manifest check. Build, inspect, and validate every completed chunk; immediately before the first chunk mutation, run its applicable closing validator with `--emit-preflight`. Post and exact-read every chunk before composing the compact closing body, then cite the resulting stable URLs from that compact body and every affected child comment. Validate the compact closing body separately against only the rows it contains, and record all chunk URLs as its durable audit sinks; do not claim that one validator invocation covered rows held in other comments. This split-evidence order overrides the normal small-family parent-first order because real chunk URLs do not exist until their stored bodies have been verified.

Structured-evidence split rule: when a chunk uses `--evidence-input`, its subset manifest and evidence JSON must agree before the body is built. If the complete TDD/review arrays are reused in every chunk, every subset manifest must retain at least one selected check for every issue named by `tddRows` or `tddReviewFixes`; partition acceptance checks within those issues rather than splitting the issues apart. Keep the TDD/review arrays complete, but filter `auditRows` to exactly the checks selected into that chunk. The chunk manifests and `auditRows` sets must be pairwise disjoint and collectively cover the full manifest. A compact closing body uses its own subset manifest and matching `auditRows`, cites every verified chunk URL for the rows it does not contain, and never claims its validator covered those external rows. Alternatively, use a self-contained evidence file whose TDD rows, review fixes, review findings, and RF references are all internally complete for that chunk; do not leave a review finding pointing to an RF row filtered out of the file.

The selector-only example below assumes no reused structured evidence. If `--evidence-input` names issue #392, select disjoint #392 check IDs into both chunk manifests instead of omitting that issue from the second chunk.

```bash
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/worldloom-issues.json --select 391:Parent-Solution,US1,US2 --select 392 --output /tmp/worldloom-acceptance-part-01.json --audit-output /tmp/worldloom-acceptance-part-01.md
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/worldloom-issues.json --select 391:US3,Parent-Implementation-Decisions,Parent-Testing-Decisions,Principles --output /tmp/worldloom-acceptance-part-02.json --audit-output /tmp/worldloom-acceptance-part-02.md
```

Nested-validator angle-token rule: in compact TDD, review, or audit table cells, avoid HTML-like angle tokens such as a backticked body tag even when the token is intentional. Spell it in prose, for example `document body`, because nested validators may classify the whole cell as an unresolved placeholder. The intentional Markdown/HTML allowance applies only outside those compact cells and only when every applicable validator accepts the token.

## Sibling-Issue Rollup

When two or more in-scope issues are siblings with no parent PRD, choose the combined audit anchor in the scope ledger; default to the lowest issue number when the user or tracker gives no better anchor. Post the inspected combined audit to that anchor, capture its comment URL, verify the exact stored body, then close every sibling with a short inline comment containing the final SHA and that same evidence URL. Keep audit rows and live state verification per issue. Parent/child fields are `N/A because the issues are siblings`, and `--parent-prd`, `--child-family`, `--fixed-child`, and `--fixed-child-pending` do not apply unless a real parent/child relationship is also in scope.

For issue-family closeout, save the exact `gh issue view --json number,title,body` results as one JSON object, an array, or an object with an `issues` array. Build a deterministic acceptance manifest and audit scaffold before drafting the durable body:

```bash
node .claude/skills/implement/scripts/capture-github-issues.mjs 369 370 371 --output /tmp/worldloom-issues.json
node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/worldloom-issues.json --output /tmp/worldloom-acceptance-manifest.json --audit-output /tmp/worldloom-acceptance-audit.md
node .claude/skills/implement/scripts/build-closeout-body.mjs /tmp/worldloom-acceptance-manifest.json --audit-input /tmp/worldloom-acceptance-audit.md --output /tmp/worldloom-closeout-369.md --parent 369 --review normal --immediate-fix --tdd-parent-rollup --browser --principles --local-only --fixed-child pending --size-plan --require-headroom
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --audit-only --review-entry --acceptance-manifest /tmp/worldloom-acceptance-manifest.json
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --emit-preflight --acceptance-manifest /tmp/worldloom-acceptance-manifest.json
```

The capture helper calls exact structured `gh issue view` lookups without shell redirection and preserves issue order. For ordinary issues, the manifest scaffold assigns `AC1`, `AC2`, and so on in source order. For PRDs with `## Problem Statement` and `## Solution`, it also generates `Parent-Solution`, one exact `USN` check per numbered `## User Stories` entry, `Parent-Implementation-Decisions`, and `Parent-Testing-Decisions` when those sections exist. It adds one `Principles` check whenever the issue has a `## Principles` section. The closeout scaffold preserves those exact audit rows and emits the selected TDD/review/browser/identity/preflight field skeleton; it deliberately leaves angle-bracket placeholders, never changes `not done` to `satisfied`, and refuses output larger than 65,536 bytes by default, so it is not publishable until every field and row is completed and all applicable validators pass. `--review` accepts `normal` or `fallback`; add `--immediate-fix` only with `--review normal` when review findings were fixed so the scaffold emits the full normal-review immediate-fix block and final-reviewer statuses. `--fixed-child` accepts `none`, `pending`, or `final`. Preserve each generated ID and exact criterion text in the criterion cell. The audit-only validator checks the review-entry body without requiring final SHA/review/closeout fields; omit `--review-entry` for a truthful audit that still contains `blocked` or `not done` rows. The final manifest validator requires exactly one audit row for each generated check; it supplements, rather than replaces, exact body inspection. A closing validation requires `--expected-final-sha "$(git rev-parse HEAD)"`; on the last run before mutation, `--emit-preflight` prints the exact visible gate block to copy verbatim into the conversation.

Pass `--evidence-input <evidence.json>` to render structured `auditRows`. For multi-pass review or more than one TDD review fix, use the same input together with `--immediate-fix --tdd-parent-rollup`; the builder validates the structured identities and derives the compact TDD rows, RF rows, review-finding ledger, finding counts and worst severities, issue/seam accounting, and repeated TDD/review summaries from this single input. Do not hand-copy those derived fields afterward. The JSON shape is:

```json
{
  "auditRows": [
    {
      "issue": 368,
      "checkId": "AC1",
      "atoms": "production replay",
      "proofSurfaces": ".claude/skills/implement/scripts/build-closeout-body.test.mjs and `node --test`",
      "sequence": "request -> replay -> assertion",
      "status": "satisfied"
    }
  ],
  "tddRows": [
    {
      "issue": 368,
      "contextStatus": "absent",
      "authorityStatus": "active docs read",
      "seam": "replay route",
      "red": "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because the replay assertion did not match",
      "green": "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      "acceptance": "AC1; atoms: ...; proof surfaces: ...; sequence: ...",
      "reviewDisposition": "review fixes mapped below"
    }
  ],
  "tddReviewFixes": [
    {
      "id": "RF-1",
      "finding": "short finding title",
      "red": "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` failed because the RF-1 assertion did not match",
      "green": "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed RF-1",
      "issue": 368,
      "seam": "replay route",
      "durability": "durable regression test added at build-closeout-body.test.mjs",
      "browserFreshness": "N/A because no browser/manual evidence applies",
      "backendCurrentness": "N/A because no browser/manual evidence was used",
      "identityRefresh": "same-sink identity refresh completed"
    }
  ],
  "reviewFindings": [
    {
      "id": "P1-standards-1",
      "severity": "high",
      "reviewer": "reviewer ID or local fallback",
      "originalFinding": "short finding title",
      "repairClass": "behavior",
      "tddDisposition": "RF-1",
      "repair": "repair made",
      "rerunEvidence": "`node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs` passed",
      "finalStatus": "fixed"
    }
  ]
}
```

`auditRows` is optional, but when present it must contain exactly one row for every check in the supplied manifest, keyed by exact `(issue, checkId)`. Its statuses are `satisfied`, `blocked`, or `not done`; the builder renders the exact criterion text from the manifest and escapes the four evidence fields. Use either `auditRows` or `--audit-input`, never both. This structured route removes the need for one-off Markdown replacement scripts while preserving manifest-exact row coverage.

Structured TDD input must contain one or more rows per manifest issue, with every row identified by a unique `(issue, seam)` tuple. Every `RF-N` must map to an exact structured issue/seam row, every RF reference in a review finding must exist, review IDs must use `P<pass>-<standards|spec>-N`, severities are `critical`, `high`, `medium`, or `low`, and final statuses are `fixed` or `accepted residual`. Repair classes are `behavior`, `coverage-only`, `Standards-only`, `ADR-only`, `conformance-only`, `docs-only`, or `evidence-only`. TDD dispositions must link an `RF-N` or use the canonical red-green, coverage-only, red-first-skip, partial-red, or accepted-residual form. Review-fix red and green values must name concrete commands/results or a canonical skip form; durability, browser freshness, and backend currentness must use the validator-safe forms shown in the closeout template below. The `acceptance` value must contain the literal `atoms:`, `proof surfaces:`, and `sequence:` labels. Omitting `--evidence-input` preserves the placeholder scaffold workflow.

Long parent rollup, sibling-issue rollup, or child-family audit bodies must include this table shape, either inline or by linking an already-posted durable audit sink:

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
| #N | AC1 - exact criterion | atoms: authoritative atoms; proof surfaces: concrete test path, command, route, URL, or tracker reference for each atom; sequence: ordered proof / N/A because criterion is not sequence-sensitive | satisfied / blocked / not done |

The `atoms:` and `proof surfaces:` values must stand on their own. Do not point back to “this criterion,” “the criterion above,” or “all named items.” Every satisfied `proof surfaces:` value needs at least one concrete anchor such as a test file, verification command, API/browser route, documentation path, URL, or tracker reference.

For parent PRD rollups, including a single child plus parent PRD closeout, 4+ child issues, and small child families that choose a parent rollup as the durable sink, start from this body shape unless the issue set needs a richer audit:

```markdown
Implementation closeout for #<parent>

Final SHA: <sha>
Local-only SHA: <sha> is not remote-reachable because <reason>; local-only closeout is acceptable because <user request/repo policy>. / N/A because <remote branch contains sha>
Verification:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| `<exact command>` | <passed/failed/blocked plus output-derived counts or result> | <positive integer> | `<final SHA>` |

Copy these published claims from the final-tree rows in the durable verification-command ledger; do not retype counts from memory.
TDD evidence:
TDD closeout preflight:
Durable sink/body inspected: <stable issue reference before tracker URL exists / comment URL / N/A because no tdd skill was invoked>
Compact table/header: <present after structural check / N/A because no tdd skill was invoked>
Rows accounted for: <issue numbers / N/A because no tdd skill was invoked>
Pre-red recovery status: <N/A - pre-red preflight/table was visible before first red / listed with TDD recovery addendum / N/A because no red commands were run / N/A because no tdd skill was invoked / blocked because ...>
Pre-red evidence reference: <durable sink plus heading/row anchor and chronology proof / anchored TDD recovery addendum / N/A because no red commands were run / N/A because no tdd skill was invoked / blocked because ...>
CONTEXT.md status: <present/absent/N/A>
ADRs/principles/docs status: <present/N/A>
Acceptance atom map: <all rows list exact criterion plus authoritative atoms and proof surfaces / all criteria atomic and rows list proof surfaces / blocked because ... / N/A because no tdd skill was invoked>
Acceptance sequence map: <all rows list ordered proof or justified sequence N/A / blocked because ... / N/A because no tdd skill was invoked>
Partial-red / red-first skip reasons: <none/listed>
Evidence-only rows freshness: <none/listed with freshness reason>
Evidence-only browser console state: <none / listed with 0 errors and 0 warnings, classified unrelated output with evidence, rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof, or N/A because no browser/manual evidence-only rows>
Evidence-only proof server preflight: <configured API/UI ports and owner-check result; unrelated pre-existing owners none/listed; configured ports verified free or isolated proof-owned ports plus aligned proxy/API base; cleanup ownership / N/A because no browser/manual evidence-only rows or no proof server applies / N/A because no tdd skill was invoked / blocked because ...>
Evidence-only backend process currentness: <server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe / N/A because browser proof has no backend/API dependency / N/A because no browser/manual evidence-only rows / N/A because no tdd skill was invoked / blocked because ...>
Evidence identity refresh: <same-sink current/historical-red/superseded identity block below inspected / N/A because no tdd skill was invoked / blocked because ...>
Existing-test contract-change rows: <none/listed expectation-rewrite rows>

| Issue | CONTEXT.md status | ADRs/principles/docs status | Seam | Red command/failure | Green command or evidence | Acceptance covered | Review fix / red-first skip reason |
|---|---|---|---|---|---|---|---|
| #N | <present/absent/N/A> | <present/N/A> | <seam or evidence-only row> | <red command/failure or N/A because ...> | <green command or evidence> | <exact criterion or checkbox; atoms: authoritative atoms or atomic; proof surfaces: surface for each atom; sequence: ordered proof / N/A because criterion is not sequence-sensitive> | <N/A / RF-N plus review-fix or red-first skip reason> |

For an existing-test contract-change row, use validator-exact wording:

| #N | <present/absent/N/A> | <present/N/A> | existing contract-change expectation | existing contract-change expectation in `<test file>` because <old expected behavior no longer satisfied the issue/spec contract> | `<green command>` passed | <exact criterion authorizing the rewrite; atoms: authoritative atoms or atomic; proof surfaces: affected surface for each atom; sequence: ordered proof / N/A because criterion is not sequence-sensitive> | N/A |

TDD review-fix map: <N/A because review created no TDD row changes / replace with completed keyed rows below>

| Finding ID | Finding/source | Intended red command/failure | Green command/evidence | Updated TDD table row | Regression durability | Browser/manual evidence freshness | Backend process currentness | Evidence identity refresh |
|---|---|---|---|---|---|---|---|---|
| RF-1 | <one review finding/source> | <one red command/failure or explicit skip> | <one green command/evidence> | #N / <exact Seam cell> | <durable regression or reasoned N/A> | <freshness disposition> | <currentness disposition> | <same-sink identity refresh disposition> |

TDD evidence gate passed: durable sink <stable issue reference before tracker URL exists / comment URL>; compact table/header <present after structural check>; seams accounted for <all listed / exceptions named>; CONTEXT.md status <present/absent/N/A>; ADRs/principles/docs status <present/N/A>; sequence evidence <present/N/A>; evidence identities <present/N/A>; partial-red / red-first skip reasons <none/listed>; evidence-only rows <none/listed>; proof server preflight <present/N/A>; existing-test contract-change rows <none/listed expectation-rewrite rows>.
Review evidence:
- Review: code-review against <fixed point>; outcome <no findings / findings fixed / accepted residuals recorded count/source/rationale with unhandled findings none beyond accepted residuals>; verification rerun <commands>.
- Review subagents: Standards initial reviewer <ID> completed, final reviewer <ID> completed; Spec initial reviewer <ID> completed, final reviewer <ID> completed
- Review subagent cleanup: Standards <closed / close operation unavailable after terminal completion / auto-disposed after terminal completion>; Spec <same>
- Review subagent cleanup proof: Standards <every reviewer ID; successful close result / terminal status plus no close capability / post-terminal inventory absence or unaddressable follow-up>; Spec <same>
- Pre-dispatch Standards source inventory: <concrete path | concrete path | smell baseline>
- Pre-dispatch Spec source inventory: <issue #N | concrete spec path / no spec available>

## Standards

Handoff Standards source inventory: <exact same entry set as Pre-dispatch Standards source inventory>
Sources reviewed: <exact standards sources>
Findings: <none / exact findings>

## Spec

Handoff Spec source inventory: <exact same entry set as Pre-dispatch Spec source inventory>
Sources reviewed: <exact issue/PRD/acceptance sources>
Findings: <none / exact findings>

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #N | <issue #N AC1, AC2, Principles; sequence: ordered events plus observing proof / N/A because these criteria are not sequence-sensitive> | <diff/tests/docs reviewed> | <none / finding> |

Axis summary: Standards <count/worst>, Spec <count/worst>
Residual findings: <none / accepted residual records below>
Parent PRD coverage: <exact parent PRD rows/checks covered by the review>
Principles/ADR conformance: <no deliberate exceptions / approved exception / N/A>
Browser evidence:
- Route/action/outcome: <route and observed result / N/A because exact issue/PRD says browser/manual proof is N/A and browser contract/routes/rendered behavior/validation response/fixtures/action path are unchanged / N/A because ... / blocked because ...>
- Console state: <0 errors and 0 warnings / classified unrelated output with evidence / rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof / N/A because browser evidence is N/A or blocked>
- Backend process currentness: <server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe; when current identities name a local or withheld fixture, stateful fixture snapshot method, snapshot source, and expected-state probe, or `N/A because no stateful fixture was copied` / N/A because browser proof has no backend/API dependency / N/A because no browser/manual evidence was used / blocked because ...>
- Final freshness delta: files touched since the last browser/manual smoke after final commit and verification edits <paths or none>; affects UI/routes/browser-consumed API/fixtures/action path <yes/no per path/group and why>; smoke freshness <rerun / not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof <command> passed / blocked because ...>
Evidence identity refresh:
- Current evidence identities: fixture paths <path 1 | path 2 | none>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Authority-sensitive alternative when local fixture paths must not be published: Current evidence identities: fixture paths withheld because <authority and reason>; logical fixture <stable ID>; content SHA-256 <64 hexadecimal characters>; provenance <generated, derived, or copied-source statement>; browser sessions <names/none>; packet paths/hashes <paths and hashes/none>; active revisions <IDs/none>; artifacts <paths/IDs/none>
- Withheld-fixture currentness: the structured `fixture paths withheld because ...` form is non-`none` for review validation. Within the otherwise applicable `Backend process currentness` proof, append the exact disposition `N/A because no stateful fixture was copied` when no database, world file, or other stateful fixture was copied; otherwise include `stateful fixture snapshot method`, `snapshot source`, and `expected-state probe`.
- Historical red identities retained: <fixture paths ...; browser sessions ...; packet paths/hashes ...; active revisions ...; artifacts ... / none>
- Superseded evidence identities: fixture paths <path 1 | path 2 | none>; browser sessions <name 1 | name 2 | none>; packet paths/hashes <path/hash 1 | path/hash 2 | none>; active revisions <ID 1 | ID 2 | none>; artifacts <path/ID 1 | path/ID 2 | none>
- Superseded-token sweep: <`rg`/`grep` command naming every normalized exact superseded value individually; no hits outside classified identity/history lines and no active-proof hits; historical-red hits classified or none / N/A because every superseded category is none>
Fixed child inline close comment: <exact final text inspected / stable self-referential parent rollup wording inspected / local pending-parent template inspected and later patched / N/A>
Fixed child final inline close comment inspected: <exact `Completed by <sha>. Evidence: <parent rollup comment URL>` line after parent URL captured / N/A before parent URL exists or non-fixed-template closeout>
Child state snapshot before child closeout: <exact issue numbers and states before closing children / N/A>
Post-child closure verification before parent closeout: <exact issue numbers and CLOSED states, or pending later parent rollup patch/follow-up parent comment/parent close comment before parent closeout>

| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
| #N | AC1 - exact criterion | atoms: authoritative atoms; proof surfaces: surface for each atom; sequence: ordered proof / N/A because criterion is not sequence-sensitive | satisfied / blocked / not done |

Closeout preflight:
- Audit sink: <conversation/comment URL/stable issue reference before tracker URL exists>
- Body file(s) inspected: <local body inspected privately; staging path intentionally omitted from published evidence / N/A>
- Parent rollup URL: <URL / pending because first tracker mutation has not posted it yet / N/A>
- Fixed child inline close comment: <stable self-referential parent rollup wording inspected / local pending-parent template inspected and later patched / exact final text inspected once after parent URL captured / N/A>
- Fixed child final inline close comment inspected: <exact `Completed by <sha>. Evidence: <parent rollup comment URL>` line after parent URL captured / N/A before parent URL exists or non-fixed-template closeout>
- Final SHA: <sha>
- Remote reachability: <remote branch contains sha / no remote branch contains sha>
- Principles/ADR conformance: <present/N/A>
- Local-only SHA: <full explanatory sentence present/N/A>
- TDD evidence: <present/N/A because no tdd skill was invoked>
- Review evidence: <Review:/Review fallback: line or reference>
- Evidence identity refresh: <current/superseded category inventory and superseded-token sweep present>
- Browser console state: <0 errors and 0 warnings / classified unrelated output with evidence / rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof / N/A because browser evidence is N/A or blocked>
- Browser evidence freshness: <files touched since smoke; affects UI/routes/browser-consumed API/fixtures/action path yes/no and why; rerun / not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof <command> passed / blocked because ...>
- Final post-commit freshness delta: <files touched since last browser/manual proof after final commit and verification edits; rerun / not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof <command> passed / blocked because ...>
- Child states verified: <yes/N/A, exact issue numbers>

Closeout gate passed: audit sink <conversation/comment URL/stable issue reference before tracker URL exists>; review evidence <line/reference>; TDD evidence <present/N/A>; final SHA <sha>; Principles/ADR conformance <present/N/A>; Local-only SHA sentence <full explanatory sentence present/N/A>; child states verified <yes/N/A>; browser evidence <present/N/A/blocked>.

Closeout body check passed: audit table columns exact; every acceptance checkbox or conformance check named; every satisfied Evidence cell contains atoms/proof surfaces/sequence; every status literal satisfied/blocked/not done; final SHA present; verification evidence present; TDD evidence present or N/A; review evidence present; evidence identity refresh and superseded-token sweep present; Principles/ADR conformance string present or N/A; full Local-only SHA explanatory sentence present or N/A; browser evidence present/N/A/blocked; browser console state recorded when browser evidence is present or N/A/blocked; final browser/manual freshness delta present/N/A; exact fixed child inline comment inspected <yes/N/A>.
```

Within one identity category, separate multiple values with the canonical ` | ` delimiter. The shared review validator compares each normalized value independently, ignoring Markdown code/emphasis wrappers and trailing punctuation; legacy comma-separated lists are normalized only when every comma item is Markdown-wrapped. The sweep must therefore name each actual value, not the category's formatted raw string.

The review portion above is the normal `code-review` path. A normal body must include `## Standards`, `## Spec`, and the full shared `Evidence identity refresh:` block, and must not contain `Review fallback:` or `Review fallback gate passed:` anywhere. Use `Historical red identities retained: none` when no red proof ran. For child issue families, give every zero-residual coverage row exact acceptance items plus `sequence:` ordered proof or a justified N/A, then run the normal validator with `--child-family`. When normal review findings were fixed, add the exact immediate-fix fields required by the normal-review validator: `Initial Standards outcome:`, `Initial Spec outcome:`, `Final Standards outcome:`, `Final Spec outcome:`, `Findings found:`, the keyed review finding ledger from [review-evidence.md](review-evidence.md), `Fixes made:`, `TDD/review-fix evidence:`, `TDD closeout gate:`, `Verification rerun:`, `Browser/manual evidence freshness:`, `Browser/manual console state:`, `Evidence identity refresh:`, and `Commit handling:`. Ensure the `Review:` line says `outcome findings fixed in SHA <Final SHA>` and that this SHA matches both the `reviewed HEAD SHA` in the review frame and the body-level `Final SHA`; also ensure that `Review subagents:` names terminal initial and final Standards and Spec reviewer identities. `initial and final reviewer <same ID> completed` is valid when one reviewer performed both passes.

For local fallback, replace the entire normal review portion with the full fallback block from [review-evidence.md](review-evidence.md); do not combine the two routes. The fallback body uses `Review fallback:`, the fallback `## Standards`/`## Spec` block, and the fallback validator.

After the parent rollup URL is captured and before the first fixed-template child close command, inspect the exact final inline child comment with the real URL. Paste or echo this exact string in the conversation or durable audit sink:

```markdown
Fixed child final inline close comment inspected: Completed by <sha>. Evidence: <parent rollup comment URL>
```

This mini-gate complements, and does not replace, the fixed-template sequence in [child-family-closeout.md](child-family-closeout.md).

Then inspect the exact body before posting:

```bash
body="/tmp/worldloom-closeout-<issue-or-prd>.md"
$EDITOR "$body"
# If no interactive editor is available, create the body with the environment-approved file-edit mechanism instead.
# If the body is large or creation output was truncated, verify existence and shape before validation.
# Run each excerpt, token sweep, and validator as a separate output-bounded call; do not aggregate their outputs.
test -f "$body"
wc -l "$body"
wc -c "$body"
sed -n '1,80p' "$body"
sed -n '81,160p' "$body"
sed -n '161,240p' "$body"
# Run the applicable validator commands before posting; omit commands whose evidence type is N/A and drop only flags whose conditions do not apply.
node .claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs "$body" --parent-rollup --acceptance-manifest /tmp/worldloom-acceptance-manifest.json --closing --expected-final-sha "$(git rev-parse HEAD)"
# Normal child-family review path; drop only inapplicable --immediate-fix/--parent-prd/--child-family/--browser/--tdd-parent-rollup flags.
node .claude/skills/code-review/scripts/validate-review-normal-body.mjs "$body" --parent-prd --child-family --acceptance-manifest /tmp/worldloom-acceptance-manifest.json --browser --tdd-parent-rollup --closing --expected-final-sha "$(git rev-parse HEAD)"
# Local fallback path; run this commented command instead of the normal-review validator, then add --review-fallback to the implement validator.
# node .claude/skills/code-review/scripts/validate-review-fallback-body.mjs "$body" --implement --child-family --acceptance-manifest /tmp/worldloom-acceptance-manifest.json --browser --tdd-parent-rollup --closing --expected-final-sha "$(git rev-parse HEAD)"
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --principles --local-only --fixed-child-pending --acceptance-manifest /tmp/worldloom-acceptance-manifest.json
rg -n "<[^>\n]{1,120}>" "$body"
rg -n "Closeout gate passed: audit sink|Closeout body check passed|Final SHA:|Verification:|Review:|Review fallback:|TDD evidence gate passed|Principles/ADR conformance:|Local-only SHA:|Evidence identity refresh|Current evidence identities|Superseded evidence identities|Superseded-token sweep" "$body"
rg -n "Acceptance criterion or conformance check|Status|satisfied|blocked|not done|atoms:|proof surfaces:|sequence:" "$body"
rg -n "browser smoke|browser evidence|Console state|Browser console state|Final freshness delta|Fixed child inline close comment|Fixed child final inline close comment inspected" "$body"
# If any inspection output is truncated, treat it as not inspected. Split the check into bounded token sweeps and short table/status excerpts before posting or closing.
node .claude/skills/implement/scripts/validate-closeout-body.mjs "$body" --closing --expected-final-sha "$(git rev-parse HEAD)" --emit-preflight --principles --local-only --fixed-child-pending --acceptance-manifest /tmp/worldloom-acceptance-manifest.json
# Copy the emitted Closeout preflight block and Closeout gate passed line verbatim into the conversation immediately before mutation.
comment_url="$(gh issue comment <issue> --body-file "$body")"
node .claude/skills/implement/scripts/verify-github-comment-body.mjs "$comment_url" "$body"
gh issue close <issue> --reason completed --comment "Completed; evidence: $comment_url"
```

Validator-safe active browser rerun freshness example: if browser/manual proof was rerun on the final tree after the last content change, prefer wording that says the rerun passed and names the route/action/API/fixture. Example wording:

> Final freshness delta: files touched since the last browser/manual proof after final commit and verification edits: <paths or none>; browser smoke rerun passed on final tree for route/action/API/fixture <route/action/API/fixture> with observed outcome <outcome>.

Post-smoke content-change without rerun example: if tracked files changed after browser/manual proof and the proof was not rerun, keep the route/action/outcome evidence historical. Do not say the smoke passed on the final tree. Use `Final freshness delta` to justify not-affected or blocked freshness for the changed paths. Example wording:

> Final freshness delta: files touched since the last browser/manual proof after final commit and verification edits: <paths>; not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof `<command>` passed. / blocked because changed path <path or group> may affect the evidence route/action/API/fixture <route/action/API/fixture> and browser/manual proof was not rerun.

Post-smoke commit-only freshness example: if the final browser/manual proof ran on the same file content that was later committed, and the only post-smoke change was creating the commit metadata/SHA, write the freshness fields as content-unchanged proof rather than forcing a fake rerun. Example wording:

> Final freshness delta: files touched since the last browser/manual proof after final commit and verification edits: git commit metadata only; not affected because no tracked file content changed after the smoke, the evidence route/action/API/fixture <route/action/API/fixture> is untouched, and targeted proof `git diff HEAD -- <owned files>` is empty.

Do not leave temporary body files in the repo unless they are intentional committed evidence.

## Blocked Closeout Handoff

Use this when implementation made progress but one or more issue criteria remain `blocked` or `not done`, so tracker closeout must not run. Post it in the conversation or a durable issue comment only when it is useful for the next session; otherwise keep it in the final response.

```markdown
Blocked closeout handoff for #<parent-or-issue>

Tracker state readback:
- #<issue>: <OPEN/CLOSED> - <reason it remains open or closed>

Implementation state:
- In-scope files changed: <paths>
- Verification run: <commands and pass/fail/blocked result>
- Report/artifact paths: <paths or N/A>
- Dev/browser cleanup: <stopped / intentionally left running with reason / N/A>

Satisfied evidence:
| Issue | Acceptance criterion or conformance check | Evidence | Status |
|---|---|---|---|
| #N | <criterion exactly named> | atoms: <authoritative atoms>; proof surfaces: <tests/browser/report/readback>; sequence: <ordered proof / N/A because criterion is not sequence-sensitive> | satisfied |

Blocked or not-done criteria:
| Issue | Acceptance criterion or conformance check | Missing proof or blocker | Next action | Status |
|---|---|---|---|---|
| #N | <criterion exactly named> | <external service/cold probe/commit/SHA/etc.> | <field test, authorization, commit, rerun, or implementation follow-up> | blocked / not done |

Commit/SHA decision:
- <final SHA and reachability, or `no implementation commit; tracker closeout blocked because no final SHA represents the verified tree`>

Review evidence:
- <Review:/Review fallback: line, or N/A because tracker closeout is blocked before review>

Evidence identity refresh:
- <current/superseded category inventory and superseded-token sweep present / N/A because closeout is blocked before review>

Next session priority:
1. <exact proof or implementation step needed>
2. <exact tracker closeout prerequisite>
```

Do not use this template as a substitute for successful closeout. Any row with status `blocked` or `not done` keeps that issue and any dependent parent PRD open.

## Closeout Preflight Scratchpad

Before any `gh issue comment`, `gh issue close`, `glab issue close`, or equivalent closeout command, fill this in the inspected body. Run the implement closing validator with `--expected-final-sha "$(git rev-parse HEAD)" --emit-preflight`, then copy its emitted block and `Post-comment verification next:` reminder verbatim into the conversation or durable audit sink. Do not hand-transcribe the visible gate:

```markdown
Closeout preflight:
- Audit sink: <conversation/comment URL/stable issue reference before tracker URL exists>
- Body file(s) inspected: <local body inspected privately; staging path intentionally omitted from published evidence / N/A>
- Parent rollup URL: <URL / pending because first tracker mutation has not posted it yet / N/A>
- Fixed child inline close comment: <stable self-referential parent rollup wording inspected / local pending-parent template inspected and later patched / exact final text inspected once after parent URL captured / N/A>
- Fixed child final inline close comment inspected: <exact `Completed by <sha>. Evidence: <parent rollup comment URL>` line after parent URL captured / N/A before parent URL exists or non-fixed-template closeout>
- Final SHA: <sha>
- Remote reachability: <remote branch contains sha / no remote branch contains sha>
- Principles/ADR conformance: <present/N/A>
- Local-only SHA: <full explanatory sentence present/N/A>
- TDD evidence: <present/N/A because no tdd skill was invoked>
- Review evidence: <Review:/Review fallback: line or reference>
- Evidence identity refresh: <current/superseded category inventory and superseded-token sweep present>
- Browser console state: <0 errors and 0 warnings / classified unrelated output with evidence / rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof / N/A because browser evidence is N/A or blocked>
- Browser evidence freshness: <files touched since smoke; affects UI/routes/browser-consumed API/fixtures/action path yes/no and why; rerun / N/A because ... / not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof <command> passed / blocked because ...>
- Final post-commit freshness delta: <files touched since last browser/manual proof after final commit and verification edits; rerun / not affected because changed path <path or group> leaves the evidence route/action/API/fixture <route/action/API/fixture> untouched and targeted proof <command> passed / blocked because ...>
- Child states verified: <yes/N/A, exact issue numbers>

Closeout gate passed: audit sink <conversation/comment URL/stable issue reference before tracker URL exists>; review evidence <line/reference>; TDD evidence <present/N/A>; final SHA <sha>; Principles/ADR conformance <present/N/A>; Local-only SHA sentence <full explanatory sentence present/N/A>; child states verified <yes/N/A>; browser evidence <present/N/A/blocked>.
```
